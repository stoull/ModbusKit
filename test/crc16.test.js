"use strict"

const crc16 = require("../utils/crc16");
const datatools = require("../utils/datatools");

test("CRC16", () => {
    const buffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    const crc = crc16(buffer);
    expect(crc).toBe(50227);
});

test("CRC16", () => {
    const buffer = Buffer.from("110100130025", "hex");
    const crc = crc16(buffer);
    expect(crc).toBe(33806);
});

test("CRC16", () => {
    const buffer = Buffer.from("110100130025", "hex");
    const crc = crc16(buffer);
    expect(crc).toBe(33806);
});

test("Modbus CRC16", () => {
    const buffer = Buffer.from("110100130025", "hex");
    const crc = crc16(buffer);
    const crcHex = datatools.uint16ToHexString(crc);
    expect(crcHex).toBe('840e');
});