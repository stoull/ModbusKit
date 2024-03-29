
const crc16 = require("./utils/crc16");
const xor = require("./utils/xor");
const aes = require("./utils/aes");

const datatools = require("./utils/datatools");

const ConnectionType = Object.freeze({
    BLE: 0,
    TCP: 1
})

const FunctionCode = Object.freeze({
    penetrate17: 0x17,
    write18: 0x18,
    read19: 0x19,
    fileTransfer26: 0x26
})

const SERIALNUMBER_LENGTH = 10;
const XOR_KEY = "Growatt";

var MODBUS_VERSION = 0x0005
var CONNECTION_TYPE = ConnectionType.BLE // 认为Port.BLE，像本地蓝牙于网络传输的数服协议包会有不同

const modbusErrorMessages = [
    "未知错误",
    "数据不合法",
    "Illegal data address (register not supported by device)",
    "Illegal data value (value cannot be written to this register)",
    "Slave device failure (device reports internal error)",
    "Acknowledge (requested data will be available later)",
    "Slave device busy (retry request again later)"
];

const ModbusPackageError = function(message) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
};

class ModbusPackage {
    /**
     * Growatt数服协议包
     *
     * @param {object} obj   初始化信息，可以是transactId，functionCode及data三个参数，或者是机器返回的原始数据
     * @param {UInt16} transactId   通讯编号 0x0004
     * @param {UInt8} functionCode  功能码
     * @param {Buffer} data         数据区
     */

    constructor(obj) {
        if (obj instanceof Buffer) {
            this._constructorBuffer(obj)
        } else if (typeof obj === 'object' && obj !== null) {
            this._constructorParms(obj.transactId, obj.functionCode, obj.data)
        }
    }

    // 从机器返回的数据初始化包
    _constructorBuffer(buf) {
        if (buf.length < 9) {
            throw new Error('原始数据不正确');
        }

        // crc校验
        if (this.checkCRC(buf) == false) {
            throw new Error('CRC校验失败');
        }

        this._rawData = buf
        this.transactId = buf.readUint16BE(0)
        this.protocolId = buf.readUint16BE(2)
        this.length = buf.readUint16BE(4)
        this.deviceAdress = buf.readUint8(6)
        this.functionCode = buf.readUint8(7)
        
        // 根据返回的包更新协议版本号
        // MODBUS_VERSION = this.protocolId
        
        if (8+this.length-3 > buf.length) {
            throw new Error(`原始数据长度不对, 长度应该位：${this.length}, 但实际数据长度:${dataArray.count}`);
        }

        let crypData = buf.slice(8, -2)
        this.data = this.decrypt(crypData)
    }

    // 根据自定包信息初始化包
    _constructorParms(transactId = 0x0004, functionCode, data) {
        this.transactId = transactId;
        this.protocolId = MODBUS_VERSION;
        this.length = 0x0000;
        this.deviceAdress = 0x01;
        this.functionCode = functionCode;
        this.data = data;
        this.length = data.length;
    }
    
    // 将当前包组装成可与机器通讯用的数据包流
    asData() {

        // 当前属性转二进制数据包前的合法性检查
        if (typeof this.data === "undefined" || typeof this.functionCode === "undefined") {
            throw(ModbusPackageError("数据不合法"))
            return;
        }

        const pkgLength = 8 + this.data.length + 2; // 其中8为：7个字节的报文头+1个字节的功能码 
        const buf = Buffer.alloc(pkgLength + 2);    // 2为：两字节的crc

        // 拉接报文头及功能码
        buf.writeUInt16BE(this.transactId, 0);
        buf.writeUInt16BE(this.protocolId, 2);
        buf.writeUInt16BE(this.data.length, 4);
        buf.writeUInt8(this.deviceAdress, 6);
        buf.writeUInt8(this.functionCode, 7);

        // 拼接数据区
        if (CONNECTION_TYPE === ConnectionType.BLE) {
            // 走蓝牙的数据处理
            let encryptedData = this.encrpty(this.data)

            // 写入数据区
            for (i = 0; i < encryptedData.length; i++) {
                buf.writeUInt8(encryptedData[i], 7 + i);
            }

            // 另一种写入数据区的方法
            // for (i = 0; i < encryptedData.length; i++) {
            //     // 在将要写的区域写入0
            //     buf.writeUInt8(0, 7 + i);
            // }
            // for (i = 0; i < encryptedData.length; i++) {
            //     // buf中的bits都是0
            //     // 只有array[i]为1时才写入1
            //     if (array[i]) {
            //         buf.writeBit(1, i, 7);
            //     }
            // }
        } else {
            // 走网络的或其它的数据处理
        }

        // 拼接CRC
        const cCrc = crc16(buf.slice(0, -2));
        this.crc = cCrc;
        buf.writeUInt16LE(cCrc);
        return buf;
    }

