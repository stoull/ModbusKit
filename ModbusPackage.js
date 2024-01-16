"use strict";

class GTModbusPackage {
    constructor(functionCode, data, transactId = 0x0002) {
        this.transactId = transactId;
        this.protocolId = k_GTModbus_Version;
        this.length = 0x0000;
        this.slaveAdress = 0x01;
        this.functionCode = functionCode;
        this.data = data;
        this.length = data.length;
    }
    
    extractData(modData) {
        let encrypedData = modData.slice(8, modData.length - 3);
        if (this.functionCode === GTModbusFunctionCode.penetrate_0x17) {
            encrypedData = modData.slice(8, modData.length - 1);
        }
        if (k_ConnectionType === .bluetooth) {
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
    
    asData() {
        const packageData = [];
        const length = this.data.length + 2; // Data + function code + slave address
        packageData.push((this.transactId >> 8) & 0xFF, this.transactId & 0xFF);
        packageData.push((this.protocolId >> 8) & 0xFF, this.protocolId & 0xFF);
        packageData.push((length >> 8) & 0xFF, length & 0xFF);
        packageData.push(this.slaveAdress);
        packageData.push(this.functionCode);
        let encryptedData = [];
        if (k_ConnectionType === .bluetooth) {
            // Encrypt data
            encryptedData = Array(this.encrpty(this.data));
            if (k_GTModbus_Version > 5) {
                // Update total length
                if (k_GTModbus_Version === 6) {
                    const allLength = packageData.length + encryptedData.length;
                    packageData[0] = (allLength >> 8) & 0xFF;
                    packageData[1] = allLength & 0xFF;
                }
            }
        }
        if (encryptedData.length > 0) {
            packageData.push(...encryptedData);
        }
        const checkedCRCData = this.assembleCRC(packageData);
        return new Uint8Array(checkedCRCData);
    }
    
    assembleCRC(packageData) {
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
    
    checkCRCValid(checkData) {
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
    
    encrpty(targetData) {
        let encryptedData = targetData;
        if (k_ConnectionType === .bluetooth) {
            if (k_GTModbus_Version > 5) {
                // Encrypt data (AES128)
                console.log("Data before encryption (AES128):", targetData);
                const enedData = GTModbusEncryption.aesGrowattEncrypt(targetData);
                if (enedData) {
                    encryptedData = enedData;
                }
                console.log("Data after encryption (AES128):", encryptedData);
            } else {
                // Encrypt data (XOR with key)
                console.log("Data before encryption (XOR with key):", targetData);
                encryptedData = GTModbusEncryption.XOR(targetData, k_XOR_KEY);
                console.log("Data after encryption (XOR with key):", encryptedData);
            }
        }
        return encryptedData;
    }
    
    decrypt(targetData) {
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