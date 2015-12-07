/*jshint esnext:true*/
/*global QUnit*/

import {mix, factoryFactory} from 'js/oop';
import {Attribute, AttributeObservable} from 'js/attribute';

QUnit.module('attribute', {
	beforeEach: function () {
		this.SimpleAttribute = factoryFactory(Attribute);
	}
});

QUnit.test('basic add, set / get use', function (assert) {
	let at = this.SimpleAttribute.create();
	
	at.addAttribute('k');
	
	// test hasAttribute()
	assert.notOk(at.hasAttribute('nope'));
	assert.ok(at.hasAttribute('k'));
	
	// test get / set
	assert.equal(at.get('k'), undefined);
	
	at.set('k', 'v');
	assert.equal(at.get('k'), 'v');
	
	at.set('k', null);
	assert.equal(at.get('k'), null);
	
	let ob = {};
	assert.equal(at.set('k', ob).get('k'), ob);
	
	// test chainability
	assert.equal(at.set('k', true), at);
	
	// try with definition on prototype
	this.SimpleAttribute.ATTRS = {
		k: {
			value: 1337
		}
	};
	
	at = this.SimpleAttribute.create();
	assert.equal(at.get('k'), 1337);
	at.set('k', 1336);
	assert.equal(at.get('k'), 1336);
	
	at = this.SimpleAttribute.create();
	assert.equal(at.get('k'), 1337);
	
	// check whether value configured through addAttribute is set
	at.addAttribute('l', {value: 'w'});
	assert.equal(at.get('l'), 'w');
});

QUnit.test('test validator', function (assert) {
	let at = this.SimpleAttribute.create(),
		validatorCalled = false;
	
	at.addAttribute('k', {
		validator: function (val) {
			validatorCalled = true;
			return val >= 1337;
		}
	});
	
	at.set('k', 1);
	assert.ok(validatorCalled);
	assert.equal(at.get('k'), undefined);
	
	at.set('k', 1337);
	assert.equal(at.get('k'), 1337);
	
	at.set('k', null);
	assert.equal(at.get('k'), 1337);
	
	assert.equal(at.set('k', 1), at);	// test chainability
});

QUnit.test('getter / setter', function (assert) {
	let at = this.SimpleAttribute.create(),
		getterCalled = false,
		setterCalled = false;
	
	at.addAttribute('k', {
		getter:	function (value, name) {
			getterCalled = true;
			
			return value && JSON.parse(value)[name];
		},
		setter: function (value, name) {
			let ob = {};
			
			setterCalled = true;
			
			if (!value) {
				return Attribute.INVALID;
			}
			ob[name] = value;
			return JSON.stringify(ob);
		}
	});
	
	at.set('k', 1337);
	assert.ok(setterCalled);
	assert.equal(at.get('k'), 1337);
	assert.ok(getterCalled);
	
	// try invalid value
	setterCalled = false;
	getterCalled = false;
	
	at.set('k', 0);
	assert.ok(setterCalled);
	assert.equal(at.get('k'), 1337);
	assert.ok(getterCalled);
});

QUnit.test('initialize attributes via constructor', function (assert) {
	this.SimpleAttribute.ATTRS = {
		k1: {
			value: 1337,
			validator: function (value) {
				let numVal = +value;
				return value === numVal;
			}
		},
		k2: {
			value: 'elite'
		}
	};
	
	// empty config
	let at = this.SimpleAttribute.create({});
	
	assert.equal(at.get('k1'), 1337);
	assert.equal(at.get('k2'), 'elite');
	
	// supply config
	at = this.SimpleAttribute.create({
		k1: 13.37,
		k2: 'sweet'
	});
	
	assert.equal(at.get('k1'), 13.37);
	assert.equal(at.get('k2'), 'sweet');
	
	// supply invalid initial value
	at = this.SimpleAttribute.create({
		k1: 'bad'
	});
	
	assert.equal(at.get('k1'), 1337);
});

