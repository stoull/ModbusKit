
const crc16 = require("../utils/crc16");

const datatools = require("../utils/datatools");

const constant = require("../modbus-constant");

// 设备逆变器协议功能码
const InverterFunctionCode = Object.freeze({
    // 读holding寄存器即03号
    readHolding03: 3,
    // 读input寄存器即04号
    readInput04: 4,
    // 设置寄存器
    writeRegister: 6,
    // 预设值有多个寄存器
    writeMultipleRegister: 16,
    
    // 错误83 协议未指明具体错误说明
    error_83: 83,
    // 错误84 协议未指明具体错误说明 如出现逆变器超出范围，03或04的包会回复成这个84的功能码
    error_84: 84,
    
    error: 0
})

class InverterPackage {
    /**
     * Growatt光伏逆变器 Modbus 协议
     * 详见 文档"Growatt Inverter Modbus RTU Protocol_II V1_42-20230220.docx"
     *
     * @param {Uint8} slaveAddress  从机地址
     * @param {InverterFunctionCode} functionCode   寄存器类型或对寄存器功能类型
     * @param {Buffer} data     数据 functionCode位后所有的数据
     * @param {Uint16} crc          CRC校验 值
     */

    constructor(obj) {
        if (obj instanceof Buffer) {
            this._constructorBuffer(obj)
        } else if (typeof obj === 'object' && obj !== null) {
            this._constructorParms(obj.slaveAddress, obj.functionCode)
        }
    }

    // 从机器返回的数据初始化包
    _constructorBuffer(buf) {
        if (buf.length < 5) {
            throw new Error('InverterPackage 原始数据不正确');
        }

        // crc校验
        if (this.checkCRC(buf) == false) {
            throw new Error('InverterPackage CRC校验失败');
        }

        this._rawData = buf
        this.slaveAddress = buf.readUint8(0)
        this.functionCode = buf.readUint8(1)

        this.data = buf.slice(2, -2)
    }
    
    // 根据自定包信息初始化包
    _constructorParms(slaveAddress = 1, functionCode) {
        this.slaveAddress = slaveAddress
        this.functionCode = functionCode
    }
    
    // 将当前包组装成可与机器通讯用的数据包流
    asData(data) {
        // 当前属性转二进制数据包前的合法性检查
        if (typeof this.data === "undefined" || typeof this.functionCode === "undefined") {
            throw(constant.ModbusPackageError("数据不合法"))
            return;
        }

        const pkgLength = 2 + this.data.length; // 其中2为：1个字节的从机地址+1个字节的功能码
        const buf = Buffer.alloc(pkgLength + 2);    // 2为：两字节的crc

        // 拉接报文头及功能码
        buf.writeUInt8(this.slaveAddress, 0);
        buf.writeUInt8(this.functionCode, 1);

        // 写入数据区
        for (let i = 0; i < this.data.length; i++) {
            buf.writeUInt8(this.data[i], 2 + i);
        }

        // 拼接CRC
        const cCrc = crc16(buf.slice(0, -2));
        this.crc = cCrc;
        buf.writeUint16LE(cCrc, buf.length-2);
        
        const buffer2 = Buffer.from("00010005000F01180F392247253730764238775774", "hex");
        const crc2 = crc16(buffer2);
        const crcHex = datatools.uint16ToBEHexString(crc2);

        return buf;
    }
    
    checkCRC(buf) {
        if (buf.length < 3) {
            return false
        }
        const fCrc = buf.slice(-2).readUint16LE(0)
        const cCrc = crc16(buf.slice(0, -2));

        const crcHex = datatools.uint16ToBEHexString(cCrc);
        const crcHex2 = datatools.uint16ToBEHexString(fCrc);
        
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

    setData(dataBuf) {
        this.data = dataBuf
    }

    getData() {
        return this.data
    }

    setFunctionCode(newCode) {
        this.functionCode = newCode
    }

    getFunctionCode() {
        return this.functionCode
    }
}


/**
 * 光伏逆变器 Modbus RS485 协议, 功能3,4读holding及input寄存器包
 * 详见 文档"Growatt Inverter Modbus RTU Protocol_II V1_42.docx"
 * 请求包 参数
 * @param {Uint16} startAddress     开始地址
 * @param {Uint16} registerCount    点的数目
 * 
 * 响应包 参数
 * @param {Uint8} dataByteCount     字节数目 (读取数据的字节长度)
 * @param {Buffer} readData         读取到的有效数据
 */
class InverterPackageRead extends InverterPackage {
    constructor(obj) {
        super(obj);
        if (obj instanceof Buffer) {
            // 字节数目
            this.dataByteCount = this.data.readUint8(0)
            this.registerCount = this.dataByteCount/2
            // 读取到的有效数据
            if (this.dataByteCount > 1) {
                this.readData = this.data.slice(1, 0)
            }
        } else if (typeof obj === 'object' && obj !== null) {
            this._constructorParmsSub(obj.startAddress, obj.registerCount)
        }
    }

