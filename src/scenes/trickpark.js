require([
	'scenes/SceneInitializer',
	'player/Player',

	'goo/shapes/Quad',
	'goo/shapes/Box',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component'
	], 

	function (
		SceneInitializer,
		Player,

		Quad,
		Box,
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

	var blockMaterial = new Material(ShaderLib.simpleColored);
	blockMaterial.uniforms.color = [0.1, 0.05, 0.3];

	var leftBlock = gooRunner.world.createEntity(
		new Box(10, 10, 10),
		blockMaterial,
		[-10, 0, 0]
	);

	leftBlock.set(new P2Component({
		mass: 0,

		shapes: [{
			type: 'box',
			width: 10,
			height: 10
		}]
	}))

	leftBlock.addToWorld();

	ground.addToWorld();

	gooRunner.startGameLoop();

});