/*jshint esnext:true*/
/*global QUnit*/

import createEventTarget from 'js/eventTarget';
	
QUnit.module('eventTarget');

QUnit.test('on() callbacks are called after fire()', function (assert) {
	let et = createEventTarget(),
		i = 0;
	
	et.on('ev', function () {
		i += 1;
	});
	et.on('ev2', function () {
		i += 1;
	});
	
	assert.equal(i, 0);
	
	et.fire('ev');
	assert.equal(i, 1);
	
	et.fire('ev');
	assert.equal(i, 2);
});

QUnit.test('cancel does not cause other listeners to be ignored', function (assert) {
	let et = createEventTarget(),
		cancelled = false;
	
	et.on('ev', e => {e.cancel();});
	et.on('ev', e => {cancelled = e.cancelled;});
	
	et.fire('ev');
	assert.ok(cancelled);
});

QUnit.test('Can add custom properties to events', function (assert) {
	let et = createEventTarget(),
		eventArgs = {
			on:				null,
			after:			null,
			defaultFn:		null,
			cancelledFn:	null
		},
		cancel = false;
	
	et.publish('ev', {
		defaultFn: function (e) {
			eventArgs.defaultFn = e;
		},
		cancelledFn: function (e) {
			eventArgs.cancelledFn = e;
		}
	});
	
	et.on('ev', function (e) {
		eventArgs.on = e;
		
		if (cancel) {
			e.cancel();
		}
	});
	et.after('ev', function (e) {
		eventArgs.after = e;
	});
	
	// fire event with custom data
	et.fire('ev', {custom: true});
	
	assert.ok(eventArgs.on.custom);
	assert.ok(eventArgs.defaultFn.custom);
	assert.ok(eventArgs.after.custom);
	assert.equal(eventArgs.cancelledFn, null);		// event was not prevent
	
	// fire event, prevent Default
	eventArgs = {
		on:				null,
		after:			null,
		defaultFn:		null,
		cancelledFn:	null
	};
	
	cancel = true;
	et.fire('ev', {custom: true});
	
	assert.ok(eventArgs.on.custom);
	assert.equal(eventArgs.defaultFn, null);
	assert.equal(eventArgs.after, null);
	assert.ok(eventArgs.cancelledFn);
});

QUnit.test('can unsubscribe handlers', function (assert) {
	let et = createEventTarget(),
		context = {i: 0},
		cb = function () {
			this.i += 1;
		};
	
	et.i = 0;
	
	// use on's returned Subscription.unsubscribe()
	et.on('ev', cb).unsubscribe();
	
	et.fire('ev');
	assert.equal(et.i, 0);
	
	// use EventTarget.detach
	et.on('ev', cb);
	et.detach('ev', cb);
	
	et.fire('ev');
	assert.equal(et.i, 0);
	
	// check after sub
	et.on('ev', cb);
	et.after('ev', cb);
	et.detach('ev', cb);
	
	et.fire('ev');
	assert.equal(et.i, 0);
	
	// check with context
	et.on('ev', cb);
	et.after('ev', cb);
	et.on('ev', cb, context);
	et.after('ev', cb, context);
	
	et.detach('ev', cb);
	
	et.fire('ev');
	assert.equal(et.i, 0);
	assert.equal(context.i, 2);
	
	et.detach('ev', cb, context);
	
	et.fire('ev');
	assert.equal(et.i, 0);
	assert.equal(context.i, 2);
});

QUnit.test('after() callbacks are called after (), but only if default is not cancelled', function (assert) {
	let et = createEventTarget(),
		onRan = false,
		i = 0;
	
	et.on('ev', function (e) {
		onRan = true;
		
		if (i) {
			e.cancel();
		}
	});
	et.after('ev', function () {
		assert.ok(onRan);
		onRan = false;
		
		i += 1;
	});
	
	et.fire('ev');
	assert.equal(i, 1);
	
	et.fire('ev');
	assert.equal(i, 1);
});

QUnit.test('once() and onceAfter() callbacks are only called once', function (assert) {
	let et = createEventTarget(),
		on = 0,
		after = 0,
		once = 0,
		onceAfter = 0;
	
	et.on('ev', function () {
		on += 1;
	});
	et.once('ev', function () {
		once += 1;
	});
	
	et.after('ev', function () {
		after += 1;
	});
	et.onceAfter('ev', function () {
		onceAfter += 1;
	});
	
	// fire event once
	et.fire('ev');
	
	assert.equal(on, 1);
	assert.equal(once, 1);
	
	assert.equal(after, 1);
	assert.equal(onceAfter, 1);
	
	// fire twice
	et.fire('ev');
	
	assert.equal(on, 2);
	assert.equal(once, 1);
	
	assert.equal(after, 2);
	assert.equal(onceAfter, 1);
	
	// fire once, with two subscriptions
	et = createEventTarget();
	
	on = after = once = onceAfter = 0;
	et.on('ev', () => {
		on += 1;
	});
	et.on('ev', () => {
		on += 1;
	});
	
	et.once('ev', () => {
		once += 1;
	});
	et.once('ev', () => {
		once += 1;
	});
	
	et.after('ev', () => {
		after += 1;
	});
	et.after('ev', () => {
		after += 1;
	});
	
	et.onceAfter('ev', () => {
		onceAfter += 1;
	});
	et.onceAfter('ev', () => {
		onceAfter += 1;
	});
	
	et.fire('ev');
	assert.equal(on, 2);
	assert.equal(once, 2);
	assert.equal(after, 2);
	assert.equal(onceAfter, 2);
});

