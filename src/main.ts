import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { vertexShader, fragmentShader } from './shaders/portalShaders';

// --- Global Application States ---
const PARTICLE_COUNT = 80000;
let currentShapeIndex = 0; // 0=Nebula, 1=BlackHole, 2=DNA, 3=Torus
let currentColorTheme = 0; // 0=Cyber, 1=Aurora, 2=Solar, 3=Cosmic

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

let particleGeometry: THREE.BufferGeometry;
let particleMaterial: THREE.ShaderMaterial;
let particlePoints: THREE.Points;

// Cache the Float32Arrays for the 4 shapes
const shapeBuffers: Float32Array[] = [];

// Interaction States
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Flat z-plane
const targetMouse3D = new THREE.Vector3(999, 999, 999);
const activeMouse3D = new THREE.Vector3(999, 999, 999);

// Shader control uniform parameters
const params = {
  vortexSpeed: 1.0,
  noiseAmp: 0.3,
  noiseFreq: 0.2,
  gravityStrength: 1.2,
  audioPulseScale: 1.0,
  cinematicMode: false
};

// Telemetry & FPS Tracking
let lastTime = performance.now();
let frameCount = 0;
const fpsValElement = document.getElementById('fps-val');

// Audio Reaction States
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: any = null;
let isMicActive = false;

// --- 1. Shape Coordinates Calculations (Pure Math) ---

function initGeometries() {
  // Shape 0: Swirling Cosmic Nebula (3-Arm Logarithmic Spiral)
  const nebula = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const r = Math.pow(Math.random(), 1.5) * 5.0; // Dense center, sparse outside
    const armsCount = 3;
    const armAngle = ((i % armsCount) * 2 * Math.PI) / armsCount;
    
    // Logarithmic spiral angle calculation
    const theta = r * 1.6 + armAngle + (Math.random() - 0.5) * 0.45;
    
    nebula[i3] = r * Math.cos(theta) + (Math.random() - 0.5) * 0.2;
    nebula[i3 + 1] = (Math.random() - 0.5) * 0.4 * (5.5 - r); // Flatten height near outer edges
    nebula[i3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 0.2;
  }
  shapeBuffers.push(nebula);

  // Shape 1: Accretion Disk Quantum Black Hole
  const blackhole = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    if (i < PARTICLE_COUNT * 0.08) {
      // Small dense sphere at gravitational singularity center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 0.25;
      blackhole[i3] = r * Math.sin(phi) * Math.cos(theta);
      blackhole[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      blackhole[i3 + 2] = r * Math.cos(phi);
    } else {
      // Spinning accretion disk rings
      const theta = Math.random() * Math.PI * 2;
      const r = 0.55 + Math.pow(Math.random(), 1.25) * 4.8; // Inner hole gap
      
      blackhole[i3] = r * Math.cos(theta);
      blackhole[i3 + 1] = (Math.random() - 0.5) * 0.15 * Math.sin(r * 2.0); // Wavy vertical thickness
      blackhole[i3 + 2] = r * Math.sin(theta);
    }
  }
  shapeBuffers.push(blackhole);

  // Shape 2: twisted Double Helix DNA
  const dna = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const strand = i % 2 === 0 ? 0 : 1;
    const height = (Math.random() - 0.5) * 8.0; // Length of vertical strand
    const theta = height * 2.2 + (strand === 1 ? Math.PI : 0); // Twist offset
    const r = 1.3; // Helix radius

    if (Math.random() < 0.15) {
      // Connective horizontal bars matching closest strands
      const pct = Math.random();
      dna[i3] = r * Math.cos(theta) * (pct * 2 - 1);
      dna[i3 + 1] = height;
      dna[i3 + 2] = r * Math.sin(theta) * (pct * 2 - 1);
    } else {
      // Outer spiraling ribbon lines
      const jitterAngle = (Math.random() - 0.5) * 0.25;
      dna[i3] = r * Math.cos(theta + jitterAngle) + (Math.random() - 0.5) * 0.08;
      dna[i3 + 1] = height + (Math.random() - 0.5) * 0.05;
      dna[i3 + 2] = r * Math.sin(theta + jitterAngle) + (Math.random() - 0.5) * 0.08;
    }
  }
  shapeBuffers.push(dna);

  // Shape 3: Toroidal Ring ( 次元ドーナツ )
  const torus = new Float32Array(PARTICLE_COUNT * 3);
  const R = 2.4; // Major radius
  const r = 1.0; // Minor tube radius
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    // Add jitter radial noise for fluffiness
    const jitterR = r + (Math.random() - 0.5) * 0.15;

    torus[i3] = (R + jitterR * Math.cos(phi)) * Math.cos(theta);
    torus[i3 + 1] = jitterR * Math.sin(phi);
    torus[i3 + 2] = (R + jitterR * Math.cos(phi)) * Math.sin(theta);
  }
  shapeBuffers.push(torus);
}

