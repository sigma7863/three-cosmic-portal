/**
 * Geometry Generators for Cosmic Particle Portal Visualizer
 * Pure mathematical formulas generating coordinate buffers (Float32Array)
 */

/**
 * Shape 0: Swirling Cosmic Nebula (3-Arm Logarithmic Spiral)
 */
export function generateNebula(count: number): Float32Array {
  const buffer = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = Math.pow(Math.random(), 1.5) * 5.0; // Dense center, sparse outside
    const armsCount = 3;
    const armAngle = ((i % armsCount) * 2 * Math.PI) / armsCount;
    
    // Logarithmic spiral angle calculation
    const theta = r * 1.6 + armAngle + (Math.random() - 0.5) * 0.45;
    
    buffer[i3] = r * Math.cos(theta) + (Math.random() - 0.5) * 0.2;
    buffer[i3 + 1] = (Math.random() - 0.5) * 0.4 * (5.5 - r); // Flatten height near outer edges
    buffer[i3 + 2] = r * Math.sin(theta) + (Math.random() - 0.5) * 0.2;
  }
  return buffer;
}

/**
 * Shape 1: Accretion Disk Quantum Black Hole
 */
export function generateBlackHole(count: number): Float32Array {
  const buffer = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    if (i < count * 0.08) {
      // Small dense sphere at gravitational singularity center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 0.25;
      buffer[i3] = r * Math.sin(phi) * Math.cos(theta);
      buffer[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      buffer[i3 + 2] = r * Math.cos(phi);
    } else {
      // Spinning accretion disk rings
      const theta = Math.random() * Math.PI * 2;
      const r = 0.55 + Math.pow(Math.random(), 1.25) * 4.8; // Inner hole gap
      
      buffer[i3] = r * Math.cos(theta);
      buffer[i3 + 1] = (Math.random() - 0.5) * 0.15 * Math.sin(r * 2.0); // Wavy vertical thickness
      buffer[i3 + 2] = r * Math.sin(theta);
    }
  }
  return buffer;
}

/**
 * Shape 2: Twisted Double Helix DNA
 */
export function generateDNA(count: number): Float32Array {
  const buffer = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const strand = i % 2 === 0 ? 0 : 1;
    const height = (Math.random() - 0.5) * 8.0; // Length of vertical strand
    const theta = height * 2.2 + (strand === 1 ? Math.PI : 0); // Twist offset
    const r = 1.3; // Helix radius

    if (Math.random() < 0.15) {
      // Connective horizontal bars matching closest strands
      const pct = Math.random();
      buffer[i3] = r * Math.cos(theta) * (pct * 2 - 1);
      buffer[i3 + 1] = height;
      buffer[i3 + 2] = r * Math.sin(theta) * (pct * 2 - 1);
    } else {
      // Outer spiraling ribbon lines
      const jitterAngle = (Math.random() - 0.5) * 0.25;
      buffer[i3] = r * Math.cos(theta + jitterAngle) + (Math.random() - 0.5) * 0.08;
      buffer[i3 + 1] = height + (Math.random() - 0.5) * 0.05;
      buffer[i3 + 2] = r * Math.sin(theta + jitterAngle) + (Math.random() - 0.5) * 0.08;
    }
  }
  return buffer;
}

/**
 * Shape 3: Toroidal Ring (次元トーラス)
 */
export function generateTorus(count: number): Float32Array {
  const buffer = new Float32Array(count * 3);
  const R = 2.4; // Major radius
  const r = 1.0; // Minor tube radius
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    // Add jitter radial noise for fluffiness
    const jitterR = r + (Math.random() - 0.5) * 0.15;

    buffer[i3] = (R + jitterR * Math.cos(phi)) * Math.cos(theta);
    buffer[i3 + 1] = jitterR * Math.sin(phi);
    buffer[i3 + 2] = (R + jitterR * Math.cos(phi)) * Math.sin(theta);
  }
  return buffer;
}