QUnit.test('context argument is applied to callback', function (assert) {
	let et = createEventTarget(),
		context = {i: 0},
		cb = function () {this.i += 1;};
	
	// test on / after
	et.on('ev', cb, context);
	et.after('ev', cb, context);
	
	et.fire('ev');
	assert.equal(context.i, 2);
	
	et.i = 0;
	et.on('ev', cb);
	et.after('ev', cb);
	
	et.fire('ev');
	assert.equal(et.i, 2);
	assert.equal(context.i, 4);
});

QUnit.test('publish sets event defaults', function (assert) {
	let et = createEventTarget(),
		v = null;
	
	// check non-cancelable
	et.publish('non-cancelable', {
		cancelable: false
	});
	
	et.on('non-cancelable', function (e) {
		e.cancel();
	});
	et.after('non-cancelable', function (e) {
		v = e.cancelled;
	});
	
	et.fire('non-cancelable');
	assert.equal(v, false);
	
	// check default / cancelled function
	v = [];
	et.publish('defFn', {
		defaultFn: function () {
			v.push('def');
		},
		cancelledFn: function () {
			v.push('prev');
		}
	});
	et.on('defFn', function (e) {		// will cancel second call
		if (v.length) {
			e.cancel();
		}
		v.push('on');
	});
	et.after('defFn', function () {
		v.push('after');
	});
	
	et.fire('defFn');
	assert.deepEqual(v, ['on', 'def', 'after']);
	
	et.fire('defFn');
	assert.deepEqual(v, ['on', 'def', 'after', 'on', 'prev']);
});

QUnit.test('publish can set context for defaultFn and cancelledFn', function (assert) {
	let et = createEventTarget(),
		defaultFnContext,
		cancelledFnContext;
	
	et.publish('without-context', {
		defaultFn () {defaultFnContext = this;},
		cancelledFn () {cancelledFnContext = this;}
	});
	
	// make sure both defaultFn and cancelledFn get called
	let cancel = false;
	et.on('without-context', (e) => {
		if (cancel) {
			e.cancel();
		}
	});
	
	et.fire('without-context');
	cancel = true;
	et.fire('without-context');
	
	// check that et itself was context (default)
	assert.equal(defaultFnContext, et, 'defaultFn defaults to "this" as context');
	assert.equal(cancelledFnContext, et, 'cancelledFn defaults to "this" as context');
	
	// now try with explicit context
	let context = {};
	et.publish('with-context', {
		defaultFn () {defaultFnContext = this;},
		cancelledFn () {cancelledFnContext = this;},
		context
	});
	
	cancel = false;
	et.on('with-context', (e) => {
		if (cancel) {
			e.cancel();
		}
	});
	
	et.fire('with-context');
	cancel = true;
	et.fire('with-context');
	
	assert.equal(defaultFnContext, context, 'defaultFn uses provided context');
	assert.equal(cancelledFnContext, context, 'cancelledFn uses provided context');
});

QUnit.test('can add and remove bubble targets', function (assert) {
	var et1 = createEventTarget(),
		et2 = createEventTarget(),
		et3 = createEventTarget(),
		et4 = createEventTarget(),
		et1Called = false,
		et2Called = false,
		et3Called = false,
		et4Called = false,
		originalTargetCorrect = true;
	
	et1.addBubbleTarget(et2);
	et2.addBubbleTarget(et3);
	et2.addBubbleTarget(et4);
	
	et1.on('ev', (e) => {
		et1Called = true;
		if (e.originalTarget !== et1) {
			originalTargetCorrect = false;
		}
	});
	et2.on('ev', (e) => {
		et2Called = true;
		if (e.originalTarget !== et1) {
			originalTargetCorrect = false;
		}
	});
	et3.on('ev', (e) => {
		et3Called = true;
		if (e.originalTarget !== et1) {
			originalTargetCorrect = false;
		}
	});
	et4.on('ev', (e) => {
		et4Called = true;
		if (e.originalTarget !== et1) {
			originalTargetCorrect = false;
		}
	});
	
	et1.fire('ev');
	assert.ok(et1Called);
	assert.ok(et2Called);
	assert.ok(et3Called);
	assert.ok(et4Called);
	
	assert.ok(originalTargetCorrect);
	
	// configure an event to not bubble
	et2Called = false;
	
	et1.publish('noBubble', {bubbles: false});
	et1.fire('noBubble');
	
	assert.notOk(et2Called);
	
	// listen only on bubble target, fire on original
	et2Called = false;
	et2.on('ve', () => {et2Called = true;});
	et1.fire('ve');
	
	assert.ok(et2Called, 'Events reach bubble targets even if original target is not subscribed');
	
	// remove target
	et3Called = et2Called = false;
	et2.removeBubbleTarget(et3);
	
	et1.fire('ev');
	assert.ok(et2Called);
	
	assert.notOk(et3Called);
});

QUnit.test('can stop bubbling', function (assert) {
	var et1 = createEventTarget(),
		et2 = createEventTarget(),
		et2Called = false,
		bubblingStopped = false;
	
	et1.addBubbleTarget(et2);
	
	et1.on('ev', (e) => {
		e.stopBubbling();
	});
	et1.on('ev', (e) => {
		bubblingStopped = e.bubblingStopped;
	});
	et2.on('ev', () => {
		et2Called = true;
	});
	
	et1.fire('ev');
	
	assert.notOk(et2Called);
	assert.ok(bubblingStopped);
});
