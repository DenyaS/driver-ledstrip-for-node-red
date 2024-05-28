module.exports = function (RED) {
    const i2c = require('i2c-bus');

    const MODE1 = 0x0;
    const MODE2 = 0x1;
    const LEDOUT0 = 0x14;
    const LEDOUT1 = 0x15;
    const LEDOUT2 = 0x16;
    const LEDOUT3 = 0x17;

    
    function setTrue(node) {
        node.status({ fill: "green", shape: "dot", text: "true" })
    }

    function setFalse(node) {
        node.status({ fill: "green", shape: "dot", text: "false" });
    }

    function setWrongProperties(node) {
        node.status({ fill: "red", shape: "ring", text: "Wrong properties" });
    }

    function setOk(node) {
        node.status({ fill: "yellow", shape: "dot", text: "OK" });
    }

    function setWrongPayload(node) {
        node.status({ fill: "red", shape: "ring", text: "Wrong payload" });
    }
    function checkStatus(state) {
        return state.pin >= 1 && state.pin <= 16 && state.bus >= 0 && state.bus <= 7
    }

    function setStatus(node) {
        if (checkStatus(node)) setOk(node)
        else setWrongProperties(node)
    }

    function setNode(config, node) {
        RED.nodes.createNode(node, config);
        node.pin = parseInt(config.pin)
        node.bus = parseInt(config.bus)
        node.address = parseInt(config.address, 16)
    }


    function Ledstrip(config) {

        setNode(config, this)

        setStatus(this)

        if (checkStatus(this)) {
            const i2cX = i2c.openSync(this.bus);
            i2cX.writeByteSync(this.address, MODE2, 0x15);  // погасить все порты инверсный
            i2cX.writeByteSync(this.address, MODE1, 0x8D);  // включить контроллер настроить режим
            i2cX.writeByteSync(this.address, (this.pin+1), 0x00); // отключить канал
            i2cX.writeByteSync(this.address, LEDOUT0, 0xAA); //Включить управление 0 регистром через регистр PWM
            i2cX.writeByteSync(this.address, LEDOUT1, 0xAA); //Включить управление 0 регистром через регистр PWM
            i2cX.writeByteSync(this.address, LEDOUT2, 0xAA); //Включить управление 0 регистром через регистр PWM
            i2cX.writeByteSync(this.address, LEDOUT3, 0xAA); //Включить управление 0 регистром через регистр PWM
        } else {
            setWrongProperties(this)
        }

        this.on('input', function (msg) {

            if (checkStatus(this)) {
                var payload = (parseInt(msg.payload));
//                if (msg.payload === "true") msg.payload = true;
//                if (msg.payload === "false") msg.payload = false;
                const i2cX = i2c.openSync(this.bus);
//                let output = i2cX.readByteSync(this.address, OUTPUT_PORT_REG);
               if ((msg.payload >= 0) & (msg.payload <= 255)) {

                   i2cX.writeByteSync(this.address, (this.pin+1), payload);
                   this.status({fill: "green", shape: "dot", text: `PWM${this.pin}=${payload}`});
 //                  setOk(this)
                } else {
                    setWrongPayload(this)
                }
                //write new output

            } else {
                setWrongProperties(this)
            }
        });
        this.on('close', function() {               //Функция закрытия ноды - выключить за собой!
            if (checkStatus(this)) {
                const i2cX = i2c.openSync(this.bus);
                i2cX.writeByteSync(this.address, (this.pin+1), 0x00);
            } else {
                setWrongProperties(this)
            }
        });
    }
    RED.nodes.registerType("Led strip", Ledstrip);
}
