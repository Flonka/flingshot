define([
], function () {

	'use strict';

	var Config = {};

	Config.collisionGroup = {
		player: Math.pow(2,0),
		ground: Math.pow(2,0)
	};

	Config.player = {
		airMoveMult: 0.1,
		fixedRotation: true
	};
	

	return Config;
});