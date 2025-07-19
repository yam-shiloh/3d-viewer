import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  MeshRefractionMaterial,
} from '@react-three/drei';
import { RGBELoader } from 'three-stdlib';
import { Mesh } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Preload models
useGLTF.preload('https://cdn.shopify.com/3d/models/f24085e9b7d9b801/new_silver_diamond.glb');
useGLTF.preload('https://cdn.shopify.com/3d/models/f24085e9b7d9b801/new_silver_diamond.glb');

const MODEL_SETTINGS = {
  loving: {
    url: 'https://cdn.shopify.com/3d/models/f24085e9b7d9b801/new_silver_diamond.glb',
    bloomIntensity: 0.3,
    roughness: 0.1,
  },
  minimal: {
    url: 'https://cdn.shopify.com/3d/models/f24085e9b7d9b801/new_silver_diamond.glb',
    bloomIntensity: 0.3,
    roughness: 0.1,
  },
  special: {
    url: 'https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb',
    bloomIntensity: 0.3,
    roughness: 0.1,
  },
} as const;

type ModelType = keyof typeof MODEL_SETTINGS;

function Model({
  url,
  roughness,
}: {
  url: string;
  roughness: number;
}) {
  const { scene } = useGLTF(url);
  const royalHDR = useLoader(
    RGBELoader,
    'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460'
  );
  const { scene: r3fScene } = useThree();
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const meshes: React.ReactElement[] = [];

  useEffect(() => {
    r3fScene.environment = royalHDR;
  }, [royalHDR, r3fScene]);

  cloned.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh;
      const geometry = mesh.geometry;
      const name = mesh.name.toLowerCase();

      if (name.includes('diamond')) {
        meshes.push(
          <mesh
            key={mesh.uuid}
            geometry={geometry}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            castShadow
            receiveShadow
            onUpdate={(self) => self.layers.set(1)} // Bloom layer
          >
            <MeshRefractionMaterial
              envMap={royalHDR}
              bounces={2}
              ior={2.4}
              fresnel={0}
              aberrationStrength={0}
              color="#ffffff"
              fastChroma
              toneMapped={false}
            />
          </mesh>
        );
      } else {
        meshes.push(
          <mesh
            key={mesh.uuid}
            geometry={geometry}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#ffffff"
              metalness={1}
              roughness={roughness}
              envMap={r3fScene.environment!}
              envMapIntensity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      }
    }
  });

  return <group scale={50} position={[0, -0.5, 0]}>{meshes}</group>;
}

function CameraLayers() {
  const { camera } = useThree();
  useEffect(() => {
    camera.layers.enable(0);
    camera.layers.enable(1);
  }, [camera]);
  return null;
}

export default function App() {
  const [modelType, setModelType] = useState<ModelType>('loving');

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event?.data?.type === 'changeModel') {
        const newType = event.data.modelType;
        if (MODEL_SETTINGS[newType as ModelType]) {
          console.log(`🔄 Switching to model type: ${newType}`);
          setModelType(newType);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const { url, bloomIntensity, roughness } = useMemo(
    () => MODEL_SETTINGS[modelType],
    [modelType]
  );

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
          <color attach="background" args={['white']} />
          <ambientLight intensity={0} />
          <Suspense fallback={null}>
            <CameraLayers />
            <Environment
              files="https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
              background={false}
            />
            <Model url={url} roughness={roughness} />
            <OrbitControls
              enableZoom
              enablePan={false}
              minPolarAngle={Math.PI / 2}
              maxPolarAngle={Math.PI / 2}
              autoRotate
              autoRotateSpeed={0}
            />
            <EffectComposer>
              <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={1}
                luminanceSmoothing={1}
                mipmapBlur
                renderIndex={1}
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
