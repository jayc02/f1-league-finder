import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera, useGLTF, Float } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO, Vignette } from '@react-three/postprocessing';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

type PartKey =
  | 'body'
  | 'floor'
  | 'nose'
  | 'frontWing'
  | 'rearWing'
  | 'halo'
  | 'lfWheel'
  | 'rfWheel'
  | 'lrWheel'
  | 'rrWheel'
  | 'suspension'
  | 'sidepods';

const STAGES: PartKey[] = ['floor', 'body', 'nose', 'sidepods', 'suspension', 'frontWing', 'rearWing', 'halo', 'lfWheel', 'rfWheel', 'lrWheel', 'rrWheel'];

const NAME_MAP: Record<PartKey, RegExp[]> = {
  body: [/body/i, /monocoque/i, /chassis/i],
  floor: [/floor/i, /plank/i, /undertray/i],
  nose: [/nose/i],
  frontWing: [/front[_\s-]?wing/i, /fw/i],
  rearWing: [/rear[_\s-]?wing/i, /rw/i],
  halo: [/halo/i],
  lfWheel: [/(left|lf).*(front|fr)/i, /(front|fr).*(left|lf)/i],
  rfWheel: [/(right|rf).*(front|fr)/i, /(front|fr).*(right|rf)/i],
  lrWheel: [/(left|lr).*(rear|rr)/i, /(rear|rr).*(left|lr)/i],
  rrWheel: [/(right|rr).*(rear|lr)/i, /(rear|rr).*(right|rf)/i],
  suspension: [/suspension/i, /wishbone/i, /upright/i],
  sidepods: [/sidepod/i, /engine[_\s-]?cover/i, /intake/i],
};

function getScrollProgress() {
  if (typeof window === 'undefined') return 0;
  const section = document.getElementById('f1-scroll-build');
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  return THREE.MathUtils.clamp((-rect.top || 0) / Math.max(total, 1), 0, 1);
}

function offsetFor(part: PartKey) {
  const i = STAGES.indexOf(part);
  const wave = i * 0.15;
  return new THREE.Vector3((i % 2 === 0 ? -1 : 1) * (2.5 + wave), 0.3 + (i % 3) * 0.2, -2.5 - wave);
}

function F1Model() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/f1-car.glb');

  const { partMeshes, fallback } = useMemo(() => {
    const meshMap = new Map<PartKey, THREE.Object3D[]>();
    STAGES.forEach((k) => meshMap.set(k, []));

    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const n = mesh.name.toLowerCase();
      let matched = false;
      for (const key of STAGES) {
        if (NAME_MAP[key].some((r) => r.test(n))) {
          meshMap.get(key)?.push(mesh);
          matched = true;
          break;
        }
      }
      if (!matched) meshMap.get('body')?.push(mesh);
    });

    const missing = STAGES.some((k) => (meshMap.get(k)?.length ?? 0) === 0);
    return { partMeshes: meshMap, fallback: missing };
  }, [scene]);

  useFrame((state, delta) => {
    const progress = getScrollProgress();
    const settle = THREE.MathUtils.smoothstep(progress, 0.9, 1);
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -0.28 + settle * 0.06 + Math.sin(state.clock.elapsedTime * 0.22) * 0.015, delta * 2.4);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.08 + Math.sin(state.clock.elapsedTime * 1.5) * 0.008 * settle, delta * 1.8);
    }

    if (fallback) return;

    STAGES.forEach((part, i) => {
      const partStart = i / STAGES.length;
      const partEnd = (i + 1) / STAGES.length;
      const t = THREE.MathUtils.smoothstep(progress, partStart, partEnd);
      const offset = offsetFor(part);
      for (const mesh of partMeshes.get(part) ?? []) {
        mesh.position.lerpVectors(offset, new THREE.Vector3(0, 0, 0), t);
        mesh.rotation.set((1 - t) * 0.5, (1 - t) * 0.6, (1 - t) * 0.35);
        if ((mesh as THREE.Mesh).material) {
          const mat = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = Math.max(0.15, t);
        }
      }
    });
  });

  if (fallback) {
    return (
      <group ref={group} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.2, 0.55, 1.35]} />
          <meshPhysicalMaterial color="#16191f" metalness={0.7} roughness={0.16} clearcoat={0.9} clearcoatRoughness={0.14} />
        </mesh>
      </group>
    );
  }

  return <primitive ref={group} object={scene} scale={1.15} position={[0, -0.1, 0]} />;
}

useGLTF.preload('/models/f1-car.glb');

export default function F1ScrollBuildCar() {
  return (
    <section id="f1-scroll-build" className="relative h-[360vh] bg-[#05070b]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(239,68,68,0.11),transparent_36%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.14),transparent_42%),linear-gradient(160deg,#040507,#060910_55%,#020203)]" />
        <Canvas gl={{ antialias: true }} dpr={[1, 1.75]} shadows>
          <color attach="background" args={['#040509']} />
          <fog attach="fog" args={['#040509', 9, 18]} />
          <PerspectiveCamera makeDefault fov={35} position={[4.6, 1.9, 5.5]} />
          <ambientLight intensity={0.28} />
          <directionalLight position={[5, 5, 3]} intensity={2.1} color="#dff5ff" castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-4, 2, -5]} intensity={0.65} color="#ff4060" />
          <Suspense fallback={null}>
            <Float speed={0.5} rotationIntensity={0.09} floatIntensity={0.12}>
              <F1Model />
            </Float>
            <Environment preset="city" />
            <ContactShadows position={[0, -0.48, 0]} blur={2.1} scale={9} opacity={0.55} far={2.8} />
          </Suspense>
          <EffectComposer multisampling={4}>
            <SSAO radius={0.45} intensity={16} luminanceInfluence={0.2} color="black" />
            <Bloom luminanceThreshold={1.04} luminanceSmoothing={0.2} intensity={0.2} />
            <Vignette eskil={false} offset={0.2} darkness={0.45} />
          </EffectComposer>
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto w-[min(560px,88vw)] px-6">
          <div className="rounded-full border border-white/20 bg-black/35 p-1 backdrop-blur-xl">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-red-400 via-slate-200 to-cyan-300" style={{ width: `${Math.round(getScrollProgress() * 100)}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
