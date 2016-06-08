/*jshint esnext:true*/

/**
 * @param	{Object} target	object to receive mixins
 * @param	{Object[]} mixins
 * @return	{Object}
 */
export function mix (target, ...mixins) {
	if (!target.__mixins) {
		target.__mixins = [];
	}
	
	for (let mixin of mixins) {
		// register mixin
		if (target.__mixins.indexOf(mixin) !== -1) {
			continue;	// already mixed in
		}
		target.__mixins.push(mixin);
		
		// copy properties
		for (let prop of Object.keys(mixin)) {
			if (!target.hasOwnProperty(prop) && prop !== 'constructor') {
				target[prop] = mixin[prop];
			}
		}
	}
	
	return target;
}

/**
 * 
 * @param {Object} prototype
 * @returns {Object}
 */
export function factoryFactory (prototype = Object.prototype) {
	let factory = Object.create(prototype);
	
	factory.create = function (...args) {
		let ob = Object.create(factory);
		
		prototype.init.apply(ob, args);
		
		return ob;
	};
	
	return factory;
}

function initHierarchy (instance, args, factory) {
	// recurse to call inits from top to bottom
	if (factory.super) {
		initHierarchy(instance, args, factory.super);
	}
	
	// call init for each link in the factory chain
	if (factory.init) {
		factory.init.apply(instance, args);
	}
}

export function createFactory (prototype, init = null) {
	var factory = function () {
		const i = Object.create(prototype);
		
		initHierarchy(i, arguments, factory);
		
		return i;
	};
	
	factory.prototype = prototype;
	factory.init = init;
	
	return factory;
}

export function extendFactory (base, prototype, init = null) {
	const proto = Object.create(base.prototype);
	
	mix(proto, prototype);
	
	const factory = createFactory(proto, init);
	
	factory.super = base;
	
	return factory;
}
