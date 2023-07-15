

import * as THREE from '/build/three.module.js';


import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';

import { Octree } from '/jsm/math/Octree.js';
import { Capsule } from '/jsm/math/Capsule.js';

var raycaster,arrow;

//Clock. Object for keeping track of time. This uses performance.now if it is available,
const clock = new THREE.Clock();

//The import.meta meta-property exposes context-specific metadata to a JavaScript module.
const juice_obj = new URL('../models/gltf/drinks/Coke/juice.glb', import.meta.url);
const Url4 = new URL('../models/gltf/mymall1.glb', import.meta.url);
const ban = new URL('../models/gltf/ban.glb', import.meta.url);
const fence = new URL('../models/gltf/fence.glb', import.meta.url);
const back = new URL('../models/gltf/back.glb', import.meta.url);
const peak = new URL('../models/gltf/peakfreans.glb', import.meta.url);
const chocolate = new URL('../models/gltf/choco.glb', import.meta.url);
const knorr = new URL('../models/gltf/knorr.glb', import.meta.url);
const kolsnack = new URL('../models/gltf/kolsonchips.glb', import.meta.url);
const shan = new URL('../models/gltf/shaan.glb', import.meta.url);
const snack = new URL('../models/gltf/snacks.glb', import.meta.url);
const banner = new URL('../models/gltf/banners.glb', import.meta.url);

const nestle = new URL('../models/gltf/hello/nestle.glb', import.meta.url);
const pasta = new URL('../models/gltf/hello/pasta.glb', import.meta.url);
const rafan = new URL('../models/gltf/hello/rafan.glb', import.meta.url);
const sunridge = new URL('../models/gltf/hello/sunridge.glb', import.meta.url);
const surf = new URL('../models/gltf/hello/surf.glb', import.meta.url);


//LoadingManager. Handles and keeps track of loaded and pending data.
const LoadingManager = new THREE.LoadingManager();

var enableClick = false;




LoadingManager.onProgress = function(){
	
	console.log("Onprogress Loading");
	$(".onload").show();
	$("#info").hide();
	$("#navbar").hide();
	$("#target_point").hide();
	document.body.style.pointerEvents = "none";
	
	
}

LoadingManager.onLoad = function(){
	
	console.log("onLoad Loading");
	$(".onload").hide();

	document.body.style.pointerEvents = "auto";
	enableClick = true;
}

const loader = new GLTFLoader(LoadingManager);




const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccee);


var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
light.position.set(0, 100, 0.4);
scene.add(light);

var dirLight = new THREE.SpotLight(0xffffff, 0.5, 0.0, 180.0);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(0, 300, 100);
dirLight.castShadow = true;
dirLight.lookAt(new THREE.Vector3());
scene.add(dirLight);



const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';


//Camera Location
camera.position.set(-60, 2.5, -50.5); // Set position like this

var vc = new THREE.Vector3(30, 0, 10);
camera.lookAt(vc);


////////////////////////////////////
raycaster = new THREE.Raycaster(
	camera.getWorldPosition(new THREE.Vector3()),
	camera.getWorldDirection(new THREE.Vector3())
  );



  arrow = new THREE.ArrowHelper(
	camera.getWorldDirection(new THREE.Vector3()),
	camera.getWorldPosition(new THREE.Vector3()),
	3,
	0x000000
  );
////////////////////////////////////

const fillLight1 = new THREE.HemisphereLight(0x4488bb, 0x002244, 0.5);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(- 5, 25, - 1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add(directionalLight);


// market
const container = document.getElementById('container1');

//WebGl
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);


const GRAVITY = 30;


const STEPS_PER_FRAME = 5;


const spheres = [];


const worldOctree = new Octree();

