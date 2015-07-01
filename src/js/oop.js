/*jshint esnext:true*/

/**
 * @param	{Function} Target class to receive mixins
 * @param	{Function[],Object[]} mixins
 */
function mix (Target, ...mixins) {
	Target.__mixins = mixins;
	
	for (let mixin of mixins) {
		if (mixin instanceof Function) {
			mixin = mixin.prototype;
		}
		
		for (let prop of Object.keys(mixin)) {
			if (!Target.prototype.hasOwnProperty(prop) && prop !== 'constructor') {
				Target.prototype[prop] = mixin[prop];
			}
		}
	}
}

export {mix};
