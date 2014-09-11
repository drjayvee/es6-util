/*global console, define, require*/
require(['js/event', 'js/oop'], function (event, oop) {
	"use strict";
	
	var Party = oop.buildClass(oop.Root, [event.EventTarget], {
		init: function () {
			this.booze = 1;
			this.on('party', this._onParty.bind(this));
			this.on('boozegone', this._onBoozeGone.bind(this));
		},

		/**
		 * @param {Event} e
		 * @private
		 */
		_onParty: function (e) {
			if (this.booze) {
				console.log('party!');
			} else{
				e.preventDefault();
				this.fire('boozegone');
			}
			
			this.booze -= 1;
		},
		
		_onBoozeGone: function () {
			console.log('party\'s over people');
		},
		
		throwParty: function () {
			this.fire('party');
			return this;
		}
	});
	
	new Party().throwParty().throwParty();
});
