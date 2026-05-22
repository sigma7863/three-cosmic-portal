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

## 📝 License
This project is open-source under the MIT License.
