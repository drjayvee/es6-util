/*global console, define, require, QUnit*/
require(['js/attribute', 'js/oop'], function (attr, oop) {
	"use strict";
	
	var Attribute = attr.Attribute;
	
	QUnit.test('basic add, set / get use', function (assert) {
		var at = new Attribute();
		
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
		at = new (oop.buildClass(oop.Root, [Attribute], {}, {
			ATTRS: {
				k: {
					value: 1337
				}
			}
		}))();
		
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
	
	/*
	QUnit.test('', function (assert) {
		var at = new AT();
		
		
	});
	*/
});
