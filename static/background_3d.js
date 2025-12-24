// 3D Particle Network Background
document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('canvas-container');

	// Scene Setup
	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 50; // Increased Z for better field of view

	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	container.appendChild(renderer.domElement);

	// Particles
	const particlesGeometry = new THREE.BufferGeometry();
	const particleCount = 700;

	const posArray = new Float32Array(particleCount * 3);

	for (let i = 0; i < particleCount * 3; i++) {
		// Spread particles across a wide area centered at 0
		posArray[i] = (Math.random() - 0.5) * 120;
	}

	particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

	// Material: Glowing dots
	const material = new THREE.PointsMaterial({
		size: 0.3,
		color: 0x2dd4bf, // Teal/Cyan accent
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending
	});

	const particlesMesh = new THREE.Points(particlesGeometry, material);
	scene.add(particlesMesh);

	// Connecting Lines (Optional - might be heavy, let's keep it simple particles for now with dynamic movement)
	// To make it "Real World" app feeling, let's add a slowly rotating geometric shape or wireframe grid

	// Wireframe Globe/Network
	const geoGeometry = new THREE.IcosahedronGeometry(20, 2);
	const geoMaterial = new THREE.MeshBasicMaterial({
		color: 0x8b5cf6, // Violet
		wireframe: true,
		transparent: true,
		opacity: 0.05
	});
	const globe = new THREE.Mesh(geoGeometry, geoMaterial);
	scene.add(globe);

	// Mouse Interaction
	let mouseX = 0;
	let mouseY = 0;

	document.addEventListener('mousemove', (event) => {
		mouseX = event.clientX / window.innerWidth - 0.5;
		mouseY = event.clientY / window.innerHeight - 0.5;
	});

	// Animation Loop
	const clock = new THREE.Clock();

	function animate() {
		requestAnimationFrame(animate);
		const elapsedTime = clock.getElapsedTime();

		// Rotate globe
		globe.rotation.y += 0.002;
		globe.rotation.x += 0.001;

		// Animate particles (wave effect)
		particlesMesh.rotation.y = -mouseX * 0.1;
		particlesMesh.rotation.x = -mouseY * 0.1;

		// Gentle wave motion for particles
		// Access positions if needed, but simple rotation is often enough for "depth"

		renderer.render(scene, camera);
	}

	animate();

	// Resize Handler
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});
});
