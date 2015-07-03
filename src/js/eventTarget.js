/*jshint esnext:true*/

// region CustomEvent
class CustomEvent {
	constructor (type, preventable = true, bubbles = true) {
		this.type = type;
		this.preventable = preventable;
		this.bubbles = bubbles;
		
		this.defaultPrevented = false;
		this.bubblingStopped = false;
	}
	
	preventDefault () {
		if (this.preventable) {
			this.defaultPrevented = true;
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
	 * @param	{CustomEvent} event
	 * @returns {boolean} wether the event completed (i.e. was not cancelled)
	 */
	dispatch (event) {
		for (let sub of this._findSubs(event.type)) {
			sub.callback.call(sub.context, event);
			
			if (sub.once) {
				sub.unsubscribe();
			}
		}
		
		return !event.defaultPrevented;
	}

	/**
	 * 
	 * @param {String} type
	 * @param {Boolean} [bubbles=true]
	 * @param {Boolean} [preventable=true]
	 * @param {Object} [data]
	 * @returns {CustomEvent}
	 */
	createEvent (type, preventable = true, bubbles = true, data = null) {
		let e = new CustomEvent(type, preventable, bubbles);
		
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
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 * @param	{Boolean} [once=false]
	 */
	subscribe (type, callback, context, once = false) {
		// prevent duplicate subs
		let subs = this._findSubs(type, callback, context);
		if (subs.length === 1) {
			return subs[0];
		}
		
		// store subscription
		let sub = new Subscription(this, type, callback, context, once);
		
		if (!this._subscriptions.has(type)) {
			this._subscriptions.set(type, []);
		}
		
		this._subscriptions.get(type).push(sub);
		
		return sub;
	}

	/**
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 */
	unsubscribe (type, callback, context) {
		// merge on and after subs
		let subs = this._findSubs(type, callback, context).concat(
			this._findSubs(EventTarget.AFTER + type, callback, context)
		);
		
		subs.forEach(sub => {
			this._deleteSub(sub);
			sub.active = false;
		});
	}
	
	/**
	 * @param	{String} type
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
	 * @param	{Subscription} sub
	 * @private
	 */
	_deleteSub (sub) {
		let subs = this._subscriptions.get(sub.type);
		
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
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} context
	 * @param	{Boolean} [once=false]
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
function EventTarget () {}

EventTarget.AFTER = 'AFTER:';

EventTarget.defaultConfig = {
	preventable:	true,
	bubbles:		true,
	preventedFn:	null,
	defaultFn:		null
};

EventTarget.prototype = {
	constructor: EventTarget,
	
	init: function (config) {
		this._eventDispatch = new Dispatch();
		this._eventDefinitions = new Map();
		this._bubbleTargets = [];
	},
	
	/**
	 * Define a new event
	 * 
	 * @param	{String} type
	 * @param	{Object} [config]
	 * @param	{Boolean} [config.preventable=true]
	 * @param	{Boolean} [config.bubbles=true]
	 * @param	{Function} [config.preventedFn=null]
	 * @param	{Function} [config.defaultFn=null]
	 */
	publish: function (
		type,
		{
			preventable = EventTarget.defaultConfig.preventable,
			bubbles		= EventTarget.defaultConfig.bubbles,
			preventedFn = EventTarget.defaultConfig.preventedFn,
			defaultFn	= EventTarget.defaultConfig.defaultFn
		} = {}
	) {
		if (this._eventDefinitions.has(type)) {
			throw new Error(`Event "${type}" has already been published`);
		}
		
		this._eventDefinitions.set(type, {
			preventable,
			preventedFn,
			defaultFn
		});
	},

	/**
	 * @param	{EventTarget} target
	 * @return	{EventTarget} this
	 * @chainable
	 */
	addBubbleTarget: function (target) {
		if (this._bubbleTargets.indexOf(target) !== false) {
			this._bubbleTargets.push(target);
		}
		return this;
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
		return this.on(EventTarget.AFTER + type, callback, context);
	},
	
	/**
	 * @see on
	 */
	onceAfter: function (type, callback, context) {
		return this.once(EventTarget.AFTER + type, callback, context);
	},

	/**
	 * Remove all subscriptions for this type (on and after), callback, context
	 * 
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} [context]		if not specified, use this
	 */
	detach: function (type, callback, context) {
		this._eventDispatch.unsubscribe(type, callback, context || this);
	},

	/**
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} [context=this]
	 * @param	{Boolean} [once=false]
	 * @returns {Subscription}
	 * @private
	 */
	_on: function (type, callback, context, once = false) {
		return this._eventDispatch.subscribe(type, callback, context || this, once);
	},
	
	/**
	 * 
	 * @param {String} type
	 * @param {Object} [data]
	 * @return {boolean}	true if event was not cancelled
	 */
	fire: function (type, data = {}) {
		let def = this._eventDefinitions.get(type) || EventTarget.defaultConfig;
		
		data.originalTarget = this;
		
		// dispatch 'on' event on self, bubble targets
		let event = this._fireEvent(
			this._eventDispatch.createEvent(type, def.preventable, def.bubbles, data)
		);
		
		if (!event.defaultPrevented) {
			if (def.defaultFn) {
				def.defaultFn(data);
			}
			
			// dispatch 'after' event on self, bubble targets
			this._fireEvent(
				this._eventDispatch.createEvent(EventTarget.AFTER + type, false, def.bubbles, data)
			);
		} else if (def.preventedFn) {
			def.preventedFn(data);
		}
		
		return !event.defaultPrevented;
	},

	/**
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
};
// endregion

export default EventTarget;
