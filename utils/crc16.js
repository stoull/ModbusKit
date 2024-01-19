"use strict";

/**
 * 计算数据的 CRC16.
 *
 * @param {Buffer} buffer 需要计算的数据.
 * @return {number} 计算数据的 CRC16 结果.
 */

module.exports = function crc16(buffer) {
    let crc = 0xFFFF;
    let odd;

    for (let i = 0; i < buffer.length; i++) {
        crc = crc ^ buffer[i];

        for (let j = 0; j < 8; j++) {
            odd = crc & 0x0001;
            crc = crc >> 1;
            if (odd) {
                crc = crc ^ 0xA001;
            }
        }
    }

    return crc;
}