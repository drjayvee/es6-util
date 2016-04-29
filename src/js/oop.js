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

export function createFactory (prototype, initializer) {
	initializer = initializer || prototype.init;
	
	return function () {
		var ob = Object.create(prototype);
		
		if (initializer) {
			initializer.apply(ob, arguments);
		}
		
		return ob;
	};
}
