import { Director } from './director';
import { ParticleSystem } from './particles';
import { AudioController } from './audio';

export class HUDController {
  private director: Director;
  private particles: ParticleSystem;
  private audio: AudioController;

  // FPS Telemetry States
  private lastTime = performance.now();
  private frameCount = 0;
  private fpsValElement: HTMLElement | null;

  constructor(director: Director, particles: ParticleSystem, audio: AudioController) {
    this.director = director;
    this.particles = particles;
    this.audio = audio;
    this.fpsValElement = document.getElementById('fps-val');

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 1. Shape Selection Button Events
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
        this.particles.triggerMorph(item.shapeIndex);
      });
    });

    // 2. Color Theme Spectrum Selection Events
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
        this.particles.setColorTheme(item.themeIndex);
      });
    });

    // 3. Tuning Parameter Range Sliders Events
    const configSliders = [
      { sliderId: 'slider-speed', valueId: 'val-speed', parameter: 'vortexSpeed', isUniform: false },
      { sliderId: 'slider-noise-amp', valueId: 'val-noise-amp', parameter: 'noiseAmp', isUniform: true, uniformName: 'uNoiseAmp' },
      { sliderId: 'slider-noise-freq', valueId: 'val-noise-freq', parameter: 'noiseFreq', isUniform: true, uniformName: 'uNoiseFreq' },
      { sliderId: 'slider-gravity', valueId: 'val-gravity', parameter: 'gravityStrength', isUniform: true, uniformName: 'uGravityStrength' }
    ];

    configSliders.forEach(item => {
      const slider = document.getElementById(item.sliderId) as HTMLInputElement;
      const indicator = document.getElementById(item.valueId);
      slider?.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        if (indicator) indicator.innerHTML = val.toFixed(2);
        
        // Update variables inside config database
        if (item.parameter === 'vortexSpeed') {
          this.particles.config.vortexSpeed = val;
        } else if (item.parameter === 'noiseAmp') {
          this.particles.config.noiseAmp = val;
          if (item.isUniform && item.uniformName) {
            this.particles.material.uniforms[item.uniformName].value = val;
          }
        } else if (item.parameter === 'noiseFreq') {
          this.particles.config.noiseFreq = val;
          if (item.isUniform && item.uniformName) {
            this.particles.material.uniforms[item.uniformName].value = val;
          }
        } else if (item.parameter === 'gravityStrength') {
          this.particles.config.gravityStrength = val;
          if (item.isUniform && item.uniformName) {
            this.particles.material.uniforms[item.uniformName].value = val;
          }
        }
      });
    });

    // 4. Microphone audio react permissions toggle
    const audioBtn = document.getElementById('btn-audio-reactive');
    audioBtn?.addEventListener('click', () => {
      this.audio.setupAudio();
    });

    // 5. Cinematic trajectory orbital controls
    const cinematicBtn = document.getElementById('btn-cinematic');
    cinematicBtn?.addEventListener('click', () => {
      this.director.toggleCinematic();
    });
  }

  /**
   * Track real-time rendering statistics (FPS)
   */
  public update() {
    this.frameCount++;
    const currentTime = performance.now();
    if (currentTime >= this.lastTime + 1000) {
      if (this.fpsValElement) {
        this.fpsValElement.innerHTML = `${this.frameCount} FPS`;
      }
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
}
