import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GORE_MARKS } from "../utils/goreAssets";
import { playCaptureSound } from "../utils/audio";

// --- Types ---
export interface GoreMark {
  id: string;
  x: number;
  z: number;
  type: "blood" | "scorch" | "electric";
  color: string;
  rotation: number;
  scale: number;
  variantIndex: number; // to select one of the 3 SVG variants
}

interface Particle {
  id: number;
  pos: [number, number, number];
  vel: [number, number, number];
  size: number;
  color: string;
  maxLife: number;
  life: number; // 0 to maxLife
  type: "blood" | "ember" | "spark" | "lightning";
}

interface ActiveEmitter {
  id: string;
  x: number;
  z: number;
  type: "blood" | "scorch" | "electric";
  color: string;
}

// Custom hook to load SVG data URL textures safely and reliably
function useGoreTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      const tex = new THREE.CanvasTexture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    };
    img.onerror = (e) => {
      console.warn("Failed to load SVG data URL in browser:", e);
    };
    img.src = url;
    return () => {
      active = false;
    };
  }, [url]);

  return texture;
}

// --- Component for a Single Persistent Mark ---
const DecalMark = ({ mark }: { mark: GoreMark }) => {
  const svgUrl = GORE_MARKS[mark.type][mark.variantIndex];
  const texture = useGoreTexture(svgUrl);

  if (!texture) return null;

  // Calculate a reliable string-hash to stagger heights above the board cells (which are around y = 0.07)
  let hash = 0;
  for (let i = 0; i < mark.id.length; i++) {
    hash = (hash << 5) - hash + mark.id.charCodeAt(i);
    hash |= 0;
  }
  const staggerHeight = 0.12 + (Math.abs(hash) % 100) * 0.001;

  // Adjust color multiplier or overlay to match the victim's player color for blood splatters!
  const displayColor = mark.type === "blood" ? getBloodColor(mark.color) : "#ffffff";

  return (
    <mesh 
      position={[mark.x, staggerHeight, mark.z]} 
      rotation={[-Math.PI / 2, 0, mark.rotation]} 
      scale={[mark.scale, mark.scale, 1]}
    >
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial 
        map={texture} 
        color={displayColor} 
        transparent={true} 
        polygonOffset={true}
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
        depthWrite={true}
        toneMapped={false} 
      />
    </mesh>
  );
};

// Map color name to hexadecimal representation of blood (different alien blood colors for fun!)
function getBloodColor(color: string): string {
  switch (color.toLowerCase()) {
    case "red": return "#ef4444"; // rich red blood
    case "green": return "#22c55e"; // green alien blood!
    case "blue": return "#3b82f6"; // neon blue royal blood!
    case "yellow": return "#eab308"; // glowing yellow/acid blood!
    default: return "#dc2626";
  }
}

