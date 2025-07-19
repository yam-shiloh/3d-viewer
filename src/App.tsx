import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { RGBELoader } from 'three-stdlib';
import { Mesh, MeshStandardMaterial } from 'three';

useGLTF.preload('https://cdn.shopify.com/3d/models/9ada044d09b88568/the_new_silver_heart.glb');

function Model({ bakedEnvMap, hdrIntensity }: { bakedEnvMap: THREE.Texture | null; hdrIntensity: number }) {
  const { scene } = useGLTF('https://cdn.shopify.com/3d/models/9ada044d09b88568/the_new_silver_heart.glb');
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current || !bakedEnvMap) return;

    ref.current.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffdc70'),
          metalness: 1,
          roughness: 0,
          envMap: bakedEnvMap,
          envMapIntensity: hdrIntensity,
          side: THREE.DoubleSide,
        });

        mesh.material = material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [bakedEnvMap]);

  // Update intensity dynamically
  useEffect(() => {
    if (!ref.current) return;
    ref.current.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mat = (obj as Mesh).material as MeshStandardMaterial;
        if (mat && mat.envMap) {
          mat.envMapIntensity = hdrIntensity;
          mat.needsUpdate = true;
        }
      }
    });
  }, [hdrIntensity]);

  return <primitive ref={ref} object={scene} scale={50} position={[0, -0.5, 0]} />;
}

function HDRRotator({
  url,
  rotation,
  onBaked,
}: {
  url: string;
  rotation: number;
  onBaked: (bakedMap: THREE.Texture) => void;
}) {
  const { gl } = useThree();
  const hdr = useLoader(RGBELoader, url);
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);

  useEffect(() => {
    const hdrScene = new THREE.Scene();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(100, 64, 64),
      new THREE.MeshBasicMaterial({ map: hdr, side: THREE.BackSide })
    );
    sphere.rotation.y = rotation;
    hdrScene.add(sphere);

    const baked = pmrem.fromScene(hdrScene).texture;
    onBaked(baked);

    return () => {
      baked.dispose();
    };
  }, [hdr, rotation, pmrem, onBaked]);

  return null;
}

export default function App() {
  const [hdrIntensity, setHdrIntensity] = useState(0.4);
  const [hdrRotation, setHdrRotation] = useState(0);
  const [bakedEnvMap, setBakedEnvMap] = useState<THREE.Texture | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* UI Sliders */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'white', padding: 10, borderRadius: 8 }}>
        <div>
          <label>HDR Intensity: {hdrIntensity.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={hdrIntensity}
            onChange={(e) => setHdrIntensity(parseFloat(e.target.value))}
            style={{ width: 150 }}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>HDR Rotation: {hdrRotation.toFixed(2)} rad</label>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.01"
            value={hdrRotation}
            onChange={(e) => setHdrRotation(parseFloat(e.target.value))}
            style={{ width: 150 }}
          />
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 0, 3], fov: 30 }}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={hdrIntensity * 0.3} />
        <Suspense fallback={null}>
          <HDRRotator
            url="https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
            rotation={hdrRotation}
            onBaked={(map) => setBakedEnvMap(map)}
          />
          {bakedEnvMap && <Model bakedEnvMap={bakedEnvMap} hdrIntensity={hdrIntensity} />}
          <OrbitControls
            enableZoom
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
            autoRotate
            autoRotateSpeed={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
