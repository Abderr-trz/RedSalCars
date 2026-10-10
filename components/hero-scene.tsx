"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

/* ─── Configuration ─── */

const MODEL_URL = "/models/mercedes/Mercedes+AMG+GT.fbx";
const TIRE_TEXTURE_URL = "/models/mercedes/tire7.jpg";

export const COLOR_PALETTE = [
  { id: "red", name: "Rouge Carmine", hex: "#9a121c" },
  { id: "black", name: "Noir Obsidienne", hex: "#111215" },
  { id: "silver", name: "Gris Sélénite", hex: "#4f555d" },
  { id: "white", name: "Blanc Polaire", hex: "#e5e7eb" },
];

/* ─── Error Boundary ─── */

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Mercedes showroom failed to load:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ─── Loading Overlay ─── */

function LoadingOverlay({ ready }: { ready: boolean }) {
  const { active, progress } = useProgress();
  const visible = active || !ready;

  return (
    <div
      className={`model-loader ${visible ? "visible" : ""}`}
      aria-live="polite"
      aria-busy={visible}
    >
      <div className="model-loader-track">
        <span
          style={{ transform: `scaleX(${Math.max(progress, 4) / 100})` }}
        />
      </div>
      <p>Chargement du modèle Mercedes AMG GT</p>
      <strong>{Math.round(progress)}%</strong>
    </div>
  );
}

/* ─── Helpers ─── */

function materialList(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material : [material];
}

/* ─── Mercedes AMG GT Model (FBX) ─── */

function MercedesModel({
  onReady,
  bodyColor,
  isMobile,
}: {
  onReady: () => void;
  bodyColor: string;
  isMobile: boolean;
}) {
  const source = useLoader(FBXLoader, MODEL_URL, (loader) => {
    loader.setResourcePath("/models/mercedes/");
  });
  const tireTexture = useLoader(THREE.TextureLoader, TIRE_TEXTURE_URL);
  const bodyMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);

  const model = useMemo(() => {
    /* Reset body materials cache */
    bodyMaterialsRef.current = [];

    /* Configure tire texture */
    tireTexture.colorSpace = THREE.SRGBColorSpace;
    tireTexture.wrapS = THREE.RepeatWrapping;
    tireTexture.wrapT = THREE.RepeatWrapping;
    tireTexture.repeat.set(2, 2);
    tireTexture.anisotropy = 8;

    const clone = source.clone(true);

    /* Traverse all meshes and convert to PBR materials */
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = true;
      object.castShadow = true;
      object.receiveShadow = true;

      const enhanced = materialList(object.material).map((sourceMaterial) => {
        const semanticName = `${object.name} ${sourceMaterial.name}`.toLowerCase();

        // 1. Car body paint (AMG_GT_Mango_Gr / body)
        if (/amg_gt_mango_gr|body|paint|carrosserie/.test(semanticName)) {
          const pbrBody = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(bodyColor),
            metalness: 0.84,
            roughness: 0.18,
            clearcoat: 1.0,
            clearcoatRoughness: 0.06,
            envMapIntensity: 2.4,
          });
          bodyMaterialsRef.current.push(pbrBody);
          return pbrBody;
        }

        // 2. Rubber tires
        if (/tire|rubber|pneu/.test(semanticName)) {
          return new THREE.MeshStandardMaterial({
            map: tireTexture,
            color: new THREE.Color("#222325"),
            metalness: 0.0,
            roughness: 0.85,
            envMapIntensity: 0.8,
          });
        }

        // 3. Chrome / Wheels / Rims / Brake Discs
        if (/chrome|silver|rim|wheel|brake_discs/.test(semanticName)) {
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#d5d8dc"),
            metalness: 0.92,
            roughness: 0.16,
            envMapIntensity: 2.2,
          });
        }

        // 4. Windows and windshield glass
        if (/windowglass|glass|windshield/.test(semanticName)) {
          return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#111822"),
            transparent: true,
            opacity: 0.62,
            roughness: 0.06,
            metalness: 0.2,
            envMapIntensity: 2.5,
          });
        }

        // 5. Carbon fiber elements (mirrors, spoiler, roof)
        if (/carbon/.test(semanticName)) {
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#1c1d20"),
            roughness: 0.45,
            metalness: 0.5,
            envMapIntensity: 1.2,
          });
        }

        // 6. Yellow AMG brake calipers
        if (/amg_brakes_yell/.test(semanticName)) {
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#e2b123"),
            roughness: 0.25,
            metalness: 0.4,
            envMapIntensity: 1.6,
          });
        }

        // 7. Red taillights
        if (/r_lights|tail_lamp/.test(semanticName)) {
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#dc1414"),
            emissive: new THREE.Color("#900000"),
            emissiveIntensity: 0.5,
            roughness: 0.18,
            metalness: 0.2,
          });
        }

        // 8. Dark trims / interior plastics
        const sm = sourceMaterial as THREE.Material & { color?: THREE.Color };
        return new THREE.MeshStandardMaterial({
          color: sm.color ? sm.color.clone() : new THREE.Color("#141518"),
          roughness: 0.65,
          metalness: 0.2,
          envMapIntensity: 1.2,
        });
      });

      object.material = Array.isArray(object.material)
        ? enhanced
        : enhanced[0];
    });

    /* Auto-center and auto-scale to target size */
    const initialBox = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const longestSide = Math.max(initialSize.x, initialSize.z);

    // Responsive scaling: 4.6 units on mobile, 5.7 units on desktop
    const targetLength = isMobile ? 4.6 : 5.7;
    const scale = targetLength / Math.max(longestSide, 0.001);
    const center = initialBox.getCenter(new THREE.Vector3());

    clone.position.sub(center);
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);

    /* Drop the car onto the ground plane */
    const groundedBox = new THREE.Box3().setFromObject(clone);
    clone.position.y -= groundedBox.min.y;
    clone.updateMatrixWorld(true);

    return clone;
  }, [source, tireTexture, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Instant color change without re-cloning geometry */
  useEffect(() => {
    bodyMaterialsRef.current.forEach((mat) => {
      mat.color.set(bodyColor);
      mat.needsUpdate = true;
    });
  }, [bodyColor]);

  useEffect(() => {
    onReady();
  }, [model, onReady]);

  /* Responsive car position and rotation */
  // On mobile: perfectly centered at [0, 0, 0] with slight 3/4 angle
  // On desktop: offset to the right at [0.9, 0, -0.25]
  const carPosition: [number, number, number] = isMobile
    ? [0, 0.01, 0]
    : [0.9, 0.01, -0.25];

  const carRotation: [number, number, number] = isMobile
    ? [0, -0.38, 0]
    : [0, -0.48, 0];

  return (
    <group position={carPosition} rotation={carRotation}>
      <primitive object={model} />
    </group>
  );
}