// --- 2. Initial Setup Core (Three.js Initialization) ---

function init() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;
  scene = new THREE.Scene();

  // Perspective camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3.5, 9);

  // High performance antialiased WebGLRenderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Controls for camera navigation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 25;
  controls.minDistance = 3;

  // Initialize coordinate databases
  initGeometries();

  // Initial particle layout initialization
  particleGeometry = new THREE.BufferGeometry();
  
  // Base positional buffer
  const initialPositions = new Float32Array(shapeBuffers[0]);
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
  
  // Morph target buffer
  const targetPositions = new Float32Array(shapeBuffers[0]);
  particleGeometry.setAttribute('aPositionTarget', new THREE.BufferAttribute(targetPositions, 3));

  // Custom Shader Material Compilation
  particleMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0.0 },
      uProgress: { value: 0.0 },
      uNoiseAmp: { value: params.noiseAmp },
      uNoiseFreq: { value: params.noiseFreq },
      uMouse: { value: activeMouse3D },
      uGravityStrength: { value: params.gravityStrength },
      uColorTheme: { value: currentColorTheme },
      uAudioLevel: { value: 0.0 }
    }
  });

  // Particle Points Mesh
  particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);

  // Resize & Mouse Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });

  // Connect control panels
  setupEventListeners();
}

// --- 3. Interactive Morph Engine (GPU Double-Buffer Interpolation) ---

function triggerMorph(targetIndex: number) {
  if (targetIndex === currentShapeIndex) return;

  const progressUniform = particleMaterial.uniforms.uProgress;
  
  // Stop any active morph tweens
  gsap.killTweensOf(progressUniform);

  // 1. Prepare target buffer attribute coordinates on GPU
  const targetBuffer = shapeBuffers[targetIndex];
  const targetAttribute = particleGeometry.getAttribute('aPositionTarget') as THREE.BufferAttribute;
  
  targetAttribute.copyArray(targetBuffer);
  targetAttribute.needsUpdate = true;

  // Reset GPU mix progress to 0
  progressUniform.value = 0.0;

  // 2. Animate mix progress uniform to 1 via GSAP
  gsap.to(progressUniform, {
    value: 1.0,
    duration: 2.2,
    ease: 'power3.inOut',
    onComplete: () => {
      // Morph completed: Promote target positions to baseline position buffer
      const baseAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      baseAttribute.copyArray(targetBuffer);
      baseAttribute.needsUpdate = true;

      // Reset progress to 0 for next operation
      progressUniform.value = 0.0;
      currentShapeIndex = targetIndex;
    }
  });
}

// --- 4. Interactive Mouse Mechanics & Raycasting ---

function onMouseMove(event: MouseEvent) {
  // Normalize screen coordinates from -1 to 1
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  updateMouse3D();
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length > 0) {
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    updateMouse3D();
  }
}

