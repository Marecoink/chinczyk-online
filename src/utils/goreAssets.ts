// --- High-Quality Procedural Vector Assets for Gore, Scorch, and Electric Marks ---

function svgToDataUrl(svg: string): string {
  const utf8Bytes = new TextEncoder().encode(svg);
  let binary = "";
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return "data:image/svg+xml;base64," + btoa(binary);
}

// 3 variations of Blood Splatters (Red / Gory)
const blood1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Core splatter -->
  <path d="M 50,50 C 40,40 30,52 32,60 C 34,68 45,72 52,68 C 60,64 68,58 60,45 C 55,38 50,42 50,50 Z" fill="#b91c1c" />
  <!-- Splat droplets -->
  <circle cx="25" cy="45" r="4" fill="#991b1b" />
  <circle cx="28" cy="35" r="2" fill="#b91c1c" />
  <circle cx="70" cy="52" r="3.5" fill="#991b1b" />
  <circle cx="65" cy="70" r="5" fill="#7f1d1d" />
  <circle cx="48" cy="30" r="3" fill="#b91c1c" />
  <circle cx="38" cy="74" r="2.5" fill="#991b1b" />
  <!-- Dripping lines -->
  <path d="M 32,60 Q 24,68 20,64" fill="none" stroke="#991b1b" stroke-width="2.5" stroke-linecap="round" />
  <path d="M 60,45 Q 72,40 76,46" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" />
</svg>
`;

const blood2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Big explosion splat -->
  <path d="M 50,50 
           L 42,32 Q 50,38 58,30 
           L 62,45 Q 68,40 74,48 
           L 58,58 Q 62,68 52,72 
           L 44,58 Q 32,65 36,52 Z" fill="#991b1b" />
  <!-- Droplets flying away -->
  <circle cx="50" cy="18" r="3" fill="#b91c1c" />
  <circle cx="82" cy="46" r="2" fill="#7f1d1d" />
  <circle cx="54" cy="82" r="3.5" fill="#991b1b" />
  <circle cx="22" cy="54" r="2.5" fill="#b91c1c" />
  <circle cx="30" cy="28" r="4" fill="#7f1d1d" />
  <circle cx="72" cy="72" r="3" fill="#991b1b" />
</svg>
`;

const blood3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Dynamic radial slash and droplets -->
  <path d="M 15,25 Q 50,50 85,75" fill="none" stroke="#7f1d1d" stroke-width="12" stroke-linecap="round" />
  <path d="M 22,28 Q 50,50 78,72" fill="none" stroke="#b91c1c" stroke-width="6" stroke-linecap="round" />
  <circle cx="35" cy="52" r="5" fill="#991b1b" />
  <circle cx="65" cy="48" r="4" fill="#b91c1c" />
  <circle cx="50" cy="38" r="6" fill="#7f1d1d" />
  <circle cx="20" cy="15" r="3" fill="#b91c1c" />
  <circle cx="80" cy="85" r="4" fill="#991b1b" />
</svg>
`;

// 3 variations of Scorch Marks (Carbon/Explosion ash)
const scorch1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="ash" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#111111" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#333333" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#555555" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Main smoke fade -->
  <circle cx="50" cy="50" r="45" fill="url(#ash)" />
  <!-- Jagged cracks/burn marks -->
  <path d="M 50,50 L 25,35 L 18,38" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" />
  <path d="M 50,50 L 72,28 L 78,34" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
  <path d="M 50,50 L 40,78 L 48,82" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round" />
  <path d="M 50,50 L 78,65 L 82,60" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" />
  <!-- Small burnt debris -->
  <circle cx="35" cy="40" r="2.5" fill="#000" />
  <circle cx="60" cy="65" r="1.5" fill="#000" />
  <circle cx="55" cy="35" r="3" fill="#111" />
</svg>
`;

const scorch2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Shockwave ring blast -->
  <circle cx="50" cy="50" r="38" fill="none" stroke="#111111" stroke-width="5" stroke-dasharray="10 5" opacity="0.8" />
  <circle cx="50" cy="50" r="22" fill="#000000" opacity="0.85" />
  <!-- Blown outward streaks -->
  <path d="M 50,15 L 50,5" stroke="#111" stroke-width="3" stroke-linecap="round" />
  <path d="M 50,85 L 50,95" stroke="#111" stroke-width="3" stroke-linecap="round" />
  <path d="M 15,50 L 5,50" stroke="#111" stroke-width="3" stroke-linecap="round" />
  <path d="M 85,50 L 95,50" stroke="#111" stroke-width="3" stroke-linecap="round" />
  <path d="M 25,25 L 18,18" stroke="#111" stroke-width="2" stroke-linecap="round" />
  <path d="M 75,75 L 82,82" stroke="#111" stroke-width="2" stroke-linecap="round" />
</svg>
`;

const scorch3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="fireAsh" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ea580c" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#1c1917" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Burnt ground with ember center -->
  <circle cx="50" cy="50" r="42" fill="url(#fireAsh)" />
  <!-- Ember speckles -->
  <circle cx="46" cy="48" r="1.8" fill="#f97316" />
  <circle cx="54" cy="52" r="1.5" fill="#f97316" />
  <circle cx="48" cy="56" r="1.2" fill="#ef4444" />
  <!-- Giant splitting crack -->
  <path d="M 12,50 C 30,52 40,48 50,50 C 60,52 70,45 88,50" fill="none" stroke="#000000" stroke-width="4.5" stroke-linecap="round" />
</svg>
`;

// 3 variations of Electric Marks (Electrocution burns / Blue lightning)
const electric1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Crackling discharge -->
  <path d="M 50,50 L 40,32 L 25,35" fill="none" stroke="#06b6d4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 50,50 L 58,68 L 74,65" fill="none" stroke="#06b6d4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 50,50 L 68,42 L 72,25" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 50,50 L 32,58 L 22,70" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Inner hot white sparks -->
  <path d="M 50,50 L 40,32 L 25,35 M 50,50 L 58,68 L 74,65 M 50,50 L 68,42" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
  <!-- Ground burn under electricity -->
  <circle cx="50" cy="50" r="15" fill="#1e293b" opacity="0.6" />
</svg>
`;

const electric2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Cyber-electric EMP target mesh -->
  <circle cx="50" cy="50" r="40" fill="url(#glow)" />
  <!-- Hexagonal electric grid lines -->
  <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-dasharray="4 2" />
  <polygon points="50,30 67,40 67,60 50,70 33,60 33,40" fill="none" stroke="#60a5fa" stroke-width="1.5" />
  <!-- Tiny sparks -->
  <circle cx="35" cy="30" r="2" fill="#fff" />
  <circle cx="65" cy="70" r="2" fill="#fff" />
</svg>
`;

const electric3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Spiral vortex of lightning zaps -->
  <path d="M 50,50 Q 30,35 15,48" fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round" />
  <path d="M 50,50 Q 70,65 85,52" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />
  <path d="M 50,50 Q 65,30 52,15" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
  <path d="M 50,50 Q 35,70 48,85" fill="none" stroke="#a855f7" stroke-width="3" stroke-linecap="round" />
  
  <circle cx="50" cy="50" r="6" fill="#ffffff" />
</svg>
`;

export const GORE_MARKS = {
  blood: [svgToDataUrl(blood1), svgToDataUrl(blood2), svgToDataUrl(blood3)],
  scorch: [svgToDataUrl(scorch1), svgToDataUrl(scorch2), svgToDataUrl(scorch3)],
  electric: [svgToDataUrl(electric1), svgToDataUrl(electric2), svgToDataUrl(electric3)],
};
