'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export default function ObrixRobot() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = host.current
    if (!root) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 1.1, 11.6)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    root.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new THREE.Scene(), 0.04).texture
    pmrem.dispose()

    scene.add(new THREE.HemisphereLight(0xfff6ee, 0xd9d2c8, 1.2))

    const key = new THREE.DirectionalLight(0xfff3e6, 3)
    key.position.set(-3, 5, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0xfff0e6, 2)
    rim.position.set(4, 2, -4)
    scene.add(rim)

    const warm = new THREE.PointLight(0xff9a6a, 12, 6)
    warm.position.set(-3.2, 1.2, 0.6)
    scene.add(warm)

    const shell = new THREE.MeshPhysicalMaterial({
      color: 0xeeebe6, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3,
    })
    const lightShell = new THREE.MeshPhysicalMaterial({
      color: 0xf8f6f2, roughness: 0.34, clearcoat: 0.45,
    })
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.55, metalness: 0.3 })
    const black = new THREE.MeshPhysicalMaterial({ color: 0x08080b, roughness: 0.16, clearcoat: 1 })
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff8a3d, emissive: 0xff3d8b, emissiveIntensity: 0.55, roughness: 0.4,
      metalness: 0.15,
    })

    const robot = new THREE.Group()
    scene.add(robot)

    const box = (parent: THREE.Object3D, size: [number, number, number], radius: number,
      material: THREE.Material, pos: [number, number, number]) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 5, radius), material)
      mesh.position.set(...pos)
      mesh.castShadow = true
      mesh.receiveShadow = true
      parent.add(mesh)
      return mesh
    }

    const ball = (parent: THREE.Object3D, r: number, material: THREE.Material,
      pos: [number, number, number]) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), material)
      mesh.position.set(...pos)
      mesh.castShadow = true
      parent.add(mesh)
      return mesh
    }

    // Torso and pelvis
    box(robot, [1.22, 1.12, 0.92], 0.24, shell, [0, -0.25, 0])
    box(robot, [0.82, 0.14, 0.68], 0.06, lightShell, [0, 0.25, 0.04])
    box(robot, [0.78, 0.22, 0.62], 0.08, dark, [0, -0.91, 0])
    box(robot, [0.18, 0.18, 0.06], 0.035, black, [-0.23, -0.18, 0.49])
    box(robot, [0.18, 0.18, 0.06], 0.035, black, [0.23, -0.18, 0.49])

    const ledColors = [0xff8a3d, 0xff5a5f, 0xff3d8b]
    ledColors.forEach((color, i) => {
      const led = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4 })
      box(robot, [0.09, 0.035, 0.035], 0.012, led, [-0.13 + i * 0.13, 0.12, 0.39])
    })

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.28, 32), dark)
    neck.position.set(0, 0.42, 0)
    robot.add(neck)

    // Head pivots for expression and look movement
    const headPivot = new THREE.Group()
    headPivot.position.set(0, 0.54, 0)
    robot.add(headPivot)
    box(headPivot, [1.5, 1.42, 1.3], 0.2, shell, [0, 0.78, 0])

    // Rear dark casing
    box(headPivot, [1.28, 1.14, 0.9], 0.14, dark, [0, 0.8, -0.48])

    // Face screen and gradient rim
    box(headPivot, [1.18, 1.12, 0.14], 0.24, ringMat, [0, 0.78, 0.68])
    box(headPivot, [1.05, 0.99, 0.12], 0.2, lightShell, [0, 0.78, 0.755])
    const faceCanvas = document.createElement('canvas')
    faceCanvas.width = 512
    faceCanvas.height = 512
    const ctx = faceCanvas.getContext('2d')!
    let quoteMode = false
    let faceAlpha = 1
    let lastBlink = 0
    let blinkStart = -1
    const drawFace = (time: number) => {
      ctx.clearRect(0, 0, 512, 512)
      ctx.fillStyle = '#050507'
      ctx.fillRect(0, 0, 512, 512)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 18
      ctx.globalAlpha = faceAlpha
      if (quoteMode) {
        ctx.font = 'bold 430px Arial Black, Arial'
        ctx.textAlign = 'center'
        ctx.fillText('“', 256, 410)
      } else {
        const blink = blinkStart >= 0 && time - blinkStart < 180
          ? Math.max(0.1, Math.abs(time - blinkStart - 90) / 90)
          : 1
        ctx.beginPath()
        ctx.ellipse(178, 250, 29, 38 * blink, 0, 0, Math.PI * 2)
        ctx.ellipse(334, 250, 29, 38 * blink, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }
    drawFace(0)
    const faceTexture = new THREE.CanvasTexture(faceCanvas)
    faceTexture.colorSpace = THREE.SRGBColorSpace
    const screenMaterial = new THREE.MeshPhysicalMaterial({
      map: faceTexture, emissive: 0xffffff, emissiveMap: faceTexture,
      emissiveIntensity: 1.6, roughness: 0.12, clearcoat: 1,
    })
    box(headPivot, [0.91, 0.84, 0.035], 0.15, screenMaterial, [0, 0.78, 0.84])

    // Ears
    const earGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 32)
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeometry, dark)
      ear.rotation.z = Math.PI / 2
      ear.position.set(side * 0.82, 0.78, 0)
      headPivot.add(ear)
      ball(headPivot, 0.14, lightShell, [side * 0.92, 0.78, 0])
    }

    // Arms, elbows, hands
    const armPivots: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group()
      shoulder.position.set(side * 0.7, 0.05, 0)
      shoulder.rotation.z = side * -0.16
      robot.add(shoulder)
      armPivots.push(shoulder)
      ball(shoulder, 0.18, dark, [0, 0, 0])
      box(shoulder, [0.28, 0.55, 0.3], 0.1, shell, [side * 0.07, -0.36, 0])
      ball(shoulder, 0.14, dark, [side * 0.1, -0.68, 0])
      const forearm = new THREE.Group()
      forearm.position.set(side * 0.1, -0.68, 0)
      forearm.rotation.z = -0.35
      shoulder.add(forearm)
      box(forearm, [0.25, 0.43, 0.28], 0.09, lightShell, [0, -0.25, 0])
      box(forearm, [0.28, 0.22, 0.3], 0.07, shell, [0, -0.56, 0.02])
      box(forearm, [0.1, 0.17, 0.12], 0.04, lightShell, [side * -0.15, -0.54, 0.07])
    }

    // Legs and feet
    for (const side of [-1, 1]) {
      ball(robot, 0.17, dark, [side * 0.3, -0.98, 0])
      box(robot, [0.3, 0.58, 0.36], 0.09, shell, [side * 0.3, -1.3, 0])
      ball(robot, 0.13, dark, [side * 0.3, -1.62, 0])
      box(robot, [0.42, 0.2, 0.62], 0.07, lightShell, [side * 0.3, -1.77, 0.12])
    }

    // Dark pedestal
    box(scene, [1.7, 0.2, 1.7], 0.05,
      new THREE.MeshStandardMaterial({ color: 0x2a2928, roughness: 0.9 }), [0, -1.96, 0])

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer)

    let scrollProgress = 0
    let smoothProgress = 0
    const onScroll = () => { scrollProgress = Math.min(2, Math.max(0, window.scrollY / window.innerHeight)) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.fov = 30
      camera.position.z = width < 900 ? 14.5 : 11.6
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    let frame = 0
    let previousBlink = 0
    let raf = 0
    const animate = (now: number) => {
      raf = requestAnimationFrame(animate)
      const t = now * 0.001
      smoothProgress += (scrollProgress - smoothProgress) * 0.08
      pointer.sx += (pointer.x - pointer.sx) * 0.06
      pointer.sy += (pointer.y - pointer.sy) * 0.06

      const ease = (v: number) => v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2
      const blend = ease(Math.min(1, smoothProgress))
      const closeBlend = ease(Math.max(0, Math.min(1, smoothProgress - 1)))
      camera.position.x = pointer.sx * 0.25
      camera.position.y = 1.1 + blend * 0.85 + pointer.sy * -0.1
      camera.position.z = (11.6 - blend * 4.7) * (window.innerWidth < 900 ? 1.25 : 1)
      camera.lookAt(pointer.sx * 0.08, 0.55 + blend * 1.17, 0)

      robot.rotation.y = -0.42 + blend * 0.22 + pointer.sx * 0.12
      robot.position.y = Math.sin(t * 1.4) * 0.02
      headPivot.rotation.y = -0.6 + blend * 0.54 + pointer.sx * 0.45
      headPivot.rotation.x = 0.16 + pointer.sy * 0.18 + Math.sin(t * 0.9) * 0.02
      headPivot.rotation.z = 0.22 * (1 - blend) + Math.sin(t * 0.7) * 0.02
      armPivots.forEach((arm, i) => { arm.rotation.z += Math.sin(t * 1.4 + i) * 0.0007 })

      quoteMode = smoothProgress > 1.55
      if (now - previousBlink > 2500 + Math.random() * 3000) {
        blinkStart = now
        previousBlink = now
      }
      if (now - blinkStart > 180) blinkStart = -1
      faceAlpha = Math.min(1, faceAlpha + 0.05)
      drawFace(now)
      faceTexture.needsUpdate = true

      renderer.render(scene, camera)
      frame++
    }
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      renderer.dispose()
      faceTexture.dispose()
      root.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} aria-hidden="true" className="obrix-robot-canvas" />
}