    // 根据自定包信息初始化包
    _constructorParmsSub(startAddress, registerCount) {
        this.startAddress = startAddress
        this.registerCount = registerCount
    }

    // 将当前包组装成可与机器通讯用的数据包流
    asData() {
        const paramsBuf = Buffer.alloc(4); // 开始地址 及 点的数目 共4个字节
        paramsBuf.writeUint16BE(this.startAddress, 0);
        paramsBuf.writeUint16BE(this.registerCount, 2);
        super.data = paramsBuf
        super.setData(paramsBuf)
        return super.asData();
    }
}

/**
 * 光伏逆变器 Modbus RS485 协议, 功能3,4读holding及input寄存器包
 * 详见 文档"Growatt Inverter Modbus RTU Protocol_II V1_42.docx"
 * 请求包 参数
 * @param {Uint16} startAddress     开始地址
 * @param {Uint16} registerCount    点的数目
 * 
 * 响应包 参数
 * @param {Uint8} dataByteCount     字节数目 (设置数据的字节长度)
 * @param {Buffer} writeData        设置的数据
 */
class InverterPackageWrite extends InverterPackage {
    constructor(obj) {
        super(obj);
        if (obj instanceof Buffer) {
            this._constructorBufferSub()
        } else if (typeof obj === 'object' && obj !== null) {
            this._constructorParmsSub(obj.startAddress, obj.registerCount, obj.writeData)
        }
    }

    // 根据自定包信息初始化包
    _constructorParmsSub(startAddress, registerCount, writeData) {
        this.registerCount = registerCount
        if (registerCount > 1) {
            // 功能码16 设置多个寄存器
            super.setFunctionCode(InverterFunctionCode.writeMultipleRegister)
        } else {
            // 功能码6 设置单个寄存器
            super.setFunctionCode(InverterFunctionCode.wirteRegister)
        }
        this.startAddress = startAddress
        this.dataByteCount = settingData.count*2
        this.writeData = writeData
    }

    _constructorBufferSub() {
        if (super.functionCode == InverterFunctionCode.writeMultipleRegister) {
            // 功能码6 设置单个寄存器 解析
            this.writeData = this.data.readUint16BE(4)
            this.dataByteCount = this.writeData.count*2
        } else if (super.functionCode == InverterFunctionCode.writeRegister) {
            // 功能码16 设置多个寄存器 解析
            this.dataByteCount = this.data.readUint8(2)
            const dCount = this.dataByteCount/2
            let dPoint = 3
            const setBuf = Buffer.alloc(this.dataByteCount);
            for (let step = 0; step < dCount; step++) {
                setBuf.writeUint16BE(this.data.readUint16BE(dPoint))
                dPoint = dPoint + 2;
            }
            this.writeData = setBuf
        }
    }

    // 将当前包组装成可与机器通讯用的数据包流
    asData() {
        const paramsBuf = Buffer.alloc(4); // 开始地址 及 点的数目 共4个字节
        paramsBuf.writeUint16BE(this.startAddress, 0);
        paramsBuf.writeUint16BE(this.registerCount, 2);
        super.data = paramsBuf
        return super.asData();
    }
}

module.exports = {
    InverterFunctionCode: InverterFunctionCode,
    InverterPackage: InverterPackage,
    InverterPackageRead: InverterPackageRead,
    InverterPackageWrite: InverterPackageWrite
};
