/*jshint esnext:true*/

/**
 * @param	{Function} Target class to receive mixins
 * @param	{Function[],Object[]} mixins
 */
function mix (Target, ...mixins) {
	Target.__mixins = mixins;
	
	mixins.forEach(mix => {
		if (mix instanceof Function) {
			mix = mix.prototype;
		}
		
		Object.keys(mix).forEach(prop => {
			if (!Target.prototype.hasOwnProperty(prop) && prop !== 'constructor') {
				Target.prototype[prop] = mix[prop];
			}
		});
	});
}

export {mix};
