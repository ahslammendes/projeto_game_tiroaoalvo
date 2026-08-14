// Game variables
let scene, camera, renderer;
let targets = [];
let particles = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(); // Center of screen for pointer lock
let isPlaying = false;
let score = 0;
let timeLeft = 60;
let timerInterval;
let lastTime = 0;
let cylinderRotation = 0;

// Mobile touch variables
let lastTouchX = 0;
let lastTouchY = 0;
let lastTouchIdentifier = null;
const activeTouches = {};
let isTouchDevice = false;

// UI Elements
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('hud');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

init();
animate(0);

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // Player height
    camera.rotation.order = "YXZ"; // Important for FPS controls

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // 5. Environment
    createEnvironment();

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('mousemove', onMouseMove);
    restartBtn.addEventListener('click', onRestartClick);
    
    // Touch Events for Mobile
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
}

function createEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 }); // Grass green
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Table/Wall for targets
    const wallGeo = new THREE.BoxGeometry(40, 3, 2);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Wood brown
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 1.5, -10);
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);
    
    // Add some random trees/bushes for pixel look
    for(let i = 0; i < 20; i++) {
        const size = Math.random() * 2 + 1;
        const bushGeo = new THREE.BoxGeometry(size, size, size);
        const bushMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(
            (Math.random() - 0.5) * 60,
            size / 2,
            -15 - Math.random() * 20
        );
        bush.castShadow = true;
        scene.add(bush);
    }
}

// Silhouette Paper Target Generator
function createTargetMesh() {
    const group = new THREE.Group();
    
    // Create canvas for the texture
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Paper background with dark frame
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(15, 15, 370, 470);

    // Silhouette (dark gray/black)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    // Head
    ctx.arc(200, 110, 50, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(160, 150);
    ctx.lineTo(240, 150);
    ctx.lineTo(280, 200); // right shoulder
    ctx.bezierCurveTo(350, 220, 350, 280, 350, 485); // right side
    ctx.lineTo(50, 485); // bottom left
    ctx.bezierCurveTo(50, 280, 50, 220, 120, 200); // left side
    ctx.closePath();
    ctx.fill();

    // Rings (white)
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Outfit", Arial, sans-serif';

    const centerY = 310;
    const centerX = 200;

    function drawRing(rx, ry, score) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (score) {
            if (score === 'X') {
                ctx.fillText(score, centerX, centerY + 2);
            } else {
                ctx.fillText(score, centerX, centerY - ry + 16);
                ctx.fillText(score, centerX, centerY + ry - 16);
                ctx.fillText(score, centerX - rx + 16, centerY + 2);
                ctx.fillText(score, centerX + rx - 16, centerY + 2);
            }
        }
    }

    drawRing(130, 160, '7');
    drawRing(100, 120, '8');
    drawRing(70, 80, '9');
    drawRing(35, 40, 'X');

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    // Create materials
    const materialFront = new THREE.MeshLambertMaterial({ map: texture });
    const materialSide = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    
    // Apply texture only to the front
    const materials = [
        materialSide, materialSide, materialSide, materialSide, materialFront, materialSide
    ];

    // Create mesh (Board)
    const geometry = new THREE.BoxGeometry(1.6, 2.0, 0.1);
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.y = 1.0; // bottom of board at y=0
    mesh.castShadow = true;
    
    // Stand base
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.1;
    base.castShadow = true;
    
    group.add(mesh);
    group.add(base);

    return group;
}

function spawnTarget() {
    if (!isPlaying) return;
    
    const target = createTargetMesh();
    
    // Randomize start side (left or right)
    const startLeft = Math.random() > 0.5;
    const startX = startLeft ? -20 : 20;
    const dir = startLeft ? 1 : -1;
    
    target.position.set(startX, 3.2, -10 + (Math.random() * 2 - 1)); // On the wall
    // Removed the rotation so the target always faces the camera (forward)
    
    scene.add(target);
    
    targets.push({
        mesh: target,
        speed: (2 + Math.random() * 3) * dir,
        active: true
    });
}

function createExplosion(position, color = 0xffd700) {
    const particleCount = 20;
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshLambertMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        
        // Random velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            Math.random() * 10,
            (Math.random() - 0.5) * 10
        );
        
        scene.add(mesh);
        particles.push({
            mesh: mesh,
            velocity: velocity,
            life: 1.0 // 1 second life
        });
    }
}

function onClick(event) {
    if (isTouchDevice) return; // Prevent double firing on touch devices
    if (gameOverScreen.classList.contains('active')) return;
    
    // Only request pointer lock if clicking on the main canvas/game screen
    if (!isPlaying && event.target !== restartBtn) {
        document.body.requestPointerLock();
        return;
    }

    if (isPlaying && document.pointerLockElement === document.body) {
        shoot();
    }
}

document.addEventListener('pointerlockchange', () => {
    if (isTouchDevice) return;
    if (document.pointerLockElement === document.body) {
        if (!isPlaying && timeLeft > 0) startGame();
        else if (timeLeft > 0) resumeGame();
    } else {
        pauseGame();
    }
});

function onRestartClick(event) {
    if (!isTouchDevice) {
        startGame();
        document.body.requestPointerLock();
    } else {
        startGame();
    }
}

function onTouchStart(event) {
    isTouchDevice = true;
    if (gameOverScreen.classList.contains('active')) return;
    
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        activeTouches[touch.identifier] = {
            startX: touch.clientX,
            startY: touch.clientY,
            moved: false
        };
    }

    if (event.target.tagName !== 'BUTTON') {
        event.preventDefault(); // Prevent double tap zoom/scroll
    }

    if (!isPlaying && event.target !== restartBtn) {
        startGame();
    }
}

