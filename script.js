const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#solar-system'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const textureLoader = new THREE.TextureLoader();

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 100;

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(sunLight);

camera.position.set(0, 30, 50);
camera.lookAt(0, 0, 0);

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1,
        sizeAttenuation: false
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

const planetData = {
    mercury: { 
        radius: 0.4, 
        distance: 5, 
        speed: 0.04, 
        color: 0x8C8C8C,
        rotationSpeed: 0.004,
        specular: 0x111111,
        shininess: 5
    },
    venus: { 
        radius: 0.9, 
        distance: 7, 
        speed: 0.015, 
        color: 0xE39E1C,
        rotationSpeed: 0.002,
        specular: 0x222222,
        shininess: 5
    },
    earth: { 
        radius: 1, 
        distance: 10, 
        speed: 0.01, 
        color: 0x2B83FF,
        rotationSpeed: 0.02,
        specular: 0x333333,
        shininess: 5
    },
    mars: { 
        radius: 0.5, 
        distance: 13, 
        speed: 0.008, 
        color: 0xC1440E,
        rotationSpeed: 0.018,
        specular: 0x222222,
        shininess: 5
    },
    jupiter: { 
        radius: 2.5, 
        distance: 18, 
        speed: 0.002, 
        color: 0xD8CA9D,
        rotationSpeed: 0.04,
        specular: 0x333333,
        shininess: 5
    },
    saturn: { 
        radius: 2.2, 
        distance: 23, 
        speed: 0.0009, 
        color: 0xE3BB76,
        rotationSpeed: 0.038,
        specular: 0x333333,
        shininess: 5
    },
    uranus: { 
        radius: 1.8, 
        distance: 28, 
        speed: 0.0004, 
        color: 0x5580AA,
        rotationSpeed: 0.03,
        specular: 0x222222,
        shininess: 5
    },
    neptune: { 
        radius: 1.8, 
        distance: 32, 
        speed: 0.0001, 
        color: 0x366896,
        rotationSpeed: 0.032,
        specular: 0x222222,
        shininess: 5
    }
};

const planets = {};
const planetSpeeds = {};
const orbitTrails = {};

function createPlanetLabel(name, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.font = 'Bold 40px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name.charAt(0).toUpperCase() + name.slice(1), 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(5, 1.25, 1);
    scene.add(sprite);
}

function createOrbitTrail(name, distance) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(theta) * distance,
            0,
            Math.sin(theta) * distance
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    
    const trail = new THREE.Line(geometry, material);
    scene.add(trail);
    orbitTrails[name] = trail;
}

function createPlanet(name, data) {
    const material = new THREE.MeshPhongMaterial({
        color: data.color,
        specular: new THREE.Color(data.specular),
        shininess: data.shininess,
        emissive: new THREE.Color(data.color).multiplyScalar(0.1)
    });

    const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
    const planet = new THREE.Mesh(geometry, material);
    
    createOrbitTrail(name, data.distance);
    
    if (name === 'saturn') {
        const ringGeometry = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xE3BB76,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
    }
    
    planet.position.x = data.distance;
    planet.rotationSpeed = data.rotationSpeed;
    scene.add(planet);
    planets[name] = planet;
    planetSpeeds[name] = data.speed;
    
    createPlanetLabel(name, planet.position);
}

const sunGeometry = new THREE.SphereGeometry(3, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.5
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

createStarfield();

Object.entries(planetData).forEach(([name, data]) => {
    createPlanet(name, data);
});

function animate() {
    requestAnimationFrame(animate);
    
    Object.entries(planets).forEach(([name, planet]) => {
        const speed = planetSpeeds[name];
        const distance = planetData[name].distance;
        const time = Date.now() * 0.001;
        
        planet.position.x = Math.cos(time * speed) * distance;
        planet.position.z = Math.sin(time * speed) * distance;
        planet.rotation.y += planet.rotationSpeed;
        
        planet.children.forEach(child => {
            if (child instanceof THREE.Sprite) {
                child.position.copy(planet.position);
                child.position.y += 2;
            }
        });
    });
    
    sun.rotation.y += 0.004;
    
    controls.update();
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

Object.keys(planetData).forEach(planetName => {
    const slider = document.getElementById(`${planetName}-speed`);
    const speedValue = slider.nextElementSibling;
    
    slider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        planetSpeeds[planetName] = planetData[planetName].speed * speed;
        speedValue.textContent = `${speed}x`;
    });
});

animate(); 