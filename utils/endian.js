
"use strict";

// 字节顺序
const Endian = Object.freeze({
    unknow: 0,
    little: 1,
    big: 2,
})

/**
 * 判断当前系统的字节顺序
 *
 */
function checkEndian() {
    var arrayBuffer = new ArrayBuffer(2);
    var uint8Array = new Uint8Array(arrayBuffer);
    var uint16array = new Uint16Array(arrayBuffer);
    uint8Array[0] = 0xAA;
    uint8Array[1] = 0xBB;
    if(uint16array[0] === 0xBBAA) return Endian.little;
    if(uint16array[0] === 0xAABB) return Endian.big;
    else return Endian.big;
}

function isLittleEndian() {
    let current = checkEndian()
    if (current == Endian.little) {
        return true
    } else {
        return false
    }
}

module.exports = {
    Endian: Endian,
    checkEndian: checkEndian,
    isLittleEndian: isLittleEndian
};