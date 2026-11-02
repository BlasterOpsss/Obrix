'use client'

import { useEffect, useRef } from 'react'

type V = { x: number; y: number }

function roundedRect(hw: number, hh: number, r: number, n: number): V[] {
  const corners = [
    { cx: hw - r, cy: -(hh - r), a0: -Math.PI / 2 },
    { cx: hw - r, cy: hh - r, a0: 0 },
    { cx: -(hw - r), cy: hh - r, a0: Math.PI / 2 },
    { cx: -(hw - r), cy: -(hh - r), a0: Math.PI },
  ]
  const dense: V[] = []
  for (const c of corners) {
    for (let i = 0; i <= 16; i++) {
      const a = c.a0 + (i / 16) * (Math.PI / 2)
      dense.push({ x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r })
    }
  }
  dense.push(dense[0])
  const cum = [0]
  for (let i = 1; i < dense.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y))
  }
  const total = cum[cum.length - 1]
  const out: V[] = []
  let j = 1
  for (let k = 0; k < n; k++) {
    const s = (k / n) * total
    while (j < cum.length - 1 && cum[j] < s) j++
    const seg = cum[j] - cum[j - 1] || 1
    const f = (s - cum[j - 1]) / seg
    out.push({
      x: dense[j - 1].x + (dense[j].x - dense[j - 1].x) * f,
      y: dense[j - 1].y + (dense[j].y - dense[j - 1].y) * f,
    })
  }
  return out
}

const ORANGE = '#ff8a3d'
const HOT = '#ffd9b8'

export function ThinkingSphere({ size = 190 }: { size?: number; dots?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const HH = 0.81
    const rings = [0, 1, 2].map((k) => {
      const inset = k * 0.085
      return roundedRect(1 - inset, HH - inset, 0.46 - inset, 120 - k * 18)
    })
    const edge = roundedRect(0.77, 0.58, 0.3, 84)
    const visor = roundedRect(0.77, 0.58, 0.3, 60)

    const grid: V[] = []
    for (let gx = -0.7; gx <= 0.7; gx += 0.08) {
      for (let gy = -0.5; gy <= 0.5; gy += 0.08) {
        if (Math.abs(gx) > 0.5 && Math.abs(gy) > 0.34) continue
        if (((Math.abs(gx) - 0.31) / 0.2) ** 2 + (gy / 0.3) ** 2 < 1) continue
        grid.push({ x: gx, y: gy })
      }
    }

    const S = size * 0.42
    const c = size / 2
    const zOf = (x: number, y: number) => 0.25 * Math.cos((x * Math.PI) / 2.2) * Math.cos((y * Math.PI) / 1.8)

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    const draw = (t: number) => {
      const yaw = Math.sin(t * 0.8) * 0.45
      const pit = Math.sin(t * 0.5) * 0.12
      const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw)
      const cp = Math.cos(pit), sp = Math.sin(pit)

      const proj = (x: number, y: number, z: number) => {
        const x1 = x * cy_ + z * sy_
        const z1 = -x * sy_ + z * cy_
        const y2 = y * cp - z1 * sp
        const z2 = y * sp + z1 * cp
        const f = 3 / (3 - z2)
        return { px: c + x1 * S * f, py: c + y2 * S * f, z: z2, f }
      }
      const alphaOf = (z: number) => Math.max(0.25, Math.min(1, 0.55 + z * 0.9))

      ctx.clearRect(0, 0, size, size)

      ctx.globalAlpha = 0.92
      ctx.fillStyle = '#0b0b0b'
      ctx.beginPath()
      visor.forEach((p, i) => {
        const q = proj(p.x, p.y, zOf(p.x, p.y))
        if (i === 0) ctx.moveTo(q.px, q.py)
        else ctx.lineTo(q.px, q.py)
      })
      ctx.closePath()
      ctx.fill()

      const head = (t * 0.35) % 1
      rings.forEach((ring, k) => {
        ring.forEach((p, i) => {
          const u = i / ring.length
          const d = (u - head + 1) % 1
          const glow = d < 0.2 ? 1 - d / 0.2 : 0
          const q = proj(p.x, p.y, zOf(p.x, p.y))
          ctx.globalAlpha = Math.min(1, alphaOf(q.z) * (0.75 - k * 0.12) + glow * 0.4)
          ctx.fillStyle = glow > 0.35 ? HOT : ORANGE
          ctx.beginPath()
          ctx.arc(q.px, q.py, (1.1 + glow * 1.4 - k * 0.15) * q.f, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      edge.forEach((p) => {
        const q = proj(p.x, p.y, zOf(p.x, p.y))
        ctx.globalAlpha = alphaOf(q.z) * 0.5
        ctx.fillStyle = ORANGE
        ctx.beginPath()
        ctx.arc(q.px, q.py, 0.9 * q.f, 0, Math.PI * 2)
        ctx.fill()
      })

      const scan = ((t * 0.7) % 1.8) - 0.9
      grid.forEach((p) => {
        const b = Math.max(0, 1 - Math.abs(p.x - scan) / 0.16)
        const q = proj(p.x, p.y, zOf(p.x, p.y) + 0.05)
        ctx.globalAlpha = alphaOf(q.z) * (0.16 + b * 0.7)
        ctx.fillStyle = b > 0.3 ? HOT : ORANGE
        ctx.beginPath()
        ctx.arc(q.px, q.py, (0.7 + b * 0.8) * q.f, 0, Math.PI * 2)
        ctx.fill()
      })

      const lx = Math.sin(t * 0.9) * 0.07 + Math.sin(t * 2.3) * 0.015
      const ly = Math.sin(t * 0.6) * 0.03
      const ph = t % 3.2
      const k = ph > 3.05 ? 1 - Math.abs(ph - 3.125) / 0.075 : 0
      const sy = 1 - 0.92 * Math.max(0, k)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(255,200,150,.9)'
      ctx.shadowBlur = 10
      for (const ex of [-0.31, 0.31]) {
        ctx.beginPath()
        for (let i = 0; i <= 28; i++) {
          const a = (i / 28) * Math.PI * 2
          const x = ex + lx + Math.cos(a) * 0.14
          const y = ly + Math.sin(a) * 0.22 * sy
          const q = proj(x, y, 0.3)
          if (i === 0) ctx.moveTo(q.px, q.py)
          else ctx.lineTo(q.px, q.py)
        }
        ctx.closePath()
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    const loop = () => {
      draw(performance.now() / 1000)
      raf = requestAnimationFrame(loop)
    }
    if (still) draw(0)
    else loop()
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <div className="flex flex-col items-center gap-3 py-4" role="status" aria-live="polite">
      <div style={{ background: 'radial-gradient(circle, rgba(255,138,61,.18) 0%, transparent 65%)' }}>
        <canvas ref={ref} style={{ width: size, height: size }} />
      </div>
      <span className="font-mono text-sm tracking-wide opacity-80">
        Thinking<span className="animate-pulse"> •••</span>
      </span>
    </div>
  )
}
