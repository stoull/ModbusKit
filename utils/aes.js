
const CryptoJS = require("crypto-js");

const AES_KEY = 'growatt_aes16key' // 密钥, AES-128 需16个字符, AES-256 需要32个字符
const AES_IV = 'growatt_aes16Ivs' // 密钥偏移量，16个字符

const key = CryptoJS.enc.Utf8.parse(AES_KEY)
const iv = CryptoJS.enc.Utf8.parse(AES_IV)

// 加密
function encrypt(data) {
    const srcs = CryptoJS.enc.Utf8.parse(data)
    const encrypted = CryptoJS.AES.encrypt(srcs, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding // Pkcs7
    })
    return encrypted
}

// 解密
function decrypt(data) {
    const decrypted = CryptoJS.AES.decrypt(data, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding // Pkcs7
    })
    return decrypted
}

// 将加密的数据转成hex
function hexString(encryptedData) {
    var e64 = CryptoJS.enc.Base64.parse(encryptedData.toString());
    var eHex = e64.toString(CryptoJS.enc.Hex);
    return eHex
}

// 将解密的数据转成utf8string, 前提是加密的是utf8string
function parseToString(decryptedData) {
    return CryptoJS.enc.Utf8.stringify(decryptedData).toString()
}



/* 使用crypto实现
   这里手是手动实现ZeroPadding, 但是上面的CryptoJS已经实现, 这里使用一种即可
*/
const crypto = require('crypto');

function encrypZeroPad(data) {
    let newData = data
    if (data instanceof Buffer) {
        newData = Buffer.from(data).toString('utf8')
    }
    // pad data
    var zeroPadData = zeroPad(newData, 16)
    const cipher = crypto.createCipheriv('aes-128-cbc', AES_KEY, AES_IV);
    cipher.setAutoPadding(false);
    // Encrypt the data
    let encryptedData = cipher.update(zeroPadData, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData
}

function decryptZeroPad(data) {
    let newData = Buffer(data, 'hex')
    const cipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
    cipher.setAutoPadding(false);
    // Encrypt the data
    let decryptedData = cipher.update(newData, 'hex', 'hex');
    decryptedData += cipher.final('hex');
        // ZERO移除
    decryptedData = removeZeroPad(decryptedData)
    return decryptedData
}

function zeroPad(text, bs){
    var newText = text;
    if (text instanceof Buffer) {
        newText = Buffer.from(text).toString('utf8');
    } else if (typeof text !== 'string') {
        throw new Error('Text must be a string');
    }
    var padLength = newText.length;
    if (newText.length % bs > 0){
      padLength += bs - newText.length % bs;
    }
    // ZERO填充
    return newText.padEnd(padLength, '\0');
}

function removeZeroPad(text) {
    var newText = text;
    if (text instanceof Buffer) {
        newText = Buffer.from(deData, 'hex')
    } else if (typeof text !== 'string') {
        throw new Error('Text must be a string');
    }
    
    // 到这里进行ZERO移除 不安全！！！！如果原始数据本来就是0呢，是不是协议也没有考虑到？？
    // Padding zeros cannot always be reliably removed, and so should be avoided. 
    return newText.replace(/(00+)$/, "");
}

module.exports = {
    encrypZeroPad: encrypZeroPad,
    decryptZeroPad: decryptZeroPad,
    encrypt: encrypt,
    decrypt: decrypt,
    hexString: hexString,
    parseToString: parseToString
};