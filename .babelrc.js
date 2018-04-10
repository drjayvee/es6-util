/*jslint node:true, esnext: true*/

module.exports = {
	"presets": [
		["@babel/env", {
			"debug": true,
			"modules": false,
			"targets": {
				"browsers": [
					"last 1 Chrome versions",
					"last 1 Edge versions",
					"last 1 Firefox versions",
					"ie 11",
				]
			},
			"useBuiltIns": "usage",
		}],
	],
};
