define([
	'goo/math/Vector3',
	'goo/renderer/Camera',
	'goo/scripts/Scripts',
	'goo/entities/components/ScriptComponent',
	'goo/addons/p2pack/P2Component'
], function (
	Vector3,
	Camera,
	Scripts,
	ScriptComponent,
	P2Component
	) {

	'use strict';

	function FollowCamera(player) {

		var world = player.entity._world;
		this.player = player;

		this.mass = 15;
		this.minFollowMultiplier = 0.7;

		var camera = new Camera(45, 1, 0.1, 1000);
		camera.lookAt(Vector3.ZERO, Vector3.UNIT_Y);
		var camEntity = world.createEntity(camera, [0, 3, 40]);
		this.camera = camera;

		var lookAtScript = {
			run: function (entity, tps, context, params) {
				this.camera.lookAt(this.player.entity.getTranslation(), Vector3.UNIT_Y);
			}.bind(this)
		};
		var camScript = new ScriptComponent();
		camScript.scripts.push(lookAtScript);
		camEntity.set(camScript);
		camEntity.addToWorld();

		var anchorEntity = world.createEntity();
		anchorEntity.set(new P2Component({
			mass: 0
		}));
		anchorEntity.addToWorld();
		anchorEntity.attachChild(camEntity);

		world.process();

		var anchorBody = anchorEntity.p2Component.body;
		anchorBody.type = p2.Body.KINEMATIC;

		var physicsWorld = anchorBody.world;

		var followScript = {
			run: function(entity, tps, ctx, params) {
				var rb = entity.p2Component.body;
				var rbPos = rb.position;
				var playerPos = this.player.rigidBody.position;
				var dx = playerPos[0] - rbPos[0];
				var dy = playerPos[1] - rbPos[1];

				var d = Math.sqrt(dx * dx + dy * dy);
				d = Math.max(this.minFollowMultiplier, d);

				rb.velocity[0] = dx * d;
				rb.velocity[1] = dy * d;

			}.bind(this)
		};
		var sc = new ScriptComponent();
		sc.scripts.push(followScript);
		anchorEntity.set(sc);

	};

	return FollowCamera;
});