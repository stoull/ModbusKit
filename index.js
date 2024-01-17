
const crc16 = require("./utils/crc16");
const xor = require("./utils/xor");
const aes = require("../utils/aes");

const ConnectionType = Object.freeze({
    BLE: 0,
    TCP: 1
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
     * @param {UInt16} transactId   通讯编号 0x0004
     * @param {UInt16} protocolId   功能码
     * @param {UInt16} length       数据长度
     * @param {UInt8} deviceAdress  设备地址 单元标识符 (UnitId , 1 Bytes)
     * @param {UInt8} functionCode 功能码
     * @param {Buffer} data         数据区
     */

    constructor(transactId = 0x0004, functionCode, data) {
        this.transactId = transactId;
        this.protocolId = MODBUS_VERSION;
        this.length = 0x0000;
        this.deviceAdress = 0x01;
        this.functionCode = functionCode;
        this.data = data;
        this.length = data.length;
    }

    extractData(buf) {
        const buf = Buffer.alloc(8 + this.data.length + 2);
        this.transactId = buf.readUint16BE(0)
        this.protocolId = buf.readUint16BE(2)
        this.data.length = buf.readUint16BE(4)
        this.deviceAdress = buf.readUint8(6)
        this.functionCode = buf.readUint8(7)
    }
    
    asData(next) {

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
            let encryptedData
            if (MODBUS_VERSION > 5) {
                encryptedData = aes.encrypt(this.data)
            } else {
                encryptedData = xor(this.data, XOR_KEY)
            }
            for (i = 0; i < encryptedData.length; i++) {
                buf.writeUInt8(encryptedData[i], 7 + i);
            }

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
        buf.writeUInt16BE(crc16(buf));
        return buf;
    }
    
    _assembleCRC(packageData) {
        // let dataWithCRC = packageData;
        // let crc = GTModbusEncryption.CRC16(new Uint8Array(packageData), 0xFFFF);
        // if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
        //     // No need to generate CRC for penetrate command
        //     crc = 0;
        // }
        // if (crc !== 0) {
        //     dataWithCRC.push((crc >> 8) & 0xFF, crc & 0xFF);
        // }
        // return dataWithCRC;
    }
    
    _checkCRCValid(checkData) {
        // const dataArray = checkData;
        // if (dataArray.length <= 8) {
        //     return false;
        // }
        // this.transactId = (new Uint8Array(dataArray.slice(0, 2))).uint16;
        // this.protocolId = (new Uint8Array(dataArray.slice(2, 4))).uint16;
        // const length = (new Uint8Array(dataArray.slice(4, 6))).uint16;
        // this.length = length;
        // this.slaveAdress = dataArray[6];
        // this.functionCode = GTModbusFunctionCode[dataArray[7]] || .unkonw;
        // if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
        //     // No need for CRC validation for penetrate command
        //     return true;
        // } else {
        //     // CRC validation
        //     const packageCRC = (new Uint8Array(dataArray.slice(dataArray.length - 2, dataArray.length))).uint16;
        //     const checkData = new Uint8Array(dataArray.slice(0, dataArray.length - 3));
        //     const caculateCRC = GTModbusEncryption.CRC16(checkData);
        //     if (packageCRC !== 0 && packageCRC === caculateCRC) {
        //         return true;
        //     }
        //     return false;
        // }
    }
    
    _encrpty(targetData) {
        // let encryptedData = targetData;
        // if (CONNECTION_TYPE == ConnectionType.BLE) {
        //     if (MODBUS_VERSION > 0x0005) {
        //         // Encrypt data (AES128)
        //         // Encrypt data (AES128)
        //         console.log("Data before encryption (AES128):", targetData);
        //         const enedData = GTModbusEncryption.aesGrowattEncrypt(targetData);
        //         if (enedData) {
        //             encryptedData = enedData;
        //         }
        //         console.log("Data after encryption (AES128):", encryptedData);
        //     } else {
        //         // Encrypt data (XOR with key)
        //         console.log("数据加密前-XOR:", targetData);
        //         encryptedData = xor(targetData, k_XOR_KEY);
        //         console.log("数据加密前后-XOR:", encryptedData);
        //     }
        // }
        // return encryptedData;
    }
    
    _decrypt(targetData) {
        // let decryptedData = targetData;
        // if (k_ConnectionType === .bluetooth) {
        //     if (k_GTModbus_Version <= 5) {
        //         // Decrypt data (XOR with key)
        //         console.log("Data before decryption (XOR with key):", targetData);
        //         decryptedData = GTModbusEncryption.XOR(targetData, k_XOR_KEY);
        //         console.log("Data after decryption (XOR with key):", decryptedData);
        //     } else if (k_GTModbus_Version > 5) {
        //         console.log("Data before decryption (AES128):", targetData);
        //         const deedData = GTModbusEncryption.aesGrowattDecrypt(targetData);
        //         if (deedData) {
        //             decryptedData = deedData;
        //         }
        //         console.log("Data after decryption (AES128):", decryptedData);
        //     }
        // }
        // return decryptedData;
    }
}