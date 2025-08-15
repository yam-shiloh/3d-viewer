import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
    url: 'https://cdn.shopify.com/3d/models/133e8057a7d84b68/UV_heart_for_website.glb',
  },
  minimal: {
    url: 'https://cdn.shopify.com/3d/models/f70a4cea3b31f8db/small_circle_diamond.glb',
  },
  'diamond heart': {
    url: 'https://cdn.shopify.com/3d/models/886a83f03ae1cde6/diamond_of_heart.glb',
  },
  'diamond flower': {
    url: 'https://cdn.shopify.com/3d/models/905ba1e3092db1f1/gold_flower.glb',
  },
  'Oval diamond': {
    url: 'https://cdn.shopify.com/3d/models/f847d87436ca7a32/oval.glb',
  },
  butterfly: {
    url: 'https://cdn.shopify.com/3d/models/617d0680da1c9a48/butterfly_diamond.glb',
  },
  tennis: {
    url: 'https://cdn.shopify.com/3d/models/1a187af7d0f3b961/new_tennis_necklace.glb',
  },
} as const;

// diamond heart: "https://cdn.shopify.com/3d/models/886a83f03ae1cde6/diamond_of_heart.glb"
  //flower many diamonds: "https://cdn.shopify.com/3d/models/60290f2665af26de/flower_diamond.glb"
  //flower one diamond: "https://cdn.shopify.com/3d/models/905ba1e3092db1f1/gold_flower.glb"
  // minimal diamond circle: "https://cdn.shopify.com/3d/models/f70a4cea3b31f8db/small_circle_diamond.glb"
  // loving: "https://cdn.shopify.com/3d/models/133e8057a7d84b68/UV_heart_for_website.glb"
  // Tennis: "https://cdn.shopify.com/3d/models/1a187af7d0f3b961/new_tennis_necklace.glb"
  // Tulip: "https://cdn.shopify.com/3d/models/91da56e870392bd6/vintage_tulip.glb"
  // Oval: "https://cdn.shopify.com/3d/models/f847d87436ca7a32/oval.glb"
  // butterfly diamond: "https://cdn.shopify.com/3d/models/617d0680da1c9a48/butterfly_diamond.glb"

  // Metal material settings - easily adjustable
const METAL_SETTINGS = {
  '14k-gold-plating': {
    color: '#F8E685',
    roughness: 0.25,
  },
  '18k-gold-plating': {
    color: '#FFCF00',
    roughness: 0.15,
  },
  '18k-solid-gold': {
    color: '#FFC328',
    roughness: 0.1,
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
    color: '#ffffff',
    roughness: 0.05,
  },
} as const;

// Special material for demos meshes - easily adjustable
const DEMOS_MATERIAL_SETTINGS = {
  color: '#ffffff',
  roughness: 0.1,
};

// Diamond material settings with different HDR URLs
const DIAMOND_SETTINGS = {
  'real-diamond': {
    bounces: 2,
    ior: 2.4,
    fresnel: 0,
    aberrationStrength: 0.00,
    color: '#ffffff',
    fastChroma: true,
    toneMapped: false,
    hdrUrl: 'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/white_40f4e004-e07c-46be-8d0d-8bda61f2e966.hdr?v=1754676270',
  },
  // white diamond HDR: "https://cdn.shopify.com/s/files/1/0754/1676/4731/files/white_40f4e004-e07c-46be-8d0d-8bda61f2e966.hdr?v=1754676270"
  // grayish diamond HDR: "https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460"
  // brown diamond HDR: "https://cdn.shopify.com/s/files/1/0754/1676/4731/files/brown_photostudio_04_1k.hdr?v=1753809331"
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
  'ruby': {
    bounces: 2,
    ior: 2.4,
    fresnel: 0,
    aberrationStrength: 0,
    color: '#f74444',
    fastChroma: true,
    toneMapped: false,
    hdrUrl: 'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/white_40f4e004-e07c-46be-8d0d-8bda61f2e966.hdr?v=1754676270',
  },
  'emerald': {
    bounces: 2,
    ior: 2.4,
    fresnel: 0,
    aberrationStrength: 0,
    color: '#047b36',
    fastChroma: true,
    toneMapped: false,
    hdrUrl: 'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/white_40f4e004-e07c-46be-8d0d-8bda61f2e966.hdr?v=1754676270',
  },
} as const;

