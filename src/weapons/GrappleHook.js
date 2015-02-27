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

		hookBody.world.on('impact', function (event) {

			var hookBody = this.hook.p2Component.body;

			if (event.bodyA === hookBody) {
				this.createRope(event, true);
			} else if (event.bodyB === hookBody) {
				this.createRope(event, false);
			}

		}.bind(this));

		this.disableHook();

		this.activeSpring = null;
	};

	GrappleHook.prototype.disableHook = function() {
		var hookBody = this.hook.p2Component.body;
		hookBody.world.removeBody(hookBody);
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

	var anchorVec = [0,0];
	GrappleHook.prototype.createRope = function(contactEvent, hookIsBodyA) {

		// TODO: Create Rope-like structure, now testing with a spring.

		var equation = contactEvent.contactEquation;
		console.log('A', equation.contactPointA);
		console.log('B', equation.contactPointB);
		console.log('Penetration', equation.penetrationVec);

		// Using the only the first contact equation for the anchor pos.
		var targetBody, contactPoint, hookBody;
		if (hookIsBodyA) {
			console.log('hook is body A!');
			targetBody = contactEvent.bodyB;
			hookBody = contactEvent.bodyA;
			contactPoint = equation.contactPointB;
		} else {
			targetBody = contactEvent.bodyA;
			hookBody = contactEvent.bodyB;
			contactPoint = equation.contactPointA;
		}

		p2.vec2.add(anchorVec, targetBody.position, contactPoint)

		console.log('ankare', anchorVec);
		console.log('diff', p2.vec2.subtract([0,0], anchorVec, contactEvent.bodyA.position));

		hookBody.position = anchorVec;

		var spring = new p2.LinearSpring(
			this.player.rigidBody,
			targetBody, {
				restLength: 1,
				stiffness: 300,
				localAnchorA: [0, this.player.height * 0.5],
				worldAnchorB: anchorVec
			});

		this.disableHook();
		targetBody.world.addSpring(spring);
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