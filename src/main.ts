import * as THREE from 'three';
import { Director } from './modules/director';
import { ParticleSystem } from './modules/particles';
import { AudioController } from './modules/audio';
import { HUDController } from './modules/hud';

// --- Configuration ---
const PARTICLE_COUNT = 80000;

// --- Application Core Objects ---
let director: Director;
let particles: ParticleSystem;
let audio: AudioController;
let hud: HUDController;

/**
 * Bootstrap the modular system
 */
function init() {
  // 1. Initialize rendering context (Scene, Camera, Renderer, Mouse raycasting)
  director = new Director();

  // 2. Initialize GPU particles, shader material and mesh structures
  particles = new ParticleSystem(director.scene, PARTICLE_COUNT);

  // 3. Initialize Audio reaction engine
  audio = new AudioController();

  // 4. Bind event listeners and HUD indicators
  hud = new HUDController(director, particles, audio);
}

// --- Animation Time Clock ---
const clock = new THREE.Clock();

/**
 * Main Frame Render Loop
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Process simulated or live microphone frequency beats
  const currentPulse = audio.update(time, 1.0); // Hardcoded audio pulse scale multiplier

  // 2. Perform rotation and uniform synchronizations on particles
  particles.update(time, delta, director.activeMouse3D, currentPulse);

  // 3. Glide mouse inputs and update orbital cinematic flight camera paths
  director.update(time);

  // 4. Track FPS and diagnostic gauges telemetry
  hud.update();

  // 5. Draw call execution
  director.render();
}

// Start application
init();
animate();
