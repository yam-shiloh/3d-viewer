import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import {
  OrbitControls as DreiOrbitControls,
  useGLTF,
  Environment,
  MeshRefractionMaterial,
} from '@react-three/drei';
import { RGBELoader } from 'three-stdlib';
import { Mesh } from 'three';

// Preload models
useGLTF.preload('https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb');
useGLTF.preload('https://cdn.shopify.com/3d/models/c1ba46f8c661e88e/smaller_diamond_for_website.glb');

const MODEL_SETTINGS = {
  loving: {
    url: 'https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb',
  },
  minimal: {
    url: 'https://cdn.shopify.com/3d/models/c1ba46f8c661e88e/smaller_diamond_for_website.glb',
  },
  special: {
    url: 'https://cdn.shopify.com/3d/models/6bce9a7ae62786dd/new_gold_heart_for_website.glb',
  },
} as const;

// Metal material settings - easily adjustable
const METAL_SETTINGS = {
  '14k-gold-plating': {
    color: '#F8E685',
    roughness: 0.25,
  },
  '18k-gold-plating': {
    color: '#FFC328',
    roughness: 0.15,
  },
  '18k-solid-gold': {
    color: '#FFB800',
    roughness: 0.05,
  },
  '925-silver': {
    color: '#c0c0c0',
    roughness: 0.2,
  },
  'stainless-steel': {
    color: '#c0c0c0',
    roughness: 0.3,
  },
  '18k-white-gold': {
    color: '#FFCF00',
    roughness: 0.1,
  },
} as const;

// Diamond material settings with different HDR URLs
const DIAMOND_SETTINGS = {
  'real-diamond': {
    bounces: 2,
    ior: 2.4,
    fresnel: 0,
    aberrationStrength: 0,
    color: '#ffffff',
    fastChroma: true,
    toneMapped: false,
    hdrUrl: 'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460',
  },
  'demi-diamond': {
    bounces: 2,
    ior: 2.4,
    fresnel: 0,
    aberrationStrength: 0,
    color: '#ffffff',
    fastChroma: true,
    toneMapped: false,
    hdrUrl: 'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/brown_photostudio_04_1k.hdr?v=1753809331',
  },
} as const;

type ModelType = keyof typeof MODEL_SETTINGS;
type MetalType = keyof typeof METAL_SETTINGS;
type DiamondType = keyof typeof DIAMOND_SETTINGS;

function Model({
  url,
  metalType,
  diamondType,
}: {
  url: string;
  metalType: MetalType;
  diamondType: DiamondType;
}) {
  const { scene } = useGLTF(url);
  const { scene: r3fScene } = useThree();
  const cloned = useMemo(() => scene.clone(true), [scene]);
  
  const { color: metalColor, roughness } = METAL_SETTINGS[metalType];
  const diamondSettings = DIAMOND_SETTINGS[diamondType];

  // Load the HDR specific to the diamond type
  const diamondHDR = useLoader(RGBELoader, diamondSettings.hdrUrl);
  
  // Also load the environment HDR (using the real diamond HDR for environment)
  const environmentHDR = useLoader(
    RGBELoader,
    'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460'
  );

  const meshes: React.ReactElement[] = [];

  useEffect(() => {
    r3fScene.environment = environmentHDR;
  }, [environmentHDR, r3fScene]);

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
          >
            <MeshRefractionMaterial
              envMap={diamondHDR}
              bounces={diamondSettings.bounces}
              ior={diamondSettings.ior}
              fresnel={diamondSettings.fresnel}
              aberrationStrength={diamondSettings.aberrationStrength}
              color={diamondSettings.color}
              fastChroma={diamondSettings.fastChroma}
              toneMapped={diamondSettings.toneMapped}
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
              color={metalColor}
              metalness={1}
              roughness={roughness}
              envMap={r3fScene.environment!}
              envMapIntensity={1}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      }
    }
  });

  return <group scale={50} position={[0, -1.2, 0]}>{meshes}</group>;
}

function SmartOrbitControls() {
  const controlsRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { gl } = useThree();
  const domElement = gl.domElement;

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.zoomToCursor = true;

    const handleStart = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      controls.autoRotate = false;
    };

    const handleEnd = () => {
      timeoutRef.current = setTimeout(() => {
        controls.autoRotate = true;
      }, 5000);
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      autoRotate
      autoRotateSpeed={2}
      makeDefault
    />
  );
}

export default function App() {
  const [modelType, setModelType] = useState<ModelType>('minimal');
  const [metalType, setMetalType] = useState<MetalType>('18k-white-gold');
  const [diamondType, setDiamondType] = useState<DiamondType>('real-diamond'); // Default to real diamond

  useEffect(() => {
    // Sync from window.selectedMaterial if already set (backward compatibility)
    if (typeof window !== 'undefined' && 'selectedMaterial' in window) {
      if (window.selectedMaterial === 'silver') {
        setMetalType('925-silver');
      } else if (window.selectedMaterial === 'gold') {
        setMetalType('18k-solid-gold');
      }
    }

    function handleMessage(event: MessageEvent) {
      if (event?.data?.type === 'changeModel') {
        const newType = event.data.modelType;
        if (MODEL_SETTINGS[newType as ModelType]) {
          setModelType(newType);
        }
      }

      // Handle metal material changes
      if (event?.data?.type === 'materialChange') {
        const material = event.data.material;
        if (METAL_SETTINGS[material as MetalType]) {
          setMetalType(material as MetalType);
        }
      }

      // Handle diamond type changes
      if (event?.data?.type === 'diamondChange') {
        const diamond = event.data.diamond;
        if (DIAMOND_SETTINGS[diamond as DiamondType]) {
          setDiamondType(diamond as DiamondType);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const { url } = useMemo(() => MODEL_SETTINGS[modelType], [modelType]);

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
            <Environment
              files="https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
              background={false}
            />
            <Model url={url} metalType={metalType} diamondType={diamondType} />
            <SmartOrbitControls />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}