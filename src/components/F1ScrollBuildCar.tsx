import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO, Vignette } from '@react-three/postprocessing';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';

type PartKey = 'floor' | 'chassis' | 'nose' | 'frontWing' | 'rearWing' | 'sidepods' | 'halo' | 'suspension' | 'wheels' | 'livery';

const STAGES: PartKey[] = ['floor', 'chassis', 'nose', 'sidepods', 'suspension', 'frontWing', 'rearWing', 'halo', 'wheels', 'livery'];

const stageWindow = (progress: number, index: number) => {
  const s = index / STAGES.length;
  const e = (index + 1) / STAGES.length;
  return THREE.MathUtils.smoothstep(progress, s, e);
};

const baseOffsets: Record<PartKey, THREE.Vector3> = {
  floor: new THREE.Vector3(-5, -1.2, -2.8),
  chassis: new THREE.Vector3(4.2, 1.4, -2.6),
  nose: new THREE.Vector3(0, 2.8, -4.5),
  frontWing: new THREE.Vector3(-5.8, -1, 2),
  rearWing: new THREE.Vector3(5.8, 0.8, 2.1),
  sidepods: new THREE.Vector3(0, 1.6, 5.5),
  halo: new THREE.Vector3(0, 3.2, 0),
  suspension: new THREE.Vector3(0, -2.2, -5.2),
  wheels: new THREE.Vector3(0, 3.4, 4.5),
  livery: new THREE.Vector3(0, -3.5, 0),
};

function scrollProgress() {
  if (typeof window === 'undefined') return 0;
  const el = document.getElementById('f1-scroll-build');
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  return THREE.MathUtils.clamp((-rect.top || 0) / Math.max(total, 1), 0, 1);
}

