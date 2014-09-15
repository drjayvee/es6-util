/*global console, define, require*/
require(['js/event', 'js/oop'], function (event, oop) {
	"use strict";
	
	var o, p, Party;
	
	Party = oop.buildClass(oop.Root, [event.EventTarget], {
		init: function () {
			this.booze = 2;
			
			this.on('party', this._onParty);
			this.after('party', this._afterParty);
			this.on('boozegone', this._onBoozeGone);
		},

		/**
		 * @param {Event} e
		 * @private
		 */
		_onParty: function (e) {
			console.log('Party: let\'s party!');
			if (!this.booze) {
				e.preventDefault();
				this.fire('boozegone');
			}
		},
		
		_afterParty: function () {
			this.booze -= 1;
			console.log('Party: clean up');
		},
		
		_onBoozeGone: function () {
			console.log('Party: booze is gone, no party tonight people');
		},
		
		throwParty: function () {
			this.fire('party');
			return this;
		}
	});
	
	p = new Party();
	
	p.once('party', function () {
		console.log('Neighbour hears a party, will tolerates once');
	});
	p.onceAfter('party', function () {
		console.log('Neighbour can finally go to bed');
	});
	
	// 1st party
	p.throwParty();
	console.log('-- That was one heck of a party! --');
	
	p.on('party', function (e) {
		console.log('Neighbour will call cops ', !e.defaultPrevented);
	});
	
	// 2nd party
	p.throwParty();
	console.log('-- That was one heck of a party, again! --');

	// 3rd party
	o = {name: 'Pete'};
	function dance () {
		console.log(this.name + ' starts to dance (should NEVER happen!!!!)');
	}
	p.on('party', dance, o);
	p.on('party', dance, o);
	p.detach('party', dance, o);
	
	p.throwParty();
});
