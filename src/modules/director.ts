import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Director {
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  public controls!: OrbitControls;

  // Interaction States
  public mouse = new THREE.Vector2();
  public raycaster = new THREE.Raycaster();
  public mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Flat z-plane
  public targetMouse3D = new THREE.Vector3(999, 999, 999);
  public activeMouse3D = new THREE.Vector3(999, 999, 999);

  // Cinematic State
  public cinematicMode = false;

  constructor() {
    this.init();
  }

  private init() {
    const canvas = document.getElementById('webgl') as HTMLCanvasElement;
    this.scene = new THREE.Scene();

    // Perspective camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 3.5, 9);

    // High performance antialiased WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls for camera navigation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 3;

    // Window Resize Bindings
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Interaction Listeners
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.updateMouse3D();
  }

  private onTouchMove(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      this.updateMouse3D();
    }
  }

  private updateMouse3D() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.ray.intersectPlane(this.mousePlane, this.targetMouse3D);
  }

  /**
   * Toggle cinematic pathing
   */
  public toggleCinematic(): boolean {
    this.cinematicMode = !this.cinematicMode;
    const btn = document.getElementById('btn-cinematic');
    if (btn) {
      if (this.cinematicMode) {
        btn.innerHTML = '🛑 STOP CINEMATIC ORBIT';
        btn.classList.add('active');
      } else {
        btn.innerHTML = '🚀 START CINEMATIC ORBIT';
        btn.classList.remove('active');
        this.controls.autoRotate = false;
      }
    }
    return this.cinematicMode;
  }

  /**
   * Frame update. Interpolates mouse coordinates and updates orbital trajectory if cinematic mode is active.
   */
  public update(time: number) {
    // Easing vector interpolation inside JS to avoid mouse snapping
    this.activeMouse3D.lerp(this.targetMouse3D, 0.08);

    if (this.cinematicMode) {
      const orbitSpeed = time * 0.15;
      const dist = 7.0 + Math.sin(time * 0.4) * 2.5; // Pulsing cinematic depth zoom
      this.camera.position.x = dist * Math.cos(orbitSpeed);
      this.camera.position.z = dist * Math.sin(orbitSpeed);
      this.camera.position.y = 2.0 + Math.sin(time * 0.6) * 1.5;
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
      this.controls.update();
    }
  }

  /**
   * Render the active scene
   */
  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
