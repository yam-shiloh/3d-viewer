import * as THREE from 'three';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Mesh, MeshStandardMaterial } from 'three';

useGLTF.preload('https://cdn.shopify.com/3d/models/9ada044d09b88568/the_new_silver_heart.glb');

function Model() {
  const { scene } = useGLTF('https://cdn.shopify.com/3d/models/9ada044d09b88568/the_new_silver_heart.glb');
  const ref = useRef<THREE.Group>(null);
  const { scene: r3fScene } = useThree();

  useEffect(() => {
    const envMap = r3fScene.environment;
    if (!ref.current || !envMap) return;

    ref.current.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        mesh.material = new MeshStandardMaterial({
          color: new THREE.Color('#ffdc70'),
          metalness: 1,
          roughness: 0,
          envMap,
          envMapIntensity: 0.5,
          side: THREE.DoubleSide,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [r3fScene.environment]);

  return <primitive ref={ref} object={scene} scale={50} position={[0, -0.5, 0]} />;
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 3], fov: 30 }}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.15} />
        <Suspense fallback={null}>
          <Environment
            files="https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
            background={false}
          />
          <Model />
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
