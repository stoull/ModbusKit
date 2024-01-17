"use strict"

const xor = require("../utils/xor");
const XOR_KEY = "Growatt";

test("Modbus XOR", () => {
    const buffer = Buffer.from("af0012322323f2f3", "hex");
    const xorHex = xor(buffer, XOR_KEY).toString('hex')
    expect(xorHex).toBe("e8727d45425786b4");
});

test("Modbus XOR", () => {
    const buffer = Buffer.from("123456", "hex");
    const xorHex = xor(buffer, XOR_KEY).toString('hex')
    expect(xorHex).toBe("554639");
});

test("Modbus XOR", () => {
    const buffer = Buffer.from("0f392247253730764238775774", "hex");
    const xorHex = xor(buffer, XOR_KEY).toString('hex')
    expect(xorHex).toBe("484b4d30444344313057003600");
});