"use strict"

const aes = require("../utils/aes");

test("AES crypto-js", () => {
    const enData = aes.encrypt("123456")
    var hexStr = aes.hexString(enData)
    expect(hexStr).toBe('c5973907af46c13dc7e5546274b3c972');
    const deData = aes.decrypt(enData)
    const deString = aes.parseToString(deData)
    expect(deString).toBe('123456');
});

test("AES crypto-js", () => {
    const hexRawStr = "30303030303030303030000100240036002067726f776174745f696f745f6465766963655f636f6d6d6f6e5f6b65795f3031"
    const buf = Buffer.from(hexRawStr, 'hex');
    const enData = aes.encrypt(buf)
    var hexStr = aes.hexString(enData)
    expect(hexStr).toBe('02dc6dad19f245f834f3b53ab52cfe44b04b2e1541b74584866c883a895ed7faf9407be0308b03b689c8ddb6efeb46c79a9db6e503c9d6e18b237d1e4682a380');
});

test("AES crypto", () => {
    const hexRawStr = "30303030303030303030000100240036002067726f776174745f696f745f6465766963655f636f6d6d6f6e5f6b65795f3031"
    const buf = Buffer.from(hexRawStr, 'hex');
    const enData = aes.encrypZeroPad(buf)
    expect(enData).toBe('02dc6dad19f245f834f3b53ab52cfe44b04b2e1541b74584866c883a895ed7faf9407be0308b03b689c8ddb6efeb46c79a9db6e503c9d6e18b237d1e4682a380');
});

test("AES crypto", () => {
    const enData = aes.encrypZeroPad('123456');
    var hexStr = enData.toString('hex')
    expect(hexStr).toBe('c5973907af46c13dc7e5546274b3c972');
    const deData = aes.decryptZeroPad(enData)
    let deString = Buffer.from(deData.toString('hex'), 'hex').toString('utf8');
    expect(deString).toBe('123456');
});

