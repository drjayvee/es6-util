/*jshint esnext:true*/

import {createButton, createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';
import createTabView from 'js/tabView';

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

bt.addEventListener('click', () => {
	bt.hide();
	setTimeout(() => bt.show(), 2000);
	
	bt.set('label', 'You got me')
		.set('disabled', true);
});
// endregion

// region ButtonGroup
createButtonGroup({
	children: [
		createToggleButton({label: 'check', pressed: true}),
		createToggleButton({label: 'mate'})
	]
}).render();

createButtonGroup({
	children: [
		createToggleButton({label: 'blue pil'}),
		createToggleButton({label: 'red pil'})
	],
	radio: true
}).render();

createButtonGroup({
	enhance: document.getElementById('bg'),
	radio: true
});
// endregion

// region TabView
createTabView({
	enhance: document.getElementById('tv')
});
// endregion
