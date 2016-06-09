/*jshint esnext:true*/

/**
 * @param	{Object} target	object to receive mixins
 * @param	{Object[]} mixins
 * @return	{Object}
 */
export function mix (target, ...mixins) {
	if (!target.hasOwnProperty('__mixins')) {
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

function findFactoryWithNextInit (factory) {
	if (factory.init) {
		return factory;
	}
	
	if (factory.super) {
		return findFactoryWithNextInit(factory.super);
	}
	return null;
}

function initHierarchy (instance, args, factory) {
	const factoryWithInit = findFactoryWithNextInit(factory);
	
	if (!factoryWithInit) {	// neither factory nor any of its base factories have an init
		return;
	}
	
	// call 1st init in the chain
	// Unless that init is the base factory's, provide it with a function that calls the _next_ init in the chain
	// this is recursive, because the _next_ init might need a function that calls _its_ next init, etc
	const initArgs = args.slice();
	if (factoryWithInit.super) {
		initArgs.splice(0, 0, initHierarchy.bind(null, instance, args, factoryWithInit.super));
	}
	
	factoryWithInit.init.call(instance, ...initArgs);
}

export function createFactory (prototype, init = null) {
	const factory = function (...args) {
		const i = Object.create(prototype);
		
		initHierarchy(i, args, factory);
		
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
