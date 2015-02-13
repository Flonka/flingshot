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

		var camera = new Camera(45, 1, 0.1, 1000);
		camera.lookAt(Vector3.ZERO, Vector3.UNIT_Y);
		var camEntity = world.createEntity(camera, [0, 3, 40]);
		camEntity.addToWorld();

		var anchorEntity = world.createEntity();
		anchorEntity.set(new P2Component({
			mass: 0.1
		}));
		anchorEntity.addToWorld();
		anchorEntity.attachChild(camEntity);

		world.process();

		var anchorBody = anchorEntity.p2Component.body;

		var physicsWorld = anchorBody.world;

		// Lock the anchor to the player.
		var lock = new p2.LockConstraint(
			anchorBody, 
			player.rigidBody,
			{
				localOffsetB: [0,0],
				localAngleB: 0
			}
		);

		physicsWorld.addConstraint(lock);

		
	};

	return FollowCamera;
});