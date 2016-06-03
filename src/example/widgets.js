/*jshint esnext:true*/

import {Button, ToggleButton} from 'js/button';

let bt = Button({
	label: 'No touching!',
	disabled: true
});

bt.render();

setTimeout(() => {
	bt.set('label', 'Just kidding, go ahead :)')
		.set('disabled', false);
}, 2000);

bt.node.addEventListener('click', () => {
	bt.set('label', 'You got me')
		.set('disabled', true);
});
