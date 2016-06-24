/*jshint esnext:true*/

import {createButton, createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';

// region Button
const bt = createButton({
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
// endregion

// region ButtonGroup
const checkGroup = createButtonGroup({
	children: [
		createToggleButton({label: 'check', pressed: true}),
		createToggleButton({label: 'mate'})
	]
}).render();

const radioGroup = createButtonGroup({
	children: [
		createToggleButton({label: 'blue pil'}),
		createToggleButton({label: 'red pil'})
	],
	radio: true
}).render();
// endregion
