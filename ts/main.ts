import Attr2JSON = require('attr2json');
///<reference path="legacy.d.ts">
import legacy = require('legacy');

(function main () {
	var a2j = new Attr2JSON();
	
	a2j.set('pwn', true)
		.set('fail', 'no way!');
	
	$('.main ul').append(
		'<li><a href="' + legacy.flattenToURL(a2j.getAll()) + '">' + a2j.toJSON() + '()</a></li>'
	);
}());
