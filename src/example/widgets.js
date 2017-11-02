/*jshint esnext:true*/

import {createButton, createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';
import createOverlay from 'js/overlay';

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
document.getElementById('tv').addEventListener('click', () => {
	// import('js/tabView').then(createTabView => {
	// 	createTabView.default({
	// 		enhance: document.getElementById('tv')
	// 	});
	// });
});
// endregion

// region Overlay
const placement = {
	index: 0,
	options: ['left', 'top', 'right', 'bottom']
};
const referenceElement = document.querySelector('#overlay-ref');

const overlay = createOverlay({
	bodyContent: 'Moon'
})
	.align(referenceElement, 'bottom', {offset: {offset: '50, 50'}})
	.render()
	.addEventListener('mouseenter', function () {
		this.align(referenceElement, placement.options[placement.index++ % 4]);
		
		if (placement.index === 4) {
			this.set('headerContent', 'Le')
				.set('bodyContent', `${this.get('bodyContent')} (2nd cycle)`);
		}
		if (placement.index === 8) {
			this.destroy();
		}
	});
// endregion
