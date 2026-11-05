"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface MinsuCrestCanvasProps {
  className?: string;
  showOrbit?: boolean;
}

export function MinsuCrestCanvas({
  className = "",
  showOrbit = true,
}: MinsuCrestCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // Fallback if WebGL isn't supported
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // Group for the entire 3D interactive assembly
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Sub-group for crest so we can rotate the whole emblem
    const crestGroup = new THREE.Group();
    rootGroup.add(crestGroup);

    // ==========================================
    // 1. LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5d6, 3.2);
    dirLight1.position.set(5, 6, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2e7d32, 2.0);
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0xf2b705, 2.5, 12);
    rimLight.position.set(0, 4, 3);
    scene.add(rimLight);

    // ==========================================
    // 2. SHIELD / CREST GEOMETRY & MATERIALS
    // ==========================================
    // MinSU Gold Metallic Material
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2b705,
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.2,
    });

    // MinSU Emerald Material
    const emeraldMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      metalness: 0.45,
      roughness: 0.35,
    });

    // Outer Shield Bevel Rim Shape (Classic Academic Crest Proportion)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(-1.3, 1.35);
    shieldShape.quadraticCurveTo(0, 1.48, 1.3, 1.35);
    shieldShape.lineTo(1.3, 0.15);
    shieldShape.quadraticCurveTo(1.25, -0.85, 0, -1.5);
    shieldShape.quadraticCurveTo(-1.25, -0.85, -1.3, 0.15);
    shieldShape.lineTo(-1.3, 1.35);

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const shieldGeom = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeom.center();
    const shieldRim = new THREE.Mesh(shieldGeom, goldMaterial);
    crestGroup.add(shieldRim);

    // Inner Emerald Shield Inset
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-1.18, 1.24);
    innerShape.quadraticCurveTo(0, 1.36, 1.18, 1.24);
    innerShape.lineTo(1.18, 0.15);
    innerShape.quadraticCurveTo(1.12, -0.75, 0, -1.35);
    innerShape.quadraticCurveTo(-1.12, -0.75, -1.18, 0.15);
    innerShape.lineTo(-1.18, 1.24);

    const innerExtrude = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };

    const innerGeom = new THREE.ExtrudeGeometry(innerShape, innerExtrude);
    innerGeom.center();
    const innerShield = new THREE.Mesh(innerGeom, emeraldMaterial);
    innerShield.position.z = 0.06;
    crestGroup.add(innerShield);

    // Center Circular Emblem Base with Logo
    const discGeom = new THREE.CylinderGeometry(0.92, 0.92, 0.1, 48);
    discGeom.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeom, goldMaterial);
    discMesh.position.z = 0.16;
    crestGroup.add(discMesh);

    // Texture Face with MinSU Logo
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/logo.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const logoFaceGeom = new THREE.CircleGeometry(0.85, 48);
        const logoMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.98,
          side: THREE.DoubleSide,
        });
        const logoFace = new THREE.Mesh(logoFaceGeom, logoMaterial);
        logoFace.position.z = 0.23;
        crestGroup.add(logoFace);
        setIsLoaded(true);
      },
      undefined,
      () => {
        // Fallback procedural "M" emblem if logo fails
        const fallbackGeom = new THREE.CircleGeometry(0.85, 48);
        const fallbackMat = new THREE.MeshStandardMaterial({
          color: 0x123f17,
          metalness: 0.3,
          roughness: 0.4,
        });
        const fallbackMesh = new THREE.Mesh(fallbackGeom, fallbackMat);
        fallbackMesh.position.z = 0.23;
        crestGroup.add(fallbackMesh);
        setIsLoaded(true);
      }
    );

    // ==========================================
    // 3. ORBITING GOLD KINETIC RINGS
    // ==========================================
    const ring1Geom = new THREE.TorusGeometry(2.0, 0.028, 16, 96);
    const ring1 = new THREE.Mesh(ring1Geom, goldMaterial);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    rootGroup.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(2.35, 0.022, 16, 96);
    const ring2 = new THREE.Mesh(
      ring2Geom,
      new THREE.MeshStandardMaterial({
        color: 0x2e7d32,
        metalness: 0.9,
        roughness: 0.2,
      })
    );
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = -Math.PI / 5;
    rootGroup.add(ring2);

    // ==========================================
    // 4. FLOATING PARTICLE CONSTELLATION
    // ==========================================
    const particleCount = 110;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorGold = new THREE.Color(0xf2b705);
    const colorEmerald = new THREE.Color(0x2e7d32);
    const colorMint = new THREE.Color(0xdcefdd);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const chosenColor =
        i % 3 === 0 ? colorGold : i % 3 === 1 ? colorEmerald : colorMint;
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeom.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    rootGroup.add(particles);

    // ==========================================
    // 5. INTERACTION & MOUSE PARALLAX (CLAMPED)
    // ==========================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      // Clamp mouse target to prevent extreme angles
      mouse.targetX = Math.max(-1, Math.min(1, x));
      mouse.targetY = Math.max(-1, Math.min(1, y));
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
        mouse.targetX = Math.max(-1, Math.min(1, x));
        mouse.targetY = Math.max(-1, Math.min(1, y));
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    // Handle Resize via ResizeObserver and window events
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      // If container aspect ratio is narrower or compact on mobile, adapt camera distance so outer orbit rings and shield never clip
      const isCompact = newHeight < 280 || newWidth < 340;
      if (isCompact) {
        camera.position.z = 6.8;
      } else if (camera.aspect < 1) {
        camera.position.z = 5.8 / Math.max(camera.aspect, 0.65);
      } else {
        camera.position.z = 5.8;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", handleResize);

    // ==========================================
    // 6. ANIMATION LOOP
    // ==========================================
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth spring interpolation towards clamped pointer coords
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Gentle floating / bobbing idle motion
      const floatY = Math.sin(elapsedTime * 1.5) * 0.12;
      crestGroup.position.y = floatY;

      // Clamped parallax rotation:
      // Rotates up to ±0.35 rad (approx 20 deg) on Y and ±0.22 rad on X
      // Crest always faces front and remains dignified & readable
      const baseTiltY = Math.sin(elapsedTime * 0.4) * 0.08;
      crestGroup.rotation.y = baseTiltY + mouse.x * 0.45;
      crestGroup.rotation.x = -mouse.y * 0.28;

      // Kinetic Rings slow continuous orbit
      ring1.visible = showOrbit;
      ring2.visible = showOrbit;
      particles.visible = showOrbit;

      if (showOrbit) {
        ring1.rotation.z = elapsedTime * 0.35;
        ring1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.5) * 0.15;

        ring2.rotation.z = -elapsedTime * 0.25;
        ring2.rotation.y = -Math.PI / 5 + Math.cos(elapsedTime * 0.4) * 0.12;

        // Subtle particle cloud drift
        particles.rotation.y = elapsedTime * 0.06;
        particles.rotation.x = Math.sin(elapsedTime * 0.08) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // 7. CLEANUP
    // ==========================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);

      // Memory cleanup
      shieldGeom.dispose();
      innerGeom.dispose();
      discGeom.dispose();
      ring1Geom.dispose();
      ring2Geom.dispose();
      particleGeom.dispose();

      goldMaterial.dispose();
      emeraldMaterial.dispose();
      particleMat.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[220px] sm:h-[300px] lg:h-[480px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-pan-y ${className}`}
      aria-label="Interactive 3D Mindoro State University Academic Crest"
    >
      {/* Soft Ambient Glow Halo behind the 3D scene */}
      <div className="absolute w-[180px] sm:w-[280px] lg:w-[380px] h-[180px] sm:h-[280px] lg:h-[380px] rounded-full bg-gradient-to-br from-[#F2B705]/20 via-[#1B5E20]/15 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Subtle interaction hint pill */}
      <div className="absolute bottom-1 sm:bottom-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/75 backdrop-blur-md border border-[#1B5E20]/10 text-[9px] sm:text-xs text-[#55645B] font-medium pointer-events-none opacity-80 shadow-xs">
        ✦ Interactive 3D • Drag & Tilt
      </div>
    </div>
  );
}