const ProceduralF1Car = memo(function ProceduralF1Car() {
  const root = useRef<THREE.Group>(null);
  const parts = useRef<Record<PartKey, THREE.Group | null>>({ floor: null, chassis: null, nose: null, frontWing: null, rearWing: null, sidepods: null, halo: null, suspension: null, wheels: null, livery: null });

  const mats = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: '#9b1222', metalness: 0.52, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }),
    carbon: new THREE.MeshStandardMaterial({ color: '#13161b', metalness: 0.35, roughness: 0.45 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#0f1012', metalness: 0.02, roughness: 0.88 }),
    rim: new THREE.MeshStandardMaterial({ color: '#aab3c2', metalness: 0.95, roughness: 0.22 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0b1018', transmission: 0.2, roughness: 0.24, metalness: 0.12, transparent: true, opacity: 0.85 }),
    accent: new THREE.MeshStandardMaterial({ color: '#f3f6fb', metalness: 0.66, roughness: 0.28 }),
  }), []);

  useFrame((state, delta) => {
    const p = scrollProgress();
    const settle = THREE.MathUtils.smoothstep(p, 0.9, 1);
    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -0.35 + settle * 0.08 + Math.sin(state.clock.elapsedTime * 0.17) * 0.02, delta * 2.2);
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, -0.32 + Math.sin(state.clock.elapsedTime * 1.35) * 0.012 * settle, delta * 1.8);
    }

    STAGES.forEach((k, i) => {
      const g = parts.current[k];
      if (!g) return;
      const t = stageWindow(p, i);
      const off = baseOffsets[k];
      g.position.lerpVectors(off, new THREE.Vector3(0, 0, 0), t);
      g.rotation.x = (1 - t) * 0.45;
      g.rotation.y = (1 - t) * (i % 2 ? -0.55 : 0.55);
      g.rotation.z = (1 - t) * 0.2;
      g.scale.setScalar(0.82 + t * 0.18);
      g.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
          if (Array.isArray(m.material)) {
            m.material.forEach((mt) => ((mt as THREE.Material).transparent = true, (mt as THREE.Material).opacity = 0.06 + t * 0.94));
          } else if (m.material) {
            (m.material as THREE.Material).transparent = true;
            (m.material as THREE.Material).opacity = 0.06 + t * 0.94;
          }
        }
      });
    });
  });

  return (
    <group ref={root} position={[0, -0.32, 0]}>
      <group ref={(n) => (parts.current.floor = n)}>
        <mesh material={mats.carbon} position={[0, 0, 0]}><boxGeometry args={[4.9, 0.12, 1.72]} /></mesh>
        <mesh material={mats.carbon} position={[1.65, 0.08, 0]}><boxGeometry args={[1.4, 0.08, 1.2]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.chassis = n)}>
        <mesh material={mats.paint} position={[-0.05, 0.42, 0]}><capsuleGeometry args={[0.56, 2.45, 8, 24]} /></mesh>
        <mesh material={mats.glass} position={[-0.1, 0.66, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.19, 0.42, 8, 12]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.nose = n)}>
        <mesh material={mats.paint} position={[-2.08, 0.29, 0]} rotation={[0, 0, 0.02]}><boxGeometry args={[1.75, 0.22, 0.32]} /></mesh>
        <mesh material={mats.carbon} position={[-1.34, 0.18, 0]}><boxGeometry args={[0.66, 0.14, 0.2]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.frontWing = n)}>
        <mesh material={mats.carbon} position={[-2.64, 0.04, 0]}><boxGeometry args={[0.22, 0.06, 1.85]} /></mesh>
        <mesh material={mats.carbon} position={[-2.45, 0.11, 0]}><boxGeometry args={[0.22, 0.06, 1.55]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.rearWing = n)}>
        <mesh material={mats.carbon} position={[2.3, 0.6, 0]}><boxGeometry args={[0.18, 0.75, 0.1]} /></mesh>
        <mesh material={mats.carbon} position={[2.6, 0.6, 0]}><boxGeometry args={[0.18, 0.75, 0.1]} /></mesh>
        <mesh material={mats.carbon} position={[2.45, 0.95, 0]}><boxGeometry args={[0.68, 0.08, 1.3]} /></mesh>
        <mesh material={mats.carbon} position={[2.45, 0.75, 0]}><boxGeometry args={[0.62, 0.08, 1.1]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.sidepods = n)}>
        <mesh material={mats.paint} position={[0.25, 0.29, -0.62]}><capsuleGeometry args={[0.22, 1.45, 8, 14]} /></mesh>
        <mesh material={mats.paint} position={[0.25, 0.29, 0.62]}><capsuleGeometry args={[0.22, 1.45, 8, 14]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.halo = n)}>
        <mesh material={mats.accent} position={[-0.5, 0.92, 0]}><cylinderGeometry args={[0.03, 0.03, 0.38, 12]} /></mesh>
        <mesh material={mats.accent} position={[-0.22, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.34, 0.03, 12, 48, Math.PI]} /></mesh>
      </group>
      <group ref={(n) => (parts.current.suspension = n)}>
        {[-1.65, 1.65].map((x) => [-0.84, 0.84].map((z) => <mesh key={`${x}-${z}`} material={mats.accent} position={[x, 0.22, z]} rotation={[0, 0, z > 0 ? 0.35 : -0.35]}><cylinderGeometry args={[0.02, 0.02, 0.9, 8]} /></mesh>))}
      </group>
      <group ref={(n) => (parts.current.wheels = n)}>
        {[-1.68, 1.62].map((x) => [-0.92, 0.92].map((z) => <group key={`w-${x}-${z}`} position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={mats.rubber}><cylinderGeometry args={[0.34, 0.34, 0.28, 36]} /></mesh>
          <mesh material={mats.rim}><cylinderGeometry args={[0.17, 0.17, 0.3, 30]} /></mesh>
        </group>))}
      </group>
      <group ref={(n) => (parts.current.livery = n)}>
        <mesh material={mats.accent} position={[-0.05, 0.48, 0]}><boxGeometry args={[2.38, 0.02, 0.05]} /></mesh>
        <mesh material={mats.accent} position={[-0.45, 0.43, 0]} rotation={[0, 0, Math.PI / 5]}><boxGeometry args={[0.42, 0.02, 1.18]} /></mesh>
        <mesh material={mats.accent} position={[0.55, 0.43, 0]} rotation={[0, 0, -Math.PI / 5]}><boxGeometry args={[0.42, 0.02, 1.18]} /></mesh>
      </group>
    </group>
  );
});

export default function F1ScrollBuildCar() {
  return (
    <section id="f1-scroll-build" className="relative h-[380vh] bg-[#04060a]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(244,63,94,0.12),transparent_35%),radial-gradient(circle_at_78%_15%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(145deg,#030406,#070b13_50%,#030305)]" />
        <Canvas shadows dpr={[1, 1.8]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <color attach="background" args={['#05070b']} />
          <fog attach="fog" args={['#05070b', 8, 20]} />
          <PerspectiveCamera makeDefault position={[5.3, 2.2, 6.2]} fov={32} />
          <ambientLight intensity={0.22} />
          <spotLight position={[6.5, 7, 3]} intensity={95} angle={0.34} penumbra={0.8} color="#eaf6ff" castShadow shadow-mapSize={[2048, 2048]} />
          <spotLight position={[-4, 3, -6]} intensity={32} angle={0.48} penumbra={1} color="#ff335f" />
          <ProceduralF1Car />
          <Environment preset="warehouse" />
          <ContactShadows position={[0, -0.56, 0]} scale={10} opacity={0.58} blur={2.2} far={3} />
          <EffectComposer multisampling={4}>
            <SSAO radius={0.44} intensity={14} luminanceInfluence={0.3} color="black" />
            <Bloom intensity={0.17} luminanceThreshold={1.03} luminanceSmoothing={0.24} />
            <Vignette eskil={false} offset={0.2} darkness={0.43} />
          </EffectComposer>
        </Canvas>
      </div>
    </section>
  );
}
