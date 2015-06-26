/*jshint esnext:true*/
/*global QUnit*/

import {mix} from 'js/oop';

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
	mix(this.Base, this.mixO);
	
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
	mix(this.Base, this.MixF);
	
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
	mix(this.Base, this.mixO, this.MixF, {
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
