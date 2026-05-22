// WebGL GLSL Shaders for the Cosmic Portal Particle System

export const vertexShader = `
uniform float uTime;
uniform float uProgress;
uniform float uNoiseAmp;
uniform float uNoiseFreq;
uniform vec3 uMouse;
uniform float uGravityStrength;
uniform float uAudioLevel;

attribute vec3 aPositionTarget;

varying vec3 vColor;
varying float vDisplacement;

// --- 3D Simplex Noise Implementation by Ashima Arts ---
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - D.yyy;      // Roman version: vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points distributed over a tetrahedron, localized on vertices)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  // 1. Interpolate between start and target positions on GPU
  vec3 blendedPosition = mix(position, aPositionTarget, uProgress);

  // 2. Compute organic simplex noise offset (Vortex Ripple)
  // Incorporate audio levels to dynamically stretch noise amplitude
  float dynamicAmp = uNoiseAmp * (1.0 + uAudioLevel * 0.8);
  vec3 noisePos = blendedPosition * uNoiseFreq + vec3(0.0, uTime * 0.4, 0.0);
  
  float noiseX = snoise(noisePos);
  float noiseY = snoise(noisePos + vec3(42.0));
  float noiseZ = snoise(noisePos + vec3(100.0));
  vec3 noiseOffset = vec3(noiseX, noiseY, noiseZ) * dynamicAmp;

  // Apply noise displacement
  vec3 finalPos = blendedPosition + noiseOffset;

  // 3. Mouse Gravity Field interaction (Attractor/Repeller)
  // Distance between particle and raycasted 3D mouse vector
  float distToMouse = distance(finalPos, uMouse);
  if (distToMouse < 2.5 && uGravityStrength > 0.01) {
    vec3 dir = finalPos - uMouse;
    float force = (2.5 - distToMouse) / 2.5; // Normalized range 0 to 1
    
    // Repulsion or attraction vector distortion
    finalPos += normalize(dir) * force * uGravityStrength * 0.6;
  }

  // 4. Calculate size and pass variables to Fragment Shader
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspective size attenuation
  float baseSize = 45.0 * (1.0 + uAudioLevel * 0.6);
  gl_PointSize = baseSize * (1.0 / -mvPosition.z);

  // Pass varying colors and displacement back
  vDisplacement = noiseX;
  
  // Height/Radius-based color mix (interpolated)
  vColor = finalPos;
}
`;

export const fragmentShader = `
uniform float uColorTheme; // 0 = Cyberpunk, 1 = Aurora, 2 = Solar, 3 = Cosmic
uniform float uTime;

varying vec3 vColor;
varying float vDisplacement;

// Harmonic Color Palettes
vec3 getPaletteColor(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  // 1. Render soft round particle instead of hard squares
  // Radial distance from point center (0.5, 0.5)
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;

  // Light bloom formula
  float strength = 1.0 - (dist * 2.0);
  strength = pow(strength, 2.8); // sharper center, soft glow halo

  // 2. Select vibrant color based on theme and position displacement
  vec3 color = vec3(1.0);
  float radius = length(vColor.xz) * 0.28;
  float heightFactor = (vColor.y + 1.5) * 0.35;
  
  // Mix color variables
  float blendVal = radius * 0.6 + heightFactor * 0.4 + vDisplacement * 0.15;

  if (uColorTheme < 0.5) {
    // 💖 Cyberpunk: Neon Pink & Cyber Blue
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    color = getPaletteColor(blendVal, a, b, c, d);
  } 
  else if (uColorTheme < 1.5) {
    // 💚 Aurora: Neon Teal, Aqua & Mint
    vec3 a = vec3(0.2, 0.8, 0.5);
    vec3 b = vec3(0.1, 0.5, 0.8);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.1, 0.2);
    color = getPaletteColor(blendVal, a, b, c, d);
  }
  else if (uColorTheme < 2.5) {
    // 💛 Solar Flare: Golden Orange, Yellow, Crimson
    vec3 a = vec3(0.8, 0.4, 0.1);
    vec3 b = vec3(0.9, 0.8, 0.2);
    vec3 c = vec3(1.0, 0.5, 0.1);
    vec3 d = vec3(0.1, 0.2, 0.4);
    color = getPaletteColor(blendVal, a, b, c, d);
  }
  else {
    // 💜 Cosmic Void: Royal Purple, Dark Magenta, Indigo
    vec3 a = vec3(0.4, 0.1, 0.8);
    vec3 b = vec3(0.5, 0.1, 0.4);
    vec3 c = vec3(0.8, 0.8, 0.8);
    vec3 d = vec3(0.0, 0.25, 0.25);
    color = getPaletteColor(blendVal, a, b, c, d);
  }

  // Multiply color intensity with radial light glow alpha
  gl_FragColor = vec4(color, strength * 0.85);
}
`;