// --- Component for Active Particle Systems ---
const ParticleSystem = ({ emitter, onComplete }: { emitter: ActiveEmitter; onComplete: () => void }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shockwaveScale, setShockwaveScale] = useState(0.1);
  const [shockwaveOpacity, setShockwaveOpacity] = useState(1.0);
  const [flashScale, setFlashScale] = useState(0.1);
  const [flashOpacity, setFlashOpacity] = useState(1.0);
  const startTime = useRef(Date.now());

  // Initialize particles once based on emitter type
  useEffect(() => {
    const temp: Particle[] = [];
    const count = emitter.type === "blood" ? 35 : emitter.type === "scorch" ? 45 : 30;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      
      let vel: [number, number, number] = [0, 0, 0];
      let pColor = "#ffffff";
      let size = 0.05 + Math.random() * 0.12;
      let maxLife = 0.6 + Math.random() * 0.6;
      let pType: "blood" | "ember" | "spark" | "lightning" = "blood";

      if (emitter.type === "blood") {
        // Explode outward radially + upward
        vel = [
          Math.cos(angle) * speed * 1.2,
          2.0 + Math.random() * 4.0,
          Math.sin(angle) * speed * 1.2
        ];
        pColor = getBloodColor(emitter.color);
        pType = "blood";
      } else if (emitter.type === "scorch") {
        // Fire embers rising and expanding
        vel = [
          Math.cos(angle) * speed * 0.8,
          1.5 + Math.random() * 3.0,
          Math.sin(angle) * speed * 0.8
        ];
        pColor = Math.random() > 0.4 ? "#f97316" : Math.random() > 0.5 ? "#ef4444" : "#eab308"; // orange, red, yellow fire
        pType = "ember";
        size = 0.08 + Math.random() * 0.15;
        maxLife = 0.4 + Math.random() * 0.5;
      } else if (emitter.type === "electric") {
        // Electrical cyan/magenta sparks cracking in all directions
        vel = [
          (Math.random() - 0.5) * 6.0,
          (Math.random() - 0.5) * 6.0,
          (Math.random() - 0.5) * 6.0
        ];
        pColor = Math.random() > 0.3 ? "#06b6d4" : "#a855f7"; // cyan/neon purple
        pType = "spark";
        size = 0.04 + Math.random() * 0.08;
        maxLife = 0.3 + Math.random() * 0.4;
      }

      temp.push({
        id: i,
        pos: [emitter.x, 0.1, emitter.z],
        vel,
        size,
        color: pColor,
        maxLife,
        life: maxLife,
        type: pType
      });
    }

    // Add some electrical lightning meshes if electric
    if (emitter.type === "electric") {
      for (let i = 0; i < 5; i++) {
        temp.push({
          id: 100 + i,
          pos: [emitter.x, 0.1, emitter.z],
          vel: [0, 0, 0], // static lightning frame
          size: 0.05 + Math.random() * 0.05,
          color: "#ffffff",
          maxLife: 0.15 + Math.random() * 0.1,
          life: 0.15 + Math.random() * 0.1,
          type: "lightning"
        });
      }
    }

    setParticles(temp);
  }, [emitter]);

  // Frame animation loop for physics & properties
  useFrame((state, delta) => {
    const elapsed = (Date.now() - startTime.current) / 1000;

    // Remove emitter after 1.8 seconds max
    if (elapsed >= 1.6) {
      onComplete();
      return;
    }

    // Dynamic flash explosion bubble scale/opacity
    if (emitter.type === "scorch") {
      setFlashScale(0.1 + elapsed * 8.5);
      setFlashOpacity(Math.max(0, 1.0 - elapsed * 2.5));
      setShockwaveScale(0.2 + elapsed * 7.0);
      setShockwaveOpacity(Math.max(0, 1.0 - elapsed * 1.5));
    } else if (emitter.type === "electric") {
      setFlashScale(0.1 + elapsed * 6.0);
      setFlashOpacity(Math.max(0, 1.0 - elapsed * 4.0));
      setShockwaveScale(0.2 + elapsed * 5.0);
      setShockwaveOpacity(Math.max(0, 1.0 - elapsed * 2.0));
    } else if (emitter.type === "blood") {
      setShockwaveScale(0.2 + elapsed * 4.0);
      setShockwaveOpacity(Math.max(0, 1.0 - elapsed * 2.0));
    }

    // Update active particles
    setParticles((prev) =>
      prev
        .map((p) => {
          const nextLife = p.life - delta;
          if (nextLife <= 0) return null;

          const nextPos: [number, number, number] = [
            p.pos[0] + p.vel[0] * delta,
            p.pos[1] + p.vel[1] * delta,
            p.pos[2] + p.vel[2] * delta
          ];

          // Physics updates
          let nextVel = { ...p.vel };
          if (p.type === "blood") {
            // Blood droplets have gravity + air resistance
            p.vel[1] -= 9.8 * delta; 
            p.vel[0] *= 0.96;
            p.vel[2] *= 0.96;
          } else if (p.type === "ember") {
            // Embers rise (reversed gravity/buoyancy)
            p.vel[1] += 2.0 * delta;
            p.vel[0] *= 0.95;
            p.vel[2] *= 0.95;
          } else if (p.type === "spark") {
            // Electric sparks fade immediately, with high speed
            p.vel[0] *= 0.9;
            p.vel[1] *= 0.9;
            p.vel[2] *= 0.9;
          }

          // Bound blood drops to the ground level so they splat!
          if (p.type === "blood" && nextPos[1] <= 0.08) {
            nextPos[1] = 0.08;
            p.vel[0] = 0;
            p.vel[1] = 0;
            p.vel[2] = 0;
          }

          return {
            ...p,
            pos: nextPos,
            life: nextLife
          };
        })
        .filter((p): p is Particle => p !== null)
    );
  });

  return (
    <group>
      {/* 1. Expandable Explosion / Flash sphere */}
      {emitter.type === "scorch" && flashOpacity > 0 && (
        <mesh position={[emitter.x, 0.4, emitter.z]} scale={[flashScale, flashScale, flashScale]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial 
            color="#f59e0b" 
            transparent={true} 
            opacity={flashOpacity * 0.8} 
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 2. Ring Shockwave lying flat on the ground */}
      {shockwaveOpacity > 0 && (
        <mesh 
          position={[emitter.x, 0.08, emitter.z]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          scale={[shockwaveScale, shockwaveScale, 1]}
        >
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial 
            color={
              emitter.type === "blood" 
                ? getBloodColor(emitter.color) 
                : emitter.type === "scorch" 
                  ? "#ef4444" 
                  : "#06b6d4"
            } 
            transparent={true} 
            opacity={shockwaveOpacity} 
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 3. Render 3D particles */}
      {particles.map((p) => {
        const opacity = p.life / p.maxLife;

        if (p.type === "lightning") {
          // Render jagged lightning lines/cylinders
          const randomTargetX = emitter.x + (Math.random() - 0.5) * 1.5;
          const randomTargetZ = emitter.z + (Math.random() - 0.5) * 1.5;
          return (
            <group key={p.id}>
              <line>
                <bufferGeometry attach="geometry">
                  <float32BufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array([
                        emitter.x, 0.08, emitter.z,
                        emitter.x + (randomTargetX - emitter.x) * 0.5, 0.8, emitter.z + (randomTargetZ - emitter.z) * 0.5,
                        randomTargetX, 0.08, randomTargetZ
                      ]),
                      3
                    ]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#ffffff" linewidth={3} transparent opacity={opacity} toneMapped={false} />
              </line>
              <line>
                <bufferGeometry attach="geometry">
                  <float32BufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array([
                        emitter.x, 0.08, emitter.z,
                        emitter.x + (randomTargetX - emitter.x) * 0.5, 0.8, emitter.z + (randomTargetZ - emitter.z) * 0.5,
                        randomTargetX, 0.08, randomTargetZ
                      ]),
                      3
                    ]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#06b6d4" linewidth={10} transparent opacity={opacity * 0.4} toneMapped={false} />
              </line>
            </group>
          );
        }

        // Render spherical or box-like particles
        return (
          <mesh key={p.id} position={p.pos}>
            {p.type === "blood" ? (
              <sphereGeometry args={[p.size, 6, 6]} />
            ) : (
              <boxGeometry args={[p.size, p.size, p.size]} />
            )}
            <meshBasicMaterial 
              color={p.color} 
              transparent={true} 
              opacity={opacity} 
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// --- Main Combined Gore & Effects Component ---
export default function GoreEffects({ goreMarks = [] }: { goreMarks: GoreMark[] }) {
  const [activeEmitters, setActiveEmitters] = useState<ActiveEmitter[]>([]);
  const previousMarksLength = useRef(goreMarks.length);
  const processedMarkIds = useRef<Set<string>>(new Set());

  // Initialize processedMarkIds with existing marks so we don't trigger effects on loading them
  useEffect(() => {
    goreMarks.forEach(m => processedMarkIds.current.add(m.id));
    previousMarksLength.current = goreMarks.length;
  }, []);

  // Detect when a new mark is added to trigger audio & visual effects!
  useEffect(() => {
    if (goreMarks.length > previousMarksLength.current) {
      // Find the new marks
      const newMarks = goreMarks.filter(m => !processedMarkIds.current.has(m.id));

      newMarks.forEach((mark) => {
        processedMarkIds.current.add(mark.id);

        // 1. Play funny custom pain sounds or synth sounds
        playCaptureSound(mark.type);

        // 2. Add temporary active particle emitter locally
        const newEmitter: ActiveEmitter = {
          id: mark.id,
          x: mark.x,
          z: mark.z,
          type: mark.type,
          color: mark.color
        };

        setActiveEmitters((prev) => [...prev, newEmitter]);
      });
    }
    previousMarksLength.current = goreMarks.length;
  }, [goreMarks]);

  const removeEmitter = (id: string) => {
    setActiveEmitters((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <group>
      {/* Persistent blood/scorch/electric decals on the board */}
      {goreMarks.map((mark) => (
        <DecalMark key={mark.id} mark={mark} />
      ))}

      {/* Temporary flying particles & shockwaves */}
      {activeEmitters.map((emitter) => (
        <ParticleSystem 
          key={emitter.id} 
          emitter={emitter} 
          onComplete={() => removeEmitter(emitter.id)} 
        />
      ))}
    </group>
  );
}
