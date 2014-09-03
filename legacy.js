/*global define*/
define('legacy', ['jquery'], function ($) {
	"use strict";
	
	return {
		/**
		 * Flatten an object to URL
		 * {key: 'my val', yes: true} becomes 'key=my%20val&yes=true'
		 * 
		 * @param {Object} obj
		 * @param {Array} [filterKeys]
		 * @returns {string}
		 */
		flattenToURL: function (obj, filterKeys) {
			var parts = [];
			
			$.each(obj, function (key, val) {
				if ($.isArray(filterKeys) && filterKeys.indexOf(key) !== -1) {
					return;
				}
				if ($.isPlainObject(val)) {
					val = JSON.stringify(val);
				}
				parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
			});
			
			return parts.join('&');
		}
	};
});
