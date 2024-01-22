"use strict"

const ModbusPackage = require("../index");

const datatools = require("../utils/datatools");

test("Modbus Package", () => {

    const buf = Buffer.from('00010005000F01180F3922472537307642387757749AD5', 'hex')
    const pak = new ModbusPackage(buf)
    
    expect(pak.checkCRC(buf)).toBe(true);
    expect(datatools.uint16ToBEHexString(pak.crc)).toBe('9ad5');

});