function updateMouse3D() {
  raycaster.setFromCamera(mouse, camera);
  
  // Cast ray against flat vertical plane centered at origin
  raycaster.ray.intersectPlane(mousePlane, targetMouse3D);
}

// --- 5. Interactive Audio Reactive Mechanics ---

async function setupAudio() {
  const btn = document.getElementById('btn-audio-reactive');
  if (!btn) return;

  if (isMicActive) {
    // Disable active mic sync
    isMicActive = false;
    btn.innerHTML = '📯 MIC SYNC MODE: OFF';
    btn.classList.remove('active');
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Small fast FFT for particles

    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    isMicActive = true;
    btn.innerHTML = '📯 MIC SYNC MODE: ACTIVE';
    btn.classList.add('active');
  } catch (err) {
    alert('マイクのアクセス許可が必要です！マイク入力で共鳴させるため、許可してください。');
    console.error('Mic access denied or unsupported', err);
  }
}

// Render dynamic HTML diagnostic audio wave bars
const waveBars = document.querySelectorAll('.wave-bar') as NodeListOf<HTMLDivElement>;

function handleAudioPulse(time: number): number {
  let finalPulseVal = 0;

  if (isMicActive && analyser && dataArray) {
    // Extract actual microphone volume frequencies
    analyser.getByteFrequencyData(dataArray);
    
    // Average low-mid frequencies representing volume beats
    let sum = 0;
    const binsToAverage = 10;
    for (let i = 0; i < binsToAverage; i++) {
      sum += dataArray[i];
      
      // Update HTML diagnostic bars in real-time
      if (waveBars[i]) {
        const heightPct = Math.max(10, Math.min(100, (dataArray[i] / 255) * 100));
        waveBars[i].style.height = `${heightPct}%`;
      }
    }
    const avg = sum / binsToAverage;
    finalPulseVal = avg / 255; // Normalize 0 to 1
  } else {
    // Microphone inactive: Synthesize dummy ambient audio wave frequencies
    finalPulseVal = Math.max(0, Math.sin(time * 6.0) * 0.12 + Math.cos(time * 2.5) * 0.08 + 0.05);
    
    // Animate mock HTML wave columns
    for (let i = 0; i < waveBars.length; i++) {
      if (waveBars[i]) {
        const mockHeight = 10 + Math.sin(time * 8.0 + i * 0.5) * 20 + Math.cos(time * 3.0 + i) * 15;
        waveBars[i].style.height = `${Math.max(10, mockHeight)}%`;
      }
    }
  }

  // Update uniforms
  particleMaterial.uniforms.uAudioLevel.value = finalPulseVal * params.audioPulseScale;
  return finalPulseVal;
}

// --- 6. Unified Event Listeners Panel Setup ---

