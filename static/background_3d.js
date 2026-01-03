// 3D Digital Globe Network
document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('canvas-container');

	// Scene Setup
	const scene = new THREE.Scene();
	// No fog for deep space contrast, or very subtle
	scene.fog = new THREE.FogExp2(0x000000, 0.002);

	const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 80;

	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	container.appendChild(renderer.domElement);

	// --- GLOBE PARTICLES ---
	const particlesGeometry = new THREE.BufferGeometry();
	const particleCount = 1200;

	const posArray = new Float32Array(particleCount * 3);

	// Create particles on a sphere surface
	for (let i = 0; i < particleCount; i++) {
		// Random point on sphere
		const phi = Math.acos(-1 + (2 * i) / particleCount);
		const theta = Math.sqrt(particleCount * Math.PI) * phi;

		const r = 35; // Radius

		const x = r * Math.cos(theta) * Math.sin(phi);
		const y = r * Math.sin(theta) * Math.sin(phi);
		const z = r * Math.cos(phi);

		posArray[i * 3] = x;
		posArray[i * 3 + 1] = y;
		posArray[i * 3 + 2] = z;
	}

	particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

	// Material: Glowing dots
	const material = new THREE.PointsMaterial({
		size: 0.4,
		color: 0x6366f1, // Indigo
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending
	});

	const globePoints = new THREE.Points(particlesGeometry, material);
	scene.add(globePoints);

	// --- ATMOSPHERE GLOW (Simple Sprite) ---
	// Optional: Add a faint glowing shere inside if needed, but clean dots are better for "Data" look

	// --- ANIMATION VARIABLES ---
	let mouseX = 0;
	let mouseY = 0;
	let targetRotationX = 0;
	let targetRotationY = 0;

	// Window Events
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	document.addEventListener('mousemove', (event) => {
		mouseX = (event.clientX / window.innerWidth) * 2 - 1;
		mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
	});

	// Boot Up Animation (Scale Up)
	globePoints.scale.set(0, 0, 0);
	let scale = 0;

	// Animation Loop
	function animate() {
		requestAnimationFrame(animate);

		// Entrance Expansion
		if (scale < 1) {
			scale += (1 - scale) * 0.02; // Ease out
			globePoints.scale.set(scale, scale, scale);
		}

		// Smooth Rotation Control
		targetRotationY += 0.002; // Auto spin

		// Mouse influence
		const rotationX = mouseY * 0.1;
		const rotationY = mouseX * 0.1;

		globePoints.rotation.y += 0.002;
		globePoints.rotation.x += (rotationX - globePoints.rotation.x) * 0.05;
		globePoints.rotation.y += (rotationY - (globePoints.rotation.y - globePoints.rotation.y)) * 0.05; // Relative nudge

		renderer.render(scene, camera);
	}

	animate();
});
