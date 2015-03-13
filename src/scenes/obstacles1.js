require([
	'scenes/SceneInitializer',
	'player/Player',
	'Config',

	'goo/shapes/Quad',
	'goo/shapes/Box',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component'
	], 

	function (
		SceneInitializer,
		Player,
		Config,

		Quad,
		Box,
		Material,
		ShaderLib,
		P2Component
	) {

	'use strict';

	var blockMaterial = new Material(ShaderLib.uber);
	blockMaterial.uniforms.materialDiffuse = [0.1, 0.05, 0.3, 1.0];
	blockMaterial.wireframe = false;

	var propMaterial = new Material(ShaderLib.uber);
	propMaterial.uniforms.materialDiffuse = [0.1, 0.9, 0.3, 1.0];

	init();

	function init () {

		var gooRunner = SceneInitializer.initGoo();

		gooRunner.renderer.setClearColor(0.3, 0.3, 0.3);

		var player = new Player(gooRunner.world);

		createMap(gooRunner.world);

		gooRunner.startGameLoop();
	}

	function createMap(world) {
	
		// Room 1 

		addBlock(5, 20, [0, -10, 0], world);
		addBlock(2, 10, [-4, 2.5, 0], world);
		addBlock(5, 10, [0, 10, 0], world);
		addProp(2, 2, [12, 10, 0], world);
		addProp(2, 2, [12, 12, 0], world);
		
		// Ground
		addBlock(30, 4, [15, -20, 0], world);
		
		addBlock(10, 10, [15, 0, 0], world);

		addBlock(20, 10, [40, -15, 0], world);

		addProp(2, 2, [32, -8, 0], world);
		addProp(2, 2, [34, -8, 0], world);
		addProp(2, 2, [34, -5, 0], world);
		addProp(2, 2, [34, -2, 0], world);

	};


	function addBlock(width, height, pos, world) {

		var leftBlock = world.createEntity(
			new Box(width, height, 10),
			blockMaterial,
			pos
		);

		leftBlock.static = true;

		leftBlock.set(new P2Component({
			mass: 0,

			shapes: [{
				type: 'box',
				width: width,
				height: height
			}]
		}));

		leftBlock.addToWorld();

		world.process();

		setGroundCollisionRules(leftBlock.p2Component.body.shapes[0]);
	};


	function addProp(width, height, pos, world) {

		var propEntity = world.createEntity(
			new Box(width, height, width),
			propMaterial,
			pos
		);

		propEntity.set(new P2Component({
			mass: width * height * 10,
			shapes: [{
				type: 'box',
				width: width,
				height: height
			}]
		}));

		propEntity.addToWorld();

		world.process();

		setGroundCollisionRules(propEntity.p2Component.body.shapes[0]);
	};


	function setGroundCollisionRules(shape) {
		shape.collisionGroup = Config.collisionGroup.ground;
		shape.collisionMask = Config.collisionGroup.player | Config.collisionGroup.bullet | Config.collisionGroup.ground;
	};


});