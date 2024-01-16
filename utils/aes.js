
const CryptoJS = require("crypto-js");

const AES_KEY = 'growatt_aes16key' // 密钥, AES-128 需16个字符, AES-256 需要32个字符
const AES_IV = 'growatt_aes16Ivs' // 密钥偏移量，16个字符

const key = CryptoJS.enc.Utf8.parse(AES_KEY)
const iv = CryptoJS.enc.Utf8.parse(AES_IV)

// 加密
function encrypt(data) {
    const srcs = CryptoJS.enc.Utf8.parse(data)
    const encrypted = CryptoJS.AES.encrypt(data, key, {
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
    console.log(`encrypted hex: ${eHex}`)
    return eHex
}

// 将解密的数据转成utf8string, 前提是加密的是utf8string
function parseToString(decryptedData) {
    return CryptoJS.enc.Utf8.stringify(decryptedData).toString()
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    hexString: hexString,
    parseToString: parseToString
};

