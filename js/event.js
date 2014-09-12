/*global define, Event*/
define(function () {
	"use strict";
	
	// region Event
	function createEvent (type, cancelable) {
		var e = document.createEvent('Event');
		e.initEvent(type, false, cancelable);
		return e;
	}
	// endregion
	
	// region EventHandle
	function EventHandle (eventTarget, type, callback) {
		this._eventTarget = eventTarget;
		this.type = type;
		this.callback = callback;
	}
	
	EventHandle.prototype = {
		constructor: EventHandle,
		
		detach: function () {
			this._eventTarget._detach(this.type, this.callback);
		}
	};
	// endregion
	
	// region EventTarget
	function EventTarget () {
		this._eventNode = document.createElement('a');
	}
	
	EventTarget.prototype = {
		constructor: EventTarget,

		/**
		 * 
		 * @param	{String} type
		 * @param	{Function} callback
		 * @param	{Object} [context]		if not specified, use this
		 * @returns {EventHandle}
		 */
		on: function (type, callback, context) {
			callback = callback.bind(context || this);
			
			this._eventNode.addEventListener(type, callback);
			
			return new EventHandle(this, type, callback);
		},

		/**
		 * @see on
		 */
		once: function (type, callback, context) {
			var eh,
				self = this;
			
			eh = this.on(type, function () {
				callback.apply(context || self);
				eh.detach();
			});
			
			return eh;
		},

		/**
		 * @see on
		 */
		after: function (type, callback, context) {
			return this.on('AFTER:' + type, callback, context);
		},
		
		/**
		 * @see on
		 */
		onceAfter: function (type, callback, context) {
			return this.once('AFTER:' + type, callback, context);
		},
		
		_detach: function (type, callback) {
			this._eventNode.removeEventListener(type, callback, false);
		},

		/**
		 * 
		 * @param	{String} type
		 */
		fire: function (type) {
			var cancelled;
			
			cancelled = !this._eventNode.dispatchEvent(
				createEvent(type, true)
			);
			
			if (!cancelled) {
				this._eventNode.dispatchEvent(
					createEvent('AFTER:' + type, true)
				);
			}
		}
	};
	// endregion
	
	return {
		EventTarget: EventTarget
	};
});
