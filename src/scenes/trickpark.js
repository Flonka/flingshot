require([
	'scenes/SceneInitializer',
	'player/Player',

	'goo/shapes/Quad',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component'
	], 

	function (
		SceneInitializer,
		Player,

		Quad,
		Material,
		ShaderLib,
		P2Component
	) {

	'use strict';

	var gooRunner = SceneInitializer.initGoo();

	var player = new Player(gooRunner.world);

	// Create ground

	var ground = gooRunner.world.createEntity(
		new Quad(1000, 1000, 100, 100),
		new Material(ShaderLib.simpleLit)
	);
	ground.set(new P2Component({
		mass: 0,
		offsetAngleX: -Math.PI / 2,
		shapes: [{
			type: 'plane'
		}]
	}));
	ground.addToWorld();

	gooRunner.startGameLoop();

});