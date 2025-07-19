import * as THREE from 'three';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Mesh, MeshStandardMaterial } from 'three';

// Preload default models to speed up switching
useGLTF.preload('https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb');
useGLTF.preload('https://cdn.shopify.com/3d/models/e09fccbf08734217/very_small_silver_diamond.glb');

// Map style keys to GLB URLs
const MODEL_URLS: Record<string, string> = {
  loving: 'https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb',
  minimal: 'https://cdn.shopify.com/3d/models/e09fccbf08734217/very_small_silver_diamond.glb',
  special: 'https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb', // Same as loving for now
};

// 3D model component
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  const { scene: r3fScene } = useThree();

  useEffect(() => {
    const envMap = r3fScene.environment;
    if (!ref.current || !envMap) return;

    ref.current.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        mesh.material = new MeshStandardMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 1,
          roughness: 0.2,
          envMap,
          envMapIntensity: 0.5,
          side: THREE.DoubleSide,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [r3fScene.environment, scene]);

  return <primitive ref={ref} object={scene} scale={50} position={[0, -0.5, 0]} />;
}

export default function App() {
  const [modelType, setModelType] = useState<'loving' | 'minimal' | 'special'>('loving');

  // Handle messages from Shopify page
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event?.data?.type === 'changeModel') {
        const newType = event.data.modelType;
        if (MODEL_URLS[newType]) {
          console.log(`🔄 Switching to model type: ${newType}`);
          setModelType(newType);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const currentModelUrl = useMemo(() => MODEL_URLS[modelType], [modelType]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '60vw',
          height: '100vh',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 15%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, black 15%)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
      >
        <Canvas
          dpr={Math.max(2, window.devicePixelRatio)}
          camera={{ position: [0, 0, 5], fov: 30 }}
          gl={{ alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0} />
          <Suspense fallback={null}>
            <Environment
              files="https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
              background={false}
            />
            <Model url={currentModelUrl} />
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
    </div>
  );
}
