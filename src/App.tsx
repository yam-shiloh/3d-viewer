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

function Model({ envMap }: { envMap: THREE.Texture }) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  
  const gltf = useLoader(
    GLTFLoader,
    'https://cdn.shopify.com/3d/models/84099c96618f39d1/compression_silver_diamond.glb',
    (loader) => {
      (loader as GLTFLoader).setDRACOLoader(dracoLoader);
    }
  );

  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 1 / Math.max(size.x, size.y, size.z);
    groupRef.current.scale.setScalar(scale);

    const heightOffset = box.min.y * scale;
    groupRef.current.position.y -= heightOffset;

    console.log('✅ Draco model scaled and aligned');
  }, []);

  return (
    <group ref={groupRef}>
      {gltf.scene.children.map((child: any, index: number) => {
        if (child.isMesh) {
          const mesh = child as THREE.Mesh;
          const isDiamond = mesh.name === 'Round';

          return (
            <mesh
              key={mesh.name + index}
              geometry={mesh.geometry}
              position={mesh.position}
              rotation={mesh.rotation}
              scale={mesh.scale}
            >
              {isDiamond ? (
                <MeshRefractionMaterial
                  envMap={envMap}
                  bounces={2}
                  ior={2.4}
                  fresnel={0}
                  aberrationStrength={0.001}
                  color="white"
                  fastChroma
                  toneMapped={false}
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
  const { scene } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
      (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = hdrTexture;
        // Set white background instead of HDR texture
        scene.background = new THREE.Color(0xffffff);
        setEnvMap(hdrTexture);
      }
    );
  }, [scene]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.zoomToCursor = true;
    }
  }, []);

  return (
    <>
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.1} intensity={1.5} />
      </EffectComposer>
      {envMap && (
        <Caustics
          color="#ffffff"
          lightSource={[5, 5, -10]}
          worldRadius={0.5}
          ior={1.1}
          causticsOnly={false}
          backside
        >
          <Model envMap={envMap} />
        </Caustics>
      )}
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />
    </>
  );
}

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 2, 2], near: 0.01, fov: 45 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}