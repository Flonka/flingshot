define([
	'goo/shapes/Cylinder',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component',
	'goo/entities/components/ScriptComponent',
	'goo/math/Ray',
	'goo/math/Vector3',
	'goo/math/Plane',

	'weapons/GrappleHook',
	'player/FollowCamera',
	'Config'
], function (
	Cylinder,
	Material,
	ShaderLib,
	P2Component,
	ScriptComponent,
	Ray,
	Vector3,
	Plane,

	GrappleHook,
	FollowCamera,
	Config
	) {

	'use strict';

	function Player(world) {

		this.mass = 66.6;

		this.material = new Material(ShaderLib.uber);

		this.material.uniforms.materialDiffuse = [1.0, 0, 0.5, 1.0];

		this.width = 1.0;
		this.height = 1.8;

		this.jumpForce = 20000;
		this.onJumpCooldown = false;

		this.moveForce = 5000;
		this.capXvelocity = 15;

		this.controls = {
			moveMult: 0,
			left: false,
			right: false,
			shoot: false,
			jump: false,
		};

		this.entity = world.createEntity(
			new Cylinder(8, this.width, this.width, this.height),
			this.material,
			[0, 5, 0]
		);

		this.entity.set(new P2Component({
			mass: this.mass,
			shapes: [{
				type: 'box',
				width: this.width * 1.8,
				height: this.height
			}],
			offsetAngleX: Math.PI/2.0,
			fixedRotation: Config.player.fixedRotation
		}));



		this.addScriptComponent();

		this.entity.addToWorld();

		// Process to make p2system initialize the p2component.
		world.process();
		this.entity.p2Component.body.allowSleep = false;
		// Convenience
		this.rigidBody = this.entity.p2Component.body;

		for (var i = 0; i < this.rigidBody.shapes.length; i++) {
			var shape = this.rigidBody.shapes[i];
			shape.collisionGroup = Config.collisionGroup.player;
			shape.collisionMask = Config.collisionGroup.ground;
		}

		this.hook = new GrappleHook(world, this);



		this.addKeyBoardListeners();

		this.followCamera = new FollowCamera(this);

	};


	Player.prototype.addScriptComponent = function() {
		var sc = new ScriptComponent();
		var moveScript = {
			run: function(entity, tps, context, params) {

				var applyMove = this.controls.moveMult !== 0;
				var inContact = false;
				if (applyMove === true || this.controls.jump === true) {
					inContact = this.checkIfInContact();
				}

				if (applyMove) {
					this.move(inContact);
				}

				if (this.controls.jump && inContact === true) {
					this.jump();
				}
			}.bind(this)
		};
		sc.scripts.push(moveScript);
		this.entity.set(sc);
	};

	var yAxis = [0,1];
	Player.prototype.checkIfInContact = function() {
		var playerRb = this.rigidBody;
		var contactEquations = playerRb.world.narrowphase.contactEquations;
		var l = contactEquations.length;
		for (var i = 0; i < l; i++) {
			var c = contactEquations[i];
			if (c.bodyA === playerRb || c.bodyB === playerRb) {
				var d = p2.vec2.dot(c.normalA, yAxis); // Normal dot Y-axis
				if (c.bodyA === playerRb) {
					d *= -1;
				}
				if (d > 0.5) {
					console.debug('Touching ground');
					return true;
				} 
			}
		}
		return false;
	};

	Player.prototype.move = function(onGround) {
		
		var applyMove = Math.abs(this.rigidBody.velocity[0]) < this.capXvelocity;
		if (!applyMove) {
			return;
		}

		var force = this.moveForce;
		if (!onGround) {
			force *= Config.player.airMoveMult;
		}
		this.rigidBody.force[0] += this.controls.moveMult * force;
	};

	Player.prototype.jump = function() {

		if (this.onJumpCooldown) {
			console.log('Jump on CD!');
			return;
		}

		this.onJumpCooldown = true;
		this.rigidBody.force[1] += this.jumpForce;
		this.rigidBody.position[1] += 0.07;
		console.log('Jumped!');

		setTimeout(function() {
			this.onJumpCooldown = false;
		}.bind(this),
		Config.player.jumpCooldown
		);
	};


	Player.prototype.addKeyBoardListeners = function() {

		window.onkeydown = function(event) {

			switch (event.keyCode) {
				// Left
				case 65:
				case 37:
					this.controls.left = true;
					this.controls.moveMult = -1;
					break;
				// Right
				case 68:
				case 39:
					this.controls.right = true;
					this.controls.moveMult = 1;
					break;
				// Up
				case 87:
				case 38:
					this.controls.jump = true;
					break;
				// Down
				case 83:
				case 40:
					this.hook.disable();
					console.log('Pos: ', this.entity.getTranslation().data);
					break;
				default:
					console.log('unbound : ', event.keyCode);
			};
			
		}.bind(this);

		window.onkeyup = function(event) {
			switch (event.keyCode) {
				// Left
				case 65:
				case 37:
					this.controls.left = false;
					this.controls.moveMult = 0;
					break;
				// Right
				case 68:
				case 39:
					this.controls.right = false;
					this.controls.moveMult = 0;
					break;
				// Up
				case 87:
				case 38:
					this.controls.jump = false;
				
					break;
				// Down
				case 83:
				case 40:
					break;
				default:
					console.log('unbound : ', event.keyCode);
			};

		}.bind(this);

		var workingTarget = [0, 1];
		var pickRay = new Ray();
		var pickVec = new Vector3();
		var pickPlane = new Plane(new Vector3(0,0,1), 0);
		document.onmousedown = function(event) {

			if (this.hook.onCooldown == true) {
				console.log('Hook on CD');
				return;
			}

			var canvas = this.entity._world.gooRunner.renderer.domElement;
			this.followCamera.camera.getPickRay(event.x, event.y, canvas.width, canvas.height, pickRay);
			pickRay.intersectsPlane(pickPlane, pickVec);
			workingTarget[0] = pickVec.x;
			workingTarget[1] = pickVec.y;
			p2.vec2.subtract(workingTarget, workingTarget, this.rigidBody.position);
			p2.vec2.normalize(workingTarget, workingTarget);

			this.hook.fire(workingTarget);

		}.bind(this);

		document.onmouseup = function(event) {
			
		}.bind(this);
	};

	return Player;
});