/* ─── Showroom Scene ─── */

function Showroom({
  onReady,
  bodyColor,
}: {
  onReady: () => void;
  bodyColor: string;
}) {
  const { size, camera } = useThree();
  const isMobile = size.width < 768;
  const controlsRef = useRef<any>(null);

  /* Sync camera and controls target dynamically */
  useEffect(() => {
    if (controlsRef.current) {
      if (isMobile) {
        controlsRef.current.target.set(0, 0.65, 0);
        camera.position.set(1.5, 1.8, 10.8);
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 34;
          camera.updateProjectionMatrix();
        }
      } else {
        controlsRef.current.target.set(0.8, 0.9, -0.25);
        camera.position.set(7.8, 2.8, 8.8);
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 31;
          camera.updateProjectionMatrix();
        }
      }
      controlsRef.current.update();
    }
  }, [isMobile, camera]);

  const shadowPosition: [number, number, number] = isMobile
    ? [0, 0.02, 0]
    : [0.9, 0.025, -0.25];

  return (
    <>
      <color attach="background" args={["#08090b"]} />
      <fog attach="fog" args={["#08090b", 12, 28]} />
      <ambientLight intensity={0.25} />

      {/* Key light — warm spotlight from above-right */}
      <spotLight
        position={[5, 7.5, 5]}
        angle={0.45}
        penumbra={0.9}
        intensity={180}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00012}
      />

      {/* Accent light — brand red from the left */}
      <spotLight
        position={[-5, 3.2, -1]}
        angle={0.5}
        penumbra={1}
        intensity={120}
        color="#b80f1b"
      />

      {/* Front fill light — cool crisp white */}
      <pointLight position={[0, 2.2, 6]} intensity={28} color="#e6f0fa" />

      {/* The Mercedes AMG GT */}
      <MercedesModel
        onReady={onReady}
        bodyColor={bodyColor}
        isMobile={isMobile}
      />

      {/* Showroom floor: fast PBR metal on mobile, lightweight reflector on desktop */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[36, 36]} />
        {isMobile ? (
          <meshStandardMaterial
            color="#090a0d"
            metalness={0.85}
            roughness={0.28}
            envMapIntensity={1.8}
          />
        ) : (
          <MeshReflectorMaterial
            color="#0a0b0d"
            metalness={0.78}
            roughness={0.3}
            mirror={0.38}
            mixBlur={2.2}
            mixStrength={0.8}
            resolution={256}
            depthScale={0.2}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.4}
          />
        )}
      </mesh>

      {/* Contact shadows under the car */}
      <ContactShadows
        frames={1}
        position={shadowPosition}
        opacity={0.78}
        scale={isMobile ? 7.5 : 9}
        blur={2.4}
        far={4}
        color="#000000"
      />

      {/* Back wall */}
      <mesh position={[0, 3.8, -6.5]}>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial color="#090a0c" roughness={0.75} />
      </mesh>

      {/* Studio-style HDRI environment */}
      <Environment resolution={128}>
        <Lightformer
          intensity={5}
          rotation-x={Math.PI / 2}
          position={[0, 5.5, -4]}
          scale={[9, 1.2, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={4}
          rotation-y={Math.PI / 2}
          position={[-5, 1.2, 0]}
          scale={[5, 1, 1]}
          color="#d52a32"
        />
        <Lightformer
          intensity={3}
          rotation-y={-Math.PI / 2}
          position={[5, 1.2, 1]}
          scale={[4, 1, 1]}
          color="#c5a46d"
        />
        <Lightformer
          intensity={2.2}
          position={[0, 1.2, 5]}
          scale={[3, 3, 1]}
          color="#d9e5f4"
        />
      </Environment>

      {/* 360° interactive controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.055}
        enablePan={false}
        enableZoom
        minDistance={isMobile ? 6.8 : 5.8}
        maxDistance={isMobile ? 15 : 13}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.49}
      />
    </>
  );
}

/* ─── Error Fallback UI ─── */

function ErrorFallback() {
  return (
    <div className="model-error" role="alert">
      <p>Le showroom 3D n&apos;a pas pu être chargé.</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  );
}

/* ─── Main Export ─── */

export default function HeroScene() {
  const [ready, setReady] = useState(false);
  const [activeColor, setActiveColor] = useState("#9a121c");
  const [interacted, setInteracted] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  return (
    <div
      className="showroom-shell"
      onTouchStart={() => setInteracted(true)}
      onMouseDown={() => setInteracted(true)}
    >
      <SceneErrorBoundary fallback={<ErrorFallback />}>
        <Canvas
          dpr={[1, typeof window !== "undefined" && window.innerWidth < 768 ? 1.15 : 1.5]}
          shadows
          frameloop="demand"
          camera={{
            position: [7.8, 2.8, 8.8],
            fov: 31,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.12,
          }}
        >
          <Suspense fallback={null}>
            <Showroom onReady={handleReady} bodyColor={activeColor} />
          </Suspense>
        </Canvas>

        {/* 360° Interaction Hint Badge */}
        {ready && (
          <div className={`showroom-hint ${interacted ? "fade" : ""}`}>
            <span className="hint-icon">360°</span>
            <span>Glissez pour faire pivoter le véhicule</span>
          </div>
        )}

        {/* Dynamic Color Switcher for Mobile & Desktop */}
        {ready && (
          <div className="showroom-color-bar" aria-label="Choisir la couleur de carrosserie">
            <span className="color-bar-label">Couleur</span>
            <div className="color-swatches">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.name}
                  title={c.name}
                  className={`color-swatch ${activeColor === c.hex ? "active" : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setActiveColor(c.hex)}
                />
              ))}
            </div>
          </div>
        )}

        <LoadingOverlay ready={ready} />
      </SceneErrorBoundary>
    </div>
  );
}

useLoader.preload(FBXLoader, MODEL_URL);
