"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Trail } from "@react-three/drei";
import * as THREE from "three";

function Electron({ radius, speed, offset, color }: { radius: number; speed: number; offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed + offset;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
    }
  });

  return (
    <Trail width={0.5} length={8} color={color} attenuation={(t) => t * t}>
      <Sphere ref={ref} args={[0.15, 16, 16]} position={[radius, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </Sphere>
    </Trail>
  );
}

function ElectronOrbit({ rotation, radius, speed, color }: { rotation: [number, number, number]; radius: number; speed: number; color: string }) {
  return (
    <group rotation={rotation}>
      {/* Orbit ring */}
      <mesh>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>
      {/* Electron */}
      <Electron radius={radius} speed={speed} offset={0} color={color} />
    </group>
  );
}

function Nucleus() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.5;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group ref={ref}>
      {/* Protons */}
      <Sphere args={[0.35, 32, 32]} position={[0.15, 0.1, 0]}>
        <meshStandardMaterial color="#E87A2E" emissive="#E87A2E" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.35, 32, 32]} position={[-0.15, -0.1, 0.1]}>
        <meshStandardMaterial color="#E87A2E" emissive="#E87A2E" emissiveIntensity={0.3} />
      </Sphere>
      {/* Neutrons */}
      <Sphere args={[0.32, 32, 32]} position={[0, 0.15, -0.15]}>
        <meshStandardMaterial color="#1F2937" emissive="#374151" emissiveIntensity={0.2} />
      </Sphere>
      <Sphere args={[0.32, 32, 32]} position={[-0.1, -0.15, 0.05]}>
        <meshStandardMaterial color="#1F2937" emissive="#374151" emissiveIntensity={0.2} />
      </Sphere>
    </group>
  );
}

function AtomModel() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#E87A2E" />

      <Nucleus />

      {/* Three electron orbits at different angles */}
      <ElectronOrbit
        rotation={[0, 0, 0]}
        radius={2}
        speed={2}
        color="#E87A2E"
      />
      <ElectronOrbit
        rotation={[Math.PI / 3, 0, Math.PI / 4]}
        radius={2.2}
        speed={1.7}
        color="#60A5FA"
      />
      <ElectronOrbit
        rotation={[-Math.PI / 4, Math.PI / 3, 0]}
        radius={1.8}
        speed={2.3}
        color="#34D399"
      />
    </>
  );
}

export default function Atom3D() {
  return (
    <div className="w-full h-[400px] md:h-[500px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <AtomModel />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
