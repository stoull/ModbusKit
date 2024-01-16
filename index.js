
const crc16 = require("./utils/crc16");
const xor = require("./utils/xor");

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
     * @param {UInt16} transactId  通讯编号 0x0004
     * @param {UInt16} protocolId 功能码
     * @param {UInt16} length      数据长度
     * @param {UInt8} deviceAdress 设备地址 单元标识符 (UnitId , 1 Bytes)
     * @param {UInt16} functionCode 功能码
     * @param {Buffer} data        数据区
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

    extractData(modData) {
        let encrypedData = modData.slice(8, modData.length - 3);
        if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
            encrypedData = modData.slice(8, modData.length - 1);
        }
        if (CONNECTION_TYPE === ConnectionType.BLE) {
            if (k_GTModbus_Version > 5) {
                // Update total length
                if (k_GTModbus_Version === 6) {
                }
            }
            // Decrypt data
            this.data = Array(this.decrypt(encrypedData));
        } else {
            this.data = Array(encrypedData);
        }
    }
    
        /**
     * Write a Modbus "Preset Multiple Registers" (FC=16) to serial port.
     *
     * @param {number} address the slave unit address.
     * @param {number} dataAddress the Data Address of the first register.
     * @param {Array} array the array of values to write to registers.
     * @param {Function} next the function to call next.
     */
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
            
        } else {
            // 走网络的或其它的数据处理

        }

         
        let length = data.count + 2 // 数据加功能码及设备地址两个字节
        packageData.append(contentsOf: [UInt8(transactId >> 8), UInt8(transactId & 0xFF)])
        packageData.append(contentsOf: [UInt8(protocolId >> 8), UInt8(protocolId & 0xFF)])
        packageData.append(contentsOf: [UInt8(lenght >> 8), UInt8(lenght & 0xFF)])   // 从下一字节到最后一个字节的长度
        
        packageData.append(slaveAdress) // 地址位 Unit ID
        packageData.append(functionCode.rawValue)
        
       
       var encryptedData: Data = Data()
       if k_ConnectionType == .bluetooth {
           // 数据区加密
           encryptedData = self.encrpty(targetData: Data(data))
           if k_GTModbus_Version > 5 {
               // 更新总长度
               if k_GTModbus_Version == 6 {
                   let allLength = packageData.count + encryptedData.count
                   packageData[0] = UInt8(allLength >> 8)
                   packageData[1] = UInt8(allLength & 0xFF)
               }
           }
       }
       
        if encryptedData.count > 0 {
            packageData.append(contentsOf: encryptedData)
        }
       
        let checkedCRCData = self.assembleCRC(with: packageData)
        return Data(checkedCRCData)
    }
    
    _assembleCRC(packageData) {
        let dataWithCRC = packageData;
        let crc = GTModbusEncryption.CRC16(new Uint8Array(packageData), 0xFFFF);
        if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
            // No need to generate CRC for penetrate command
            crc = 0;
        }
        if (crc !== 0) {
            dataWithCRC.push((crc >> 8) & 0xFF, crc & 0xFF);
        }
        return dataWithCRC;
    }
    
    _checkCRCValid(checkData) {
        const dataArray = checkData;
        if (dataArray.length <= 8) {
            return false;
        }
        this.transactId = (new Uint8Array(dataArray.slice(0, 2))).uint16;
        this.protocolId = (new Uint8Array(dataArray.slice(2, 4))).uint16;
        const length = (new Uint8Array(dataArray.slice(4, 6))).uint16;
        this.length = length;
        this.slaveAdress = dataArray[6];
        this.functionCode = GTModbusFunctionCode[dataArray[7]] || .unkonw;
        if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
            // No need for CRC validation for penetrate command
            return true;
        } else {
            // CRC validation
            const packageCRC = (new Uint8Array(dataArray.slice(dataArray.length - 2, dataArray.length))).uint16;
            const checkData = new Uint8Array(dataArray.slice(0, dataArray.length - 3));
            const caculateCRC = GTModbusEncryption.CRC16(checkData);
            if (packageCRC !== 0 && packageCRC === caculateCRC) {
                return true;
            }
            return false;
        }
    }
    
    _encrpty(targetData) {
        let encryptedData = targetData;
        if (CONNECTION_TYPE == ConnectionType.BLE) {
            if (MODBUS_VERSION > 0x0005) {
                // Encrypt data (AES128)
                // Encrypt data (AES128)
                console.log("Data before encryption (AES128):", targetData);
                const enedData = GTModbusEncryption.aesGrowattEncrypt(targetData);
                if (enedData) {
                    encryptedData = enedData;
                }
                console.log("Data after encryption (AES128):", encryptedData);
            } else {
                // Encrypt data (XOR with key)
                console.log("数据加密前-XOR:", targetData);
                encryptedData = xor(targetData, k_XOR_KEY);
                console.log("数据加密前后-XOR:", encryptedData);
            }
        }
        return encryptedData;
    }
    
    _decrypt(targetData) {
        let decryptedData = targetData;
        if (k_ConnectionType === .bluetooth) {
            if (k_GTModbus_Version <= 5) {
                // Decrypt data (XOR with key)
                console.log("Data before decryption (XOR with key):", targetData);
                decryptedData = GTModbusEncryption.XOR(targetData, k_XOR_KEY);
                console.log("Data after decryption (XOR with key):", decryptedData);
            } else if (k_GTModbus_Version > 5) {
                console.log("Data before decryption (AES128):", targetData);
                const deedData = GTModbusEncryption.aesGrowattDecrypt(targetData);
                if (deedData) {
                    decryptedData = deedData;
                }
                console.log("Data after decryption (AES128):", decryptedData);
            }
        }
        return decryptedData;
    }
}