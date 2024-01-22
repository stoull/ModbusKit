"use strict"

const {InverterFunctionCode, InverterPackage, InverterPackageRead, InverterPackageWrite} = require("../inverter-package/inverter-package");

test("Inverter Package read", () => {
    const param = {
        functionCode: InverterFunctionCode.readHolding03,
        startAddress: 0,
        registerCount: 107,
    }
    let read03Package = new InverterPackageRead(param)
    let bufDataStr = read03Package.asData().toString('hex')
    expect(bufDataStr).toBe('01030000006b0425');
    
});

test("Inverter Package read", () => {
    const buf = Buffer.from('0103D60000000100000000000000000000000000013030342E30303030352E30340012007800000001000000000000000158434D3044434730305100000000000101000000000000150234023401F4001500030000000000015016000307E500090008000F0022000A00003030332E3030000000333131352E30300000000000000000000000000000000000000000000000010000000000000000000000000000000000000000015E000004B0025801E0012C00C804B0025807D00004001501A403B6000000000000000000000000000000000001001E0001008D', 'hex')
    let read03Package = new InverterPackageRead(buf)
    expect(read03Package.registerCount).toBe(107);
});