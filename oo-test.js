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

function buildClass (base, extensions, protoProps, constProps) {
	"use strict";
	
	// build constructor
	function F () {
		var args = arguments,
			self = this;
		
		base.apply(this, args);					// top-down (super -> base) recursion
		
		if (typeof this.init === 'function' && this._initCalled !== true) {
			this.init.apply(this, args);
			this._initCalled = true;
		}
		
		if (extensions) {
			extensions.forEach(function (ext) {
				ext.apply(self, args);
				ext.prototype.init.apply(self, args);
			});
		}
	}
	
	// set prototype
	F.prototype = Object.create(base.prototype);
	F.prototype.constructor = F;
	
	// merge extension prototypes 
	if (extensions) {
		extensions.forEach(function (ext) {
			jQuery.extend(F.prototype, ext.prototype);
		});
	}
	
	// add properties
	if (protoProps) {
		jQuery.extend(F.prototype, protoProps);
	}
	if (constProps) {
		jQuery.extend(F, constProps);
	}
	
	return F;
}

/*global console*/
(function () {
	"use strict";
	
	var Awesome, ai, Mid;
	
	// Base
	function Base (config) {
		console.log('Base constructor');
		this.baseVar = config.baseVar;
	}
	
	Base.prototype.baseFunc = function () {
		return 'Base: ' + this.baseVar;
	};
	
	// Mid
	Mid = buildClass(Base);

	Mid.prototype.init = function (config) {
		"use strict";
		console.log('Mid.init');
		this.midVar = config.midVar;
	};
	Mid.prototype.midFunc = function () {
		return 'Mid: ' + this.midVar;
	};
	
	// Ext
	function Ext (config) {
		console.log('Ext constructor');
		this.extVar = config.extVar;
	}
	Ext.prototype.extFunc = function () {
		return 'Ext: ' + this.extVar;
	};
	Ext.prototype.init = function (config) {
		console.log('Ext.init');
	};
	
	// Awesome
	Awesome = buildClass(Mid, [Ext], {
		init: function (config) {
			this.constructor.prototype.init(config);
			console.log('Awesome.init');
			this.awsVar = config.awsVar;
		},
		awsFunc: function () {
			return 'Awesome: ' + this.awsVar;
		}
	});
	
	
	
	// test
	ai = new Awesome({
		baseVar:	'base',
		midVar:		'mid',
		extVar:		'ext',
		awsVar:		'pwn'
	});
	
	console.log(
		ai.baseFunc(), ai.midFunc(), ai.extFunc(), ai.awsFunc()
	);
	console.log(
		'these should all be true:', ai instanceof Awesome, ai instanceof Mid, ai instanceof Base
	);
	console.log(
		'and what about Ext?', ai instanceof Ext
	);
}());