//Position Change from by change x parameters of vectors
const playerCollider = new Capsule(new THREE.Vector3(10, 0.35, 0), new THREE.Vector3(10, 1, 0), 0.35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;


const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();



document.addEventListener('keydown', (event) => {

	keyStates[event.code] = true;

});



document.addEventListener('keyup', (event) => {

	keyStates[event.code] = false;

});

//container.addEventListener('mousedown', () => {

	//document.body.requestPointerLock();
	//mouseTime = performance.now();
	

//});



document.getElementById("shan_category").addEventListener("click",function(){
	playerCollider.start.x = 13;
    playerCollider.end.x = 13;
	playerCollider.start.z = -3;
	playerCollider.end.z = -3;
	camera.rotation.y = 0.1;

});

document.getElementById("peek_freans_category").addEventListener("click",function(){
	playerCollider.start.x = 9;
    playerCollider.end.x = 9;
	playerCollider.start.z = -3;
	playerCollider.end.z = -3;
	camera.rotation.y = 0.1;

});

document.getElementById("chocolate_category").addEventListener("click",function(){
	playerCollider.start.x = 5;
    playerCollider.end.x = 5;
	playerCollider.start.z = -3;
	playerCollider.end.z = -3;
	camera.rotation.y = 0.1;

});


document.getElementById("rafhan_category").addEventListener("click",function(){
	playerCollider.start.x = 13;
    playerCollider.end.x = 13;
	playerCollider.start.z = 6.5;
	playerCollider.end.z = 6.5;
	camera.rotation.y = 3;

});

document.getElementById("knor_category").addEventListener("click",function(){
	playerCollider.start.x = 9;
    playerCollider.end.x = 9;
	playerCollider.start.z = 6.;
	playerCollider.end.z = 6.5;
	camera.rotation.y= 3;

});

document.getElementById("lays_category").addEventListener("click",function(){
	playerCollider.start.x = 5;
    playerCollider.end.x = 5;
	playerCollider.start.z = 6.5;
	playerCollider.end.z = 6.5;
	camera.rotation.y = 3;

});


document.getElementById("drinks_category").addEventListener("click",function(){
	playerCollider.start.y = 6;
	playerCollider.end.y = 6.5;
	
	playerCollider.start.x = -8;
    playerCollider.end.x = -8;
	
	playerCollider.start.z = 2;
	playerCollider.end.z = 2;
	camera.rotation.y = 1.5;

	

});







document.getElementById("container1").addEventListener("click",function(){
	document.body.requestPointerLock();
	$("#mycartinfo").show();
	$("#target_point").show();
	
	$("#navbar").hide();
	$("#product_detail_view").hide();
	

});

document.getElementById("exit_btn").addEventListener("click",function(){

	document.exitPointerLock();
	$("#info").show();
	$("#mycartinfo").hide();
	$('#target_point').hide();
});




//document.addEventListener('mouseup', () => {

	
//	if (document.pointerLockElement === null) $("#info").show();$("#mycartinfo").hide();
	
//});

$(document).keyup(function(e) {
	if (e.key === "x") { // escape key maps to keycode `27`
		document.exitPointerLock();
		$("#info").show();
		$("#mycartinfo").hide();
		$('#target_point').hide();
		
   }
});



document.body.addEventListener('mousemove', (event) => {

	
	if (document.pointerLockElement === document.body) {
		
		
		
		$("#navbar").hide();
			
		if($('#product_detail_view').is(':visible'))
		{
			
			document.exitPointerLock();
			
		}

		$("#info").hide();
		
		$("#target_point").show();
		

		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;

		

		

	}
	else {
				
		$('#target_point').hide();
		
		if($('.onload').is(':visible'))
		{
			$("#navbar").hide();
		}
		else{
			$("#navbar").show();
		}

	}


});


window.addEventListener('resize', onWindowResize);


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;

	// 'ProjectionMatrix' Camera that uses perspective projection. This projection mode is designed to mimic the way the human eye sees. 
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function playerCollisions() {

	const result = worldOctree.capsuleIntersect(playerCollider);

	playerOnFloor = false;

	if (result) {

		playerOnFloor = result.normal.y > 0;

		if (!playerOnFloor) {

			playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));

		}

		playerCollider.translate(result.normal.multiplyScalar(result.depth));

	}

}

function updatePlayer(deltaTime) {

	
	let damping = Math.exp(- 4 * deltaTime) - 1;

	if (!playerOnFloor) {

		playerVelocity.y -= GRAVITY * deltaTime;

		// small air resistance
		damping *= 0.1;

	}

	playerVelocity.addScaledVector(playerVelocity, damping);

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);
	
	playerCollisions();
	
	camera.position.copy(playerCollider.end);
	
}

function playerSphereCollision(sphere) {

	const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

	const sphere_center = sphere.collider.center;

	const r = playerCollider.radius + sphere.collider.radius;
	const r2 = r * r;

	// approximation: player = 3 spheres

	for (const point of [playerCollider.start, playerCollider.end, center]) {

		const d2 = point.distanceToSquared(sphere_center);

		if (d2 < r2) {

			const normal = vector1.subVectors(point, sphere_center).normalize();
			const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
			const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

			playerVelocity.add(v2).sub(v1);
			sphere.velocity.add(v1).sub(v2);

			const d = (r - Math.sqrt(d2)) / 2;
			sphere_center.addScaledVector(normal, - d);

		}

	}

}

