define([
	'goo/shapes/Cylinder',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/addons/p2pack/P2Component',
	'goo/entities/components/ScriptComponent',

	'weapons/GrappleHook',
	'player/FollowCamera'
], function (
	Cylinder,
	Material,
	ShaderLib,
	P2Component,
	ScriptComponent,

	GrappleHook,
	FollowCamera
	) {

	'use strict';

	function Player(world) {

		this.material = new Material(ShaderLib.simpleColored);

		this.material.uniforms.color = [1.0, 0, 0.5];

		this.width = 1.0;
		this.height = 1.8;

		this.entity = world.createEntity(
			new Cylinder(8, this.width, this.width, this.height),
			this.material,
			[0, 5, 0]
		);

		this.entity.set(new P2Component({
			mass: 66.6,
			shapes: [{
				type: 'box',
				width: this.width * 1.8,
				height: this.height
			}],
			offsetAngleX: Math.PI/2.0
		}));

		this.entity.addToWorld();

		// Process to make p2system initialize the p2component.
		world.process();
		this.entity.p2Component.body.allowSleep = false;
		// Convenience
		this.rigidBody = this.entity.p2Component.body;

		this.hook = new GrappleHook(world, this);

		this.controls = {
			left: false,
			right: false,
			shoot: false,
			jump: false,
		};

		this.addKeyBoardListeners();

		this.camera = new FollowCamera(this);

	};

	Player.prototype.addKeyBoardListeners = function() {

		window.onkeydown = function(event) {

			switch (event.keyCode) {
				// Left
				case 65:
				case 37:
					this.controls.left = true;
					this.rigidBody.velocity[0] = -10;
					break;
				// Right
				case 68:
				case 39:
					this.controls.right = true;
					this.rigidBody.velocity[0] = 10;
					break;
				// Up
				case 87:
				case 38:
					this.controls.jump = true;
					this.hook.fire();
					break;
				// Down
				case 83:
				case 40:
					this.hook.releaseRope();
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
					break;
				// Right
				case 68:
				case 39:
					this.controls.right = false;
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

	};

	return Player;
});