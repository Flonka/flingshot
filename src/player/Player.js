define([
	'goo/shapes/Cylinder',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component'
], function (
	Cylinder,
	Material,
	ShaderLib,
	P2Component
	) {

	'use strict';

	function Player(world) {

		this.material = new Material(ShaderLib.simpleLit);

		var width = 1.0;
		var height = 1.8;

		this.entity = world.createEntity(
			new Cylinder(8, width, width, height),
			this.material,
			[0, 5, 0]
		);

		this.entity.set(new P2Component({
			mass: 66.6,
			shapes: [{
				type: 'box',
				width: width,
				height: height
			}],
			offsetAngleX: Math.PI/2.0
		}));

		this.entity.setRotation([Math.PI/2.0, 0, 0]);

		this.entity.addToWorld();
		world.process();
		this.entity.p2Component.body.allowSleep = false;
	};

	return Player;
});