    /// 提取包中的有效数据
    extract(buf) {
        // const buf = Buffer.alloc(8 + this.data.length + 2);
        // this.transactId = buf.readUint16BE(0)
        // this.protocolId = buf.readUint16BE(2)
        // this.length = buf.readUint16BE(4)
        // this.deviceAdress = buf.readUint8(6)
        // this.functionCode = buf.readUint8(7)

        // // 拼接数据区
        // if (CONNECTION_TYPE === ConnectionType.BLE) {
        //     if (MODBUS_VERSION > 5) {
        //         // 更新总长度
        //     }
        //     // 数据区解密
        // }
    }
    
    checkCRC(buf) {
        if (buf.length < 3) {
            return false
        }
        const fCrc = buf.slice(-2).readUint16BE(0)
        const cCrc = crc16(buf.slice(0, -2));
        if (fCrc == cCrc) {
            this.crc = fCrc;
        }
        return fCrc == cCrc;
    }

    /// 获取当前包的crc, 因要将包组装完整才能计算crc,所以这里调用组装包的方法asData
    getCRC() {
        const data = this.asData
        return this.crc
    }
    
    encrpty(buf) {
        let encryptedData
        if (MODBUS_VERSION > 5) {
            encryptedData = aes.encrypt(buf)
        } else {
            encryptedData = xor(buf, XOR_KEY)
        }
        return encryptedData;
    }
    
    decrypt(buf) {
        let decryptedData
        if (MODBUS_VERSION > 5) {
            decryptedData = aes.decrypt(buf)
        } else {
            decryptedData = xor(buf, XOR_KEY)
        }
        return decryptedData;
    }
}

class ModbusPackage0x17 extends ModbusPackage {
    /**
     * 命令码0x17,对应的数据包
     * 该功能码为完全透传命令：由手机app发送该命令码，数据采集器收到该命令码后，取出“透传数据区”，不作协议转换地透传给光伏设备；
     * 同时，对光伏设备返回的数据同样不作任何解析，直接当作“透传数据区”封装在MODBUS_ TCP协议中响应给APP。
     *
     * @param {object} obj   初始化信息，可以是transactId，functionCode及data三个参数，或者是机器返回的原始数据
     * @param {string} serial   通讯编号 0x0004
     * @param {UInt8} functionCode  功能码
     * @param {Buffer} data         数据区
     */
    constructor(obj) {
        super(obj);
        if (obj instanceof Buffer) {
            this._constructorBuffer(obj)
        } else if (typeof obj === 'object' && obj !== null) {
            this._constructorParms(obj.transactId, obj.functionCode, obj.data)
        }

        this._rawData = buf
        // 数据采集器序列号
        this.serial = buf.readUint16BE(0)
        // 透传数据区的数据长度
        this.penetrateDataLenth = buf.readUint16BE(2)
        // 透传数据区 数据内容参见逆变器协议
        this.penetrateData = buf.readUint16BE(4)
        // 查询包
        this.reqPackage = buf.readUint8(6)
        // 回复包
        this.resPackage = buf.readUint8(7)
    }

    /**
     * 读取设备的03 holding或04 input寄存器包
     *
     * @param {InverterFunctionCode} readType   
     * @param {UInt16} startIndex   要读取的起始的寄存器地址
     * @param {UInt16} count        要读取的的长度
     */
    static read(readType, startIndex, count) {

    }

    /**
     * 设置设备的寄存器数据包，可能是功能码6或者16
     *
     * @param {UInt16} startIndex   要设置的寄存器开始位置
     * @param {UInt16} count        要设置的寄存器数目
     * @param {Uint16Array} count        要设置的寄存器数据，按寄存器顺序排列
     */
    static write(startIndex, count, data) {
    
    }

}

module.exports = ModbusPackage;