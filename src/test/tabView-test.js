/*jshint esnext:true*/
/*global QUnit*/

import createTabView from 'js/tabView';
import {getByNode} from 'js/widget';

const widgets = [];
const nodes = [];

QUnit.module('TabView', {
	afterEach: () => {
		while (widgets.length) {
			let b = widgets.pop();
			if (b.get('rendered')) {
				b.destroy();
			}
		}
		
		while (nodes.length) {
			let n = nodes.pop();
			n.parentNode.removeChild(n);
		}
	}
});

QUnit.test('basic TabView', function (assert) {
	const tv = createTabView();
	
	widgets.push(tv);
	
	tv.addTab('One', '1st')
		.addTab('Two', '2nd')
		.render();
	
	// check 1st tab, selected by default
	assert.equal(0, tv.getSelectedIndex(), '1st tab should be selected by default');
	
	let selectedTab = tv.getSelectedTab();
	assert.equal(selectedTab.label, 'One');
	assert.equal(selectedTab.content, '1st');
	
	// select 2nd tab
	tv.selectTab(1);
	
	assert.equal(1, tv.getSelectedIndex(), '2nd tab should be selected after button press');
	
	selectedTab = tv.getSelectedTab();
	assert.equal(selectedTab.label, 'Two');
	assert.equal(selectedTab.content, '2nd');
	
	assert.throws(() => {tv.selectTab(2);}, 'Invalid index');
	
	// add 3rd tab in 2nd place
	tv.addTab('2.5', 'In between', 1);
	
	assert.equal(2, tv.getSelectedIndex(), '2nd tab still selected, but index changed');
	
	selectedTab = tv.getSelectedTab();
	assert.equal(selectedTab.label, 'Two');
	assert.equal(selectedTab.content, '2nd');
	
	// add new tab
	tv.selectTab(1);
	
	assert.equal(1, tv.getSelectedIndex(), '2nd tab still selected, but index changed');
	
	selectedTab = tv.getSelectedTab();
	assert.equal(selectedTab.label, '2.5');
	assert.equal(selectedTab.content, 'In between');
});

QUnit.test('enhance TabView', function (assert) {
	const c = document.createElement('div');
	c.innerHTML = `
		<div class="buttonGroup">
			<button class="button" type="button">Ay</button>
			<button class="button" type="button">Be</button>
		</div>
		<div>
			<div>captain</div>
			<div>nice</div>
		</div>`;
	
	const tv = createTabView({
		enhance: c
	});
	
	widgets.push(tv);
	
	assert.equal(0, tv.getSelectedIndex(), '1st tab should be selected by default');
	
	let tab = tv.getSelectedTab();
	assert.equal(tab.label, 'Ay');
	assert.equal(tab.content, 'captain');
	
	tab = tv.getTab(1);
	assert.equal(tab.label, 'Be');
	assert.equal(tab.content, 'nice');
});
