'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Text, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

function PaymentCard({
  position,
  rotation,
  color,
  label,
  delay = 0,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  label: string
  delay?: number
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime + delay
    group.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15
    group.current.rotation.z = rotation[2] + Math.sin(t * 0.5) * 0.05
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={group} position={position} rotation={rotation}>
        <RoundedBox args={[2.2, 1.35, 0.08]} radius={0.08} smoothness={4}>
          <meshStandardMaterial color={color} metalness={0.45} roughness={0.3} />
        </RoundedBox>
        <mesh position={[-0.7, 0.25, 0.05]}>
          <boxGeometry args={[0.45, 0.35, 0.02]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
        </mesh>
        <Text
          position={[0.15, -0.25, 0.05]}
          fontSize={0.18}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
        >
          {label}
        </Text>
      </group>
    </Float>
  )
}

function Coin({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  scale?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = state.clock.elapsedTime * 0.9
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
  })

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={mesh} position={position} scale={scale}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 48]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
    </Float>
  )
}

function CrystalOrb() {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (outer.current) {
      outer.current.rotation.y = t * 0.3
      outer.current.rotation.x = Math.sin(t * 0.35) * 0.2
    }
    if (inner.current) {
      inner.current.rotation.y = -t * 0.5
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={outer} position={[0, 0.1, 0]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#4A7FA7"
          metalness={0.55}
          roughness={0.15}
          emissive="#1A3D63"
          emissiveIntensity={0.35}
          flatShading
        />
      </mesh>
      <mesh ref={inner} position={[0, 0.1, 0]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#B3CFE5"
          emissive="#4A7FA7"
          emissiveIntensity={0.9}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
    </Float>
  )
}

function Ring() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x =
      Math.PI / 2.4 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1
    ref.current.rotation.z = state.clock.elapsedTime * 0.25
  })

  return (
    <mesh ref={ref} position={[0, 0.1, 0]}>
      <torusGeometry args={[1.6, 0.04, 16, 100]} />
      <meshStandardMaterial
        color="#B3CFE5"
        metalness={0.85}
        roughness={0.2}
        emissive="#4A7FA7"
        emissiveIntensity={0.4}
      />
    </mesh>
  )
}

function Particles() {
  const count = 100
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [])

  const points = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.elapsedTime * 0.04
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#4A7FA7"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function Scene() {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const x = state.pointer.x * 0.4
    const y = state.pointer.y * 0.25
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      x,
      0.05
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -y * 0.35,
      0.05
    )
  })

  return (
    <group ref={group}>
      <CrystalOrb />
      <Ring />
      <Particles />
      <Sparkles
        count={50}
        scale={[8, 6, 4]}
        size={2.5}
        speed={0.4}
        color="#4A7FA7"
        opacity={0.75}
      />

      <PaymentCard
        position={[-2.4, 0.9, -0.4]}
        rotation={[0.15, 0.45, -0.2]}
        color="#1A3D63"
        label="QMoney"
        delay={0}
      />
      <PaymentCard
        position={[2.3, 0.5, -0.2]}
        rotation={[-0.1, -0.5, 0.15]}
        color="#4A7FA7"
        label="Orange Money"
        delay={1.2}
      />
      <PaymentCard
        position={[-1.8, -1.1, 0.3]}
        rotation={[0.25, 0.35, 0.1]}
        color="#0d2840"
        label="Afrimoney"
        delay={2.1}
      />

      <Coin position={[1.8, -0.9, 0.8]} color="#d4af37" scale={0.9} />
      <Coin position={[-2.6, -0.2, 0.6]} color="#c0c0c0" scale={0.7} />
      <Coin position={[2.6, 1.3, -0.5]} color="#d4af37" scale={0.55} />
      <Coin position={[0.9, 1.6, 0.4]} color="#7BA3C4" scale={0.45} />
    </group>
  )
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 6, 4]} intensity={1.4} color="#ffffff" />
        <directionalLight position={[-4, 2, -2]} intensity={0.7} color="#B3CFE5" />
        <pointLight position={[0, 1.5, 3]} intensity={1.1} color="#4A7FA7" />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
