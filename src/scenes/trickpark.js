require([
	'src/scenes/SceneInitializer'
	], 

	function (SceneInitializer) {

	'use strict';

	var gooRunner = SceneInitializer.initGoo();

	gooRunner.startGameLoop();

});