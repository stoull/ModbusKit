"use strict"

const aes = require("../utils/aes");

test("Modbus AES", () => {
    console.log('raw string: 123456')
    const enData = aes.encrypt("123456")
    console.log(`encrypted Base64: ${enData}`)

    var hexStr = aes.hexString(enData)
    console.log(`encrypted hex: ${hexStr}`)

    expect(hexStr).toBe('c5973907af46c13dc7e5546274b3c972');

    const deData = aes.decrypt(enData)
    const deString = aes.parseToString(deData)

    expect(deString).toBe('123456');
});
