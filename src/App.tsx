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

function Model({ envMap, diamondEnvMap }: { envMap: THREE.Texture; diamondEnvMap?: THREE.Texture }) {
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
const scale = 15; // Scale control metric
const enableEffects = true; // True/False switch - set to false to show original GLB

useEffect(() => {
gltf.scene.children.forEach((child: any, index) => {
if (child.isMesh) {
const mesh = child as THREE.Mesh;
const isDiamond = mesh.name === 'Round';

// Apply smooth shading to non-diamond meshes ONLY if effects are enabled
if (!isDiamond && enableEffects) {
mesh.geometry.computeVertexNormals();
}
}
});
}, [gltf, enableEffects]);

return (
<group ref={groupRef} scale={scale}>
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
const { scene, gl, camera } = useThree();
const controlsRef = useRef<any>(null);
const enableEffects = true; // True/False switch - set to false to disable all effects
const autoRotateTimeout = useRef<NodeJS.Timeout | null>(null);

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
}, [gl, camera]);

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

{enableEffects && envMap ? (
<Model envMap={envMap} diamondEnvMap={diamondEnvMap || undefined} />
) : envMap ? (
<Model envMap={envMap} diamondEnvMap={diamondEnvMap || undefined} />
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