type ModelType = keyof typeof MODEL_SETTINGS;
type MetalType = keyof typeof METAL_SETTINGS;
type DiamondType = keyof typeof DIAMOND_SETTINGS;

// Text Engraving Component
function TextEngraver({ 
  onTextureUpdate, 
  isVisible 
}: { 
  onTextureUpdate: (texture: THREE.Texture, depth: number) => void;
  isVisible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [text, setText] = useState('I love you Sarah,\nfrom now on I\'m always\nhere if you\'ll need me\n- [your name]');
  const [fontSize, setFontSize] = useState(55);
  const [fontFamily, setFontFamily] = useState('cursive');
  const [engravingDepth, setEngravingDepth] = useState(1.0); // 100%
  const [positionX, setPositionX] = useState(0.32); // -36% from center (0.5 - 0.18 = 0.32)
  const [positionY, setPositionY] = useState(0.5); // 0% = center

  // Listen for iframe messages to change text
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received iframe message:', event.data);
      
      // Handle text change commands
      if (event.data?.type === 'changeEngravingText') {
        const newText = event.data.text;
        if (typeof newText === 'string') {
          console.log('✏️ Updating engraved text to:', newText);
          setText(newText);
        }
      }
      
      // Handle other potential commands
      if (event.data?.type === 'getEngravingText') {
        // Send current text back to parent
        if (event.source && 'postMessage' in event.source) {
          (event.source as Window).postMessage({
            type: 'currentEngravingText',
            text: text
          }, event.origin);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send ready signal to parent window
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'engravingReady',
        message: 'Engraving system ready to receive commands'
      }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [text]);

  useEffect(() => {
    if (!isVisible) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not found');
      setDebugInfo('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Context not found');
      setDebugInfo('Context not found');
      return;
    }

    console.log('✅ High-res canvas initialized:', canvas.width, 'x', canvas.height);

    // Initialize with white background (255 = no bump effect, preserves original material)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create high-resolution texture
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.generateMipmaps = false; // Better for text
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    textureRef.current = texture;
    onTextureUpdate(texture, engravingDepth);
    
    console.log('✅ High-res engraving texture created');
    setDebugInfo('High-res texture created');
  }, [onTextureUpdate, isVisible]);

  const renderText = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !text.trim()) return;

    console.log('📝 Rendering bump map text:', text, 'at position:', positionX, positionY);

    // Clear canvas with white background (255 = no bump effect, preserves material color)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enable anti-aliasing for smooth text
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Save context for rotation
    ctx.save();

    // Calculate position based on sliders (0-1 range to canvas coordinates)
    const centerX = positionX * canvas.width;
    const centerY = positionY * canvas.height;

    // Move to custom position and rotate -90 degrees
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 2); // -90 degrees in radians

    // Configure text rendering for bump mapping
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Split text into lines if it contains line breaks
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      
      // Calculate bump map color based on depth
      // For engraved/carved effect: darker than white = deeper into surface
      const bumpDepth = Math.round(255 - (engravingDepth * 200)); // Range from 255 (no effect) to 55 (deep)
      
      // Main engraved text (dark = carved in)
      ctx.fillStyle = `rgb(${bumpDepth}, ${bumpDepth}, ${bumpDepth})`;
      ctx.fillText(line, 0, y);
      
      // Add subtle edge highlighting for more realistic bump effect
      if (engravingDepth > 0.3) {
        // Create a slight offset highlight for carved edge effect
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = `rgb(${Math.min(255, 255 - engravingDepth * 50)}, ${Math.min(255, 255 - engravingDepth * 50)}, ${Math.min(255, 255 - engravingDepth * 50)})`;
        ctx.translate(1, 1); // Slight offset for highlight
        ctx.fillText(line, 0, y);
        ctx.restore();
      }
    });

    // Restore context
    ctx.restore();

    // Update texture
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
      console.log('🔄 Bump map texture updated');
      setDebugInfo(`Bump map text "${text.substring(0, 20)}..." at ${(positionX*100).toFixed(0)}%, ${(positionY*100).toFixed(0)}%`);
    }
  }, [text, fontSize, fontFamily, engravingDepth, positionX, positionY]);

  const clearText = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Reset to white background (no bump effect, preserves original material)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
      console.log('🧹 Text engraving cleared');
      setDebugInfo('Engraving cleared');
    }
  }, []);

  const previewText = useCallback(() => {
    const sampleTexts = [
      "Love Forever",
      "Sarah & John\n2025",
      "Always Yours",
      "Forever\n&\nAlways"
    ];
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setText(randomText);
  }, []);

  // Auto-render when text or settings change
  useEffect(() => {
    if (text.trim()) {
      renderText();
    } else {
      clearText();
    }
  }, [text, fontSize, fontFamily, engravingDepth, positionX, positionY, renderText, clearText]);

  if (!isVisible) return null;

  // Render texture in background - no UI, controlled via iframe messages
  return (
    <canvas
      ref={canvasRef}
      width={1024}
      height={1024}
      style={{ display: 'none' }} // Hidden but still renders texture
    />
  );
}

