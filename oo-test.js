"use strict";

function jQuery () {}

jQuery.type = function( obj ) {
	if ( obj == null ) {
		return obj + "";
	}
	return typeof obj;
	// Support: Android < 4.0, iOS < 6 (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call(obj) ] || "object" :
		typeof obj;
};

jQuery.isPlainObject = function ( obj ) {
	"use strict";
	// Not plain objects:
	// - Any object or value whose internal [[Class]] property is not "[object Object]"
	// - DOM nodes
	// - window
	if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.constructor &&
			!obj.constructor.prototype.hasOwnProperty("isPrototypeOf") ) {
		return false;
	}

	// If the function hasn't returned already, we're confident that
	// |obj| is a plain object, created by {} or constructed with new Object
	return true;
};

jQuery.extend = function () {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== 'function' ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

/**
 * Build a constructor function
 * 
 * The constructor itself will only call its parent. This recursion will
 * stop with Root(). Extension constructors are not called.
 * 
 * Each class' and extension's init() function is called. The order is
 * bottom-up (e.g. sub -> super), and extensions before the classes they
 * were set up on.
 * 
 * Init functions (and the constructors) are called with the arguments used
 * for the built class.
 * 
 * Example:
 *   B = buildClass(Root);
 *   
 *   E = function () {}		// will never be called
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
 *   B.init(), E.init(), F.init()
 *   F's prototype will have E's merged
 * 
 * @param {Function} base				Must be Root or subclass of Root
 * @param {[Function]} [extensions]		List of extension constructors
 * @param {Object} [protoProps]			Properties to merge onto the built class' prototype (e.g. Func.prototype.prop)
 * @param {Object} [staticProps]		Properties to merge onto the built class (e.g. Func.prop)
 * @returns {Function}
 */
function buildClass (base, extensions, protoProps, staticProps) {
	// build constructor
	function F () {
		base.apply(this, arguments);			// top-down (super -> base) recursion
	}
	
	F.superclass = base;
	
	// set prototype
	F.prototype = Object.create(base.prototype);
	F.prototype.constructor = F;
	
	// register extensions and merge their prototypes
	F.__ext = [];
	if (extensions) {
		extensions.forEach(function (ext) {
			F.__ext.push(ext);
			jQuery.extend(F.prototype, ext.prototype);
		});
	}
	
	// add properties
	if (protoProps) {
		jQuery.extend(F.prototype, protoProps);
	}
	if (staticProps) {
		jQuery.extend(F, staticProps);
	}
	
	return F;
}

function Root () {
	var args = arguments,
		self = this;
	
	console.log('Root()');
	
	// walk inheritance chain, call each (super) class extensions' init functions
	(function initExtensionsFor(constructor) {
		if (constructor === Root) {
			return;
		}
		initExtensionsFor(constructor.superclass);		// super -> base
		
		constructor.__ext.forEach(function (ext) {
//			ext.apply(self, args);		// TODO: meh, should we even call Extensions constructors?
			ext.prototype.init.apply(self, args);
		});
		if (constructor.prototype.hasOwnProperty('init')) {
			constructor.prototype.init.apply(self, args);
		}
		
	}(this.constructor));
}

/*global console*/
(function () {
	"use strict";
	
	var Awesome, my, Base, MESAp, Mid;
	
	// Base
	Base = buildClass(Root);
	
	Base.prototype.init = function (config) {
		this.baseVar = config.baseVar;
		console.log('Base.init');
	};
	
	Base.prototype.baseFunc = function () {
		return 'Base: ' + this.baseVar;
	};
	
	// Mid
	Mid = buildClass(Base);

	Mid.prototype.init = function (config) {
		console.log('Mid.init');
		this.midVar = config.midVar;
	};
	Mid.prototype.midFunc = function () {
		return 'Mid: ' + this.midVar;
	};
	Mid.midStatic = 'Mid static';
	
	// Ext1
	function Ext1 () {}

	Ext1.prototype.init = function (config) {
		this.ext1Var = config.ext1Var;
		console.log('Ext1.init');
	};
	Ext1.prototype.ext1Func = function () {
		return 'Ext1: ' + this.ext1Var;
	};
	Ext1.ext1Static = 'Ext1 static';
	
	// Awesome
	Awesome = buildClass(Mid, [Ext1], {
		init: function (config) {
			console.log('Awesome.init');
			this.awsVar = config.awsVar;
		},
		awsFunc: function () {
			return 'Awesome: ' + this.awsVar;
		}
	});

	// Ext2
	function Ext2 () {}

	Ext2.prototype.init = function (config) {
		this.ext2Var = config.ext2Var;
		console.log('Ext2.init');
	};
	Ext2.prototype.ext2Func = function () {
		return 'Ext2: ' + this.ext2Var;
	};
	Ext2.ext2Static = 'Ext2 static';

	// MESAp
	MESAp = buildClass(Awesome, [Ext2], {
		init: function (config) {
			console.log('MESAp.init');
			this.mesapVar = config.mesapVar;
		},
		mesapFunc: function () {
			return 'MESA+: ' + this.mesapVar;
		}
	}, {
		mesapStatic: 'MESA+ static'
	});
	
	
	// test
	my = new MESAp({
		baseVar:	'base',
		midVar:		'mid',
		ext1Var:	'ext1',
		awsVar:		'aws',
		ext2Var:	'ext2',
		mesapVar:	'mesa+'
	});
	
	console.log(
		my.baseFunc(), my.midFunc(), my.ext1Func(), my.awsFunc(), my.ext2Func(), my.mesapFunc()
	);
	console.log(
		'these should all be true:', my instanceof MESAp, my instanceof Awesome, my instanceof Mid, my instanceof Base
	);
	console.log(
		'and what about Ext1?', my instanceof Ext2, my instanceof Ext1
	);
}());
