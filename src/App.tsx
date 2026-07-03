import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Edges } from "@react-three/drei";
import { useState, useEffect, useRef, useMemo } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, Send, Users } from "lucide-react";
import * as THREE from "three";
import { io } from "socket.io-client";

// Generate/retrieve persistent playerId
const playerId = (() => {
  let pid = localStorage.getItem("chinczyk_player_id");
  if (!pid) {
    pid = "player_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("chinczyk_player_id", pid);
  }
  return pid;
})();

// Connect to the socket server at the same origin with persistent playerId
const socket = io(window.location.origin, {
  query: { playerId }
});

const colorTheme = {
  red: "#d62828",
  green: "#1b9e31",
  blue: "#1d6bc2",
  yellow: "#e8c913",
  purple: "#a855f7",
  orange: "#f97316",
  white: "#ffffff",
  black: "#111111",
  gray: "#6b7280"
};

const players = ["red", "green", "yellow", "blue"];

import { predefinedAvatars, predefinedMapUrls } from "./predefinedAssets";
import GoreEffects, { GoreMark } from "./components/GoreEffects";

const pathPositions: Record<string, [number, number][]> = {
  blue: [
    [1, -5], [1, -4], [1, -3], [1, -2], [1, -1],
    [2, -1], [3, -1], [4, -1], [5, -1],
    [5, 0], [5, 1],
    [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
    [0, 5], [-1, 5],
    [-1, 4], [-1, 3], [-1, 2], [-1, 1],
    [-2, 1], [-3, 1], [-4, 1], [-5, 1],
    [-5, 0], [-5, -1],
    [-4, -1], [-3, -1], [-2, -1], [-1, -1], [-1, -2], [-1, -3], [-1, -4], [-1, -5], [0, -5]
  ],
  red: [
    [5, 1],
    [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
    [0, 5], [-1, 5],
    [-1, 4], [-1, 3], [-1, 2], [-1, 1],
    [-2, 1], [-3, 1], [-4, 1], [-5, 1],
    [-5, 0], [-5, -1],
    [-4, -1], [-3, -1], [-2, -1], [-1, -1], [-1, -2], [-1, -3], [-1, -4], [-1, -5], [0, -5], [1, -5], [1, -4], [1, -3], [1, -2], [1, -1],
    [2, -1], [3, -1], [4, -1], [5, -1],
    [5, 0]
  ],
  green: [
    [-1, 5],
    [-1, 4], [-1, 3], [-1, 2], [-1, 1],
    [-2, 1], [-3, 1], [-4, 1], [-5, 1],
    [-5, 0], [-5, -1],
    [-4, -1], [-3, -1], [-2, -1], [-1, -1], [-1, -2], [-1, -3], [-1, -4], [-1, -5], [0, -5], [1, -5], [1, -4], [1, -3], [1, -2], [1, -1],
    [2, -1], [3, -1], [4, -1], [5, -1],
    [5, 0], [5, 1],
    [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
    [0, 5]
  ],
  yellow: [
    [-5, -1],
    [-4, -1], [-3, -1], [-2, -1], [-1, -1], [-1, -2], [-1, -3], [-1, -4], [-1, -5], [0, -5], [1, -5], [1, -4], [1, -3], [1, -2], [1, -1],
    [2, -1], [3, -1], [4, -1], [5, -1],
    [5, 0], [5, 1],
    [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
    [0, 5], [-1, 5],
    [-1, 4], [-1, 3], [-1, 2], [-1, 1],
    [-2, 1], [-3, 1], [-4, 1], [-5, 1],
    [-5, 0],
  ],
};

const startExitCells: Record<string, { pos: [number, number]; lightColor: string }> = {
  blue: { pos: [1, -5], lightColor: "#5ab4f2" }, 
  red: { pos: [5, 1], lightColor: "#f25a5a" },  
  green: { pos: [-1, 5], lightColor: "#5af276" }, 
  yellow: { pos: [-5, -1], lightColor: "#f2dc5a" },
};

const startCells = Object.values(startExitCells).map(({ pos, lightColor }) => ({
  position: pos, color: lightColor,
}));

const finishPaths = [
  { color: "yellow", coords: [[-4, 0], [-3, 0], [-2, 0], [-1, 0]] as [number, number][] },
  { color: "green", coords: [[0, 4], [0, 3], [0, 2], [0, 1]] as [number, number][] },
  { color: "red", coords: [[4, 0], [3, 0], [2, 0], [1, 0]] as [number, number][] },
  { color: "blue", coords: [[0, -4], [0, -3], [0, -2], [0, -1]] as [number, number][] }
];

const baseCells = [
  ...[[-6, -6], [-6, -5], [-5, -6], [-5, -5]].map(pos => ({ position: pos as [number, number], color: "yellow" })),
  ...[[-6, 6], [-6, 5], [-5, 6], [-5, 5]].map(pos => ({ position: pos as [number, number], color: "green" })),
  ...[[6, 6], [6, 5], [5, 6], [5, 5]].map(pos => ({ position: pos as [number, number], color: "red" })),
  ...[[6, -6], [6, -5], [5, -6], [5, -5]].map(pos => ({ position: pos as [number, number], color: "blue" })),
];

const allCells = [
  ...Object.values(pathPositions).flatMap(path => path.map(pos => ({ position: pos, color: "white" }))),
  ...finishPaths.flatMap(p => p.coords.map(pos => ({ position: pos, color: p.color }))),
  ...baseCells,
  ...startCells
];

const arrowRotations: Record<string, number> = {
  blue: Math.PI,
  red: Math.PI / 2,
  green: 0,
  yellow: -Math.PI / 2
};

const diceRotations: Record<number, [number, number, number]> = {
  1: [-Math.PI / 2, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [0, 0, 0], 
  4: [Math.PI, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI / 2, 0, 0]
};

const dicePositions: Record<string, [number, number, number]> = {
  blue: [7.5, 0.5, -7.5],
  red: [7.5, 0.5, 7.5],
  green: [-7.5, 0.5, 7.5],
  yellow: [-7.5, 0.5, -7.5],
};

// --- Custom Texture Hook with Procedural Fallbacks ---
function useSafeTexture(url: any, fallbackColor: string = "#1e293b") {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const safeUrlString = useMemo(() => {
    if (typeof url === 'string') return url;
    if (typeof url === 'object' && url !== null && 'url' in url) return url.url;
    return null;
  }, [url]);

  useEffect(() => {
    // ZMIANA: Usunięto sztuczną blokadę AI Studio dla ścieżek lokalnych
    if (!safeUrlString) {
      // Create procedural fallback ONLY if no avatar/map is selected
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 236, 236);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
      return;
    }

    // Load actual user base64 data URL or local image
    const loader = new THREE.TextureLoader();
    loader.load(
      safeUrlString,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        // Fallback on load error (e.g. wrong file name)
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = fallbackColor;
          ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 4;
          ctx.strokeRect(10, 10, 236, 236);
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Błąd", 128, 128);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      }
    );
  }, [safeUrlString, fallbackColor]);

  return texture;
}

function DiceFace({ value, position, rotation }: { value: number; position: number[]; rotation: number[] }) {
  const dots: number[][] = [];
  if ([1, 3, 5].includes(value)) dots.push([0, 0, 0.01]);
  if ([2, 3, 4, 5, 6].includes(value)) {
    dots.push([-0.25, 0.25, 0.01]);
    dots.push([0.25, -0.25, 0.01]);
  }
  if ([4, 5, 6].includes(value)) {
    dots.push([0.25, 0.25, 0.01]);
    dots.push([-0.25, -0.25, 0.01]);
  }
  if (value === 6) {
    dots.push([-0.25, 0, 0.01]);
    dots.push([0.25, 0, 0.01]);
  }

  return (
    <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
      <mesh>
        <planeGeometry args={[0.96, 0.96]} />
        <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
      </mesh>
      {dots.map((pos, i) => (
        <mesh key={i} position={new THREE.Vector3(...pos)}>
          <circleGeometry args={[0.1, 16]} />
          <meshBasicMaterial color="black" />
        </mesh>
      ))}
    </group>
  );
}

function Dice3D({ value, currentPlayer, position, isRolling }: { value: number | null; currentPlayer: string; position: [number, number, number]; isRolling: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null); 
  const lastValue = useRef(3); 
  if (value) lastValue.current = value;

  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    const targetArr = position || [7.5, 0.5, -7.5];
    const targetPos = new THREE.Vector3(...targetArr);
    const pos = groupRef.current.position;
    const dx = targetPos.x - pos.x;
    const dz = targetPos.z - pos.z;
    const dist2D = Math.sqrt(dx * dx + dz * dz);

    if (dist2D > 0.1) {
      pos.x = THREE.MathUtils.lerp(pos.x, targetPos.x, 0.3);
      pos.z = THREE.MathUtils.lerp(pos.z, targetPos.z, 0.3);
      pos.y = Math.abs(Math.sin(dist2D * 2)) * 1.5 + 0.5; 
      meshRef.current.rotation.x += delta * 35;
      meshRef.current.rotation.y += delta * 35;
    } else {
      pos.x = targetPos.x;
      pos.z = targetPos.z;

      if (isRolling) {
        meshRef.current.rotation.x += delta * 60;
        meshRef.current.rotation.y += delta * 50;
        pos.y = Math.abs(Math.sin(state.clock.elapsedTime * 60)) * 0.8 + 0.5;
      } else {
        pos.y = THREE.MathUtils.lerp(pos.y, 0.5, 0.5); 
        const targetRot = diceRotations[lastValue.current] || [0, 0, 0];
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(...targetRot));
        meshRef.current.quaternion.slerp(targetQuat, 0.5); 
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
      <group ref={meshRef}>
        <DiceFace value={1} position={[0, 0, 0.5]} rotation={[0, 0, 0]} />
        <DiceFace value={6} position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]} />
        <DiceFace value={2} position={[0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <DiceFace value={5} position={[-0.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <DiceFace value={3} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        <DiceFace value={4} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshStandardMaterial color="white" />
          <Edges scale={1.02} threshold={15} color="black" />
        </mesh>
      </group>
    </group>
  );
}

function Cell({ position, color = "white" }: { position: [number, number]; color?: string }) {
  const displayColor = colorTheme[color as keyof typeof colorTheme] || color;
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.96, 0.1, 0.96]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.9]} />
        <meshStandardMaterial color={displayColor} roughness={0.4} metalness={0.1} />
        <Edges scale={1.01} threshold={15} color="black" />
      </mesh>
    </group>
  );
}

// Draw procedural arrow to eliminate loading /arrow.png image dependencies
function StartArrow({ position, rotationZ = 0 }: { position: [number, number]; rotationZ?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      // Sleek white glowing arrow
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(64, 15);
      ctx.lineTo(105, 65);
      ctx.lineTo(78, 65);
      ctx.lineTo(78, 115);
      ctx.lineTo(50, 115);
      ctx.lineTo(50, 65);
      ctx.lineTo(23, 65);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh position={[position[0], 0.15, position[1]]} rotation={[-Math.PI / 2, 0, rotationZ]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

function BoardBackground({ mapUrl }: { mapUrl: string | null }) {
  const texture = useSafeTexture(mapUrl, "#0f172a");
  return (
    <Box args={[16, 0.2, 16]} position={[0, -0.25, 0]}>
      {texture ? (
        <meshBasicMaterial map={texture} color="#ffffff" toneMapped={false} />
      ) : (
        <meshBasicMaterial color="#0f172a" />
      )}
      <Edges scale={1.001} threshold={15} color="black" />
    </Box>
  );
}

function generateBoard(mapUrl: string | null, geometry: any) {
  return [
    <Cell key="center" position={[0, 0]} color="black" />,
    ...geometry.allCells.map(({ position, color }: any, i: number) => {
      for (const [key, val] of Object.entries(geometry.startExitCells)) {
        const { pos, lightColor } = val as any;
        if (Math.abs(position[0] - pos[0]) < 0.01 && Math.abs(position[1] - pos[1]) < 0.01) {
          return (
            <group key={`cell-${i}`}>
              <Cell position={position as [number, number]} color={lightColor} />
              <StartArrow position={position as [number, number]} rotationZ={geometry.arrowRotations[key]} />
            </group>
          );
        }
      }
      return <Cell key={`cell-${i}`} position={position as [number, number]} color={color} />;
    }),
    <BoardBackground key="background" mapUrl={mapUrl} />
  ];
}

interface PawnProps {
  position: [number, number];
  color: string;
  onClick?: () => void;
  isActive: boolean;
  avatarUrl: string | null;
}

function Pawn({ position, color, onClick, isActive, avatarUrl }: PawnProps) {
  // --- ZMIANA: Wyciągnięcie odpowiedniego URL ---
  const safeAvatarUrl = typeof avatarUrl === 'object' && avatarUrl !== null && 'url' in avatarUrl 
    ? (avatarUrl as any).url 
    : avatarUrl;

  const texture = useSafeTexture(safeAvatarUrl, colorTheme[color as keyof typeof colorTheme] || color);
  const displayColor = colorTheme[color as keyof typeof colorTheme] || color; 
  const handleClick = (event: any) => {
    event.stopPropagation();
    if (isActive && onClick) onClick();
  };
  return (
    <group position={[position[0], 0.6, position[1]]} onClick={handleClick}>
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      {safeAvatarUrl && texture ? (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.75, 0.95, 0.1]} />
          <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
          <Edges scale={1.01} threshold={15} color="black" />
          <mesh position={[0, 0, 0.052]}>
            <planeGeometry args={[0.7, 0.9]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.052]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.7, 0.9]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} />
          </mesh>
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.3, 0.7, 32]} />
            <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
            <Edges scale={1.02} threshold={15} color="black" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
            <Edges scale={1.05} threshold={15} color="black" />
          </mesh>
        </>
      )}
      {isActive && (
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[0.1, 0.2, 4]} />
          <meshBasicMaterial color="#ffff00" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// --- MAIN APPLICATION CLIENT ---
export default function App() {
  const [appPhase, setAppPhase] = useState("lobby");
  const [gameMode, setGameMode] = useState<"classic" | "six_player">("classic");
  const [activePlayerCount, setActivePlayerCount] = useState(4);

  const geometry = useMemo(() => {
    if (gameMode === "classic") {
      const playersList = ["red", "green", "yellow", "blue"];
      const theme = {
        red: "#d62828",
        green: "#1b9e31",
        blue: "#1d6bc2",
        yellow: "#e8c913",
        white: "#ffffff",
        black: "#111111",
        gray: "#6b7280"
      };

      const allC = [
        ...Object.values(pathPositions).flatMap(path => path.map(pos => ({ position: pos, color: "white" }))),
        ...finishPaths.flatMap(p => p.coords.map(pos => ({ position: pos, color: p.color }))),
        ...baseCells,
        ...startCells
      ];

      return {
        players: playersList,
        colorTheme: theme,
        pathPositions: pathPositions,
        startExitCells: startExitCells,
        startCells: startCells,
        finishPaths: finishPaths,
        baseCells: baseCells,
        arrowRotations: arrowRotations,
        dicePositions: dicePositions,
        allCells: allC
      };
    } else {
      const playersList = ["red", "purple", "green", "yellow", "orange", "blue"];
      const theme = {
        red: "#d62828",
        purple: "#a855f7",
        green: "#1b9e31",
        yellow: "#e8c913",
        orange: "#f97316",
        blue: "#1d6bc2",
        white: "#ffffff",
        black: "#111111",
        gray: "#6b7280"
      };

      const u = (k: number): [number, number] => {
        const angle = (k % 6) * Math.PI / 3;
        return [Math.cos(angle), Math.sin(angle)];
      };

      // Generate the 48 spaces of the outer track
      const track: [number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const vk = u(k);
        const vkPrev = u(k - 1);
        const vkNext = u(k + 1);

        // Right side going out (3 cells)
        for (let r = 2; r <= 4; r++) {
          track.push([r * vk[0] + vkPrev[0], r * vk[1] + vkPrev[1]]);
        }
        // Tip (1 cell)
        track.push([5 * vk[0], 5 * vk[1]]);
        // Left side going in (3 cells)
        for (let r = 4; r >= 2; r--) {
          track.push([r * vk[0] + vkNext[0], r * vk[1] + vkNext[1]]);
        }
        // Inner corner (1 cell)
        track.push([vk[0] + vkNext[0], vk[1] + vkNext[1]]);
      }

      const pathPos: Record<string, [number, number][]> = {};
      playersList.forEach((color, i) => {
        const p: [number, number][] = [];
        const startIndex = i * 8 + 4; // Start on the left side of arm i
        for (let j = 0; j < 48; j++) {
          p.push(track[(startIndex + j) % 48]);
        }
        pathPos[color] = p;
      });

      const startExit: Record<string, { pos: [number, number]; lightColor: string }> = {};
      playersList.forEach((color, i) => {
        startExit[color] = {
          pos: track[i * 8 + 4],
          lightColor: theme[color as keyof typeof theme]
        };
      });

      const startC = Object.values(startExit).map(({ pos, lightColor }) => ({
        position: pos,
        color: lightColor
      }));

      // Finish paths (home path) for each player, going from outer to inner
      const finishP = playersList.map((color, i) => {
        const vk = u(i);
        return {
          color,
          coords: [
            [4 * vk[0], 4 * vk[1]],
            [3 * vk[0], 3 * vk[1]],
            [2 * vk[0], 2 * vk[1]],
            [1 * vk[0], 1 * vk[1]]
          ] as [number, number][]
        };
      });

      // Base cells for each player: placed adjacent to the left row / start cell
      const baseC: Array<{ position: [number, number]; color: string }> = [];
      playersList.forEach((color, i) => {
        const vk = u(i);
        const vkNext = u(i + 1);

        const bCoords: [number, number][] = [
          [4 * vk[0] + 2 * vkNext[0], 4 * vk[1] + 2 * vkNext[1]],
          [4 * vk[0] + 3 * vkNext[0], 4 * vk[1] + 3 * vkNext[1]],
          [5 * vk[0] + 2 * vkNext[0], 5 * vk[1] + 2 * vkNext[1]],
          [5 * vk[0] + 3 * vkNext[0], 5 * vk[1] + 3 * vkNext[1]]
        ];
        bCoords.forEach(pos => baseC.push({ position: pos, color }));
      });

      const arrowRot: Record<string, number> = {};
      playersList.forEach((color, i) => {
        // Points towards the next cell (which goes inwards towards the center along the -vk direction)
        arrowRot[color] = Math.PI / 2 - (i * Math.PI / 3);
      });

      const dicePos: Record<string, [number, number, number]> = {};
      playersList.forEach((color, i) => {
        const vk = u(i);
        const vkNext = u(i + 1);
        // Positioned beautifully near their base
        dicePos[color] = [5 * vk[0] + 4.2 * vkNext[0], 0.5, 5 * vk[1] + 4.2 * vkNext[1]];
      });

      const allC = [
        ...track.map(pos => ({ position: pos, color: "white" })),
        ...finishP.flatMap(p => p.coords.map(pos => ({ position: pos, color: p.color }))),
        ...baseC
      ];

      return {
        players: playersList,
        colorTheme: theme,
        pathPositions: pathPos,
        startExitCells: startExit,
        startCells: startC,
        finishPaths: finishP,
        baseCells: baseC,
        arrowRotations: arrowRot,
        dicePositions: dicePos,
        allCells: allC
      };
    }
  }, [gameMode]);

  const activePlayers = geometry.players.slice(0, activePlayerCount);

  // --- LOGIN PANEL ---
  const [hasEnteredName, setHasEnteredName] = useState(() => {
    return localStorage.getItem("chinczyk_has_entered_name") === "true";
  });
  const [myPersonalName, setMyPersonalName] = useState(() => {
    return localStorage.getItem("chinczyk_personal_name") || "";
  });

  const [myColor, setMyColor] = useState<string | null>(null);
  const [takenSeats, setTakenSeats] = useState<Record<string, string>>({});
  const [selectedMap, setSelectedMap] = useState<string | null>(predefinedMapUrls[0].url);
  const [gameMaster, setGameMaster] = useState<string | null>(null);

  const [playerNames, setPlayerNames] = useState<Record<string, string>>({
    red: "Gracz 1", green: "Gracz 2", yellow: "Gracz 3", blue: "Gracz 4",
    purple: "Gracz 5", orange: "Gracz 6"
  });
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string | null>>({
    red: null, green: null, yellow: null, blue: null,
    purple: null, orange: null
  });

  const [pawns, setPawns] = useState<Array<{ color: string; positionIndex: number; pawnNumber: number }>>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const currentPlayer = activePlayers[currentPlayerIndex] || "red";
  
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [phase, setPhase] = useState("roll"); 
  const [rollAttempts, setRollAttempts] = useState(0);
  const [isHandling, setIsHandling] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [deadlockMsg, setDeadlockMsg] = useState<string | null>(null); 

  const [chatMessages, setChatMessages] = useState<Array<{ id: number; sender: string; color: string; text: string }>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<Array<{ id: string; playerId: string; name: string }>>([]);
  const [isPlayersPanelExpanded, setIsPlayersPanelExpanded] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPlayersPanelExpanded(appPhase === "lobby");
  }, [appPhase]);

  // --- TURNS TIMERS STATES ---
  const [gameTimeLimit, setGameTimeLimit] = useState<number | null>(null);
  const [playerRemainingTimes, setPlayerRemainingTimes] = useState<Record<string, number>>({});
  const [eliminatedPlayers, setEliminatedPlayers] = useState<string[]>([]);
  const [goreMarks, setGoreMarks] = useState<GoreMark[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    socket.on("state_update", (newState: any) => {
      if (newState.appPhase !== undefined) setAppPhase(newState.appPhase);
      if (newState.gameMode !== undefined) setGameMode(newState.gameMode);
      if (newState.activePlayerCount !== undefined) setActivePlayerCount(newState.activePlayerCount);
      if (newState.selectedMap !== undefined) setSelectedMap(newState.selectedMap);
      if (newState.playerNames !== undefined) setPlayerNames(newState.playerNames);
      if (newState.playerAvatars !== undefined) setPlayerAvatars(newState.playerAvatars);
      if (newState.goreMarks !== undefined) setGoreMarks(newState.goreMarks);
      
      if (newState.gameMaster !== undefined) setGameMaster(newState.gameMaster);
      if (newState.connectedUsers !== undefined) setConnectedUsers(newState.connectedUsers);

      if (newState.gameTimeLimit !== undefined) setGameTimeLimit(newState.gameTimeLimit);
      if (newState.playerRemainingTimes !== undefined) setPlayerRemainingTimes(newState.playerRemainingTimes);
      if (newState.eliminatedPlayers !== undefined) setEliminatedPlayers(newState.eliminatedPlayers);

      if (newState.takenSeats !== undefined) {
        setTakenSeats(newState.takenSeats);
        // Automatically reclaim our seat if it's assigned to our playerId
        const foundColor = Object.keys(newState.takenSeats).find(
          (color) => newState.takenSeats[color] === playerId
        );
        if (foundColor) {
          setMyColor(foundColor);
        } else {
          setMyColor(null);
        }
      }

      if (newState.pawns !== undefined) setPawns(newState.pawns);
      if (newState.currentPlayerIndex !== undefined) setCurrentPlayerIndex(newState.currentPlayerIndex);
      if (newState.diceRoll !== undefined) setDiceRoll(newState.diceRoll);
      if (newState.phase !== undefined) setPhase(newState.phase);
      if (newState.rollAttempts !== undefined) setRollAttempts(newState.rollAttempts);
      if (newState.diceRolling !== undefined) setDiceRolling(newState.diceRolling);
      if (newState.winner !== undefined) setWinner(newState.winner);
      if (newState.deadlockMsg !== undefined) setDeadlockMsg(newState.deadlockMsg);
      if (newState.chatMessages !== undefined) setChatMessages(newState.chatMessages);
    });
    return () => {
      socket.off("state_update");
    };
  }, []);

  useEffect(() => {
    if (hasEnteredName && myPersonalName.trim()) {
      socket.emit("set_user_name", myPersonalName.trim());
    }
  }, [hasEnteredName, myPersonalName]);

  const isGameMaster = socket.id === gameMaster;
  const isMyTurn = myColor === currentPlayer;

  const getGMName = () => {
    if (!gameMaster) return "Łączenie...";
    if (isGameMaster) return "TY 👑";
    const gmUser = connectedUsers.find(u => u.id === gameMaster);
    if (gmUser) return `${gmUser.name} 👑`;
    return "Szef Gry 👑";
  };

  const broadcastState = (updates: any) => {
    socket.emit("update_state", updates);
  };

  const allPawnsInBase = (color: string) => pawns.filter((p) => p.color === color).every((p) => p.positionIndex === -1);

  const getNextActivePlayerIndex = (fromIndex: number, currentEliminated: string[]) => {
    for (let i = 1; i <= activePlayerCount; i++) {
      const nextIdx = (fromIndex + i) % activePlayerCount;
      const color = activePlayers[nextIdx];
      if (!currentEliminated.includes(color)) {
        return nextIdx;
      }
    }
    return fromIndex;
  };

  // --- WELCOME/LOGIN REGISTRATION ---
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPersonalName.trim()) return;
    socket.emit("set_user_name", myPersonalName.trim());
    localStorage.setItem("chinczyk_personal_name", myPersonalName.trim());
    localStorage.setItem("chinczyk_has_entered_name", "true");
    setHasEnteredName(true);
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    const msg = {
      id: Date.now() + Math.random(),
      sender: myPersonalName || "Obserwator",
      color: myColor || "gray",
      text: currentMessage.trim()
    };
    const newHistory = [...chatMessages, msg];
    setChatMessages(newHistory);
    setCurrentMessage("");
    broadcastState({ chatMessages: newHistory });
  };

  const handleMapPredefinedSelect = (url: string) => {
    if (!isGameMaster) return; 
    setSelectedMap(url);
    broadcastState({ selectedMap: url });
  };

  const handleMapUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedMap(base64String);
        broadcastState({ selectedMap: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Automatic Seat Assignment With Player Nicknames ---
  const handleSeatToggle = (color: string) => {
    const occupierPlayerId = takenSeats[color];
    const isOccupierConnected = occupierPlayerId ? connectedUsers.some(u => u.playerId === occupierPlayerId) : false;
    
    const isTakenByOther = occupierPlayerId && occupierPlayerId !== playerId;
    if (isTakenByOther && isOccupierConnected) return; 

    const newTaken = { ...takenSeats };
    const newNames = { ...playerNames };

    if (myColor === color) {
      delete newTaken[color];
      setMyColor(null);
      newNames[color] = `Gracz ${geometry.players.indexOf(color) + 1}`;
    } else {
      if (myColor) {
         delete newTaken[myColor];
         newNames[myColor] = `Gracz ${geometry.players.indexOf(myColor) + 1}`;
      }
      newTaken[color] = playerId;
      setMyColor(color);
      newNames[color] = myPersonalName || `Gracz ${geometry.players.indexOf(color) + 1}`;
    }
    
    setTakenSeats(newTaken);
    setPlayerNames(newNames);
    broadcastState({ takenSeats: newTaken, playerNames: newNames });
  };

  const handleForceFreeSeat = (color: string) => {
    const newTaken = { ...takenSeats };
    delete newTaken[color];
    setTakenSeats(newTaken);
    
    const newNames = { ...playerNames };
    newNames[color] = `Gracz ${geometry.players.indexOf(color) + 1}`;
    setPlayerNames(newNames);

    if (myColor === color) setMyColor(null); 
    broadcastState({ takenSeats: newTaken, playerNames: newNames });
  };

  const handleActivePlayerCount = (num: number) => {
    if (!isGameMaster) return; 
    setActivePlayerCount(num);
    broadcastState({ activePlayerCount: num });
  };

  const handleGameModeChange = (mode: "classic" | "six_player") => {
    if (!isGameMaster) return;
    setGameMode(mode);
    let nextCount = activePlayerCount;
    if (mode === "classic" && activePlayerCount > 4) {
      nextCount = 4;
      setActivePlayerCount(4);
    }
    broadcastState({ gameMode: mode, activePlayerCount: nextCount });
  };

  const handlePredefinedSelect = (color: string, url: string | null) => {
    const updated = { ...playerAvatars, [color]: url };
    setPlayerAvatars(updated);
    broadcastState({ playerAvatars: updated });
  };

  const handleFileUpload = (color: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updated = { ...playerAvatars, [color]: base64String };
        setPlayerAvatars(updated);
        broadcastState({ playerAvatars: updated });
      };
      reader.readAsDataURL(file);
    }
  };

  const startGame = () => {
    const initialPawns = activePlayers.flatMap((color) =>
      [0, 1, 2, 3].map((num) => ({ color, positionIndex: -1, pawnNumber: num + 1 }))
    );
    
    const initialTimes: Record<string, number> = {};
    if (gameTimeLimit !== null) {
      activePlayers.forEach(color => {
        initialTimes[color] = gameTimeLimit;
      });
    }

    setPawns(initialPawns);
    setCurrentPlayerIndex(0); 
    setDiceRoll(null);
    setPhase("roll");
    setRollAttempts(0);
    setWinner(null);
    setDeadlockMsg(null);
    setEliminatedPlayers([]);
    setPlayerRemainingTimes(initialTimes);
    setGoreMarks([]);
    setAppPhase("playing");

    broadcastState({
      pawns: initialPawns,
      currentPlayerIndex: 0,
      diceRoll: null,
      phase: "roll",
      rollAttempts: 0,
      winner: null,
      deadlockMsg: null,
      eliminatedPlayers: [],
      playerRemainingTimes: initialTimes,
      goreMarks: [],
      appPhase: "playing",
      selectedMap
    });
  };

  useEffect(() => {
    if (appPhase !== "playing" || pawns.length === 0 || winner) return;

    for (const color of activePlayers) {
      const playerPawns = pawns.filter((p) => p.color === color);
      const mainPathLength = geometry.pathPositions[color].length;
      const allInFinish = playerPawns.every((p) => p.positionIndex >= mainPathLength);

      if (allInFinish && playerPawns.length > 0) {
        setWinner(color);
        broadcastState({ winner: color }); 
        break; 
      }
    }
  }, [pawns, activePlayers, appPhase, winner, geometry]);

  const handleDeadlockConfirm = () => {
    if (!isMyTurn) return;

    const nextPlayer = getNextActivePlayerIndex(currentPlayerIndex, eliminatedPlayers);
    setCurrentPlayerIndex(nextPlayer);
    setDiceRoll(null);
    setRollAttempts(0);
    setPhase("roll");
    setDeadlockMsg(null);

    broadcastState({
      currentPlayerIndex: nextPlayer,
      diceRoll: null,
      rollAttempts: 0,
      phase: "roll",
      deadlockMsg: null
    });
  };

  const handleDiceRoll = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isMyTurn || diceRolling || winner || deadlockMsg) return;
    
    setDiceRolling(true);

    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceRoll(roll);
    broadcastState({ diceRoll: roll, diceRolling: true });

    const checkAnyValidMove = () => {
      const playerPawns = pawns.filter((p) => p.color === currentPlayer);
      const mainPathLength = geometry.pathPositions[currentPlayer].length;
      const finishLength = geometry.finishPaths.find((f) => f.color === currentPlayer)?.coords.length || 4;

      return playerPawns.some((pawn) => {
        if (pawn.positionIndex === -1) {
          if (roll !== 6) return false;
          return !playerPawns.some((other) => other.positionIndex === 0);
        } else {
          const newIndex = pawn.positionIndex + roll;
          if (newIndex > mainPathLength + finishLength - 1) return false;
          if (playerPawns.some((other) => other.positionIndex === newIndex)) return false;
          return true; 
        }
      });
    };

    const hasValidMove = checkAnyValidMove();

    setTimeout(() => {
      setDiceRolling(false);
      if (allPawnsInBase(currentPlayer)) {
        if (roll === 6) {
          setPhase("selectPawn");
          broadcastState({ phase: "selectPawn", diceRolling: false });
        } else {
          if (rollAttempts < 2) {
            const nextAttempts = rollAttempts + 1;
            setRollAttempts(nextAttempts);
            setPhase("roll");
            broadcastState({ rollAttempts: nextAttempts, phase: "roll", diceRolling: false });
          } else {
            const msg = "Trzy nieudane próby wyjścia z bazy. Kolejka przepada.";
            setDeadlockMsg(msg);
            broadcastState({ deadlockMsg: msg, diceRolling: false });
          }
        }
      } else {
        if (hasValidMove) {
          setPhase("selectPawn");
          broadcastState({ phase: "selectPawn", diceRolling: false });
        } else {
          const msg = `Wyrzucono ${roll}, ale żaden pionek nie może wykonać ruchu.`;
          setDeadlockMsg(msg);
          broadcastState({ deadlockMsg: msg, diceRolling: false });
        }
      }
    }, 250); 
  };

  useEffect(() => {
    if (appPhase !== "playing" || winner || deadlockMsg || !isMyTurn) return;
    if (phase === "roll" && rollAttempts === 0 && !diceRolling) {
      const timer = setTimeout(() => { handleDiceRoll(); }, 300); 
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, phase, rollAttempts, appPhase, winner, deadlockMsg, isMyTurn, diceRolling]);

  const handlePawnSelect = (pawnNumber: number) => {
    if (!isMyTurn || isHandling || winner || deadlockMsg || diceRoll === null) return;
    setIsHandling(true);

    const selectedPawn = pawns.find(p => p.color === currentPlayer && p.pawnNumber === pawnNumber);
    if (!selectedPawn) { setIsHandling(false); return; }
    if (selectedPawn.positionIndex === -1 && diceRoll !== 6) { setIsHandling(false); return; }

    let newIndex = selectedPawn.positionIndex;
    const path = geometry.pathPositions[currentPlayer];
    const mainPathLength = path.length;
    const finishPath = geometry.finishPaths.find((f) => f.color === currentPlayer);
    const finishLength = finishPath?.coords.length || 4;

    if (selectedPawn.positionIndex === -1 && diceRoll === 6) {
      newIndex = 0;
    } else if (selectedPawn.positionIndex >= 0) {
      newIndex = selectedPawn.positionIndex + diceRoll;
      if (newIndex > mainPathLength + finishLength - 1) { setIsHandling(false); return; }
    }

    const isBlockedByOwn = pawns.some(p => p.color === currentPlayer && p.pawnNumber !== pawnNumber && p.positionIndex === newIndex);
    if (isBlockedByOwn) { setIsHandling(false); return; }

    let targetCoords: number[] | null = null;
    let isOnFinishPath = false;
    if (newIndex < mainPathLength) {
      targetCoords = path[newIndex];
    } else {
      isOnFinishPath = true;
    }

    let newPawnsState: Array<{ color: string; positionIndex: number; pawnNumber: number }> = [];
    
    // Detect capture
    let capturedEnemy: { color: string; pawnNumber: number } | null = null;
    if (targetCoords && !isOnFinishPath) {
      const enemy = pawns.find(p => {
        if (p.color === currentPlayer || p.positionIndex === -1) return false;
        const enemyPath = geometry.pathPositions[p.color];
        if (p.positionIndex < enemyPath.length) {
          const enemyCoords = enemyPath[p.positionIndex];
          return enemyCoords[0] === targetCoords[0] && enemyCoords[1] === targetCoords[1];
        }
        return false;
      });
      if (enemy) {
        capturedEnemy = { color: enemy.color, pawnNumber: enemy.pawnNumber };
      }
    }

    let updatedMarks = goreMarks;
    if (capturedEnemy && targetCoords) {
      const effectTypes: Array<"blood" | "scorch" | "electric"> = ["blood", "scorch", "electric"];
      const chosenType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
      
      const bloodMark: GoreMark = {
        id: Date.now() + "_blood_" + Math.random().toString(36).substring(2, 9),
        x: targetCoords[0],
        z: targetCoords[1],
        type: "blood",
        color: capturedEnemy.color,
        rotation: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.4,
        variantIndex: Math.floor(Math.random() * 3)
      };

      if (chosenType === "blood") {
        updatedMarks = [...goreMarks, bloodMark];
      } else {
        const specialMark: GoreMark = {
          id: Date.now() + "_" + chosenType + "_" + Math.random().toString(36).substring(2, 9),
          x: targetCoords[0],
          z: targetCoords[1],
          type: chosenType,
          color: capturedEnemy.color,
          rotation: Math.random() * Math.PI * 2,
          scale: 0.7 + Math.random() * 0.3,
          variantIndex: Math.floor(Math.random() * 3)
        };
        // Put blood mark first so scorch/lightning renders on top!
        updatedMarks = [...goreMarks, bloodMark, specialMark];
      }
      setGoreMarks(updatedMarks);
    }

    setPawns((prev) => {
      newPawnsState = prev.map((p) => {
        if (p.color === currentPlayer && p.pawnNumber === pawnNumber) return { ...p, positionIndex: newIndex };
        if (targetCoords && !isOnFinishPath && p.color !== currentPlayer && p.positionIndex >= 0) {
          const enemyPath = geometry.pathPositions[p.color];
          if (p.positionIndex < enemyPath.length) {
            const enemyCoords = enemyPath[p.positionIndex];
            if (enemyCoords[0] === targetCoords[0] && enemyCoords[1] === targetCoords[1]) return { ...p, positionIndex: -1 };
          }
        }
        return p;
      });
      broadcastState({ 
        pawns: newPawnsState,
        goreMarks: updatedMarks
      });
      return newPawnsState;
    });

    setTimeout(() => {
      setIsHandling(false);
      if (diceRoll === 6) {
        setRollAttempts(0); 
        setPhase("roll");
        setDiceRoll(null);
        broadcastState({ phase: "roll", diceRoll: null, rollAttempts: 0 });
      } else {
        const nextPlayer = getNextActivePlayerIndex(currentPlayerIndex, eliminatedPlayers);
        setCurrentPlayerIndex(nextPlayer);
        setPhase("roll");
        setDiceRoll(null);
        setRollAttempts(0);
        broadcastState({ currentPlayerIndex: nextPlayer, phase: "roll", diceRoll: null, rollAttempts: 0 });
      }
    }, 300);
  };

  // --- PLAYER TIMEOUT HANDLER & TICKING ---
  const handlePlayerTimeout = (timedOutColor: string, currentTimes: Record<string, number>) => {
    setEliminatedPlayers(prevEliminated => {
      if (prevEliminated.includes(timedOutColor)) return prevEliminated;
      const nextEliminated = [...prevEliminated, timedOutColor];

      const msg = {
        id: Date.now() + Math.random(),
        sender: "⏱️ SYSTEM",
        color: "gray",
        text: `Gracz ${playerNames[timedOutColor] || timedOutColor} (${timedOutColor.toUpperCase()}) odpadł - skończył mu się czas!`
      };
      
      const nextChat = [...chatMessages, msg];
      setChatMessages(nextChat);

      const remainingActive = activePlayers.filter(color => !nextEliminated.includes(color));

      let nextWinner: string | null = null;
      let nextPlayerIndex = currentPlayerIndex;

      if (remainingActive.length === 1) {
        nextWinner = remainingActive[0];
        setWinner(nextWinner);
      } else if (remainingActive.length === 0) {
        nextWinner = timedOutColor;
        setWinner(nextWinner);
      } else {
        nextPlayerIndex = getNextActivePlayerIndex(currentPlayerIndex, nextEliminated);
        setCurrentPlayerIndex(nextPlayerIndex);
        setPhase("roll");
        setDiceRoll(null);
        setRollAttempts(0);
        setDeadlockMsg(null);
      }

      broadcastState({
        eliminatedPlayers: nextEliminated,
        chatMessages: nextChat,
        currentPlayerIndex: nextPlayerIndex,
        phase: "roll",
        diceRoll: null,
        rollAttempts: 0,
        deadlockMsg: null,
        winner: nextWinner
      });

      return nextEliminated;
    });
  };

  useEffect(() => {
    if (appPhase !== "playing" || winner || gameTimeLimit === null) return;

    const interval = setInterval(() => {
      if (eliminatedPlayers.includes(currentPlayer)) {
        return;
      }

      const occupierPlayerId = takenSeats[currentPlayer];
      const isOccupierConnected = occupierPlayerId ? connectedUsers.some(u => u.playerId === occupierPlayerId) : false;
      const iShouldTick = (occupierPlayerId === playerId) || (!isOccupierConnected && isGameMaster);

      if (iShouldTick) {
        setPlayerRemainingTimes(prev => {
          const currentRemaining = prev[currentPlayer] !== undefined ? prev[currentPlayer] : gameTimeLimit;
          const nextRemaining = Math.max(0, currentRemaining - 1);
          const updatedTimes = { ...prev, [currentPlayer]: nextRemaining };

          broadcastState({ playerRemainingTimes: updatedTimes });

          if (nextRemaining === 0) {
            handlePlayerTimeout(currentPlayer, updatedTimes);
          }

          return updatedTimes;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appPhase, currentPlayer, winner, gameTimeLimit, takenSeats, connectedUsers, isGameMaster, eliminatedPlayers]);

  // --- FLOATING ONLINE USERS LIST ---
  const ConnectedPlayersPanel = () => {
    if (!isPlayersPanelExpanded) {
      return (
        <button 
          onClick={() => setIsPlayersPanelExpanded(true)}
          className="absolute top-4 right-4 z-[100] bg-slate-900/95 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2 cursor-pointer backdrop-blur-md text-xs font-bold text-slate-300 transition-all hover:scale-105"
        >
          <Users size={14} className="text-indigo-400" />
          <span>Gracze online ({connectedUsers.length})</span>
        </button>
      );
    }

    return (
      <div className="absolute top-4 right-4 z-[100] bg-slate-900/95 p-4 rounded-xl border border-slate-800 shadow-xl min-w-[210px] backdrop-blur-md text-sm animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-widest text-xs gap-4">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-indigo-400" />
            <span>Gracze online ({connectedUsers.length})</span>
          </div>
          <button 
            onClick={() => setIsPlayersPanelExpanded(false)}
            className="text-slate-500 hover:text-slate-300 text-xs font-bold bg-transparent border-none cursor-pointer p-0.5 rounded hover:bg-slate-800 transition-all leading-none"
            title="Zwiń"
          >
            ✕
          </button>
        </div>
        <ul className="flex flex-col gap-1.5 text-slate-300 max-h-[180px] overflow-y-auto pr-1">
           {connectedUsers.map(u => (
              <li key={u.id} className={`flex items-center gap-2 text-xs ${u.playerId === playerId ? "font-bold text-indigo-400" : ""}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.id === gameMaster ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}></span>
                <span className="truncate max-w-[120px]">{u.name} {u.playerId === playerId ? "(Ty)" : ""}</span>
                {u.id === gameMaster && <span title="Mistrz Gry" className="text-xs">👑</span>}
              </li>
           ))}
        </ul>
      </div>
    );
  };

  // --- WELCOME REGISTER VIEW ---
  if (!hasEnteredName) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
         <form onSubmit={handleJoinGame} className="bg-slate-900 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full border border-slate-800">
            <div className="text-5xl mb-4 text-indigo-500 animate-bounce">🎲</div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Chińczyk Online</h2>
            <p className="text-slate-400 text-sm mb-6">Wpisz swoje imię, aby dołączyć do lobby.</p>
            
            <input 
              autoFocus 
              value={myPersonalName} 
              onChange={e => setMyPersonalName(e.target.value)} 
              placeholder="np. Marek" 
              maxLength={15}
              className="w-full p-4 text-lg bg-slate-950 border-2 border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl mb-6 outline-none text-center focus:border-indigo-500 transition-all font-semibold"
            />
            
            <button 
              type="submit" 
              disabled={!myPersonalName.trim()} 
              className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-lg rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Wejdź do Lobby
            </button>
         </form>
      </div>
    );
  }

  // --- LOBBY VIEW ---
  if (appPhase === "lobby") {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <ConnectedPlayersPanel />
        
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-800">
          
          <div className="py-2.5 px-5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-bold text-sm mb-6 uppercase tracking-wider text-center flex items-center justify-center gap-2">
            👑 Aktualny Mistrz Gry: {getGMName()}
          </div>

          <h1 className="text-3xl font-black text-white mb-6 text-center tracking-tight">Przygotowanie rozgrywki</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
            
            {/* WYBÓR WERSJI GRY */}
            <div className="md:col-span-2 p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center">
              <h2 className={`text-sm font-bold mb-4 uppercase tracking-wider ${!isGameMaster ? "text-slate-500" : "text-slate-400"}`}>
                {!isGameMaster ? "Wersja gry (Zarządza Mistrz)" : "Wybierz wersję chińczyka"}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                <button
                  disabled={!isGameMaster}
                  onClick={() => handleGameModeChange("classic")}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all border cursor-pointer flex flex-col items-center gap-1 ${
                    gameMode === "classic"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black">Klasyczny Chińczyk 🟥</span>
                  <span className="text-[11px] font-medium opacity-80 text-center">Standardowa plansza dla maksymalnie 4 osób</span>
                </button>
                <button
                  disabled={!isGameMaster}
                  onClick={() => handleGameModeChange("six_player")}
                  className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all border cursor-pointer flex flex-col items-center gap-1 ${
                    gameMode === "six_player"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black">Chińczyk na 6 osób 🌟</span>
                  <span className="text-[11px] font-medium opacity-80 text-center">Gwieździsta plansza dla od 2 do 6 graczy</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
              <h2 className={`text-sm font-bold mb-4 uppercase tracking-wider ${!isGameMaster ? "text-slate-500" : "text-slate-400"}`}>
                {!isGameMaster ? "Liczba graczy (Zarządza Mistrz)" : "Wybierz liczbę graczy"}
              </h2>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {(gameMode === "classic" ? [2, 3, 4] : [2, 3, 4, 5, 6]).map((num) => (
                  <button
                    key={num}
                    disabled={!isGameMaster}
                    onClick={() => handleActivePlayerCount(num)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all border cursor-pointer ${
                      activePlayerCount === num 
                        ? (isGameMaster ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-600 text-white border-slate-500') 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center flex-shrink-0">
                 {selectedMap ? (
                   <img src={selectedMap} alt="Wybrana mapa" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-2xl">🗺️</span>
                 )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Customowa plansza:
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={!isGameMaster} 
                    onChange={handleMapUpload} 
                    className="text-xs w-full text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Gotowe szablony:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedMapUrls.map((mapOpt) => (
                      <button 
                        key={mapOpt.url} 
                        disabled={!isGameMaster}
                        onClick={() => handleMapPredefinedSelect(mapOpt.url)}
                        title={mapOpt.name}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all border border-slate-800 cursor-pointer ${
                          selectedMap === mapOpt.url 
                            ? (isGameMaster ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20' : 'bg-slate-600 text-white border-slate-500') 
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {mapOpt.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LOBBY GAME TIME SETTINGS */}
          <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center items-center mb-8 w-full">
            <h2 className={`text-sm font-bold mb-4 uppercase tracking-wider ${!isGameMaster ? "text-slate-500" : "text-slate-400"}`}>
              {!isGameMaster ? "Czas gry na gracza (Zarządza Mistrz Gry)" : "Czas gry na gracza"}
            </h2>
            <div className="flex flex-wrap gap-2.5 justify-center w-full">
              {[
                { label: "Bez czasu (relaksik)", value: null },
                { label: "3 minuty (zapierdol) ⚡", value: 180 },
                { label: "5 min (poważna) 🧠", value: 300 },
                { label: "7 min (normalna) ⏱️", value: 420 },
                { label: "10 minut (spokojnie) 🍵", value: 600 }
              ].map((opt) => {
                const isSelected = gameTimeLimit === opt.value;
                return (
                  <button
                    key={opt.label}
                    disabled={!isGameMaster}
                    onClick={() => {
                      setGameTimeLimit(opt.value);
                      broadcastState({ gameTimeLimit: opt.value });
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                      isSelected 
                        ? (isGameMaster ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-600 text-white border-slate-500') 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {activePlayers.map((color) => {
              const occupierPlayerId = takenSeats[color];
              const isOccupierConnected = occupierPlayerId ? connectedUsers.some(u => u.playerId === occupierPlayerId) : false;
              const isTakenByMe = myColor === color;
              const isTakenByOther = occupierPlayerId && occupierPlayerId !== playerId;
              const isTakeoverAllowed = isTakenByOther && !isOccupierConnected;
              const colTheme = colorTheme[color as keyof typeof colorTheme] || color;

              // Border left mapping for Sleek style
              const borderLeftClass = 
                color === 'red' ? 'border-l-rose-500' :
                color === 'green' ? 'border-l-emerald-500' :
                color === 'yellow' ? 'border-l-amber-500' :
                color === 'blue' ? 'border-l-blue-500' :
                color === 'purple' ? 'border-l-purple-500' :
                'border-l-orange-500';

              return (
                <div 
                  key={color} 
                  className={`p-4 rounded-xl border border-slate-800 border-l-4 ${borderLeftClass} bg-slate-950 flex flex-col items-center transition-all`}
                  style={{ borderColor: isTakenByMe ? colTheme : undefined }}
                >
                  <div 
                    className="text-base font-bold text-center mb-3 pb-1.5 border-b w-full"
                    style={{ color: colTheme, borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {playerNames[color]}
                  </div>
                  
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-slate-800 bg-slate-900 flex items-center justify-center mb-3">
                    {playerAvatars[color] ? (
                      <img src={playerAvatars[color]!} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-[10px] font-bold">Standard</span>
                    )}
                  </div>

                  <div className="w-full text-left mb-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(color, e)} 
                      className="text-[10px] w-full text-slate-400 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-slate-300 cursor-pointer" 
                    />
                  </div>

                  <div className="w-full border-t border-slate-900 pt-3 flex flex-col items-center mb-4">
                    <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Wybierz postać:</div>
                    <div className="flex gap-1.5 justify-center w-full flex-wrap max-h-28 overflow-y-auto p-1.5 bg-slate-900/50 rounded border border-slate-800/40">
                      {predefinedAvatars.map((avatarOpt) => (
                        <img 
                          key={avatarOpt.url} 
                          src={avatarOpt.url} 
                          alt={avatarOpt.name} 
                          title={avatarOpt.name}
                          className="w-8 h-8 object-cover cursor-pointer border border-slate-800 rounded hover:scale-110 hover:border-indigo-500 transition-all" 
                          onClick={() => handlePredefinedSelect(color, avatarOpt.url)} 
                        />
                      ))}
                      <button 
                        onClick={() => handlePredefinedSelect(color, null)} 
                        className="h-8 px-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 text-[9px] font-bold rounded cursor-pointer border border-rose-900/30 flex items-center justify-center transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="w-full mt-auto flex flex-col items-center">
                    <button
                      onClick={() => handleSeatToggle(color)} 
                      disabled={isTakenByOther && !isTakeoverAllowed}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                        isTakenByMe 
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10" 
                          : isTakeoverAllowed
                            ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/60 hover:bg-indigo-900/40 hover:text-indigo-300"
                            : isTakenByOther 
                              ? "bg-slate-900 text-slate-600 border-slate-900 cursor-not-allowed" 
                              : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {isTakenByMe 
                        ? "✅ Twój pionek" 
                        : isTakeoverAllowed 
                          ? "🔄 Przejmij (Rozłączony)" 
                          : isTakenByOther 
                            ? "⛔ Zajęte" 
                            : "Zajmij pionek"}
                    </button>
                    {isTakenByOther && (
                      <button 
                        onClick={() => handleForceFreeSeat(color)} 
                        className="text-[9px] text-rose-400 mt-2 bg-none border-none cursor-pointer underline hover:text-rose-300"
                      >
                        Zwolnij awaryjnie
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={startGame}
            disabled={!isGameMaster}
            className={`w-full py-4 text-xl font-black rounded-xl border-none transition-all shadow-lg ${
              isGameMaster 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isGameMaster ? "START ROZGRYWKI 🚀" : "OCZEKIWANIE NA ROZPOCZĘCIE PRZEZ MISTRZA..."}
          </button>
        </div>
      </div>
    );
  }

  // --- GAME BOARD VIEW ---
  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans overflow-y-auto md:overflow-hidden select-none py-4 md:py-0">
      
      <ConnectedPlayersPanel />
      
      {winner && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[1000] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 p-12 rounded-2xl text-center shadow-2xl max-w-md w-full border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <h1 className="text-6xl mb-4">🏆</h1>
            <h2 className="text-3xl font-bold text-white mb-2">Mamy Zwycięzcę!</h2>
            <p className="text-slate-400 text-lg mb-8">
              Wygrywa: <strong style={{ color: colorTheme[winner as keyof typeof colorTheme] || winner }} className="block text-4xl font-extrabold uppercase mt-2">{playerNames[winner]}</strong>
            </p>
            <button
              onClick={() => { setAppPhase("lobby"); broadcastState({ appPhase: "lobby" }); }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl rounded-xl cursor-pointer border-none shadow-lg shadow-indigo-600/20 transition-all"
            >
              Powrót do lobby
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row w-[96%] max-w-[1350px] h-auto md:h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-visible md:overflow-hidden my-4 md:my-0">
        
        {/* LEFT: 3D THREE.JS CANVAS STAGE */}
        <div className="w-full h-[50vh] md:h-auto md:flex-1 relative bg-slate-950">
          
          {deadlockMsg && !winner && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div 
                className="bg-slate-900 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full border"
                style={{ borderColor: colorTheme[currentPlayer as keyof typeof colorTheme] || currentPlayer }}
              >
                <h2 className="text-2xl font-black text-white mb-2">Brak ruchów!</h2>
                <p className="text-slate-400 text-base leading-relaxed mb-6">
                  {deadlockMsg}
                </p>
                <button
                  onClick={handleDeadlockConfirm}
                  disabled={!isMyTurn}
                  className={`w-full py-3.5 font-bold text-lg rounded-xl border-none transition-all shadow-md ${
                    isMyTurn 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 cursor-pointer" 
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isMyTurn ? "Następna kolejka" : "Czekaj na potwierdzenie..."}
                </button>
              </div>
            </div>
          )}

          <Canvas className="w-full h-full" camera={{ position: [0, 16, 16], fov: 45 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} />
            <directionalLight position={[-10, 20, -10]} intensity={0.5} />
            <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={25} />

            {generateBoard(selectedMap, geometry)}

            <GoreEffects goreMarks={goreMarks} />

            <Dice3D
              value={diceRoll}
              currentPlayer={currentPlayer}
              position={geometry.dicePositions[currentPlayer]}
              isRolling={diceRolling}
            />

            {pawns.map((pawn, index) => {
              const isPawnInBase = pawn.positionIndex === -1;
              const canSelectPawnInBase = diceRoll === 6 && isPawnInBase;
              const isActive = phase === "selectPawn" && pawn.color === currentPlayer && (!isPawnInBase || canSelectPawnInBase) && isMyTurn && !deadlockMsg;

              let position: [number, number];
              if (pawn.positionIndex === -1) {
                const basePositions = geometry.baseCells.filter(cell => cell.color === pawn.color);
                position = basePositions[pawn.pawnNumber - 1].position;
              } else {
                const path = geometry.pathPositions[pawn.color];
                const mainPathLength = path.length;
                const finishPath = geometry.finishPaths.find(f => f.color === pawn.color);

                if (pawn.positionIndex < mainPathLength) {
                  position = path[pawn.positionIndex];
                } else {
                  const finishIndex = pawn.positionIndex - mainPathLength;
                  if (finishPath && finishIndex < finishPath.coords.length) {
                    position = finishPath.coords[finishIndex];
                  } else if (finishPath) {
                    position = finishPath.coords[finishPath.coords.length - 1];
                  } else {
                    position = [0, 0];
                  }
                }
              }

              return (
                <Pawn
                  key={index}
                  position={position}
                  color={pawn.color}
                  isActive={isActive}
                  avatarUrl={playerAvatars[pawn.color]}
                  onClick={() => {
                    if (!isActive) return;
                    handlePawnSelect(pawn.pawnNumber);
                  }}
                />
              );
            })}
          </Canvas>
        </div>

        {/* RIGHT: CONTROLS, CHAT & ACTIONS */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 h-auto md:h-full overflow-visible md:overflow-y-auto">
          
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Gra</h2>
              <div className="flex items-center gap-1.5 text-xs font-black bg-slate-950 py-1 px-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-0.5">Ruch:</span>
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: colorTheme[currentPlayer as keyof typeof colorTheme] || currentPlayer }}
                />
                <span style={{ color: colorTheme[currentPlayer as keyof typeof colorTheme] || currentPlayer }} className="uppercase truncate max-w-[80px]">
                  {playerNames[currentPlayer]}
                </span>
              </div>
            </div>

            {/* PLAYERS & TIMERS LIST */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 shadow-lg mb-3 flex flex-col gap-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                Gracze i czas {gameTimeLimit === null && "(Bez czasu)"}
              </span>
              <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-0.5">
                {activePlayers.map((color) => {
                  const isCurrent = color === currentPlayer;
                  const isEliminated = eliminatedPlayers.includes(color);
                  const themeCol = colorTheme[color as keyof typeof colorTheme] || color;
                  const timeSec = playerRemainingTimes[color];

                  let timeStr = "";
                  if (gameTimeLimit === null) {
                    timeStr = "∞";
                  } else if (isEliminated) {
                    timeStr = "⏱️ ODPADŁ";
                  } else if (timeSec !== undefined) {
                    const mins = Math.floor(timeSec / 60);
                    const secs = timeSec % 60;
                    timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
                  } else {
                    const mins = Math.floor(gameTimeLimit / 60);
                    const secs = gameTimeLimit % 60;
                    timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
                  }

                  const occupierPlayerId = takenSeats[color];
                  const isOccupierConnected = occupierPlayerId ? connectedUsers.some(u => u.playerId === occupierPlayerId) : false;
                  const isTakenByMe = occupierPlayerId === playerId;

                  return (
                    <div 
                      key={color} 
                      className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                        isCurrent 
                          ? "bg-slate-900 border-indigo-500/50 shadow-md" 
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/10 flex-shrink-0 relative flex items-center justify-center" 
                          style={{ backgroundColor: themeCol }}
                        >
                          {occupierPlayerId && (
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                                isOccupierConnected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
                              }`} 
                              title={isOccupierConnected ? "Online" : "Rozłączony"}
                            />
                          )}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span 
                            className={`truncate max-w-[100px] block ${
                              isCurrent ? "text-slate-100 font-bold" : "text-slate-400"
                            } ${isEliminated ? "line-through opacity-50" : ""}`}
                          >
                            {playerNames[color]} {isTakenByMe ? "(Ty)" : ""}
                          </span>
                          {occupierPlayerId && !isOccupierConnected && !isEliminated && (
                            <span className="text-[9px] text-rose-400/80 font-bold animate-pulse">Rozłączony</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!isOccupierConnected && myColor === null && !isEliminated && (
                          <button
                            onClick={() => {
                              const newTaken = { ...takenSeats };
                              const newNames = { ...playerNames };
                              newTaken[color] = playerId;
                              newNames[color] = myPersonalName || `Gracz ${geometry.players.indexOf(color) + 1}`;
                              setMyColor(color);
                              setTakenSeats(newTaken);
                              setPlayerNames(newNames);
                              broadcastState({ takenSeats: newTaken, playerNames: newNames });
                            }}
                            className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-[9px] font-black text-white rounded transition-all active:scale-95 cursor-pointer border-none"
                          >
                            Zastąp
                          </button>
                        )}
                        <span 
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isEliminated 
                              ? "text-rose-400 bg-rose-950/20 text-[10px]" 
                              : isCurrent 
                                ? "text-amber-400 bg-amber-950/20 text-xs animate-pulse" 
                                : "text-slate-400 text-xs"
                          }`}
                        >
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mb-3">
            {phase === "roll" ? (
              <button
                onClick={() => handleDiceRoll()}
                disabled={diceRolling || winner !== null || deadlockMsg !== null || !isMyTurn || (rollAttempts === 0 && allPawnsInBase(currentPlayer))} 
                className={`w-full py-3 rounded-xl border-none flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg select-none cursor-pointer ${
                  (diceRolling || winner !== null || deadlockMsg !== null || !isMyTurn || (rollAttempts === 0 && allPawnsInBase(currentPlayer))) 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/10 active:scale-98'
                }`}
              >
                {(() => {
                  if (diceRolling || !diceRoll) return <Dices size={32} className={diceRolling ? "animate-spin" : ""} />;
                  if (diceRoll === 1) return <Dice1 size={32} />;
                  if (diceRoll === 2) return <Dice2 size={32} />;
                  if (diceRoll === 3) return <Dice3 size={32} />;
                  if (diceRoll === 4) return <Dice4 size={32} />;
                  if (diceRoll === 5) return <Dice5 size={32} />;
                  if (diceRoll === 6) return <Dice6 size={32} />;
                  return <Dices size={32} />;
                })()}
                
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {!isMyTurn ? "Czekaj..." : diceRolling ? "Losowanie..." : (rollAttempts === 0 && allPawnsInBase(currentPlayer)) ? "Automat..." : "Rzuć Kostką"}
                </span>
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/5">
                <div className="text-emerald-400 mb-0.5 animate-pulse">
                  {(() => {
                    if (diceRoll === 1) return <Dice1 size={32} />;
                    if (diceRoll === 2) return <Dice2 size={32} />;
                    if (diceRoll === 3) return <Dice3 size={32} />;
                    if (diceRoll === 4) return <Dice4 size={32} />;
                    if (diceRoll === 5) return <Dice5 size={32} />;
                    if (diceRoll === 6) return <Dice6 size={32} />;
                    return <Dices size={32} />;
                  })()}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Wybierz Pionek</span>
                <span className="text-[10px] font-semibold text-emerald-300">Wylosowano oczek: {diceRoll}</span>
              </div>
            )}
          </div>

          {/* CHAT BOX CONTAINER */}
          <div className="h-[250px] md:h-auto md:flex-1 min-h-[200px] flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg mb-4 md:mb-0">
            <div className="bg-slate-900 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
              Czat Rozgrywki
            </div>
            
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
              {chatMessages.length === 0 ? (
                <span className="text-xs text-slate-600 text-center mt-3 font-semibold">Brak wiadomości...</span>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className="text-xs leading-normal">
                    <strong style={{ color: colorTheme[msg.color as keyof typeof colorTheme] || "#94a3b8" }}>{msg.sender}: </strong>
                    <span className="text-slate-300 font-medium select-text">{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChatMessage} className="flex border-t border-slate-800 p-2 bg-slate-900">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Napisz wiadomość..."
                maxLength={100}
                className="flex-1 px-3 py-2 text-xs border border-slate-800 rounded-lg outline-none focus:border-indigo-500 bg-slate-950 text-slate-100 placeholder-slate-600 font-medium"
              />
              <button 
                type="submit" 
                className="ml-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white border-none rounded-lg cursor-pointer flex items-center justify-center transition-all"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-slate-800">
            <button 
              onClick={() => { setAppPhase("lobby"); broadcastState({ appPhase: "lobby" }); }} 
              className="text-slate-500 hover:text-slate-300 font-bold text-xs text-center py-2 bg-transparent border-none cursor-pointer transition-colors"
            >
              Odpuść grę i wróć do Lobby
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
