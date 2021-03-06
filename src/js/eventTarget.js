/*jshint esnext:true*/

import {createFactory} from 'js/oop';

// region CustomEvent
class CustomEvent {
	constructor (type, cancelable = true, bubbles = true) {
		this.type = type;
		this.cancelable = cancelable;
		this.bubbles = bubbles;
		
		this.cancelled = false;
		this.bubblingStopped = false;
	}
	
	cancel () {
		if (this.cancelable) {
			this.cancelled = true;
		}
	}
	
	stopBubbling () {
		this.bubblingStopped = true;
	}
}
// endregion

// region Dispatch
class Dispatch {
	constructor () {
		this._subscriptions = new Map();
	}

	/**
	 * 
	 * @param	{CustomEvent} event
	 * @returns {boolean} wether the event completed (i.e. was not cancelled)
	 */
	dispatch (event) {
		for (let sub of this._findSubs(event.type).slice()) {	// .slice() because this._subscriptions change during interation
			sub.callback.call(sub.context, event);
			
			if (sub.once) {
				sub.unsubscribe();
			}
		}
		
		return !event.cancelled;
	}

	/**
	 * 
	 * @param {string} type
	 * @param {boolean} [cancelable=true]
	 * @param {boolean} [bubbles=true]
	 * @param {Object} [data]
	 * @returns {CustomEvent}
	 */
	createEvent (type, cancelable = true, bubbles = true, data = null) {
		let e = new CustomEvent(type, cancelable, bubbles);
		
		if (data) {
			Object.keys(data).forEach(key => {
				if (e[key]) {
					return;
				}
				e[key] = data[key];
			});
		}
		
		return e;
	}
	
	/**
	 * 
	 * @param	{string} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 * @param	{Boolean} [once=false]
	 */
	subscribe (type, callback, context, once = false) {
		// prevent duplicate subs
		const subs = this._findSubs(type, callback, context);
		if (subs.length === 1) {
			return subs[0];
		}
		
		// store subscription
		const sub = new Subscription(this, type, callback, context, once);
		
		if (!this._subscriptions.has(type)) {
			this._subscriptions.set(type, []);
		}
		
		this._subscriptions.get(type).push(sub);
		
		return sub;
	}

	/**
	 * 
	 * @param	{string} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 */
	unsubscribe (type, callback, context) {
		// merge on and after subs
		const subs = this._findSubs(type, callback, context).concat(
			this._findSubs(AFTER + type, callback, context)
		);
		
		subs.forEach(sub => {
			this._deleteSub(sub);
			sub.active = false;
		});
	}
	
	/**
	 * 
	 * @param	{string} type
	 * @param	{Function} [callback]
	 * @param	{Object} [context]
	 * @returns {Subscription[]}
	 * @private
	 */
	_findSubs (type, callback, context) {
		let found = [];
		
		if (!this._subscriptions.has(type)) {
			return found;
		}
		
		found = this._subscriptions.get(type);
		if (callback && context) {
			found = found.filter(sub => {
				return sub.callback === callback && sub.context === context;
			});
		}
		return found;
	}

	/**
	 * 
	 * @param	{Subscription} sub
	 * @private
	 */
	_deleteSub (sub) {
		const subs = this._subscriptions.get(sub.type);
		
		subs.splice(
			subs.indexOf(sub),
			1
		);
	}
}
// endregion

// region Subscription
class Subscription {
	
	/**
	 * @param	{Dispatch} dispatch
	 * @param	{string} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 * @param	{boolean} [once=false]
	 */
	constructor (dispatch, type, callback, context, once = false) {
		this._dispatch = dispatch;
		this.type = type;
		this.context = context;
		this.callback = callback;
		this.once = once;
	}
	
	unsubscribe () {
		this._dispatch.unsubscribe(this.type, this.callback, this.context);
	}
}
// endregion

// region EventTarget
const AFTER = 'AFTER:';

const DEFAULT_CONFIG = {
	cancelable:		true,
	bubbles:		true,
	cancelledFn:	null,
	defaultFn:		null,
	context:		null
};

/** @class EventTarget */

/**
 * @function
 * @return {EventTarget}
 * @property {EventTarget} prototype
 */
