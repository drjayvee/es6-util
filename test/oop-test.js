/*global console, define, require, QUnit*/
require(['js/oop'], function (oop) {
	"use strict";
	
	QUnit.test('create a basic class using oop.build()', function (assert) {
		var Base,
			bi,
			initArg = null;
		
		// create Basic class
		Base = oop.buildClass(oop.Root, [], {
			init: function (arg) {
				initArg = arg;
			}
		});
		
		// check class chain is set up, and oop detects it
		assert.equal(oop.Root, Base.superclass);
		
		assert.ok(oop.Root.descendsFromRoot(Base));
		assert.notOk(oop.Root.descendsFromRoot(QUnit));
		
		// try to extend a non-Root class
		assert.throws(function () {
			oop.buildClass(QUnit);
		});
		
		// check prototype
		assert.equal(Base, Base.prototype.constructor);
		
		// create an instance
		bi = new Base(1337);
		
		assert.ok(bi instanceof Base);
		assert.ok(bi instanceof oop.Root);
		
		assert.equal(Base.prototype.init, bi.init);
		assert.equal(1337, initArg);
	});
	
	QUnit.test('create a class with static properties', function (assert) {
		var Base;
		
		Base = oop.buildClass(oop.Root, [], {}, {
			leStatic: 'static'
		});
		
		assert.equal('static', Base.leStatic);
	});
	
	QUnit.test('create an inheritance chain', function (assert) {
		var Base,
			Sub,
			si,
			initArgs = {};
		
		Base = oop.buildClass(oop.Root, [], {
			init: function (arg) {
				initArgs.base = arg;
			},
			baseFunc: function () {
				return 'Base';
			}
		});
		
		Sub = oop.buildClass(Base, [], {
			init: function (arg) {
				initArgs.sub = arg;
			},
			subFunc: function () {
				return 'Sub';
			}
		});
		
		// check inheritance chain
		assert.ok(oop.Root.descendsFromRoot(Sub));
		assert.equal(Base, Sub.superclass);
		
		assert.equal(Sub, Sub.prototype.constructor);
		
		// create an instance of Sub
		si = new Sub(1337);
		
		assert.ok(si instanceof Sub);
		assert.ok(si instanceof Base);
		
		// assert that both init() functions have been called
		assert.equal(1337, initArgs.base);
		assert.equal(1337, initArgs.sub);
		
		// assert that all prototype properties are present
		assert.equal('Base', si.baseFunc());
		assert.equal('Sub', si.subFunc());
	});
	
	QUnit.test('create a class with an extension', function (assert) {
		var Base,
			bi,
			initArgs = {};
		
		function Ext (arg) {
			initArgs.extC = arg;
		}
		Ext.prototype.init = function (arg) {
			initArgs.ext = arg;
		};
		Ext.prototype.extFunc = function () {
			return 'Ext';
		};
		
		Base = oop.buildClass(oop.Root, [Ext], {
			init: function (arg) {
				initArgs.base = arg;
			},
			baseFunc: function () {
				return 'Base';
			}
		});
		
		// assert that Ext's prototype has been mixed into Base's
		assert.notOk(oop.Root.descendsFromRoot(Ext));
		
		assert.equal(Ext.prototype.extFunc, Base.prototype.extFunc);
		
		// create an instance
		bi = new Base(1337);
		
		assert.equal(1337, initArgs.base);
		assert.equal(1337, initArgs.extC);
		assert.equal(1337, initArgs.ext);
		
		assert.equal('Base', bi.baseFunc());
		assert.equal('Ext', bi.extFunc());
	});
	
	QUnit.test('all together now', function (assert) {
		var Base,
			instantiationArgs = [],
			Sub,
			instance;
		
		function Ext1 () {
			instantiationArgs.push('Ext1');
		}
		Ext1.prototype.init = function () {
			instantiationArgs.push('Ext1.init');
		};
		
		function Ext2 () {
			instantiationArgs.push('Ext2');
		}
		Ext2.prototype.init = function () {
			instantiationArgs.push('Ext2.init');
		};
		
		function Ext3 () {
			instantiationArgs.push('Ext3');
		}
		Ext3.prototype.init = function () {
			instantiationArgs.push('Ext3.init');
		};
		
		Base = oop.buildClass(oop.Root, [Ext1], {
			init: function () {
				instantiationArgs.push('Base.init');
			}
		});
		
		Sub = oop.buildClass(Base, [Ext2, Ext3], {
			init: function () {
				instantiationArgs.push('Sub.init');
			}
		});
		
		// create instance
		instance = new Sub();
		
		assert.ok(instance instanceof Base);
		assert.ok(instance instanceof Sub);
		
		// check order in which constructors, init() were called
		assert.deepEqual(instantiationArgs, [
			'Base.init',
			'Ext1',
			'Ext1.init',
			'Sub.init',
			'Ext2',
			'Ext2.init',
			'Ext3',
			'Ext3.init'
		]);
	});
});
