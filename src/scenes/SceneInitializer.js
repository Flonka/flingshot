define([
	'goo/entities/GooRunner',
	'goo/math/Vector3',
	'goo/renderer/light/DirectionalLight',
	'goo/renderer/Camera',
	'goo/scripts/Scripts',
	'goo/entities/components/ScriptComponent',
	'goo/util/GameUtils',

	'goo/addons/p2pack/P2System'
], function (
	GooRunner,
	Vector3,
	DirectionalLight,
	Camera,
	Scripts,
	ScriptComponent,
	GameUtils,

	P2System
	) {

	'use strict';

	function SceneInitializer() {

	};

	
	SceneInitializer.initGoo = function () {
		
		var options = {
			logo: {
				position: 'bottomright',
				color: '#FFF'
			},
			manuallyStartGameLoop: true,
			showStats: true,
			debugKeys: true,
			useTryCatch: false // Optimization, use try catch for debug i guess.
		};
		
		var goo = new GooRunner(options);
		goo.renderer.domElement.id = 'goo';

		var world = goo.world;

		var p2System = new P2System({
			substeps: 0
		});
		world.setSystem(p2System);

		// Set some default settings in the physics world
		p2System.world.gravity[1] = -10;
		p2System.world.defaultContactMaterial.restitution = 0.2;
		p2System.world.defaultContactMaterial.friction = 0.95;

		var sunLight = new DirectionalLight(new Vector3(1, 1, 1));
		sunLight.shadowCaster = true;

		sunLight.shadowSettings = {
			size: 45,
			near: 1,
			far: 120,
			resolution: [1024, 1024],
			upVector: Vector3.UNIT_Y.clone(),
			darkness: 1.0,
			shadowType: 'VSM'
		};

		var sun = world.createEntity(sunLight, [40, 30, 0]);
		sun.setRotation(-Math.PI/4, Math.PI * 0.4, 0);
		sun.addToWorld();

		document.body.appendChild(goo.renderer.domElement);

		return goo;
	};

	return SceneInitializer;

});