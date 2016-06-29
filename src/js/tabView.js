/*jshint esnext:true*/

import {extendFactory} from 'js/oop';
import {createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';
import createWidget from 'js/widget';

const createTabView = extendFactory(createWidget, {

	CLASS: 'tabView',
	
	/**
	 * 
	 * @param {string} label
	 * @param {string|HTMLElement} content
	 * @param {Number|null} index
	 * @param {boolean} setSelected
	 */
	addTab (label, content, index = this._tabs.length, setSelected = !this._tabs.length) {
		if (index < 0 || index > this._tabs.length) {
			throw 'Invalid index';
		}
		
		// add label Button
		const labelButton = createToggleButton({label});
		this._labelsGroup.add(labelButton, index);
		
		// render tab if tabview is already rendered
		if (this.get('rendered')) {
			this._renderTab(content, index);
		}
		
		// add to this.tabs and set selected
		this._tabs.splice(index, 0, {labelButton, content});
		
		if (setSelected) {
			this._labelsGroup.children[index].toggle(true);
		}
		
		return this;
	},
	
	_renderTab (content, index, hidden = true) {
		if (typeof content === 'string') {
			const c = document.createElement('div');
			c.innerHTML = content;
			content = c;
		}
		
		content.hidden = hidden;
		
		if (index === this._tabs.length) {
			this._tabPanelContainer.appendChild(content);
		} else {
			this._tabPanelContainer.insertBefore(content, this._tabPanelContainer.children[index]);
		}
	},
	
	getSelectedIndex () {
		return this._labelsGroup.getIndex(
			this._labelsGroup.getPressedButtons()[0]
		);
	},
	
	getSelectedTab () {
		return this.getTab(this.getSelectedIndex());
	},
	
	getTab (index) {
		return {
			label: this._labelsGroup.children[index].get('label'),
			content: this.get('rendered') ? this._tabPanelContainer.children[index].innerHTML : null
		};
	},
	
	selectTab (index) {
		if (index < 0 || index >= this._tabs.length) {
			throw 'Invalid index';
		}
		
		this._labelsGroup.children[index].toggle(true);
	},
	
	enhance (srcNode) {
		if (this._tabs.length) {
			throw 'Cannot enhance - tabs already set';
		}
		
		createWidget.prototype.enhance.apply(this, arguments);
	},
	
	_enhance () {
		this._labelsGroup.enhance(this.node.firstElementChild);
		
		if (!this._labelsGroup.getPressedButtons().length) {
			this._labelsGroup.children[0].toggle();
		}
		
		this._tabPanelContainer = this.node.children[1];
		this._tabPanelContainer.classList.add('tabView-panels');
		
		this._setSelectedTab();
	},
	
	_render () {
		this._labelsGroup.render(this.node);
		
		this._tabPanelContainer = document.createElement('div');
		this._tabPanelContainer.classList.add('tabView-panels');
		
		for (let [index, {labelButton, content}] of this._tabs.entries()) {
			this._renderTab(content, index, !labelButton.get('pressed'));
		}
		
		// finally, add panels to this.node (do this last to avoid flickering)
		this.node.appendChild(this._tabPanelContainer);
	},
	
	_bindUI () {
		this._registerSubscriptions(
			this._labelsGroup.after('selectionChange', this._setSelectedTab, this)
		);
	},
	
	_setSelectedTab () {
		const tabIndex = this._labelsGroup.getIndex(
			this._labelsGroup.getPressedButtons()[0]
		);
		
		for (let [panelIndex, panelNode] of Array.from(this._tabPanelContainer.children).entries()) {
			panelNode.hidden = panelIndex !== tabIndex;
		}
	}
}, function (superInit, {tabs = []} = {}) {
	superInit();
	
	this._labelsGroup = createButtonGroup({radio: true});
	
	this._tabs = [];
	for (let tab of tabs) {
		this.addTab(tab.label, tab.content);
	}
});

export default createTabView;
