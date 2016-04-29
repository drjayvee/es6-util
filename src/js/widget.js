/*jshint esnext:true*/

import {mix} from 'js/oop';
import {AttributeObservable} from 'js/attribute';

// region WidgetP extends AttributeObservable
const WidgetPrototype = Object.create(AttributeObservable);

mix(WidgetPrototype, {

	ATTRS: {
		hidden: {
			value: false,
			validator: newVal => Boolean(newVal)
		},
		rendered: {
			value: false,
			readOnly: true
		}
	},

	init: function () {
		AttributeObservable.init.apply(this, arguments);
		
		this.node = null;
	},
	
	render: function (container) {
		if (this.get('rendered')) {
			return;
		}
		
		if (!container) {
			container = document.createElement('div');
			document.body.appendChild(container);
		}
		
		this.node = container;
		
		this.set('rendered', true);
	}
});

export default WidgetPrototype;
// endregion
