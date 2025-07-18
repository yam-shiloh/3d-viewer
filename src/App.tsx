import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  MeshRefractionMaterial,
  Caustics
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { RGBELoader } from 'three-stdlib';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

interface ModelProps {
  envMap: THREE.Texture;
  diamondEnvMap?: THREE.Texture;
  modelUrl: string;
  style: string;
}

function Model({ envMap, diamondEnvMap, modelUrl, style }: ModelProps) {
  const [loadedModel, setLoadedModel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null!);
  const scale = 15; // Scale control metric
  const enableEffects = true; // True/False switch - set to false to show original GLB

  // Load model when modelUrl changes
  useEffect(() => {
    if (!modelUrl) return;
    
    console.log('Loading model:', modelUrl, 'for style:', style);
    setIsLoading(true);
    
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
      modelUrl,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        
        // Apply effects if enabled
        if (enableEffects) {
          gltf.scene.children.forEach((child: any) => {
            if (child.isMesh) {
              const mesh = child as THREE.Mesh;
              const isDiamond = mesh.name === 'Round' || mesh.name === 'Diamond' || mesh.name.toLowerCase().includes('diamond');
              
              // Apply smooth shading to non-diamond meshes
              if (!isDiamond) {
                mesh.geometry.computeVertexNormals();
              }
            }
          });
        }
        
        setLoadedModel(gltf);
        setIsLoading(false);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        setIsLoading(false);
      }
    );
  }, [modelUrl, enableEffects]);

  if (isLoading || !loadedModel) {
    return (
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#49b9ff" transparent opacity={0.5} />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} scale={scale}>
      {loadedModel.scene.children.map((child: any, index: number) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh;
          const isDiamond = mesh.name === 'Round' || mesh.name === 'Diamond' || mesh.name.toLowerCase().includes('diamond');
          
          return (
            <mesh
              key={mesh.name + index}
              geometry={mesh.geometry}
              position={mesh.position}
              rotation={mesh.rotation}
              scale={mesh.scale}
            >
              {enableEffects && isDiamond ? (
                <MeshRefractionMaterial
                  envMap={diamondEnvMap || envMap}
                  bounces={3}
                  ior={2.8}
                  fresnel={1}
                  aberrationStrength={0}
                  color="white"
                  fastChroma={true}
                  toneMapped={true}
                  transparent={false}
                  side={THREE.DoubleSide}
                />
              ) : (
                <primitive object={mesh.material} attach="material" />
              )}
            </mesh>
          );
        } else {
          return <primitive key={index} object={child} />;
        }
      })}
    </group>
  );
}

function Scene() {
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);
  const [diamondEnvMap, setDiamondEnvMap] = useState<THREE.Texture | null>(null);
  const [currentModelUrl, setCurrentModelUrl] = useState<string>('https://cdn.shopify.com/3d/models/725c9350fea693d9/new_silver_heart_for_website.glb');
  const [currentStyle, setCurrentStyle] = useState<string>('loving');
  const { scene, gl, camera } = useThree();
  const controlsRef = useRef<any>(null);
  const enableEffects = true; // True/False switch - set to false to disable all effects
  const autoRotateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Model URL mapping
  const MODEL_URLS = {
    loving: 'https://cdn.shopify.com/3d/models/725c9350fea693d9/new_silver_heart_for_website.glb',
    minimal: 'https://cdn.shopify.com/3d/models/84099c96618f39d1/compression_silver_diamond.glb',
    special: 'https://cdn.shopify.com/3d/models/725c9350fea693d9/new_silver_heart_for_website.glb'
  };

  // Listen for messages from parent window (Shopify quiz)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin && 
          !event.origin.includes('shopify.com') && 
          !event.origin.includes('localhost') &&
          !event.origin.includes('127.0.0.1')) {
        return;
      }
      
      console.log('3D Viewer received message:', event.data);
      
      if (event.data.type === 'loadModel') {
        console.log('Loading new model:', event.data.modelUrl, 'for style:', event.data.style);
        setCurrentModelUrl(event.data.modelUrl);
        setCurrentStyle(event.data.style);
      } else if (event.data.type === 'styleChange') {
        console.log('Style changed to:', event.data.style);
        const newModelUrl = MODEL_URLS[event.data.style as keyof typeof MODEL_URLS] || MODEL_URLS.loving;
        setCurrentModelUrl(newModelUrl);
        setCurrentStyle(event.data.style);
      } else if (event.data.type === 'materialChange') {
        console.log('Material changed to:', event.data.material);
        // Handle material changes if needed
      } else if (event.data.type === 'specialOptionChange') {
        console.log('Special option changed to:', event.data.specialOption);
        // Handle special option changes if needed
      } else if (event.data.type === 'finalMaterialChange') {
        console.log('Final material changed to:', event.data.material);
        // Handle final material changes if needed
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready message to parent
    window.parent.postMessage({ type: '3dViewerReady' }, '*');
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleControlStart = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
      if (autoRotateTimeout.current) {
        clearTimeout(autoRotateTimeout.current);
      }
    }
  };

  const handleControlEnd = () => {
    if (autoRotateTimeout.current) {
      clearTimeout(autoRotateTimeout.current);
    }
    autoRotateTimeout.current = setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true;
      }
    }, 1000); // Wait 1 second before resuming auto-rotation
  };

  useEffect(() => {
    // Load main environment HDR
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
      (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

        // Simple performance optimizations (safe)
        hdrTexture.generateMipmaps = false;
        hdrTexture.minFilter = THREE.LinearFilter;
        hdrTexture.magFilter = THREE.LinearFilter;

        // Main HDR exposure control
        const mainHdrExposure = 1.0;
        scene.environment = hdrTexture;
        scene.environmentIntensity = mainHdrExposure;
        scene.background = new THREE.Color('white');
        setEnvMap(hdrTexture);
      }
    );

    // Load diamond-specific HDR
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/photo_studio_01_1k.hdr',
      (diamondHdr) => {
        diamondHdr.mapping = THREE.EquirectangularReflectionMapping;

        // Simple performance optimizations (safe)
        diamondHdr.generateMipmaps = false;
        diamondHdr.minFilter = THREE.LinearFilter;
        diamondHdr.magFilter = THREE.LinearFilter;

        // Diamond HDR exposure control
        const diamondHdrExposure = 0.5;

        const adjustedDiamondHdr = diamondHdr.clone();
        adjustedDiamondHdr.needsUpdate = true;

        setDiamondEnvMap(adjustedDiamondHdr);
      }
    );
  }, [scene]);

  return (
    <>
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={1} intensity={0.1} />
      </EffectComposer>

      {envMap ? (
        <Model 
          envMap={envMap} 
          diamondEnvMap={diamondEnvMap || undefined} 
          modelUrl={currentModelUrl}
          style={currentStyle}
        />
      ) : null}
      
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
        rotateSpeed={2.4}
        enableDamping={true}
        dampingFactor={0.08}
        autoRotate={true}
        autoRotateSpeed={5}
        onStart={handleControlStart}
        onEnd={handleControlEnd}
      />
    </>
  );
}

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 1], near: 0.01, fov: 45 }}
      style={{ width: '100vw', height: '100vh' }}
      dpr={window.devicePixelRatio}
      gl={{ 
        antialias: false, 
        alpha: false,
        powerPreference: "high-performance",
        precision: "lowp",
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false
      }}
      frameloop="demand"
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}