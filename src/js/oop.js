/*jshint esnext:true*/

/**
 * @param	{Object} target	object to receive mixins
 * @param	{Object[]} mixins
 */
function mix (target, ...mixins) {
	target.__mixins = mixins;
	
	for (let mixin of mixins) {
		for (let prop of Object.keys(mixin)) {
			if (!target.hasOwnProperty(prop) && prop !== 'constructor') {
				target[prop] = mixin[prop];
			}
		}
	}
}

export {mix};
