/*jshint esnext:true*/

function initMixinsFor (constructor, context, args) {
	if (constructor === Root) {
		return;
	}
	initMixinsFor(constructor.superclass, context, args);		// super -> base
	
	// call class init
	if (constructor.prototype.hasOwnProperty('init')) {
		constructor.prototype.init.apply(context, args);
	}
	
	// call mixin's init
	constructor.__mixins.forEach(mix => {
		if (mix.prototype.hasOwnProperty('init')) {
			mix.prototype.init.apply(context, args);
		}
	});
}

function Root () {
	// walk inheritance chain, call each (super) class extensions' init functions
	initMixinsFor(this.constructor, this, arguments);
}

Root.descendsFromRoot = function (constructor) {
	return constructor === Root || (
		constructor.superclass && Root.descendsFromRoot(constructor.superclass)
	);
};

/**
 * Build a constructor function
 * 
 * The constructor itself will only call its parent. This recursion will
 * stop with Root(). Extension constructors are _not_ called.
 * 
 * Each class' and extension's init() function is called. The order is
 * bottom-up (e.g. sub -> super), and extensions after the classes they
 * were set up on.
 * 
 * Init functions (and the extension constructors) are called with the
 * arguments used for the built class.
 * 
 * Example:
 *   B = buildClass(Root);
 *   
 *   E = function () {}
 *   E.prototype.init = function () {}
 *   
 *   F = buildClass(B, [E], {
 *     init: function () {}
 *   });
 *   
 *   new F();
 *   
 * Call order:
 *   F() -> B() -> Root()	// Root() in turn will call
 *   B.init(), F.init(), E.init()
 *   F's prototype will have E's mixed in
 * 
 * @param {Function} base				Must be Root or subclass of Root
 * @param {Function[]} [mixins]			List of extension constructors
 * @param {Object} [protoProps]			Properties to merge onto the built class' prototype (e.g. Func.prototype.prop)
 * @param {Object} [staticProps]		Properties to merge onto the built class (e.g. Func.prop)
 * @returns {Function}
 */
function buildClass (base, mixins, protoProps, staticProps) {
	// assert base's prototype chain includes Root
	if (!Root.descendsFromRoot(base)) {
		throw 'base class does not descend from Root';
	}
	
	// build constructor
	function F () {
		base.apply(this, arguments);			// top-down (super -> base) recursion
	}
	
	F.superclass = base;
	
	// set prototype
	F.prototype = Object.create(base.prototype);
	F.prototype.constructor = F;
	
	// register extensions and merge their prototypes
	F.__mix = [];
	if (mixins) {
		let originalConstructor = F.prototype.constructor;
		mixins.forEach(mix => {
			F.__mix.push(mix);
			Object.assign(F.prototype, mix.prototype);
			if (originalConstructor) {
				F.prototype.constructor = originalConstructor;
			}
		});
	}
	
	// add properties
	if (protoProps) {
		Object.assign(F.prototype, protoProps);
	}
	if (staticProps) {
		Object.assign(F, staticProps);
	}
	
	return F;
}

export {Root, buildClass};
