/*global define, Event*/
define(function () {
	"use strict";
	
	function EventTarget () {
		this._eventNode = document.createElement('a');
	}
	
	EventTarget.prototype = {
		constructor: EventTarget,
		
		on: function (type, callback) {
			this._eventNode.addEventListener(type, callback);
		},

		/**
		 * 
		 * @param	{String} type
		 */
		fire: function (type) {
			var cancelled,
				e = document.createEvent('Event');
			
			e.initEvent(type, false, true);
			
			cancelled = !this._eventNode.dispatchEvent(e);
			console.log('after ' + type + ': default prevented ' + cancelled);
		}
	};
	
	return {
		EventTarget: EventTarget
	};
});