function spheresCollisions() {

	for (let i = 0, length = spheres.length; i < length; i++) {

		const s1 = spheres[i];

		for (let j = i + 1; j < length; j++) {

			const s2 = spheres[j];

			const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if (d2 < r2) {

				const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
				const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
				const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);

				const d = (r - Math.sqrt(d2)) / 2;

				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, - d);

			}

		}

	}

}

function updateSpheres(deltaTime) {

	

	spheres.forEach(sphere => {

		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

		const result = worldOctree.sphereIntersect(sphere.collider);

		if (result) {

			sphere.velocity.addScaledVector(result.normal, - result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));

		} else {

			sphere.velocity.y -= GRAVITY * deltaTime;

		}

		const damping = Math.exp(- 1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);

		playerSphereCollision(sphere);

	});

	spheresCollisions();

	for (const sphere of spheres) {

		sphere.mesh.position.copy(sphere.collider.center);

	}

}

function getForwardVector() {

	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;

}

function getSideVector() {

	
	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(camera.up);

	return playerDirection;

}

function controls(deltaTime) {

	

	// gives a bit of air control
	const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);
	

	if (keyStates['KeyW']) {

		playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));

	}

	if (keyStates['KeyS']) {

		playerVelocity.add(getForwardVector().multiplyScalar(- speedDelta));

	}

	if (keyStates['KeyA']) {

		playerVelocity.add(getSideVector().multiplyScalar(- speedDelta));

	}

	if (keyStates['KeyD']) {

		playerVelocity.add(getSideVector().multiplyScalar(speedDelta));

	}


	if (playerOnFloor) {

		if (keyStates['Space']) {

		//	playerVelocity.y = 15;

		}

	}

}


loader.load(Url4.href, (gltf) => {

	scene.add(gltf.scene);

	worldOctree.fromGraphNode(gltf.scene);

	gltf.scene.traverse(child => {

		if (child.isMesh) {

			child.castShadow = true;
			child.receiveShadow = true;
			child.castShadow = true;
			child.receiveShadow = true;
			child.material.toneMapped = false;
			child.material.metalness = 0.1;
			child.material.roughness = 1;
			child.material.clearcoat = 0.9;
			child.material.clearcoatRoughness = 0.1;

			if (child.material.map) {

				child.material.map.anisotropy = 4;

			}

		}

	});

	animate();

}, undefined, function ( error ) {

	alert( error );

}
);


loader.load(chocolate.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="chocolate";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });

  loader.load(back.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="back";
	
	worldOctree.fromGraphNode(gltf.scene);
	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  }); 


  loader.load(ban.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="ban";
	
	worldOctree.fromGraphNode(gltf.scene);
	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  }); 


  loader.load(fence.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="fence";
	
	worldOctree.fromGraphNode(gltf.scene);
	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  }); 

  loader.load(snack.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="snack";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });
  loader.load(shan.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="shan";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });



    loader.load(peak.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="peak";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });


  loader.load(knorr.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="knorr";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });


  loader.load(kolsnack.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="kolsnack";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });



  loader.load(banner.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="banner";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });

  loader.load(surf.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="surf";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });

  loader.load(rafan.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="rafan";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });


  loader.load(sunridge.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="sunridge";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });

  loader.load(nestle.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="nestle";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });

  loader.load(pasta.href, function(gltf) {
	const model = gltf.scene;
	model.castShadow = true;

	// x  -> left  z -> up/down   
	model.position.set(0,0,0);
	model.name="pasta";

	scene.add(model);
	//gltf.scene.scale.set(4,4,4);
	
  }, undefined, function(error) {
	console.error(error);
  });




// custom global variables
var video, videoImage, videoImageContext, videoTexture;

  	// create the video element
	  video = document.getElementById( 'myVideo' );
	
	videoImage = document.createElement( 'canvas' );
	videoImage.width = 280;
	videoImage.height = 204;

	videoImageContext = videoImage.getContext( '2d' );
	// background color if no video present
	videoImageContext.fillStyle = '#000000';
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

	videoTexture = new THREE.Texture( videoImage );
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;
	
	var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );
	// the geometry on which the movie will be displayed;
	// 		movie image will be scaled to fit these dimensions.
	
	var movieGeometry1 = new THREE.PlaneGeometry( 7, 3, 3, 3 );
	var movieScreen = new THREE.Mesh( movieGeometry1, movieMaterial );
	movieScreen.position.set(18.5,2.8,1.15);
	movieScreen.rotateY(300);
	scene.add(movieScreen);

	

	var movieGeometry = new THREE.PlaneGeometry( 2, 1, 3, 3 );
	var movieScreen3 = new THREE.Mesh( movieGeometry, movieMaterial );
	movieScreen3.position.set(-8.5,4.3,18.6);
	scene.add(movieScreen3);

	
	var movieScreen4 = new THREE.Mesh( movieGeometry, movieMaterial );
	movieScreen4.position.set(-7.4,4.3,-12.4);
	scene.add(movieScreen4);
	

	video.play();
	video.loop = true;
	


