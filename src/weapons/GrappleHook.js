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

		this.mass = 2.5;

		this.hookRadius = 0.3;

		this.hookFireVelocity = 80;

		this.recoilAmount = 0.1;

		this.onCooldown = false;

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
		this.ropeCount = 30;

		var ropeRadius = this.hookRadius * 0.45;
		var ropeDistance = 2.5 * ropeRadius;
		var lastBody = null;

		for (var i=0; i < this.ropeCount; i++) {
			var r = world.createEntity(
				new Sphere(8, 8, ropeRadius),
				ropeMaterial
			);
			r.set(new P2Component({
				mass: this.mass * 0.5,
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
				var c = new p2.DistanceConstraint(
					b, 
					lastBody,
					{
						distance: ropeDistance
					}
				);
				c.lowerLimit = 0;
				c.lowerLimitEnabled = true;
				c.upperLimit = ropeDistance;
				c.upperLimitEnabled = true;
				b.world.addConstraint(c);
			}
			
			lastBody = b;
			this.ropeEntities.push(r);
		}

		this.ropeAttachment = null;
		this.playerConstraint = null;

		world.process();

		// Set up the hook physics to init state, add handlers
		var hookBody = this.hook.p2Component.body;
		var hookShape = hookBody.shapes[0];

		hookShape.collisionGroup = Config.collisionGroup.bullet;
		hookShape.collisionMask = Config.collisionGroup.ground;

		hookBody.world.on('impact', function (event) {

			var hookBody = this.hook.p2Component.body;

			if (event.bodyA === hookBody) {
				this.anchorRope(event, true);
			} else if (event.bodyB === hookBody) {
				this.anchorRope(event, false);
			}

		}.bind(this));

		this.disableHook();
	};

	GrappleHook.prototype.attachRope = function(body, position) {

		this.detachRope();

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

		console.debug('Constraint count : ', ropeBody.world.constraints.length);

		this.ropeAttachment = c;
	};

	GrappleHook.prototype.detachRope = function() {
		if (this.ropeAttachment !== null) {
			console.debug('Detached rope!');
			var world = this.player.rigidBody.world;
			world.removeConstraint(this.ropeAttachment);
			this.ropeAttachment = null;
		}
	};

	GrappleHook.prototype.setPlayerConstraint = function() {

		this.removePlayerConstraint();

		// Grab the last for now..
		var ropeBody = this.ropeEntities[this.ropeCount - 1].p2Component.body;
		var playerBody = this.player.rigidBody;

		var c = new p2.DistanceConstraint(
			ropeBody,
			playerBody
		);

		c.lowerLimit = 0;
		c.lowerLimitEnabled = true;
		c.upperLimit = 1.0;
		c.upperLimitEnabled = true;

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
		if (hookBody.world) {
			hookBody.world.removeBody(hookBody);	
		}

		this.material.uniforms.color = [0, 0.5, 0.2];
	};

	GrappleHook.prototype.enableHook = function() {
		var hookBody = this.hook.p2Component.body;
		if (!hookBody.world) {
			var world = this.player.rigidBody.world;
			world.addBody(hookBody);
			var hookShape = hookBody.shapes[0];
			hookShape.collisionMask = Config.collisionGroup.ground;
			this.material.uniforms.color = [0.89, 0, 0];
		}
	};

	var anchorPos = [0,0];
	GrappleHook.prototype.anchorRope = function(contactEvent, hookIsBodyA) {

		var equation = contactEvent.contactEquation;

		console.debug('Anchor rope!');

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

		this.attachRope(targetBody, anchorPos);

		// WHY do i need this now? Seems as the old constraint is still acting or something.
		this.disableHook();

	};

	GrappleHook.prototype.disable = function() {
		this.detachRope();
		this.disableHook();
		this.removePlayerConstraint();
	};

	GrappleHook.prototype.fire = function(direction) {

		var hookBody = this.hook.p2Component.body;

		this.enableHook();

		this.onCooldown = true;

		var playerBody = this.player.rigidBody;

		var playerPos = playerBody.position;

		var vx = this.hookFireVelocity * direction[0];
		var vy = this.hookFireVelocity * direction[1];
		
		hookBody.wakeUp();
		hookBody.setZeroForce();
		hookBody.position[0] = playerPos[0];
		hookBody.position[1] = playerPos[1];
		hookBody.velocity[0] = vx;
		hookBody.velocity[1] = vy;

		// Recoil
		playerBody.velocity[0] += this.recoilAmount * -vx;
		playerBody.velocity[1] += this.recoilAmount * -vy;

		for (var i=0; i < this.ropeCount; i++) {
			var b = this.ropeEntities[i].p2Component.body;
			b.setZeroForce();
			b.position[0] = playerPos[0];
			b.position[1] = playerPos[1];
			b.velocity[0] = vx;
			b.velocity[1] = vy;
			vx -= 0.2 * vx;
			vy -= 0.2 * vy;
		}

		this.attachRope(hookBody, hookBody.position);
		this.setPlayerConstraint();

		setTimeout(function() {
			this.onCooldown = false;
		}.bind(this),
		Config.weapon.grappleHook.cooldown
		);

	};

	return GrappleHook;
});