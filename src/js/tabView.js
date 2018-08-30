/*jshint esnext:true*/

import {createToggleButton} from 'js/button';
import createButtonGroup from 'js/buttonGroup';
import createWidget from 'js/widget';

// region Tabview extends Widget
/**
 * @class TabView
 * @augments Widget
 * @see createTabView
 */

/**
 * @typedef {object} TabViewConfig
 * @property {Object[]} [tabs]
 * @property {string} tabs[].label
 * @property {(HTMLElement|string)} tabs[].content
 */

/**
 * @function
 * @param {TabViewConfig} [config]
 * @return {TabView}
 */
const createTabView = createWidget.extend(/** @lends TabView.prototype */ {

	CLASS: 'yui3-tabview',
	
	/**
	 * Add a tab
	 * 
	 * @param {string} label
	 * @param {(string|HTMLElement)} content
	 * @param {number} [index]
	 * @param {boolean} [setSelected]
	 * @return {TabView} this
	 */
	addTab (label, content, index = this._tabs.length, setSelected = !this._tabs.length) {
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
	
	removeTab (index) {
		const tab = this.getTab(index);
		
		this._labelsGroup.removeChild(tab.label);
		if (tab.panel) {
			this._tabPanelContainer.removeChild(tab.panel);
		}
		
		this._tabs.splice(index, 1);
		
		if (this._tabs.length) {
			this.selectTab(0);
		}
	},
	
	_checkIndex (index) {
		if (index < 0 || index > this._tabs.length) {
			throw 'Invalid index';
		}
	},
	
	_renderTab (content, index, hidden = true) {
		if (typeof content === 'string') {
			const c = document.createElement('div');
			c.innerHTML = content;
			content = c;
		}
		
		content.hidden = hidden;
		content.classList.add(`${this.CLASS}-panel`);
		
		if (index === this._tabs.length) {
			this._tabPanelContainer.appendChild(content);
		} else {
			this._tabPanelContainer.insertBefore(content, this._tabPanelContainer.children[index]);
		}
	},
	
	/**
	 * Get the selected tab's index
	 * 
	 * @return {number}
	 */
	getSelectedIndex () {
		return this._labelsGroup.getIndex(
			this._labelsGroup.getPressedButtons()[0]
		);
	},
	
	/**
	 * Get the selected tab
	 * 
	 * @return {{label: string, content: string}}
	 */
	getSelectedTab () {
		return this.getTab(this.getSelectedIndex());
	},
	
	/**
	 * Get a tab
	 * 
	 * @param {number} index
	 * @return {{index: number, label: string, panel: (HTMLElement|null)}}
	 */
	getTab (index) {
		this._checkIndex(index);
		
		return {
			index,
			label:	this._labelsGroup.children[index],
			panel:	this.get('rendered') ? this._tabPanelContainer.children[index] : null
		};
	},
	
	/**
	 * Select a tab
	 * 
	 * @param {number} index
	 */
	selectTab (index) {
		this._checkIndex(index);
		
		this._labelsGroup.children[index].toggle(true);
	},
	
	_enhance () {
		if (!this._labelsGroup.getPressedButtons().length) {
			this._labelsGroup.children[0].toggle();
		}
		
		this._tabPanelContainer = this.node.children[1];
		this._labelsGroup.node.classList.add(`${this.CLASS}-labels`);
		this._tabPanelContainer.classList.add(`${this.CLASS}-panels`);
		
		this._setSelectedTab();
	},
	
	_render () {
		this._labelsGroup.render(this.node);
		
		this._tabPanelContainer = document.createElement('div');
		this._labelsGroup.node.classList.add(`${this.CLASS}-labels`);
		this._tabPanelContainer.classList.add(`${this.CLASS}-panels`);
		
		for (let [index, {labelButton, content}] of this._tabs.entries()) {
			this._renderTab(content, index, !labelButton.get('pressed'));
		}
		
		// finally, add panels to this.node (do this last to avoid flickering)
		this.node.appendChild(this._tabPanelContainer);
	},
	
	_setSelectedTab () {
		const tabIndex = this._labelsGroup.getIndex(
			this._labelsGroup.getPressedButtons()[0]
		);
		
		for (let [panelIndex, panelNode] of Array.from(this._tabPanelContainer.children).entries()) {
			panelNode.hidden = panelIndex !== tabIndex;
		}
	}
}, function (superInit, {tabs = [], enhance = null} = {}) {
	if (enhance && tabs.length) {
		throw 'Cannot enhance existing element and add tabs';
	}
	
	// init labels button group
	this._labelsGroup = createButtonGroup({
		enhance: enhance ? enhance.firstElementChild : null,
		radio: true
	});
	this._labelsGroup.after('selectionChange', () => {
		this.fire('selectionChange', this.getSelectedTab());
	}, this);
	
	this._tabs = [];
	
	superInit();
	
	this.publish('selectionChange', {
		defaultFn: () => {
			if (this.get('rendered')) {
				this._setSelectedTab();
			}
		}
	});
	
	if (enhance) {
		for (let [index, labelButton] of this._labelsGroup.children.entries()) {
			this._tabs.push({
				label: labelButton.get('label'),
				content: this._tabPanelContainer.childNodes[index].innerHTML
			});
		}
	} else {
		for (let tab of tabs) {
			this.addTab(tab.label, tab.content);
		}
	}
});

export default createTabView;
// endregion
