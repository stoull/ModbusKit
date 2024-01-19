"use strict";
/**
 * 计算循环异或
 *
 * @param {Buffer} buffer   需要计算的数据.
 * @return {buffer} buffer  循环异或后的数据.
 */
module.exports = function xor(buffer, key) {
    let resultBytes = Buffer.alloc(buffer.length);
    let keyBytes = Buffer.from(key, 'utf8');

    let index = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (index == keyBytes.length) {
            index = 0
        }
        resultBytes[i] = buffer[i] ^ keyBytes[index]
        index+=1
    }
    return resultBytes;
}

