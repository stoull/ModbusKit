
const crc16 = require("./utils/crc16");
const xor = require("./utils/xor");
const aes = require("./utils/aes");

const datatools = require("./utils/datatools");

const constant = require("./modbus-constant");

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
        const cCrc = crc16(buf);
        this.crc = cCrc;
        buf.writeUInt16BE(cCrc);
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

module.exports = ModbusPackage;