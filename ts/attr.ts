import $ = require('jquery');

class Attr {
	attrs: Object = {};

	set(key: string, value): Attr {
		this.attrs[key] = value;
		return this;
	}

	get(key: string) {
		return this.attrs[key];
	}
	
	getAll(): Object {
		return this.attrs;
	}
}

export = Attr;
