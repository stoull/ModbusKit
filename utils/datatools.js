"use strict";

/**
 * 将Uint16转成Hex String
 *
 * @param {Uint16} value 需要计算的数值.
 */

function uint16ToBEHexString(value) {
    const high = value >> 8
    const low = value & 0xff
    return Buffer(Uint8Array.from([high, low]).buffer).toString('hex')
}

module.exports = {
    uint16ToBEHexString: uint16ToBEHexString
};