define([
	'goo/math/Vector3',
	'goo/scripts/Scripts',
	'goo/entities/components/ScriptComponent',
	'goo/addons/p2pack/P2Component',
	'goo/shapes/Sphere',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',

	'Config'
], function (
	Vector3,
	Scripts,
	ScriptComponent,
	P2Component,
	Sphere,
	Material,
	ShaderLib,

	Config
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
			material
		);
		this.hook.set(new P2Component({
			mass: this.mass,
			shapes: [{
				type: 'circle',
				radius: this.hookRadius
			}]
		}));
		this.hook.addToWorld();

		this.material = material;

		world.process();
		var hookBody = this.hook.p2Component.body;
		var hookShape = hookBody.shapes[0];

		hookShape.collisionGroup = Config.collisionGroup.bullet;
		hookShape.collisionMask = Config.collisionGroup.ground;

		hookBody.world.on('beginContact', function (event) {

			if (event.bodyA === event.bodyB) {
				console.log('end contact with oneself??');
				return;
			}

			var hookBody = this.hook.p2Component.body;
			if (event.bodyA == hookBody) {
				if (event.bodyB == this.player.rigidBody) {
					return;
				}
				this.createRope(event, true);
			} else if (event.bodyB == hookBody) {
				if (event.bodyA == this.player.rigidBody) {
					return;
				}
				this.createRope(event, false);

			}
		}.bind(this));

		this.disableHook();

		this.activeSpring = null;
	};

	GrappleHook.prototype.disableHook = function() {
		var hookBody = this.hook.p2Component.body;
		this.player.rigidBody.world.removeBody(hookBody);
		this.material.uniforms.color = [0, 1, 0.2];
	};

	GrappleHook.prototype.enableHook = function() {
		var hookBody = this.hook.p2Component.body;
		this.player.rigidBody.world.addBody(hookBody);
		this.material.uniforms.color = [0.89, 0, 0];
	};

	GrappleHook.prototype.releaseRope = function() {
		var world = this.player.rigidBody.world;
		if (this.activeSpring) {
			world.removeSpring(this.activeSpring);
			this.material.uniforms.color = [0, 0.6, 0.2];
		}
	};

	GrappleHook.prototype.createRope = function(contactEvent, hookIsBodyA) {

		// TODO: Create Rope-like structure, now testing with a spring.

		console.log('Hook hit: ', contactEvent);
		console.log(contactEvent.contactEquations);

		if (hookIsBodyA) {

			console.log(contactEvent.bodyA.position);
			console.log(this.hook.p2Component.body.interpolatedPosition);

			var spring = new p2.LinearSpring(
				this.player.rigidBody, 
				contactEvent.bodyB, {
					restLength: 1,
					stiffness: 300,
					localAnchorA: [0, this.player.height * 0.5],
					worldAnchorB: this.hook.p2Component.body.position
				});
		} else {

			console.log(contactEvent.bodyB.position);
			console.log(this.hook.p2Component.body.interpolatedPosition);

			var spring = new p2.LinearSpring(
				this.player.rigidBody, 
				contactEvent.bodyA, {
					restLength: 1,
					stiffness: 300,
					localAnchorA: [0, this.player.height * 0.5],
					worldAnchorB: this.hook.p2Component.body.position
				});
		}

		this.disableHook();

		this.player.rigidBody.world.addSpring(spring);
		this.activeSpring = spring;
	};

	GrappleHook.prototype.fire = function(direction) {
		
		this.releaseRope();
		
		var hookBody = this.hook.p2Component.body;
		this.enableHook();

		var playerT = this.player.entity.transformComponent.worldTransform.translation;
		hookBody.wakeUp();
		hookBody.position[0] = playerT[0];
		hookBody.position[1] = playerT[1];
		hookBody.velocity[0] = 0;
		hookBody.velocity[1] = 0;
		hookBody.force[0] = this.hookFireForce * direction[0];
		hookBody.force[1] = this.hookFireForce * direction[1];
		this.hook.transformComponent.transform.translation.setDirect(hookBody.position[0], hookBody.position[1], 0);
	};

	return GrappleHook;
});