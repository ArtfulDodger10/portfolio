import { useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Candles } from './Candles'
import { Crest } from './Crest'
import { Embers } from './Embers'
import { FloatingBook } from './Spellbook'
import { Dementors } from './Dementors'
import { FlyingKeys } from './FlyingKeys'
import { DEPTH, pointer, scroll, skyNow, type Tier } from './state'

function CameraRig() {
  const look = new THREE.Vector3()
  useFrame(({ camera }, dt) => {
    const y = -scroll.progress * DEPTH
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.6, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y + pointer.y * 0.3, 3, dt)
    look.set(camera.position.x * 0.3, camera.position.y - 0.4, -4)
    camera.lookAt(look)
  })
  return null
}

function Layout({ tier, animate }: { tier: Tier; animate: boolean }) {
  // Wide screens: crest centred in the space right of the text column. Narrow: above the text.
  const { viewport, size } = useThree()
  // must match the 1100px hero breakpoint in styles.css
  const wide = size.width > 1100 && viewport.aspect > 1.1
  // the text column is 640px plus a 6vw gutter (16-96px), see styles.css
  const gutter = Math.min(96, Math.max(16, size.width * 0.06))
  const textRight = -viewport.width / 2 + viewport.width * ((gutter + 640) / size.width)
  const free = viewport.width / 2 - textRight
  const crestX = textRight + free / 2
  const crestScale = THREE.MathUtils.clamp(free / 7, 0.5, 1.1)
  return (
    <>
      {/* narrow: top quarter of the screen, rings sized to fit the width (styles.css pads the hero to match) */}
      <group
        position={wide ? [crestX, 0, 0] : [0, viewport.height * 0.24, 0]}
        scale={wide ? crestScale : Math.min(0.55, (viewport.width * 0.46) / 3.4)}
      >
        <Crest animate={animate} />
      </group>
      {/* the spellbook floats beside the Spellbook section, ~80% of the way down */}
      <FloatingBook animate={animate} position={wide ? [3.4, -0.8 * DEPTH, -2] : [0, -0.8 * DEPTH, -4]} />
      <FlyingKeys animate={animate} count={tier.low ? 8 : 16} aspect={viewport.aspect} wide={wide} />
      <Dementors animate={animate} count={tier.low ? 3 : 5} aspect={viewport.aspect} wide={wide} />
      <Candles count={tier.low ? 60 : 150} animate={animate} />
      <Embers count={tier.low ? 600 : 2200} animate={animate} />
    </>
  )
}

export default function Scene({ tier, onReady }: { tier: Tier; onReady: () => void }) {
  const [dpr, setDpr] = useState(tier.maxDpr)
  const animate = !tier.reducedMotion
  // night, dawn, day or dusk from the visitor's clock, fixed for the visit
  const [sky] = useState(skyNow)

  return (
    <Canvas
      className="scene"
      dpr={[1, dpr]}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={() => onReady()}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <color attach="background" args={[sky.bg]} />
      <fog attach="fog" args={[sky.bg, 9, 32]} />
      <ambientLight intensity={sky.ambient} />
      <directionalLight position={[4, 6, 6]} intensity={0.6} color={sky.sun} />

      {/* Studio-style reflections for the gold, generated on the GPU: no HDR download. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffcf8a" position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#b3242a" position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffe2a8" position={[4, -2, 3]} scale={2} />
      </Environment>

      <Stars radius={40} depth={30} count={Math.round((tier.low ? 1200 : 3000) * sky.stars)} factor={3} fade speed={animate ? 0.6 : 0} />
      <CameraRig />
      <Layout tier={tier} animate={animate} />

      {!tier.low && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.55} intensity={1.1} radius={0.7} />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
