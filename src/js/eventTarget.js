/*jshint esnext:true*/

// region DispatchFacade
class DispatchFacade {
	constructor () {
		this._eventNode = document.createElement('a');
	}
	
	attach (type, fn) {
		this._eventNode.addEventListener(type, fn);
	}
	
	detach (type, fn) {
		this._eventNode.removeEventListener(type, fn, false);
	}

	/**
	 * 
	 * @param {String|Event} typeOrEvent
	 * @param {Boolean} [preventable=true]
	 * @param {Boolean} [bubbles=true]
	 * @param {Object} [data]
	 * @returns {Array} [defaultPrevented, propagationStopped]
	 */
	dispatch (typeOrEvent, preventable = true, bubbles = true, data = null) {
		let e = typeOrEvent;
		
		if (typeof typeOrEvent === 'string') {
			e = this.createEvent(typeOrEvent, preventable, bubbles, data);
		}
		
		return this._eventNode.dispatchEvent(e);
	}

	/**
	 * 
	 * @param {String} type
	 * @param {Boolean} [preventable=true]
	 * @param {Boolean} [bubbles=true]
	 * @param {Object} [data]
	 * @returns {Event}
	 */
	createEvent (type, preventable = true, bubbles = true, data = null) {
		let e = document.createEvent('Event');
		
		e.initEvent(type, bubbles, preventable);

		if (data) {
			Object.keys(data).forEach(key => {
				if (e[key] && key !== 'target') {		// don't overwrite "native" event properties other than 'target'
					return;
				}
				e[key] = data[key];
			});
		}
		
		return e;
	}
}
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
class Subscription {
	constructor (dispatch, type, callback, context, once) {
		this.dispatch = dispatch;
		this.type = type;
		this.callback = callback;
		this.context = context;
		
		this._eventFn = e => {	// create a unique function so detach will only remove this sub
			callback.call(context, e);
			if (once) {
				this.detach();
			}
		};
	}
	
	attach () {
		this.dispatch.attach(this.type, this._eventFn);
	}
	
	detach () {
		this.dispatch.detach(this.type, this._eventFn);
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
		this._eventDispatch = new DispatchFacade();
		this._eventDefinitions = new Map();
		this._eventSubs = new Map();
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
		context = context || this;
		
		// merge on and after subs
		let subs = this._findSubs(type, callback, context).concat(
			this._findSubs(EventTarget.AFTER + type, callback, context)
		);
		
		subs.forEach(sub => {
			sub.detach();
			this._deleteSub(sub);
		});
	},

	/**
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} [context=this]
	 * @param	{Boolean} [once=false]
	 * @returns {Subscription}
	 * @private
	 */
	_on: function (type, callback, context, once) {
		context = context || this;
		once = once === true;
		
		// prevent duplicate subs
		let subs = this._findSubs(type, callback, context);
		if (subs.length === 1) {
			return subs[0];
		}
		
		// create new sub
		let sub = new Subscription(
			this._eventDispatch,
			type,
			callback,
			context,
			once
		);
		
		sub.attach();
		
		if (!this._eventSubs.has(type)) {
			this._eventSubs.set(type, []);
		}
		this._eventSubs.get(type).push(sub);
		
		return sub;
	},

	/**
	 * @param	{String} type
	 * @param	{Function} callback
	 * @param	{Object} [context=this]
	 * @returns {Subscription[]}
	 * @private
	 */
	_findSubs: function (type, callback, context) {
		let found = [];
		
		if (!this._eventSubs.has(type)) {
			return found;
		}
		
		return this._eventSubs.get(type).filter(sub => {
			return sub.callback === callback && sub.context === context;
		});
	},

	/**
	 * @param	{Subscription} sub
	 * @private
	 */
	_deleteSub: function (sub) {
		let subs = this._eventSubs.get(sub.type);
		
		subs.splice(
			subs.indexOf(sub),
			1
		);
	},
	
	/**
	 * 
	 * @param {String} type
	 * @param {Object} [data]
	 * @return {boolean}	true if event was not cancelled
	 */
	fire: function (type, data = {}) {
		let def = this._eventDefinitions.get(type) || EventTarget.defaultConfig;
		
		data.firstTarget = this;
		
		// dispatch 'on' event on self, bubble targets
		let success = this._fire(type, def.preventable, def.bubbles, data);
		
		if (success) {
			if (def.defaultFn) {
				def.defaultFn(data);
			}
			
			// dispatch 'after' event on self, bubble targets
			this._fire(EventTarget.AFTER + type, false, def.bubbles, data);
		} else if (def.preventedFn) {
			def.preventedFn(data);
		}
		
		return success;
	},
	
	_fire: function (type, preventable, bubbles, data = null) {
		// dispatch event locally
		let success = this._eventDispatch.dispatch(type, preventable, bubbles, data);
		
		// let bubble targets dispatch (even if event was prevented locally!)
		if (bubbles) {
			for (let target of this._bubbleTargets) {
				if (!target._fire(type, preventable, bubbles, data)) {	// this will chain bubbling
					success = false;
				}
			}
		}
		
		return success;
	}
};
// endregion

export default EventTarget;
