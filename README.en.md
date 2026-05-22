# 🌌 Cosmic Particle Portal Visualizer

[日本語](README.md) | **English**

---

An interactive WebGL cosmic visualizer combining GPU-driven, high-performance 3D particle simulations with a futuristic cyberpunk glassmorphism HUD dashboard.

---

## 🚀 Features

### 1. GPU-Driven Particle Engine (80,000+ Particles)
To bypass standard CPU bottleneck issues in JavaScript, all particle coordinates, spatial noise, and cursor gravity fields are computed directly on the GPU using **custom GLSL Vertex & Fragment Shaders**. This guarantees a stable 60+ FPS visual experience.

#### 🌀 4 Dynamic Formations
* **Swirling Cosmic Nebula:** A beautiful 3-arm logarithmic spiral galaxy with dense clusters near the center.
* **Quantum Black Hole:** A ultra-thin accretion disk swirling around a dark gravitational core.
* **Double Helix DNA:** Two twisted strands pulsating vertically with energetic molecular linkages.
* **Hyperdimensional Torus:** Complex intersecting rings rotating internally in multidimensional coordinate space.

### 2. High-Fidelity Physics & Real-Time Interactions
* **Mouse Gravity Physics:** Casts a spatial gravity vector using raycasting. Moving your cursor repels or attracts nearby particles dynamically.
* **Real-time Audio Reactivity:** Connects to the Web Audio API to map microphone frequency levels, scaling particle sizes and noise speeds to surrounding music (switches to ambient audio waves if permission is withheld).
* **Cinematic Director Mode:** Autonomously controls camera orbits to create breathtaking flights directly through the portal core.

### 3. Cybernetic Glassmorphic Control Panel
* **Glassmorphic UI Overlay:** Holographic panels styled with CSS glassmorphism, glowing telemetry lines, and interactive ranges.
* **Dynamic Indicators:** Displays real-time FPS telemetry, active particle nodes, sound frequencies, and camera coordinates.
* **Tuning Controls:** Real-time range sliders for rotation speeds, vertex displacement, noise frequencies, and gravity strength.

---

## 🛠️ Technology Stack

* **Runtime & Package Manager:** [Bun](https://bun.sh/)
* **Build Bundler:** [Vite](https://vite.dev/) (Vanilla TypeScript)
* **3D Engine:** [Three.js](https://threejs.org/) + **Custom GLSL (WebGL Shaders)**
* **Transitions:** [GSAP (GreenSock)](https://gsap.com/)
* **Styles:** Custom Vanilla CSS (fluid responsiveness, glow filters, keyframes)

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Start Development Server
```bash
bun run dev
```
Open **`http://localhost:5173/`** in your browser.

### 3. Production Build
```bash
bun run build
```
Generates highly optimized, minified assets into the `dist/` directory.

### 4. Preview Production Build
```bash
bun run preview
```

---

## 📂 Directory Structure & Modules

To maximize maintainability and scalability, this project features a decoupled, modular component design that isolates visual logic, mathematics, audio capture, and DOM interactions.

```
src/
  ├── main.ts                 # Main Orchestrator Entrypoint
  ├── shaders/
  │    └── portalShaders.ts   # GLSL Custom Shader Strings
  ├── style.css               # Futuristic HUD Dashboard Styling
  └── modules/
       ├── geometries.ts      # Pure math coordinate calculators
       ├── audio.ts           # AudioController class managing Web Audio API & mic sync
       ├── director.ts        # Director class managing Three.js scene, camera & orbits
       ├── particles.ts       # ParticleSystem class managing GPU points mesh & morphs
       └── hud.ts             # HUDController class binding DOM inputs & calculating telemetry
```

### Component Breakdown

* **`main.ts` (Entrypoint)**
  Instantiates the separate component classes, runs the centralized `requestAnimationFrame` render loop, and handles time metrics (`clock`), passing frame updates (`update()`) to all individual modules seamlessly.
* **`Director` (modules/director.ts)**
  Orchestrates the Three.js viewport parameters (`Scene`, `PerspectiveCamera`, `WebGLRenderer`, and `OrbitControls`). Normalizes 2D pointer coordinates on screen, projects them onto a virtual 3D plane using raycasting, and smoothly slides (`lerp` LERP) an attractor point (`activeMouse3D`) to avoid mechanical mouse movements. Also handles cinematic orbit fly-through paths.
* **`ParticleSystem` (modules/particles.ts)**
  Wraps the `THREE.Points` mesh, its corresponding `BufferGeometry` structures, and custom `THREE.ShaderMaterial` compilation. Animates GPU positions using GSAP to tween the `uProgress` blend factor between shape states smoothly in 2.2 seconds.
* **`AudioController` (modules/audio.ts)**
  Initializes standard `AudioContext` and an `AnalyserNode` with a fast `fftSize` of 64 to monitor microphone stream decibel volumes in real-time. If microphone permission is blocked or unavailable, it automatically starts a mathematical multi-frequency oscillator simulation to mimic ambient acoustic bass waves.
* **`HUDController` (modules/hud.ts)**
  Synchronizes all sliders, selectors, buttons, and responsive tags inside the HTML HUD dashboard. Reads user input values (speeds, noise displacement thresholds, etc.) and routes updates directly to `ParticleSystem` configurations. Also tallies render frequencies to project a live digital FPS gauge.
* **`geometries.ts` (modules/geometries.ts)**
  Houses the raw mathematical algorithms (logarithmic spiral vectors, gravitational singularity vectors, double helix strand offsets, toroidal polar calculations) generating `Float32Array` buffer coordinates completely independent of WebGL scene configurations.

---

## 📝 License
This project is open-source under the MIT License.
