/*global console, define, require, QUnit*/
require(['js/event', 'js/oop'], function (event, oop) {
	"use strict";
	
	var ET = event.EventTarget;
	
	QUnit.test('on() callbacks are called after fire()', function (assert) {
		var et = new ET(),
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
	
	QUnit.test('can detach handlers', function (assert) {
		var et = new ET(),
			context = {i: 0},
			cb = function () {
				this.i += 1;
			};
		
		et.i = 0;
		
		// use on's returned Subscription.detach()
		et.on('ev', cb).detach();
		
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
	
	QUnit.test('after() callbacks are called after (), but only if default is not prevented', function (assert) {
		var et = new ET(),
			onRan = false,
			i = 0;
		
		et.on('ev', function (e) {
			onRan = true;
			
			if (i) {
				e.preventDefault();
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
		var et = new ET(),
			o = 0,
			oa = 0;
		
		et.once('ev', function (e) {
			o += 1;
		});
		et.onceAfter('ev', function () {
			oa += 1;
		});
		
		et.fire('ev');
		assert.equal(o, 1);
		assert.equal(oa, 1);
		
		et.fire('ev');
		assert.equal(o, 1);
		assert.equal(oa, 1);
	});
	
	QUnit.test('context argument is applied to callback', function (assert) {
		var et = new ET(),
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
		var et = new ET(),
			v = null;
		
		// check non-preventable
		et.publish('non-preventable', {
			preventable: false
		});
		
		et.on('non-preventable', function (e) {
			e.preventDefault();
		});
		et.after('non-preventable', function (e) {
			v = e.defaultPrevented;
		});
		
		et.fire('non-preventable');
		assert.equal(v, false);
		
		// check default / prevented function
		v = [];
		et.publish('defFn', {
			defaultFn: function () {
				v.push('def');
			},
			preventedFn: function () {
				v.push('prev');
			}
		});
		et.on('defFn', function (e) {		// will preventDefault second call
			if (v.length) {
				e.preventDefault();
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
});