function teleportPlayerIfOob() {

	

	if (camera.position.y <= - 25) {

		
		playerCollider.start.set(0, 0.35, 0);
		playerCollider.end.set(0, 1, 0);
		playerCollider.radius = 0.35;
		camera.position.copy(playerCollider.end);
		camera.rotation.set(0, 0, 0);

	}
	
	


}

console.log(scene.children);



	addEventListener('dblclick', (event) => {

		
	if (enableClick === true) {


		const intersects = raycaster.intersectObject( scene.children[8],true);	
		if ( 0< intersects.length ) {


		$("#mycartinfo").hide();
		$("#target_point").hide();
		
		$('#product_detail_view').show();

		const cake_img = new URL('../product_image/cupcake.jpg', import.meta.url);
		document.getElementById("product_detail_card_img1").srcset = cake_img;
		document.getElementById("product_detail_card_img2").srcset = cake_img;
		document.getElementById("product_detail_card_img3").src = cake_img;
			
		}
		const intersects1 = raycaster.intersectObject( scene.children[9],true);	
		if ( 0< intersects1.length ) {

		$("#mycartinfo").hide();
		$("#target_point").hide();
		
		$('#product_detail_view').show();
			
		}
		const intersects2 = raycaster.intersectObject( scene.children[10],true);	
		if ( 0< intersects2.length ) {

		$("#mycartinfo").hide();
		$("#target_point").hide();
		$('#product_detail_view').show();
			
		}
		const intersects3 = raycaster.intersectObject( scene.children[11],true);	
		if ( 0< intersects3.length ) {


			

	
		$("#mycartinfo").hide();
		$("#target_point").hide();

		$('#product_detail_view').show();
		const shan_img = new URL('../product_image/shan.jpg', import.meta.url);
		document.getElementById("product_detail_card_img1").srcset = shan_img;
		document.getElementById("product_detail_card_img2").srcset = shan_img;
		document.getElementById("product_detail_card_img3").src = shan_img;
		
			
		}
		const intersects4 = raycaster.intersectObject( scene.children[12],true);	
		if ( 0< intersects4.length ) {

		$("#mycartinfo").hide();
		$("#target_point").hide();
		$('#product_detail_view').show();
			
		}
		

		const intersects6 = raycaster.intersectObject( scene.children[14],true);	
		if ( 0< intersects6.length ) {
		
		$("#mycartinfo").hide();
		$("#target_point").hide();
		$('#product_detail_view').show();

		if($('#product_detail_view').is(':visible'))
			{
				$('#navbar').show();
				
				
			}
		


		}
		const intersects7 = raycaster.intersectObject( scene.children[15],true);	
		if ( 0< intersects7.length ) {

		$("#mycartinfo").hide();
		$("#target_point").hide();
		$('#product_detail_view').show();
			
		}
		
		
	}


	});

	



/*

	  // target point

	  const targetPoint = new THREE.Points(
		new THREE.BufferGeometry().setFromPoints( [
		  new THREE.Vector3()
	  ] ),
	  new THREE.PointsMaterial( {
		  size: 1, transparent: true,
		  map: new THREE.TextureLoader().load(
			'https://i.imgur.com/HRLtxSe.png'
		)
	  } )
	);
	camera.target.position.copy( targetPoint );
*/



function animate() {

	const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

	// we look for collisions in substeps to mitigate the risk of
	// an object traversing another too quickly for detection.
	raycaster.set(
		camera.getWorldPosition(new THREE.Vector3()),
		camera.getWorldDirection(new THREE.Vector3())
	  );
	  scene.remove(arrow);
	
	  
	/*
	arrow = new THREE.ArrowHelper(
		raycaster.ray.direction,
		raycaster.ray.origin,
		0.5,
		0x000000
	  );
	  scene.add(arrow);
		*/

	for (let i = 0; i < STEPS_PER_FRAME; i++) {
		
		controls(deltaTime);
		updatePlayer(deltaTime);
		updateSpheres(deltaTime);
		teleportPlayerIfOob();		
	}


	if( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageContext.drawImage( video, 0, 0 );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}
	
	
	

	renderer.render(scene, camera);

	

	requestAnimationFrame(animate);

}




