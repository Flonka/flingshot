define([
], function () {

	'use strict';

	var Config = {};

	// http://schteppe.github.io/p2.js/docs/classes/Shape.html
	Config.collisionGroup = {
		player: Math.pow(2,0),
		ground: Math.pow(2,1),
		bullet: Math.pow(2,2)
	};

	Config.player = {
		airMoveMult: 0.1,
		fixedRotation: false,
		jumpCooldown: 500
	};

	Config.weapon = {
		grappleHook: {
			cooldown: 1000,
		}
	}


	return Config;
});