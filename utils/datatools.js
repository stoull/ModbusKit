"use strict";

const endian = require("./endian");

/**
 * 将Uint16转成Hex String
 *
 * @param {Uint16} value 需要计算的数值.
 */

function uint16ToHexString(value) {
    if (endian.checkEndian() == endian.Endian.little) {
        const low = value >> 8
        const high = value & 0xff
        return Buffer(Uint8Array.from([high, low]).buffer).toString('hex')
    } else {
        return Buffer(Uint16Array.from([value]).buffer).toString('hex')
    }
}

module.exports = {
    uint16ToHexString: uint16ToHexString
};