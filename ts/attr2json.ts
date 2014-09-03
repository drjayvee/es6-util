import Attr = require('attr');

class Attr2JSON extends Attr {
    toJSON () {
        return JSON.stringify(this.attrs);
    }
}

export = Attr2JSON;
