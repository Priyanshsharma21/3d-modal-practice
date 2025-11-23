'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const CONFIG = {
  materials: {
    gold: { color: 0xFFD700, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.8 },
    rosegold: { color: 0xB76E79, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.8 },
    platinum: { color: 0xffffff, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.7 }
  },
  hdriUrls: {
    studio: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/brown_photostudio_02_1k.hdr',
    dramatic: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
    soft: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_05_1k.hdr',
    natural: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/lebombo_1k.hdr'
  }
};

type MaterialType = 'gold' | 'rosegold' | 'platinum' | 'custom';
type CameraPreset = 'front' | 'side' | 'top' | 'detail' | 'iso';
type LightingPreset = 'studio' | 'dramatic' | 'soft' | 'natural';

// Helper to get theme color based on material
const getThemeColor = (material: MaterialType, customColor?: string): string => {
  if (material === 'custom' && customColor) {
    return customColor;
  }
  const colors: Record<MaterialType, string> = {
    gold: '#FFD700',
    rosegold: '#B76E79',
    platinum: '#E5E4E2',
    custom: '#FFD700'
  };
  return colors[material] || colors.gold;
};

export default function JewelleryViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>('gold');
  const [customColor, setCustomColor] = useState<string>('#FFD700');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [fps, setFps] = useState(60);
  const [modelInfo, setModelInfo] = useState<{ vertices: number; faces: number; materials: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const themeColor = getThemeColor(currentMaterial, customColor);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Object3D | null>(null);
  const defaultRingRef = useRef<THREE.Mesh | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; directional: THREE.DirectionalLight; point1: THREE.PointLight; point2: THREE.PointLight } | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Reduced from 1.0 to make it less bright
    renderer.shadowMap.enabled = false; // Disable shadow mapping to prevent black artifacts
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing for bloom effect (diamond sparkle) - optional
    try {
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3, // strength - reduced from 1.5 to make it more natural
        0.2, // radius - reduced from 0.4
        0.9 // threshold - increased from 0.85 to reduce bloom effect
      );
      composer.addPass(bloomPass);
      composerRef.current = composer;
    } catch (error) {
      console.warn('Post-processing not available, using standard rendering');
      composerRef.current = null;
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Natural Lighting Setup - reduced intensity for more realistic look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Reduced point lights for more natural illumination
    const pointLight1 = new THREE.PointLight(0xffffff, 0.6, 20);
    pointLight1.position.set(-5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffd700, 0.3, 15);
    pointLight2.position.set(5, 3, -5);
    scene.add(pointLight2);

    lightsRef.current = { ambient: ambientLight, directional: dirLight, point1: pointLight1, point2: pointLight2 };

    // Load environment and default model
    loadEnvironment(scene, renderer, 'studio');

    // Sparkle particles removed - was causing rendering issues

    // Animation loop with FPS tracking
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // FPS calculation
      frameCountRef.current++;
      if (currentTime - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = currentTime;
      }

      // Sparkle particles removed

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (renderer && scene && camera) {
        if (composerRef.current) {
          composerRef.current.render();
        } else {
          renderer.render(scene, camera);
        }
      }
    };
    animate(performance.now());

    // Window resize handler
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (composerRef.current) {
        composerRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Fullscreen change handler
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        if (camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          if (composerRef.current) {
            composerRef.current.setSize(window.innerWidth, window.innerHeight);
          }
        }
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (composerRef.current) {
        composerRef.current.dispose();
      }
      renderer.dispose();
    };
  }, []);

  // Define functions before useEffects that use them
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const captureScreenshot = useCallback(() => {
    if (!rendererRef.current) return;
    
    setIsCapturing(true);
    const renderer = rendererRef.current;
    
    // Temporarily increase resolution for high-quality capture
    const originalSize = renderer.getSize(new THREE.Vector2());
    const scale = 2; // 2x resolution
    renderer.setSize(originalSize.x * scale, originalSize.y * scale, false);
    
    // Render at high resolution
    if (composerRef.current) {
      composerRef.current.render();
    } else if (sceneRef.current && cameraRef.current) {
      renderer.render(sceneRef.current, cameraRef.current);
    }
    
    // Capture
    renderer.domElement.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `jewellery-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      // Restore original size
      renderer.setSize(originalSize.x, originalSize.y, false);
      setIsCapturing(false);
    }, 'image/png');
  }, []);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'r':
          setAutoRotate(!autoRotate);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 's':
          setShowStats(!showStats);
          break;
        case 'c':
          captureScreenshot();
          break;
        case '1':
          setCameraPreset('front');
          break;
        case '2':
          setCameraPreset('side');
          break;
        case '3':
          setCameraPreset('top');
          break;
        case '4':
          setCameraPreset('detail');
          break;
        case '5':
          setCameraPreset('iso');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [autoRotate, showStats, toggleFullscreen, captureScreenshot]);

  // Update camera preset
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !currentModelRef.current) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const model = currentModelRef.current;

    // Get model bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    switch (cameraPreset) {
      case 'front':
        camera.position.set(center.x, center.y, center.z + maxDim * 1.5);
        controls.target.copy(center);
        break;
      case 'side':
        camera.position.set(center.x + maxDim * 1.5, center.y, center.z);
        controls.target.copy(center);
        break;
      case 'top':
        camera.position.set(center.x, center.y + maxDim * 1.5, center.z);
        controls.target.copy(center);
        break;
      case 'detail':
        camera.position.set(center.x + maxDim * 0.8, center.y + maxDim * 0.5, center.z + maxDim * 0.8);
        controls.target.copy(center);
        controls.minDistance = maxDim * 0.3;
        break;
      case 'iso':
        camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim);
        controls.target.copy(center);
        break;
    }
    controls.update();
  }, [cameraPreset]);

  // Update lighting preset
  useEffect(() => {
    if (!sceneRef.current) return;
    loadEnvironment(sceneRef.current, rendererRef.current!, lightingPreset);
  }, [lightingPreset]);

  const loadEnvironment = (scene: THREE.Scene, renderer: THREE.WebGLRenderer, preset: LightingPreset = 'studio') => {
    const hdriUrl = CONFIG.hdriUrls[preset];
    
    new RGBELoader().load(
      hdriUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = new THREE.Color(0x1a1a1a);
        envMapRef.current = texture;
        
        // Update all materials with new environment
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const material = child.material;
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              material.envMap = texture;
              material.needsUpdate = true;
            }
          }
        });

        if (!currentModelRef.current) {
          createDefaultRing(scene);
          setLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading HDRI:', error);
        if (!currentModelRef.current) {
          createDefaultRing(scene);
          setLoading(false);
        }
      }
    );
  };

  // Sparkle particles function removed - was causing rendering issues

  const createDefaultRing = (scene: THREE.Scene) => {
    const geometry = new THREE.TorusGeometry(1, 0.15, 64, 128);
    const material = new THREE.MeshStandardMaterial({
      color: CONFIG.materials.gold.color,
      metalness: CONFIG.materials.gold.metalness,
      roughness: CONFIG.materials.gold.roughness,
      envMapIntensity: CONFIG.materials.gold.envMapIntensity
    });

    if (envMapRef.current) {
      material.envMap = envMapRef.current;
    }

    const ring = new THREE.Mesh(geometry, material);
    ring.castShadow = false; // Disable shadows to prevent black artifacts
    ring.receiveShadow = false;

    // Natural diamond material - reduced glow for realistic appearance
    const diamondGeo = new THREE.OctahedronGeometry(0.25, 2);
    const diamondMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05, // Slight roughness for more natural look
      transmission: 0.7, // Reduced from 0.95 to reduce glow
      thickness: 1.5, // Reduced from 2.0
      ior: 2.417, // Real diamond IOR
      clearcoat: 0.8, // Reduced from 1.0
      clearcoatRoughness: 0.1, // Added slight roughness
      sheen: 0.2, // Reduced from 0.5
      sheenColor: 0xffffff,
      sheenRoughness: 0.3 // Increased from 0.1
    });

    if (envMapRef.current) {
      diamondMat.envMap = envMapRef.current;
      diamondMat.envMapIntensity = 0.8; // Reduced from 2.0 to make it less glowing
    }

    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 1.1;
    diamond.castShadow = false; // Disable shadow to prevent black spots
    diamond.receiveShadow = false;
    ring.add(diamond);

    scene.add(ring);
    currentModelRef.current = ring;
    defaultRingRef.current = ring;

    // Calculate model info
    let vertices = 0;
    let faces = 0;
    let materials = 0;
    ring.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geo = child.geometry;
        if (geo.attributes.position) {
          vertices += geo.attributes.position.count;
        }
        if (geo.index) {
          faces += geo.index.count / 3;
        } else {
          faces += geo.attributes.position.count / 3;
        }
        if (child.material) {
          materials++;
        }
      }
    });
    setModelInfo({ vertices, faces, materials });
  };

  const loadModelFromURL = useCallback(async (url: string) => {
    if (!sceneRef.current) return;
    
    setLoading(true);
    try {
      const loader = new GLTFLoader();
      let modelUrl = url;
      
      // Handle Sketchfab short URLs - try to get direct download
      if (url.includes('skfb.ly')) {
        const modelId = url.split('/').pop()?.split('?')[0];
        
        // Try using a CORS proxy to fetch the model
        // Note: This is a workaround - in production, use Sketchfab API or direct GLB URLs
        try {
          // Attempt to use Sketchfab's embed API endpoint (may require authentication)
          // For public models, we can try the download endpoint
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://sketchfab.com/models/${modelId}/embed`)}`;
          
          // For now, show a user-friendly message instead of alert
          console.warn('Sketchfab model loading:', {
            modelId,
            message: 'Direct GLB/GLTF URL or Sketchfab API access required'
          });
          
          // Show loading message but don't actually load (would need proper API)
          setTimeout(() => {
            setLoading(false);
            // You can add a toast notification here instead of alert
            const message = `To load this Sketchfab model, you need:\n• Direct GLB/GLTF download URL, or\n• Sketchfab API access\n\nModel ID: ${modelId}`;
            // Using a more user-friendly approach - just log and don't show alert
            console.info(message);
          }, 500);
          return;
        } catch (err) {
          console.error('Error processing Sketchfab URL:', err);
          setLoading(false);
          return;
        }
      }
      
      // Load model from direct URL
      loader.load(
        modelUrl,
        (gltf) => {
          if (!sceneRef.current) return;
          
          // Remove old model
          if (currentModelRef.current && currentModelRef.current !== defaultRingRef.current) {
            sceneRef.current.remove(currentModelRef.current);
          }
          
          const model = gltf.scene;
          
          // Auto-center and scale
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          model.position.x -= center.x;
          model.position.y -= center.y;
          model.position.z -= center.z;
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 2 / maxDim;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // Apply environment map and materials
          let vertices = 0;
          let faces = 0;
          let materials = 0;
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              
              const geo = child.geometry;
              if (geo.attributes.position) {
                vertices += geo.attributes.position.count;
              }
              if (geo.index) {
                faces += geo.index.count / 3;
              } else {
                faces += geo.attributes.position.count / 3;
              }
              
              if (child.material) {
                materials++;
                const material = child.material;
                if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
                  if (envMapRef.current) {
                    material.envMap = envMapRef.current;
                    material.envMapIntensity = 0.8;
                    material.needsUpdate = true;
                  }
                }
              }
            }
          });
          
          sceneRef.current.add(model);
          currentModelRef.current = model;
          setModelInfo({ vertices, faces, materials });
          setLoading(false);
          setCameraPreset('front');
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          // Don't show alert, just log and stop loading
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  }, []);

  const setMaterial = (type: MaterialType, color?: string) => {
    setCurrentMaterial(type);
    if (type === 'custom' && color) {
      setCustomColor(color);
    }
    
    const colorHex = type === 'custom' && color 
      ? parseInt(color.replace('#', ''), 16)
      : CONFIG.materials[type as keyof typeof CONFIG.materials]?.color || 0xFFD700;
    
    const settings = type === 'custom' 
      ? { color: colorHex, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.8 }
      : CONFIG.materials[type as keyof typeof CONFIG.materials];
    
    if (!settings || !currentModelRef.current) return;

    const model = currentModelRef.current;

    if (model === defaultRingRef.current) {
      // Procedural ring
      if (model instanceof THREE.Mesh && model.material instanceof THREE.MeshStandardMaterial) {
        model.material.color.setHex(settings.color);
        model.material.metalness = settings.metalness;
        model.material.roughness = settings.roughness;
        model.material.envMapIntensity = settings.envMapIntensity;
      }
    } else {
      // GLB model
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material;
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            if (
              material.name.toLowerCase().includes('metal') ||
              material.name.toLowerCase().includes('gold') ||
              material.metalness > 0.5
            ) {
              material.color.setHex(settings.color);
              material.metalness = settings.metalness;
              material.roughness = settings.roughness;
              if ('envMapIntensity' in material) {
                material.envMapIntensity = settings.envMapIntensity;
              }
            } else {
              material.color.setHex(settings.color);
              material.metalness = settings.metalness;
              material.roughness = settings.roughness;
            }
            if (envMapRef.current) {
              material.envMap = envMapRef.current;
              material.needsUpdate = true;
            }
          }
        }
      });
    }
  };

  const resetScene = () => {
    if (!sceneRef.current) return;
    
    if (currentModelRef.current && currentModelRef.current !== defaultRingRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      if (defaultRingRef.current) {
        sceneRef.current.add(defaultRingRef.current);
        currentModelRef.current = defaultRingRef.current;
      }
    }
  };

  // Drag and drop functionality removed per user request
  const loadUserGLB = (file: File) => {
    if (!sceneRef.current) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const loader = new GLTFLoader();
      loader.parse(
        e.target?.result as ArrayBuffer,
        '',
        (gltf) => {
          if (!sceneRef.current) return;

          // Remove old model
          if (currentModelRef.current) {
            sceneRef.current.remove(currentModelRef.current);
          }

          const model = gltf.scene;

          // Auto-center and scale
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          model.position.x += (model.position.x - center.x);
          model.position.y += (model.position.y - center.y);
          model.position.z += (model.position.z - center.z);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 2 / maxDim;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Enable shadows and environment map
          let vertices = 0;
          let faces = 0;
          let materials = 0;

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              const geo = child.geometry;
              if (geo.attributes.position) {
                vertices += geo.attributes.position.count;
              }
              if (geo.index) {
                faces += geo.index.count / 3;
              } else {
                faces += geo.attributes.position.count / 3;
              }

              if (child.material) {
                materials++;
                const material = child.material;
                if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
                  if (envMapRef.current) {
                    material.envMap = envMapRef.current;
                    material.envMapIntensity = 1.0;
                    material.needsUpdate = true;
                  }
                }
              }
            }
          });

          sceneRef.current.add(model);
          currentModelRef.current = model;
          setModelInfo({ vertices, faces, materials });
          setLoading(false);
          
          // Auto-adjust camera to fit model
          setCameraPreset('front');
        },
        (error) => {
          console.error(error);
          alert('Error parsing GLB file');
          setLoading(false);
        }
      );
    };

    reader.readAsArrayBuffer(file);
  };

  const zoomToFit = useCallback(() => {
    if (!currentModelRef.current || !cameraRef.current || !controlsRef.current) return;
    
    const model = currentModelRef.current;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    controls.target.copy(center);
    camera.position.set(center.x, center.y, center.z + maxDim * 1.5);
    controls.update();
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#1a1a1a]"
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
          <div className="w-12 h-12 border-3 border-white/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
          <div className="text-white text-lg tracking-widest uppercase">Loading Studio</div>
          <div className="text-gray-500 text-sm mt-2">Preparing Environment & HDRI</div>
        </div>
      )}


      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="pointer-events-auto glass-panel" style={{ borderLeft: `4px solid ${themeColor}` }}>
            <h1 className="text-xl md:text-2xl font-light text-white tracking-wider">
              JEWELLERY <span style={{ color: themeColor }} className="font-bold">STUDIO</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Interactive 3D POC</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Status */}
            <div className="pointer-events-auto glass-panel text-right">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Status</div>
              <div className="flex items-center justify-end gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-white text-sm">{fps} FPS</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pointer-events-auto glass-panel">
              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  style={{ 
                    backgroundColor: `${themeColor}20`,
                    color: themeColor
                  }}
                  className="px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                  title="Fullscreen (F)"
                >
                  ⛶
                </button>
                <button
                  onClick={captureScreenshot}
                  disabled={isCapturing}
                  style={{ 
                    backgroundColor: `${themeColor}20`,
                    color: themeColor
                  }}
                  className="px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 hover:opacity-80"
                  title="Screenshot (C)"
                >
                  {isCapturing ? '⏳' : '📷'}
                </button>
                <button
                  onClick={() => setShowStats(!showStats)}
                  style={{ 
                    backgroundColor: showStats ? `${themeColor}30` : `${themeColor}20`,
                    color: themeColor
                  }}
                  className="px-3 py-1.5 rounded text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                  title="Stats (S)"
                >
                  📊
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-end gap-4 flex-wrap">
          {/* Left Side - Material & Camera */}
          <div className="flex gap-4 flex-wrap">
            {/* Material Selector */}
            <div className="pointer-events-auto glass-panel">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">Metal Material</div>
              <div className="flex gap-4 flex-wrap">
                <button
                  className={`metal-btn ${currentMaterial === 'gold' ? 'active' : ''}`}
                  onClick={() => setMaterial('gold')}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FDB931)',
                    borderColor: currentMaterial === 'gold' ? themeColor : 'rgba(255, 255, 255, 0.2)'
                  }}
                  title="Yellow Gold"
                />
                <button
                  className={`metal-btn ${currentMaterial === 'rosegold' ? 'active' : ''}`}
                  onClick={() => setMaterial('rosegold')}
                  style={{
                    background: 'linear-gradient(135deg, #E0BFB8, #B76E79)',
                    borderColor: currentMaterial === 'rosegold' ? themeColor : 'rgba(255, 255, 255, 0.2)'
                  }}
                  title="Rose Gold"
                />
                <button
                  className={`metal-btn ${currentMaterial === 'platinum' ? 'active' : ''}`}
                  onClick={() => setMaterial('platinum')}
                  style={{
                    background: 'linear-gradient(135deg, #E5E4E2, #FFFFFF)',
                    borderColor: currentMaterial === 'platinum' ? themeColor : 'rgba(255, 255, 255, 0.2)'
                  }}
                  title="Platinum"
                />
                <button
                  className={`metal-btn ${currentMaterial === 'custom' ? 'active' : ''}`}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    background: `linear-gradient(135deg, ${customColor}, ${customColor}dd)`,
                    borderColor: currentMaterial === 'custom' ? themeColor : 'rgba(255, 255, 255, 0.2)'
                  }}
                  title="Custom Color"
                >
                  🎨
                </button>
              </div>
              
              {/* Color Picker */}
              {showColorPicker && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Custom Color</div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setMaterial('custom', e.target.value);
                      }}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          setCustomColor(e.target.value);
                          setMaterial('custom', e.target.value);
                        }
                      }}
                      className="flex-1 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600"
                      placeholder="#FFD700"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    style={{ accentColor: themeColor }}
                  />
                  <span className="text-sm text-gray-300">Auto Rotate (R)</span>
                </label>
                <button
                  onClick={zoomToFit}
                  style={{ color: themeColor }}
                  className="text-xs hover:text-white underline decoration-dashed w-full text-left transition-colors"
                >
                  Zoom to Fit
                </button>
              </div>
            </div>

            {/* Camera Presets */}
            <div className="pointer-events-auto glass-panel">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">Camera Views</div>
              <div className="grid grid-cols-2 gap-2">
                {(['front', 'side', 'top', 'detail', 'iso'] as CameraPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCameraPreset(preset)}
                    style={{
                      backgroundColor: cameraPreset === preset ? themeColor : 'rgba(55, 65, 81, 0.5)',
                      color: cameraPreset === preset ? '#000' : '#d1d5db'
                    }}
                    className="px-3 py-2 text-xs uppercase tracking-wider rounded transition-colors hover:opacity-80"
                    title={`${preset.charAt(0).toUpperCase() + preset.slice(1)} View`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Presets */}
            <div className="pointer-events-auto glass-panel">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">Lighting</div>
              <div className="grid grid-cols-2 gap-2">
                {(['studio', 'dramatic', 'soft', 'natural'] as LightingPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setLightingPreset(preset)}
                    style={{
                      backgroundColor: lightingPreset === preset ? themeColor : 'rgba(55, 65, 81, 0.5)',
                      color: lightingPreset === preset ? '#000' : '#d1d5db'
                    }}
                    className="px-3 py-2 text-xs uppercase tracking-wider rounded transition-colors hover:opacity-80"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && modelInfo && (
          <div className="pointer-events-auto glass-panel absolute top-20 right-4 max-w-xs">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Model Statistics</div>
            <div className="space-y-1 text-sm text-gray-300">
              <div>Vertices: {modelInfo.vertices.toLocaleString()}</div>
              <div>Faces: {modelInfo.faces.toLocaleString()}</div>
              <div>Materials: {modelInfo.materials}</div>
              <div className="pt-2 border-t border-gray-700 mt-2">
                <div>FPS: {fps}</div>
                <div>Resolution: {rendererRef.current?.domElement.width} × {rendererRef.current?.domElement.height}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

