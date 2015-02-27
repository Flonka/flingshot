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

		this.hookFireForce = 5000;

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

		// Rope creation

		var ropeMaterial = new Material(ShaderLib.simpleColored);
		ropeMaterial.uniforms.color = [0.5, 0.5, 0];

		this.ropeEntities = [];
		this.ropeCount = 25;
		
		var ropeRadius = this.hookRadius * 0.45;
		var lastBody = null;

		for (var i=0; i < this.ropeCount; i++) {
			var r = world.createEntity(
				new Sphere(8, 8, ropeRadius),
				ropeMaterial
			);
			r.set(new P2Component({
				mass: this.mass * 0.05,
				shapes: [{
					type: 'circle',
					radius: ropeRadius
				}]
			}));
			r.addToWorld();
			world.process();
			var b = r.p2Component.body;
			var s = b.shapes[0];
			s.collisionGroup = Config.collisionGroup.bullet;
			s.collisionMask = Config.collisionGroup.ground;

			if (lastBody) {
				var c = new p2.DistanceConstraint(b, lastBody);
				c.lowerLimit = 0;
				c.lowerLimitEnabled = true;
				c.upperLimit = 4.0 * ropeRadius;
				c.upperLimitEnabled = true;
				b.world.addConstraint(c);
			}
			
			lastBody = b;
			this.ropeEntities.push(r);
		}

		this.ropeConstraint = null;
		this.playerConstraint = null;

		this.setRopeConstraint(this.player.rigidBody, this.player.rigidBody.position);

		world.process();

		// Set up the hook physics to init state, add handlers

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
	};

	GrappleHook.prototype.setRopeConstraint = function(body, position) {

		this.removeRopeConstraint();

		var ropeBody = this.ropeEntities[0].p2Component.body;

		// Set the position of the rope
		ropeBody.position = position;

		var c = new p2.RevoluteConstraint(
			ropeBody,
			body,
			{
				worldPivot: position
			}
		);

		ropeBody.world.addConstraint(c);
		this.ropeConstraint = c;
	};

	GrappleHook.prototype.removeRopeConstraint = function() {
		if (this.ropeConstraint !== null) {
			var world = this.ropeConstraint.bodyA.world;
			world.removeConstraint(this.ropeConstraint);
			this.ropeConstraint = null;
		}
	};

	var pivotPos = [0, 0];
	GrappleHook.prototype.setPlayerConstraint = function() {

		this.removePlayerConstraint();

		// Grab the last for now..
		var ropeBody = this.ropeEntities[this.ropeCount - 1].p2Component.body;
		var playerBody = this.player.rigidBody;
		pivotPos = playerBody.position;
		pivotPos[1] += this.player.height * 0.5;

		var c = new p2.RevoluteConstraint(
			ropeBody,
			playerBody,
			{
				worldPivot: pivotPos
			}
		);

		playerBody.world.addConstraint(c);

		this.playerConstraint = c;
	};

	GrappleHook.prototype.removePlayerConstraint = function() {

		if (this.playerConstraint !== null) {
			var world = this.playerConstraint.bodyA.world;
			world.removeConstraint(this.playerConstraint);
			this.playerConstraint = null;
		}
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

	var anchorPos = [0,0];
	GrappleHook.prototype.createRope = function(contactEvent, hookIsBodyA) {

		var equation = contactEvent.contactEquation;

		// Using the only the first contact equation for the anchor pos.
		var targetBody, contactPoint, hookBody;
		if (hookIsBodyA) {
			targetBody = contactEvent.bodyB;
			hookBody = contactEvent.bodyA;
			contactPoint = equation.contactPointB;
		} else {
			targetBody = contactEvent.bodyA;
			hookBody = contactEvent.bodyB;
			contactPoint = equation.contactPointA;
		}

		p2.vec2.add(anchorPos, targetBody.position, contactPoint)

		// Only to get correct debug visuals
		hookBody.position = anchorPos;

		this.setRopeConstraint(targetBody, anchorPos);

		console.debug('Anchored ', anchorPos);
		
		//this.setPlayerConstraint();

		this.disableHook();
	};

	GrappleHook.prototype.fire = function(direction) {
		
		this.removePlayerConstraint();

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

		this.setRopeConstraint(hookBody, hookBody.position);
	};

	return GrappleHook;
});