function Model({
  url,
  metalType,
  diamondType,
  paintTexture,
}: {
  url: string;
  metalType: MetalType;
  diamondType: DiamondType;
  paintTexture?: THREE.Texture;
}) {
  const { scene } = useGLTF(url);
  const { scene: r3fScene } = useThree();
  const cloned = useMemo(() => scene.clone(true), [scene]);
  
  const { color: metalColor, roughness } = METAL_SETTINGS[metalType];
  const diamondSettings = DIAMOND_SETTINGS[diamondType];

  const diamondHDR = useLoader(RGBELoader, diamondSettings.hdrUrl);
  const rubySettings = DIAMOND_SETTINGS['ruby'];
  const rubyHDR = useLoader(RGBELoader, rubySettings.hdrUrl);
  const emeraldSettings = DIAMOND_SETTINGS['emerald'];
  const emeraldHDR = useLoader(RGBELoader, emeraldSettings.hdrUrl);
  const environmentHDR = useLoader(
    RGBELoader,
    'https://cdn.shopify.com/s/files/1/0754/1676/4731/files/custom5.hdr?v=1752937460'
  );

  const materialCache = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
  const meshes: React.ReactElement[] = [];

  useEffect(() => {
    r3fScene.environment = environmentHDR;
  }, [environmentHDR, r3fScene]);

  useEffect(() => {
    if (paintTexture) {
      console.log('🎨 Model received paint texture:', paintTexture);
      
      materialCache.current.forEach((material, key) => {
        console.log('🔄 Updating cached material for gradient depth effect:', key);
        
        material.map = paintTexture;
        material.bumpMap = null;
        material.bumpScale = 0;
        material.normalMap = null;
        material.normalScale = new THREE.Vector2(0, 0);
        material.roughnessMap = paintTexture;
        material.roughness = roughness * 1.2;
        material.metalnessMap = null;
        material.metalness = 1;
        material.envMapIntensity = 1;
        material.needsUpdate = true;
      });
    } else {
      console.log('🎨 No paint texture received by model');
    }
  }, [paintTexture, roughness]);

  cloned.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const mesh = obj as Mesh;
      const geometry = mesh.geometry;
      const name = mesh.name.toLowerCase();

      console.log('🔍 Processing mesh:', name, 'has UVs:', !!geometry.attributes.uv);

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
      } else if (name.includes('ruby')) {
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
              envMap={rubyHDR}
              bounces={rubySettings.bounces}
              ior={rubySettings.ior}
              fresnel={rubySettings.fresnel}
              aberrationStrength={rubySettings.aberrationStrength}
              color={rubySettings.color}
              fastChroma={rubySettings.fastChroma}
              toneMapped={rubySettings.toneMapped}
            />
          </mesh>
        );
      } else if (name.includes('emerald')) {
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
              envMap={emeraldHDR}
              bounces={emeraldSettings.bounces}
              ior={emeraldSettings.ior}
              fresnel={emeraldSettings.fresnel}
              aberrationStrength={emeraldSettings.aberrationStrength}
              color={emeraldSettings.color}
              fastChroma={emeraldSettings.fastChroma}
              toneMapped={emeraldSettings.toneMapped}
            />
          </mesh>
        );
      } else if (name.includes('demos')) {
        // Special material for demos meshes
        let demosMaterial = materialCache.current.get(mesh.uuid + '_demos');
        
        if (!demosMaterial) {
          console.log('🆕 Creating new demos material for mesh:', name);
          demosMaterial = new THREE.MeshStandardMaterial({
            color: DEMOS_MATERIAL_SETTINGS.color,
            metalness: 1,
            roughness: DEMOS_MATERIAL_SETTINGS.roughness,
            envMap: r3fScene.environment!,
            envMapIntensity: 1,
            side: THREE.DoubleSide,
          });
          
          materialCache.current.set(mesh.uuid + '_demos', demosMaterial);
        } else {
          demosMaterial.color.set(DEMOS_MATERIAL_SETTINGS.color);
          demosMaterial.metalness = 1;
          demosMaterial.roughness = DEMOS_MATERIAL_SETTINGS.roughness;
          demosMaterial.envMapIntensity = 1;
        }

        meshes.push(
          <mesh
            key={mesh.uuid}
            geometry={geometry}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            castShadow
            receiveShadow
            material={demosMaterial}
          />
        );
      } else {
        let material = materialCache.current.get(mesh.uuid);
        
        if (!material) {
          console.log('🆕 Creating new persistent material for engraving:', name);
          material = new THREE.MeshStandardMaterial({
            color: metalColor,
            metalness: 1,
            roughness: roughness,
            envMap: r3fScene.environment!,
            envMapIntensity: 1,
            side: THREE.DoubleSide,
          });
          
          if (paintTexture) {
            console.log('🎨 Applying gradient depth illusion to new material for mesh:', name);
            material.map = paintTexture;
            material.bumpMap = null;
            material.bumpScale = 0;
            material.normalMap = null;
            material.normalScale = new THREE.Vector2(0, 0);
            material.roughnessMap = paintTexture;
            material.roughness = roughness * 1.2;
          }
          
          materialCache.current.set(mesh.uuid, material);
        } else {
          material.color.set(metalColor);
          material.metalness = 1;
          material.roughness = roughness;
          material.envMapIntensity = 1;
        }

        meshes.push(
          <mesh
            key={mesh.uuid}
            geometry={geometry}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            castShadow
            receiveShadow
            material={material}
          />
        );
      }
    }
  });

  return <group scale={50} position={[0, -0.3, 0]}>{meshes}</group>;
}

