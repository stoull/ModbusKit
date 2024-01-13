
const crc16 = require("./utils/crc16");

const SERIALNUMBER_LENGTH = 10;
const XOR_KEY = "Growatt";
var MODBUS_VERSION = 0x0005


const Port = Object.freeze({
    BLE: 0,
    TCP: 1
  })


class ModbusPackage {
    /**
     * Growatt数服协议包
     *
     * @param {Port} 此包传输出的方式，像本地蓝牙于网络传输的数服协议包会有不同
     */
    constructor(port) {
        this._port = port
    }
}