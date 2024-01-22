
class InverterPackage {
    constructor(obj) {
        console.log("xxxxx InverterPackage super constructor ")
        this._superInit()
    }

    _superInit() {
        console.log("xxxxx InverterPackage _superInit")
    }
}


class InverterPackageSub extends InverterPackage{
    constructor(obj) {
        super(obj)
        console.log("xxxxx InverterPackage sub constructor ")
        this._subInit()
    }

    _subInit() {
        console.log("xxxxx InverterPackage _subInit")
    }
}

let inverterPkg = new InverterPackageSub()

