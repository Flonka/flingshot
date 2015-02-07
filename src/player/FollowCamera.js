define([
	'goo/math/Vector3',
	'goo/renderer/Camera',
	'goo/scripts/Scripts',
	'goo/entities/components/ScriptComponent'
], function (
	Vector3,
	Camera,
	Scripts,
	ScriptComponent
	) {

	'use strict';

	function FollowCamera(player) {

		var world = player.entity._world;
		this.player = player;

		var camera = new Camera(45, 1, 0.1, 1000);
		camera.lookAt(Vector3.ZERO, Vector3.UNIT_Y);
		var camEntity = world.createEntity(camera, [0, 3, 40]);
		camEntity.addToWorld();

		var scriptComponent = new ScriptComponent();
		var followScript = {
			run: function(entity, tpf, context, parameters) {
				var rbPos = this.player.rigidBody.position;
				entity.setTranslation([rbPos[0], rbPos[1], entity.getTranslation().z]);
			}.bind(this)
		};
		scriptComponent.scripts.push(followScript);
		camEntity.set(scriptComponent);
	};

	return FollowCamera;
});