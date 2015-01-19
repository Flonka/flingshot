define([
	'goo/entities/GooRunner'
], function (
	GooRunner
	) {

	'use strict';

	function SceneInitializer() {

	};

	
	SceneInitializer.initGoo = function () {
		
		var options = {
			logo: {
				position: 'bottomright',
				color: '#FFF'
			},
			manuallyStartGameLoop: true,
			showStats: true
		};
		
		var goo = new GooRunner(options);
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		return goo;
	};

	return SceneInitializer;

});