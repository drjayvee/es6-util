/*global console, define, require*/
require(['js/oop'], function (oop) {
	"use strict";
	
	var Awesome, my, Base, MESAp, Mid;
	
	// Base
	Base = oop.buildClass(oop.Root);
	
	Base.prototype.init = function (config) {
		this.baseVar = config.baseVar;
		console.log('Base.init');
	};
	
	Base.prototype.baseFunc = function () {
		return 'Base: ' + this.baseVar;
	};
	
	// Mid
	Mid = oop.buildClass(Base);

	Mid.prototype.init = function (config) {
		console.log('Mid.init');
		this.midVar = config.midVar;
	};
	Mid.prototype.midFunc = function () {
		return 'Mid: ' + this.midVar;
	};
	Mid.midStatic = 'Mid static';
	
	// Ext1
	function Ext1 () {}

	Ext1.prototype.init = function (config) {
		this.ext1Var = config.ext1Var;
		console.log('Ext1.init');
	};
	Ext1.prototype.ext1Func = function () {
		return 'Ext1: ' + this.ext1Var;
	};
	Ext1.ext1Static = 'Ext1 static';
	
	// Awesome
	Awesome = oop.buildClass(Mid, [Ext1], {
		init: function (config) {
			console.log('Awesome.init');
			this.awsVar = config.awsVar;
		},
		awsFunc: function () {
			return 'Awesome: ' + this.awsVar;
		}
	});

	// Ext2
	function Ext2 () {}

	Ext2.prototype.init = function (config) {
		this.ext2Var = config.ext2Var;
		console.log('Ext2.init');
	};
	Ext2.prototype.ext2Func = function () {
		return 'Ext2: ' + this.ext2Var;
	};
	Ext2.ext2Static = 'Ext2 static';

	// MESAp
	MESAp = oop.buildClass(Awesome, [Ext2], {
		init: function (config) {
			console.log('MESAp.init');
			this.mesapVar = config.mesapVar;
		},
		mesapFunc: function () {
			return 'MESA+: ' + this.mesapVar;
		}
	}, {
		mesapStatic: 'MESA+ static'
	});
	
	
	// test
	my = new MESAp({
		baseVar:	'base',
		midVar:		'mid',
		ext1Var:	'ext1',
		awsVar:		'aws',
		ext2Var:	'ext2',
		mesapVar:	'mesa+'
	});
	
	console.log(
		my.baseFunc(), my.midFunc(), my.ext1Func(), my.awsFunc(), my.ext2Func(), my.mesapFunc()
	);
	console.log(
		'these should all be true:', my instanceof MESAp, my instanceof Awesome, my instanceof Mid, my instanceof Base
	);
	console.log(
		'and what about Ext1?', my instanceof Ext2, my instanceof Ext1
	);
	
	function Fail () {}
	oop.buildClass(Fail);
});
