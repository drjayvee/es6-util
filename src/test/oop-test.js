/*jshint esnext:true*/
/*global QUnit*/

import {mix, createFactory, extendFactory} from 'js/oop';

QUnit.module('oop', {
	beforeEach: function () {
		class Base {
			constructor (...args) {
				this.cArgs = args;
			}
			meth (...args) {
				this.methArgs = args;
			}
		}
		
		const mixO = {
			mixOM (...args) {
				this.mixOMArgs = args;
			}
		};
		
		function MixF (...args) {
			this.MixFCArgs = args;
		}
		MixF.prototype = {
			mixFM (...args) {
				this.mixFMArgs = args;
			}
		};
		
		this.Base = Base;
		this.mixO = mixO;
		this.MixF = MixF;
	}
});

QUnit.test('mix an object into a class', function (assert) {
	mix(this.Base.prototype, this.mixO);
	
	assert.ok(this.Base.prototype.meth);	// original Base method
	assert.ok(this.Base.prototype.mixOM);	// mixed-in method from mixO
	
	let bi = new this.Base(1337);
	
	assert.deepEqual([1337], bi.cArgs);
	
	bi.meth(1338);
	assert.deepEqual([1338], bi.methArgs);
	
	bi.mixOM(1339);
	assert.deepEqual([1339], bi.mixOMArgs);
});

QUnit.test('mix a Function into a class', function (assert) {
	mix(this.Base.prototype, this.MixF.prototype);
	
	assert.ok(this.Base.prototype.meth);	// original Base method
	assert.ok(this.Base.prototype.mixFM);	// mixed-in method from MixF
	
	let bi = new this.Base(1337);
	
	assert.deepEqual([1337], bi.cArgs);
	assert.notOk(bi.mixFCArgs);	// MixF constructor not called
	
	bi.meth(1338);
	assert.deepEqual([1338], bi.methArgs);
	
	bi.mixFM(1339);
	assert.deepEqual([1339], bi.mixFMArgs);
});

QUnit.test('a Function and an Object walk into a bar...', function (assert) {
	mix(this.Base.prototype, this.mixO, this.MixF.prototype, {
		order (drink) {
			this.order = drink;
		}
	});
	
	assert.ok(this.Base.prototype.meth);	// original Base method
	assert.ok(this.Base.prototype.mixOM);	// mixed-in method from mixO
	assert.ok(this.Base.prototype.mixFM);	// mixed-in method from MixF
	assert.ok(this.Base.prototype.order);	// mixed-in method from new object
	
	let bi = new this.Base(1337);
	
	assert.deepEqual([1337], bi.cArgs);
	assert.notOk(bi.mixFCArgs);	// MixF constructor not called
	
	bi.meth(1338);
	assert.deepEqual([1338], bi.methArgs);
	
	bi.mixOM(1339);
	assert.deepEqual([1339], bi.mixOMArgs);
	
	bi.mixFM(8008);
	assert.deepEqual([8008], bi.mixFMArgs);
	
	bi.order('coffee');
	assert.equal('coffee', bi.order);
});

QUnit.test('createFactory', function (assert) {
	// region base factory
	const createBase = createFactory({
		baseM () {
			return 'baseM ' + this.baseInit.length;
		},
		other () {
			return 'other';
		}
	}, function (...args) {
		this.baseInit = args;
	});
	
	const bi = createBase('base');
	assert.ok(Object.getPrototypeOf(bi) === createBase.prototype);
	assert.deepEqual(['base'], bi.baseInit);
	assert.equal('baseM 1', bi.baseM());
	assert.equal('other', bi.other());
	// endregion
	
	// region now extend base factory (without init)
	const createSub = extendFactory(createBase, {
		baseM () {
			return 'sub' + createBase.prototype.baseM.apply(this);
		}
	});
	
	const si = createSub('sup', 'dude');
	assert.ok(Object.getPrototypeOf(si) === createSub.prototype);
	assert.deepEqual(['sup', 'dude'], si.baseInit);
	assert.equal('subbaseM 2', si.baseM());
	assert.equal('other', si.other());
	// endregion
	
	// region check relations between base and sub factories
	assert.ok(Object.getPrototypeOf(createSub.prototype) === createBase.prototype);
	assert.ok(Object.getPrototypeOf(Object.getPrototypeOf(si)) === Object.getPrototypeOf(bi));
	// endregion
	
	// region try two init functions
	const createSub2 = extendFactory(createSub, {}, function (superInit, ...args) {
		superInit();
		this.sub2Init = args;
	});
	const createSub3 = extendFactory(createSub2, {}, function (superInit, ...args) {
		superInit();
		this.sub3Init = args;
	});
	
	const s3i = createSub3('init');
	assert.deepEqual(['init'], s3i.baseInit);
	assert.deepEqual(s3i.baseInit, s3i.sub2Init);
	assert.deepEqual(s3i.baseInit, s3i.sub3Init);
	// endregion
});

QUnit.test('factory.mix', function (assert) {
	const base = createFactory({
		f: 'f'
	}).mix({
		m1: 'm1'
	}, {
		m2: 'm2'
	});
	
	const bo = base();
	assert.equal(bo.f, 'f');
	assert.equal(bo.m1, 'm1');
	assert.equal(bo.m2, 'm2');
	
	// extend and mix again
	const ext = extendFactory(base, {
		e: 'e'
	}).mix({
		m3: 'm3'
	});
	
	const eo = ext();
	assert.equal(eo.f, 'f');
	assert.equal(eo.m1, 'm1');
	assert.equal(eo.m2, 'm2');
	assert.equal(eo.e, 'e');
	assert.equal(eo.m3, 'm3');
});
