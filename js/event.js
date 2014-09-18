/*global define, Event*/
define(function () {
	"use strict";
	
	// region DispatchFacade
	function DispatchFacade () {
		this._eventNode = document.createElement('a');
	}
	
	DispatchFacade.prototype = {
		constructor: DispatchFacade,
		
		attach: function (type, fn) {
			this._eventNode.addEventListener(type, fn);
		},
		
		detach: function (type, fn) {
			this._eventNode.removeEventListener(type, fn, false);
		},
		
		dispatch: function (type, cancelable) {
			var e = document.createEvent('Event');
			e.initEvent(type, false, cancelable);
			
			return this._eventNode.dispatchEvent(e);
		}
	};
	// endregion
	
	// region Subscription
	/**
	 * 
	 * @param	{DispatchFacade} dispatch
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} [context]
	 * @param	{Boolean} [once=false]
	 * @constructor
	 */
	function Subscription (dispatch, type, callback, context, once) {
		var self = this;
		
		this.dispatch = dispatch;
		this.type = type;
		this.callback = callback;
		this.context = context;
		
		this._eventFn = function (e) {	// create a unique function so detach will only remove this sub
			callback.call(context, e);
			if (once) {
				self.detach();
			}
		};
	}
	
	Subscription.prototype = {
		constructor: Subscription,
		
		attach: function () {
			this.dispatch.attach(this.type, this._eventFn);
		},
		
		detach: function () {
			this.dispatch.detach(this.type, this._eventFn);
		}
	};
	// endregion
	
	// region EventTarget
	function EventTarget () {
		this._eventDispatch = new DispatchFacade();
		this._eventDefinitions = {};
		this._eventSubs = {};
	}
	
	EventTarget.defaultConfig = {
		preventable:	true,
		preventedFn:	null,
		defaultFn:		null
	};
	
	EventTarget.prototype = {
		constructor: EventTarget,
		
		publish: function (type, config) {
			var cfg;
			
			if (this._eventDefinitions[type]) {
				throw new Error('Event "' + type + '" has already been published');
			}
			
			// merge config with default config
			cfg = {};
			Object.keys(EventTarget.defaultConfig).forEach(function (key) {
				cfg[key] = config.hasOwnProperty(key) ? config[key] : EventTarget.defaultConfig[key];
			});
			
			this._eventDefinitions[type] = cfg;
		},
		
		/**
		 * 
		 * @param	{String} type
		 * @param	{Function} callback
		 * @param	{Object} [context]		if not specified, use this
		 * @returns {Subscription}
		 */
		on: function (type, callback, context) {
			return this._on(type, callback, context);
		},
		
		/**
		 * @see on
		 */
		once: function (type, callback, context) {
			return this._on(type, callback, context, true);
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

		/**
		 * Remove all subscriptions for this type (on and after), callback, context
		 * If no context is supplied, remove for each context
		 * 
		 * @param	{String} type
		 * @param	{Function} callback
		 * @param	{Object} [context]		if not specified, use this
		 */
		detach: function (type, callback, context) {
			var subs;
			
			context = context || this;
			
			// merge on and after subs
			subs = this._findSubs(type, callback, context).concat(
				this._findSubs('AFTER:' + type, callback, context)
			);
			
			subs.forEach(function (sub) {
				sub.detach();
				this._deleteSub(sub);
			}, this);
		},
		
		_on: function (type, callback, context, once) {
			var sub;
			
			context = context || this;
			
			// prevent duplicate subs
			sub = this._findSubs(type, callback, context);
			if (sub.length === 1) {
				return sub[0];
			}
			
			// create new sub
			sub = new Subscription(
				this._eventDispatch,
				type,
				callback,
				context,
				once === true
			);
			
			sub.attach();
			
			if (!this._eventSubs[type]) {
				this._eventSubs[type] = [];
			}
			this._eventSubs[type].push(sub);
			
			return sub;
		},
		
		_findSubs: function (type, callback, context) {
			var i,
				found = [],
				sub,
				subs = this._eventSubs[type];
			
			if (!this._eventSubs[type]) {
				return found;
			}
			
			for (i = 0; i < subs.length; i += 1) {
				sub = subs[i];
				if (sub.callback === callback && sub.context === context) {
					found.push(sub);
				}
			}
			return found;
		},
		
		_deleteSub: function (sub) {
			this._eventSubs[sub.type].splice(
				this._eventSubs[sub.type].indexOf(sub),
				1
			);
		},
		
		/**
		 * 
		 * @param {String} type
		 * @return {boolean}	true if event was not cancelled
		 */
		fire: function (type) {
			var success,
				def = this._eventDefinitions[type] || EventTarget.defaultConfig;
			
			success = this._eventDispatch.dispatch(type, def.preventable);
			
			if (success) {
				if (def.defaultFn) {
					def.defaultFn();
				}
				
				this._eventDispatch.dispatch('AFTER:' + type, false);
			} else if (def.preventedFn) {
				def.preventedFn();
			}
			
			return success;
		}
	};
	// endregion
	
	return {
		EventTarget: EventTarget
	};
});