function SmartOrbitControls() {
  const controlsRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [diamondType, setDiamondType] = useState<DiamondType>('real-diamond');
  const [paintTexture, setPaintTexture] = useState<THREE.Texture | undefined>();
  const [showPainter, setShowPainter] = useState(true); // Always on by default
  const [debugInfo, setDebugInfo] = useState('No texture yet');

  useEffect(() => {
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

      if (event?.data?.type === 'materialChange') {
        const material = event.data.material;
        if (METAL_SETTINGS[material as MetalType]) {
          setMetalType(material as MetalType);
        }
      }

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

  const handleTextureUpdate = useCallback((texture: THREE.Texture, depth: number) => {
    console.log('📥 App received texture update:', texture, 'depth:', depth);
    setPaintTexture(texture);
    // Store depth in texture for material access
    (texture as any).engravingDepth = depth;
    setDebugInfo(`Texture updated: ${texture.image?.width}x${texture.image?.height}`);
  }, []);

  useEffect(() => {
    console.log('🔄 App paint texture state changed:', paintTexture);
  }, [paintTexture]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Hidden TextEngraver - still renders texture but no UI */}
      <TextEngraver 
        onTextureUpdate={handleTextureUpdate}
        isVisible={showPainter}
      />

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
          camera={{ position: [0, 0, 4], fov: 30 }}
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
            <Model 
              url={url} 
              metalType={metalType} 
              diamondType={diamondType}
              paintTexture={paintTexture}
            />
            <SmartOrbitControls />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}