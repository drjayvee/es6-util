/*jshint esnext:true*/

/**
 * @param	{Function} Target class to receive mixins
 * @param	{Function[],Object[]} mixins
 */
function mix (Target, ...mixins) {
	let originalConstructor = Target.prototype.constructor;
	
	Target.__mixins = mixins;
	
	mixins.forEach(mix => {
		if (mix instanceof Function) {
			mix = mix.prototype;
		}
		
		Object.keys(mix).forEach(prop => {
			if (!Target.prototype.hasOwnProperty(prop)) {
				Target.prototype[prop] = mix[prop];
			}
		});
	});
	
	if (originalConstructor) {
		Target.prototype.constructor = originalConstructor;
	}
}

export {mix};
