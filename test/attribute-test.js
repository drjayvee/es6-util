/*global console, define, require, QUnit*/
require(['js/attribute', 'js/oop'], function (attr, oop) {
	"use strict";
	
	var Attribute = attr.Attribute,
		AttributeObservable = attr.AttributeObservable;
	
	QUnit.test('basic add, set / get use', function (assert) {
		var ATI,
			at = new Attribute();
		
		at.addAttribute('k');
		
		// test hasAttribute()
		assert.equal(at.hasAttribute('nope'), false);
		assert.ok(at.hasAttribute('k'));
		
		// test get / set
		assert.equal(at.get('k'), undefined);
		
		at.set('k', 'v');
		assert.equal(at.get('k'), 'v');
		
		at.set('k', null);
		assert.equal(at.get('k'), null);
		
		assert.equal(at.set('k', Attribute).get('k'), Attribute);
		
		// test chainability
		assert.equal(at.set('k', true), at);
		
		// try with static definition
		ATI = oop.buildClass(oop.Root, [Attribute], {}, {
			ATTRS: {
				k: {
					value: 1337
				}
			}
		});
		
		at = new ATI();
		assert.equal(at.get('k'), 1337);
		at.set('k', 1336);
		assert.equal(at.get('k'), 1336);
		
		at = new ATI();
		assert.equal(at.get('k'), 1337);
	});
	
	QUnit.test('test validator', function (assert) {
		var at = new Attribute(),
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
		var at = new Attribute(),
			getterCalled = false,
			setterCalled = false;
		
		at.addAttribute('k', {
			getter:	function (value, name) {
				getterCalled = true;
				
				return value && JSON.parse(value)[name];
			},
			setter: function (value, name) {
				var ob = {};
				
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
		var at, AT;
		
		AT = oop.buildClass(oop.Root, [Attribute], {}, {
			ATTRS: {
				k1: {
					value: 1337,
					validator: function (value) {
						var numVal = +value;
						return value === numVal;
					}
				},
				k2: {
					value: 'elite'
				}
			}
		});
		
		// empty config
		at = new AT({});
		
		assert.equal(at.get('k1'), 1337);
		assert.equal(at.get('k2'), 'elite');
		
		// supply config
		at = new AT({
			k1: 13.37,
			k2: 'sweet'
		});
		
		assert.equal(at.get('k1'), 13.37);
		assert.equal(at.get('k2'), 'sweet');
		
		// supply invalid initial value
		at = new AT({
			k1: 'bad'
		});
		
		assert.equal(at.get('k1'), 1337);
	});
	
	QUnit.test('attribute change events', function (assert) {
		var ao = new AttributeObservable(),
			cancelChange = false,
			onChangeEvent = null,
			afterChangeEvent = null;
		
		ao.addAttribute('k');
		
		ao.on('kChange', function (e) {
			onChangeEvent = e;
			if (cancelChange) {
				e.preventDefault();
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
	});
	
	/*
	QUnit.test('', function (assert) {
		var at = new Attribute();
		
		
	});
	*/
});
