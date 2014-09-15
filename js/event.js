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
		this._eventSubs = {};
	}
	
	EventTarget.prototype = {
		constructor: EventTarget,
		
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
		 * Remove all subscriptions for this type, callback, context
		 * If no context is supplied, remove for each context
		 * 
		 * @param	{String} type
		 * @param	{Function} callback
		 * @param	{Object} [context]		if not specified, use this
		 */
		detach: function (type, callback, context) {
			var sub = this._findSub(type, callback, context || this);
			
			if (sub) {
				sub.detach();
				this._deleteSub(sub);
			}
		},
		
		_on: function (type, callback, context, once) {
			var sub;
			
			context = context || this;
			
			// prevent duplicate subs
			sub = this._findSub(type, callback, context);
			if (sub) {
				return sub;
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
		
		_findSub: function (type, callback, context) {
			var i,
				sub,
				subs = this._eventSubs[type];
			
			if (!this._eventSubs[type]) {
				return null;
			}
			
			for (i = 0; i < subs.length; i += 1) {
				sub = subs[i];
				if (sub.callback === callback && sub.context === context) {
					return sub;
				}
			}
			return null;
		},
		
		_deleteSub: function (sub) {
			this._eventSubs[sub.type].splice(
				this._eventSubs[sub.type].indexOf(sub),
				1
			);
		},
		
		/**
		 * 
		 * @param	{String} type
		 */
		fire: function (type) {
			var cancelled;
			
			cancelled = !this._eventDispatch.dispatch(type, true);
			
			if (!cancelled) {
				// TODO: if (this._eventDefs[type] { this._eventDefs[type].defaultFn() }
				
				this._eventDispatch.dispatch('AFTER:' + type, false);
			}
		}
	};
	// endregion
	
	return {
		EventTarget: EventTarget
	};
});