const createEventTarget = createFactory(/** @lends EventTarget.prototype */ {
	
	/**
	 * Define a new event
	 * 
	 * @param	{string} type
	 * @param	{Object} [config]
	 * @param	{boolean} [config.cancelable=true]
	 * @param	{boolean} [config.bubbles=true]
	 * @param	{Function} [config.canceledFn=null]
	 * @param	{Function} [config.defaultFn=null]
	 */
	publish: function (
		type,
		{
			cancelable	= DEFAULT_CONFIG.cancelable,
			bubbles		= DEFAULT_CONFIG.bubbles,
			cancelledFn	= DEFAULT_CONFIG.cancelledFn,
			defaultFn	= DEFAULT_CONFIG.defaultFn,
			context		= DEFAULT_CONFIG.context
		} = {}
	) {
		if (this._eventDefinitions.has(type)) {
			throw new Error(`Event "${type}" has already been published`);
		}
		
		this._eventDefinitions.set(type, {
			cancelable,
			bubbles,
			cancelledFn,
			defaultFn,
			context
		});
	},

	/**
	 * 
	 * @param	{EventTarget} target
	 * @return	{EventTarget} this
	 * @chainable
	 */
	addBubbleTarget: function (target) {
		if (this._bubbleTargets.indexOf(target) === -1) {
			this._bubbleTargets.push(target);
		}
		return this;
	},
	
	/**
	 * 
	 * @param	{EventTarget} target
	 * @return	{EventTarget} this
	 * @chainable
	 */
	removeBubbleTarget: function (target) {
		for (let [i, t] of this._bubbleTargets.entries()) {
			if (t === target) {
				this._bubbleTargets.splice(i, 1);
			}
		}
		return this;
	},
	
	/**
	 * 
	 * @param	{string} type
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
		return this.on(AFTER + type, callback, context);
	},
	
	/**
	 * @see on
	 */
	onceAfter: function (type, callback, context) {
		return this.once(AFTER + type, callback, context);
	},

	/**
	 * Remove all subscriptions for this type (on and after), callback, context
	 * 
	 * @param	{string} type
	 * @param	{Function} callback
	 * @param	{Object} [context]		if not specified, use this
	 */
	detach: function (type, callback, context = this) {
		this._eventDispatch.unsubscribe(type, callback, context);
	},

	/**
	 * 
	 * @param	{string} type
	 * @param	{Function} callback
	 * @param	{Object} [context=this]
	 * @param	{boolean} [once=false]
	 * @returns {Subscription}
	 * @private
	 */
	_on: function (type, callback, context = this, once = false) {
		return this._eventDispatch.subscribe(type, callback, context, once);
	},
	
	/**
	 * 
	 * @param {string} type
	 * @param {Object} [data]
	 * @return {boolean}	true if event was not cancelled
	 */
	fire: function (type, data = {}) {
		const def = this._eventDefinitions.get(type) || DEFAULT_CONFIG;
		
		data.originalTarget = this;
		
		// fire 'on' event
		const onEvent = this._eventDispatch.createEvent(type, def.cancelable, def.bubbles, data);
		this._fireEvent(onEvent);
		
		// call defaultFn, dispatch 'after' event OR call preventedFn
		if (!onEvent.cancelled) {
			// call defaultFn
			if (def.defaultFn) {
				def.defaultFn.call(def.context || this, data);
			}
			
			// fire 'after' event
			this._fireEvent(
				this._eventDispatch.createEvent(AFTER + type, false, def.bubbles, data)
			);
		} else if (def.cancelledFn) {
			def.cancelledFn.call(def.context || this, data);
		}
		
		return !onEvent.cancelled;
	},

	/**
	 * 
	 * @param	{CustomEvent} event
	 * @returns {CustomEvent}
	 * @private
	 */
	_fireEvent: function (event) {
		// dispatch event locally
		this._eventDispatch.dispatch(event);
		
		// let bubble targets dispatch (even if event was prevented locally!)
		if (event.bubbles && !event.bubblingStopped) {
			for (let target of this._bubbleTargets) {
				target._fireEvent(event);	// this will chain bubbling
			}
		}
		
		return event;
	}
}, function () {
	this._eventDispatch = new Dispatch();
	this._eventDefinitions = new Map();
	this._bubbleTargets = [];
});
// endregion

export default createEventTarget;
export {AFTER};