QUnit.test('attribute change events', function (assert) {
	// AttributeObservable object factory
	function createAO (config) {
		var ob = Object.create(AttributeObservable);
		
		AttributeObservable.init.call(ob, config);
		
		return ob;
	}
	
	let ao = createAO(),
		cancelChange = false,
		onChangeEvent = null,
		afterChangeEvent = null,
		valid = true;
	
	// set up listeners
	ao.addAttribute('k', {
		validator: function () {
			return valid;
		}
	});
	
	ao.on('kChange', function (e) {
		onChangeEvent = e;
		if (cancelChange) {
			e.cancel();
		}
	});
	ao.after('kChange', function (e) {
		afterChangeEvent = e;
	});
	
	// (initial) set attr
	ao.set('k', 'sweet');
	
	assert.equal(onChangeEvent.prevVal, undefined);
	assert.equal(onChangeEvent.newVal, 'sweet');
	assert.equal(onChangeEvent.attrName, 'k');
	
	assert.ok(afterChangeEvent);
	
	assert.equal(ao.get('k'), 'sweet');
	
	// cancel change
	onChangeEvent = afterChangeEvent = null;
	cancelChange = true;
	
	ao.set('k', 'sweeter');
	
	assert.ok(onChangeEvent);
	assert.equal(afterChangeEvent, null);
	assert.equal(ao.get('k'), 'sweet');
	
	// after is only fired if new value is valid
	afterChangeEvent = null;
	cancelChange = false;
	valid = false;
	
	ao.set('k', 'sweeter');
	assert.equal(ao.get('k'), 'sweet');
	assert.equal(afterChangeEvent, null);
	
	// after is only fired if a change occured
	afterChangeEvent = null;
	valid = true;
	
	ao.set('k', 'sweet');
	assert.equal(afterChangeEvent, null);
	
	// on's callback gets pre-setter value, after's gets post-setter
	onChangeEvent = afterChangeEvent = null;
	ao.addAttribute('s', {
		value: 1337,
		setter: function (value) {
			return +value;
		}
	});
	
	ao.on('sChange', function (e) {
		onChangeEvent = e;
	});
	ao.after('sChange', function (e) {
		afterChangeEvent = e;
	});
	
	ao.set('s', '1338');
	
	assert.deepEqual(onChangeEvent.prevVal, 1337);
	assert.deepEqual(onChangeEvent.newVal, '1338');
	
	assert.deepEqual(afterChangeEvent.prevVal, 1337);
	assert.deepEqual(afterChangeEvent.newVal, 1338);
	
	// on listener can change new value before validation
	ao.addAttribute('t', {
		value: 1337,
		setter: function (value) {
			return +value;
		},
		validator: function (value) {
			return value === +value;
		}
	});
	
	ao.on('tChange', function (e) {
		if (valid) {
			e.newVal = +e.newVal + 1;
		} else {
			e.newVal = 'oh noes!';
		}
	});
	ao.after('tChange', function (e) {
		afterChangeEvent = e;
	});
	
	valid = true;
	afterChangeEvent = null;
	ao.set('t', 8007);
	
	assert.equal(afterChangeEvent.newVal, 8008);
	assert.equal(ao.get('t'), 8008);
	
	// try again with on cb setting invalid value
	valid = false;
	afterChangeEvent = null;
	ao.set('t', '1336');
	
	assert.equal(afterChangeEvent, null);
	assert.equal(ao.get('t'), 8008);
});

QUnit.test('class chain attributes', function (assert) {
	// case 1: base class has SimpleAttribute extension
	let C1 = factoryFactory(this.SimpleAttribute);
	
	C1.ATTRS = {
		c1: {value: 'c1'}
	};
	
	let C2 = factoryFactory(C1);
	C2.ATTRS = {
		c2: {value: 'c2'}
	};
	
	let i = C2.create();
	assert.equal(i.get('c1'), 'c1');
	assert.equal(i.get('c2'), 'c2');
	
	// case 2: ATTRs everywhere
	let E1  = {
		ATTRS: {
			e1: {value: 'e1'}
		}
	};
	
	let E2  = {
		ATTRS: {
			e2: {value: 'e2'}
		}
	};
	
	let CE1 = factoryFactory(this.SimpleAttribute);
	CE1.ATTRS = {
		c1: {value: 'c1'}
	};
	mix(CE1, E1);
	
	let CE2 = factoryFactory(CE1);
	CE2.ATTRS = {
		c2: {value: 'c2'}
	};
	mix(CE2, E2);
	
	let CE3 = factoryFactory(CE2);
	CE3.ATTRS =  {
		c3: {value: 'c3'}
	};
	
	i = CE3.create();
	assert.equal(i.get('c1'), 'c1');
	assert.equal(i.get('c2'), 'c2');
	assert.equal(i.get('c3'), 'c3');
	assert.equal(i.get('e1'), 'e1');
	assert.equal(i.get('e2'), 'e2');
	
	i = CE3.create({
		c1: '1',
		c2: '2',
		c3: '3',
		e1: '4',
		e2: '5'
	});
	assert.equal(i.get('c1'), '1');
	assert.equal(i.get('c2'), '2');
	assert.equal(i.get('c3'), '3');
	assert.equal(i.get('e1'), '4');
	assert.equal(i.get('e2'), '5');
});

QUnit.test('AttributeObservable chain attributes', function (assert) {
	let E1  = {
		ATTRS: {
			e1: {value: 'e1'}
		}
	};
	
	let E2  = {
		ATTRS: {
			e2: {value: 'e2'}
		}
	};
	
	class C1 {
		constructor (config) {
			AttributeObservable.init.call(this, config);
		}
	}
	C1.prototype.ATTRS = {
		c1: {value: 'c1'}
	};
	mix(C1.prototype, AttributeObservable, E1);
	
	class C2 extends C1 {}
	C2.prototype.ATTRS = {
		c2: {value: 'c2'}
	};
	mix(C2.prototype, E2);
	
	class C3 extends C2 {}
	C3.prototype.ATTRS = {
		c3: {value: 'c3'}
	};
	
	let i = new C3();
	assert.equal(i.get('c1'), 'c1');
	assert.equal(i.get('c2'), 'c2');
	assert.equal(i.get('c3'), 'c3');
	assert.equal(i.get('e1'), 'e1');
	assert.equal(i.get('e2'), 'e2');
	
	i = new C3({
		c1: '1',
		c2: '2',
		c3: '3',
		e1: '4',
		e2: '5'
	});
	assert.equal(i.get('c1'), '1');
	assert.equal(i.get('c2'), '2');
	assert.equal(i.get('c3'), '3');
	assert.equal(i.get('e1'), '4');
	assert.equal(i.get('e2'), '5');
});
