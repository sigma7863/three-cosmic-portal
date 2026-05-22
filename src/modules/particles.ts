import * as THREE from 'three';
import { gsap } from 'gsap';
import { vertexShader, fragmentShader } from '../shaders/portalShaders';
import { generateNebula, generateBlackHole, generateDNA, generateTorus } from './geometries';

export class ParticleSystem {
  private count: number;
  public geometry!: THREE.BufferGeometry;
  public material!: THREE.ShaderMaterial;
  public points!: THREE.Points;

  // Cached geometry coordinate arrays
  private shapeBuffers: Float32Array[] = [];

  // Indices
  public currentShapeIndex = 0;
  public currentColorTheme = 0;

  // Configuration parameters
  public config = {
    vortexSpeed: 1.0,
    noiseAmp: 0.3,
    noiseFreq: 0.2,
    gravityStrength: 1.2
  };

  constructor(scene: THREE.Scene, count: number) {
    this.count = count;
    this.init(scene);
  }

  private init(scene: THREE.Scene) {
    // 1. Precalculate and cache all target coordinate buffers
    this.shapeBuffers.push(generateNebula(this.count));
    this.shapeBuffers.push(generateBlackHole(this.count));
    this.shapeBuffers.push(generateDNA(this.count));
    this.shapeBuffers.push(generateTorus(this.count));

    // 2. Initialize BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    
    // Position base
    const initialPositions = new Float32Array(this.shapeBuffers[0]);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    
    // Target morph coordinates
    const targetPositions = new Float32Array(this.shapeBuffers[0]);
    this.geometry.setAttribute('aPositionTarget', new THREE.BufferAttribute(targetPositions, 3));

    // 3. Compile custom ShaderMaterial with binding uniforms
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uProgress: { value: 0.0 },
        uNoiseAmp: { value: this.config.noiseAmp },
        uNoiseFreq: { value: this.config.noiseFreq },
        uMouse: { value: new THREE.Vector3() },
        uGravityStrength: { value: this.config.gravityStrength },
        uColorTheme: { value: this.currentColorTheme },
        uAudioLevel: { value: 0.0 }
      }
    });

    // 4. Mesh creation and add to active scene context
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  /**
   * GPU Double-Buffer interpolation using GSAP tweening
   */
  public triggerMorph(targetIndex: number) {
    if (targetIndex === this.currentShapeIndex) return;

    const progressUniform = this.material.uniforms.uProgress;
    
    // Kill any active running morph tweens
    gsap.killTweensOf(progressUniform);

    // Prepare destination coordinate buffer attribute
    const targetBuffer = this.shapeBuffers[targetIndex];
    const targetAttribute = this.geometry.getAttribute('aPositionTarget') as THREE.BufferAttribute;
    
    targetAttribute.copyArray(targetBuffer);
    targetAttribute.needsUpdate = true;

    // Reset progress to start morphing
    progressUniform.value = 0.0;

    // Animate uProgress uniform smoothly from 0.0 to 1.0
    gsap.to(progressUniform, {
      value: 1.0,
      duration: 2.2,
      ease: 'power3.inOut',
      onComplete: () => {
        // Morph completed: promote target coordinates to baseline positions
        const baseAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute;
        baseAttribute.copyArray(targetBuffer);
        baseAttribute.needsUpdate = true;

        // Reset progress mapping
        progressUniform.value = 0.0;
        this.currentShapeIndex = targetIndex;
      }
    });
  }

  /**
   * Set color theme indices
   */
  public setColorTheme(themeIndex: number) {
    this.currentColorTheme = themeIndex;
    this.material.uniforms.uColorTheme.value = themeIndex;
  }

  /**
   * Unified update tick driving shader uniforms
   */
  public update(time: number, delta: number, activeMouse3D: THREE.Vector3, audioPulse: number) {
    // 1. Orbit spin rotation of the whole mesh
    const spinFactor = this.config.vortexSpeed * (1.0 + audioPulse * 1.5) * 0.05;
    this.points.rotation.y += delta * spinFactor;

    // 2. Refresh uniforms
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uMouse.value.copy(activeMouse3D);
    this.material.uniforms.uAudioLevel.value = audioPulse;
  }
}