function onTouchMove(event) {
    if (!isPlaying) return;
    
    // Check all moved touches to see if they crossed the tap threshold
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const touchData = activeTouches[touch.identifier];
        if (touchData) {
            const dist = Math.hypot(touch.clientX - touchData.startX, touch.clientY - touchData.startY);
            if (dist > 10) {
                touchData.moved = true;
            }
        }
    }
    
    // Use the first active touch for camera aiming
    if (event.touches.length > 0) {
        const touch0 = event.touches[0];
        
        // If it's a new aiming finger, reset the last position to avoid camera jumps
        if (lastTouchIdentifier !== touch0.identifier) {
            lastTouchX = touch0.clientX;
            lastTouchY = touch0.clientY;
            lastTouchIdentifier = touch0.identifier;
        }
        
        const deltaX = touch0.clientX - lastTouchX;
        const deltaY = touch0.clientY - lastTouchY;
        
        const sensitivity = 0.005; // Slightly higher sensitivity for touch
        camera.rotation.y -= deltaX * sensitivity;
        camera.rotation.x -= deltaY * sensitivity;
        
        // Clamp vertical rotation
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        
        lastTouchX = touch0.clientX;
        lastTouchY = touch0.clientY;
    }
    
    if (event.target.tagName !== 'BUTTON') {
        event.preventDefault();
    }
}

function onTouchEnd(event) {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const touchData = activeTouches[touch.identifier];
        
        if (touchData) {
            // If the finger was lifted without moving much, it's a tap! (Shoot)
            if (!touchData.moved && isPlaying) {
                shoot();
            }
            delete activeTouches[touch.identifier];
        }
        
        if (touch.identifier === lastTouchIdentifier) {
            lastTouchIdentifier = null; // Reset aiming finger
        }
    }
    
    if (event.target.tagName !== 'BUTTON') {
        event.preventDefault();
    }
}

function onMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        // Rotate camera based on mouse movement
        const sensitivity = 0.002;
        camera.rotation.y -= event.movementX * sensitivity;
        camera.rotation.x -= event.movementY * sensitivity;
        
        // Clamp vertical rotation so you can't flip over
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

function shoot() {
    // Spin the revolver cylinder crosshair
    cylinderRotation += 60;
    const crosshairSvg = document.querySelector('#crosshair svg');
    if (crosshairSvg) {
        crosshairSvg.style.transform = `rotate(${cylinderRotation}deg)`;
    }

    // Screen center raycast
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Create an array of meshes to intersect with (children of target groups)
    const intersectObjects = targets.filter(t => t.active).map(t => t.mesh);
    
    // Recursive true because targets are groups of voxels
    const intersects = raycaster.intersectObjects(intersectObjects, true);

    if (intersects.length > 0) {
        // Find the parent group (the target)
        let object = intersects[0].object;
        while (object.parent && object.parent.type === 'Group') {
            object = object.parent;
        }

        // Find in targets array
        const targetIndex = targets.findIndex(t => t.mesh === object);
        if (targetIndex !== -1 && targets[targetIndex].active) {
            // Hit!
            targets[targetIndex].active = false;
            scene.remove(object);
            
            createExplosion(object.position, 0xffffff); // White explosion for paper
            
            score += 10;
            scoreEl.innerText = score;
            
            // Add a little kickback to camera (optional polish)
            camera.rotation.x += 0.05;
        }
    }
}

function startGame() {
    score = 0;
    timeLeft = 60;
    scoreEl.innerText = score;
    timerEl.innerText = timeLeft;
    
    // Clear old targets
    targets.forEach(t => scene.remove(t.mesh));
    targets = [];
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    hud.classList.add('active');
    
    isPlaying = true;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // Initial targets
    for(let i=0; i<3; i++) {
        setTimeout(spawnTarget, i * 1000);
    }
}

function pauseGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    if (timeLeft > 0) {
        startScreen.querySelector('h1').innerText = "Pausado";
        startScreen.querySelector('p').innerText = "Clique na tela para continuar.";
        startScreen.classList.add('active');
        hud.classList.remove('active');
    }
}

function resumeGame() {
    isPlaying = true;
    startScreen.classList.remove('active');
    hud.classList.add('active');
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    isPlaying = false;
    if (document.pointerLockElement === document.body) {
        document.exitPointerLock();
    }
    clearInterval(timerInterval);
    
    hud.classList.remove('active');
    gameOverScreen.classList.add('active');
    finalScoreEl.innerText = score;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    
    const delta = (time - lastTime) / 1000; // seconds
    lastTime = time;

    if (isPlaying) {
        // Move targets
        for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            if (t.active) {
                t.mesh.position.x += t.speed * delta;
                
                // Add slight bobbing
                t.mesh.position.y = 3.2 + Math.sin(time * 0.005 + t.mesh.position.x) * 0.2;
                
                // Remove if out of bounds
                if (Math.abs(t.mesh.position.x) > 25) {
                    scene.remove(t.mesh);
                    targets.splice(i, 1);
                }
            } else {
                targets.splice(i, 1); // Remove inactive from array
            }
        }
        
        // Spawn randomly
        if (Math.random() < 0.02 * delta * 60) {
            spawnTarget();
        }
        
        // Recover camera rotation (kickback recovery)
        // Check if rotation X is higher than what a human probably looks like
        // We actually just smoothly ease it down slightly if we added recoil
        // A simple way is to not mess with it if the user is moving mouse, 
        // but for simplicity we let it be.
    }
    
    // Update particles (always run)
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= delta;
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        } else {
            p.mesh.position.addScaledVector(p.velocity, delta);
            // Gravity
            p.velocity.y -= 15 * delta;
            // Shrink
            p.mesh.scale.setScalar(p.life);
        }
    }

    renderer.render(scene, camera);
}
