define([
	'goo/math/Vector3',
	'goo/scripts/Scripts',
	'goo/entities/components/ScriptComponent',
	'goo/addons/p2pack/P2Component',
	'goo/shapes/Sphere',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib'
], function (
	Vector3,
	Scripts,
	ScriptComponent,
	P2Component,
	Sphere,
	Material,
	ShaderLib
	) {

	'use strict';

	function GrappleHook(world, player) {

		this.mass = 1.5;

		this.hookRadius = 0.3;

		this.hookFireForce = 10000;


		this.player = player;
		var material = new Material(ShaderLib.simpleColored);
		material.uniforms.color = [0.89, 0, 0];
		this.hook = world.createEntity(
			new Sphere(8, 8, this.hookRadius),
			material,
			[-10, 10, 0]
		);
		this.hook.set(new P2Component({
			mass: this.mass,
			shapes: [{
				type: 'circle',
				radius: this.hookRadius
			}]
		}));
		this.hook.addToWorld();
	};

	GrappleHook.prototype.fire = function() {
		var hookBody = this.hook.p2Component.body;
		var playerT = this.player.entity.transformComponent.worldTransform.translation;
		hookBody.position[0] = playerT[0];
		hookBody.position[1] = playerT[1] + this.player.height * 0.5 + this.hookRadius;
		hookBody.velocity[0] = 0;
		hookBody.velocity[1] = 0;
		hookBody.force[0] = 0;
		hookBody.force[1] = this.hookFireForce;
		hookBody.wakeUp();
	};

	return GrappleHook;
});