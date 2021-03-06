/*jshint esnext:true*/

/**
 * @param	{Object} target	object to receive mixins
 * @param	{...Object} mixins
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

const initMap = new Map();	// cache factory => (next) init

function findFactoryWithNextInit (factory) {
	if (factory.init) {
		return factory;
	}
	
	if (factory.base) {
		return findFactoryWithNextInit(factory.base);
	}
	return null;
}

function initHierarchy (instance, args, factory) {
	const factoryWithInit = initMap.get(factory);
	
	if (!factoryWithInit) {	// neither factory nor any of its base factories have an init
		return;
	}
	
	// call 1st init in the chain
	// Unless that init is the base factory's, provide it with a function that calls the _next_ init in the chain
	// this is recursive, because the _next_ init might need a function that calls _its_ next init, etc
	const initArgs = args.slice();
	if (factoryWithInit.base) {
		initArgs.splice(0, 0, initHierarchy.bind(null, instance, args, factoryWithInit.base));
	}
	
	factoryWithInit.init.call(instance, ...initArgs);
}

/**
 * @param {Object} prototype
 * @param {Function} [init]
 * @returns {Function}
 */
export function createFactory (prototype, init = null) {
	const factory = function (...args) {
		const i = Object.create(prototype);
		
		initHierarchy(i, args, factory);
		
		return i;
	};
	
	Object.defineProperties(factory, {
		prototype:	{value: prototype},
		init:		{value: init},
		mix:		{value: (...mixins) => {
			mix(prototype, ...mixins);
			return factory;
		}},
		extend:		{value: (prototype, init = null) => extendFactory(factory, prototype, init)},
	});
	
	Object.defineProperties(prototype, {
		factory:	{value: factory},
	});
	
	initMap.set(factory, init ? factory : null);
	
	return factory;
}

/**
 * @param {Function} base
 * @param {Object} prototype
 * @param {Function} [init]
 * @returns {Function}
 */
export function extendFactory (base, prototype, init = null) {
	const proto = Object.assign(Object.create(base.prototype), prototype);
	
	const factory = createFactory(proto, init);
	
	Object.defineProperties(factory, {
		base: {value: base}
	});
	
	initMap.set(factory, findFactoryWithNextInit(factory));
	
	return factory;
}