function setupEventListeners() {
  // Shape Triggers
  const shapesMap = [
    { btnId: 'btn-nebula', shapeIndex: 0 },
    { btnId: 'btn-blackhole', shapeIndex: 1 },
    { btnId: 'btn-dna', shapeIndex: 2 },
    { btnId: 'btn-torus', shapeIndex: 3 }
  ];

  shapesMap.forEach(item => {
    const btn = document.getElementById(item.btnId);
    btn?.addEventListener('click', () => {
      // Toggle active states on UI
      shapesMap.forEach(i => document.getElementById(i.btnId)?.classList.remove('active'));
      btn.classList.add('active');
      triggerMorph(item.shapeIndex);
    });
  });

  // Color Spectrum Triggers
  const themesMap = [
    { btnId: 'theme-cyber', themeIndex: 0 },
    { btnId: 'theme-aurora', themeIndex: 1 },
    { btnId: 'theme-solar', themeIndex: 2 },
    { btnId: 'theme-cosmic', themeIndex: 3 }
  ];

  themesMap.forEach(item => {
    const btn = document.getElementById(item.btnId);
    btn?.addEventListener('click', () => {
      themesMap.forEach(i => document.getElementById(i.btnId)?.classList.remove('active'));
      btn.classList.add('active');
      currentColorTheme = item.themeIndex;
      particleMaterial.uniforms.uColorTheme.value = currentColorTheme;
    });
  });

  // Numeric sliders listeners
  const configSliders = [
    { sliderId: 'slider-speed', valueId: 'val-speed', uniformName: 'vortexSpeed' },
    { sliderId: 'slider-noise-amp', valueId: 'val-noise-amp', uniformName: 'uNoiseAmp' },
    { sliderId: 'slider-noise-freq', valueId: 'val-noise-freq', uniformName: 'uNoiseFreq' },
    { sliderId: 'slider-gravity', valueId: 'val-gravity', uniformName: 'uGravityStrength' }
  ];

  configSliders.forEach(item => {
    const slider = document.getElementById(item.sliderId) as HTMLInputElement;
    const indicator = document.getElementById(item.valueId);
    slider?.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      if (indicator) indicator.innerHTML = val.toFixed(2);
      
      if (item.uniformName === 'vortexSpeed') {
        params.vortexSpeed = val;
      } else if (item.uniformName === 'uNoiseAmp') {
        params.noiseAmp = val;
        particleMaterial.uniforms.uNoiseAmp.value = val;
      } else if (item.uniformName === 'uNoiseFreq') {
        params.noiseFreq = val;
        particleMaterial.uniforms.uNoiseFreq.value = val;
      } else if (item.uniformName === 'uGravityStrength') {
        params.gravityStrength = val;
        particleMaterial.uniforms.uGravityStrength.value = val;
      }
    });
  });

  // Audio mic permissions toggle
  const audioBtn = document.getElementById('btn-audio-reactive');
  audioBtn?.addEventListener('click', setupAudio);

  // Cinematic sequence orbit
  const cinematicBtn = document.getElementById('btn-cinematic');
  cinematicBtn?.addEventListener('click', () => {
    params.cinematicMode = !params.cinematicMode;
    if (params.cinematicMode) {
      cinematicBtn.innerHTML = '🛑 STOP CINEMATIC ORBIT';
      cinematicBtn.classList.add('active');
    } else {
      cinematicBtn.innerHTML = '🚀 START CINEMATIC ORBIT';
      cinematicBtn.classList.remove('active');
      // Reset controls
      controls.autoRotate = false;
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// --- 7. Main Rendering Loop (RequestAnimationFrame) ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  frameCount++;
  const currentTime = performance.now();
  if (currentTime >= lastTime + 1000) {
    if (fpsValElement) {
      fpsValElement.innerHTML = `${frameCount} FPS`;
    }
    frameCount = 0;
    lastTime = currentTime;
  }

  // 1. Process simulated or live microphone frequencies
  const currentPulse = handleAudioPulse(time);

  // 2. Slow particle rotation over time (vortex spin speed)
  // Dynamic spin stretching relative to volume audio levels
  const spinFactor = params.vortexSpeed * (1.0 + currentPulse * 1.5) * 0.05;
  particlePoints.rotation.y += delta * spinFactor;

  // 3. Glide Mouse raycast attractor positions smoothly
  // Easing vector interpolation inside JS to avoid mouse snapping
  activeMouse3D.lerp(targetMouse3D, 0.08);
  
  // 4. If cinematic mode, drive orbital camera trajectories
  if (params.cinematicMode) {
    const orbitSpeed = time * 0.15;
    const dist = 7.0 + Math.sin(time * 0.4) * 2.5; // Pulsing cinematic depth zoom
    camera.position.x = dist * Math.cos(orbitSpeed);
    camera.position.z = dist * Math.sin(orbitSpeed);
    camera.position.y = 2.0 + Math.sin(time * 0.6) * 1.5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  } else {
    // Update orbit mouse camera damping
    controls.update();
  }

  // 5. Update system uniforms
  particleMaterial.uniforms.uTime.value = time;

  // 6. Draw call execution
  renderer.render(scene, camera);
}

// Start application
init();
animate();
