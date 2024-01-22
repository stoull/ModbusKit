
const ConnectionType = Object.freeze({
    BLE: 0,
    TCP: 1
})

const FunctionCode = Object.freeze({
    penetrate17: 0x17,
    write18: 0x18,
    read19: 0x19,
    fileTransfer26: 0x26
})

const SERIALNUMBER_LENGTH = 10;
const XOR_KEY = "Growatt";

var MODBUS_VERSION = 0x0005
var CONNECTION_TYPE = ConnectionType.BLE // 认为Port.BLE，像本地蓝牙于网络传输的数服协议包会有不同

const modbusErrorMessages = [
    "未知错误",
    "数据不合法",
    "Illegal data address (register not supported by device)",
    "Illegal data value (value cannot be written to this register)",
    "Slave device failure (device reports internal error)",
    "Acknowledge (requested data will be available later)",
    "Slave device busy (retry request again later)"
];

const ModbusPackageError = function(message) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
};

module.exports = {
    ConnectionType: ConnectionType,
    FunctionCode: FunctionCode,
    SERIALNUMBER_LENGTH: SERIALNUMBER_LENGTH,
    XOR_KEY: XOR_KEY,
    MODBUS_VERSION: MODBUS_VERSION,
    CONNECTION_TYPE: CONNECTION_TYPE,
    modbusErrorMessages: modbusErrorMessages,
    ModbusPackageError: ModbusPackageError
};