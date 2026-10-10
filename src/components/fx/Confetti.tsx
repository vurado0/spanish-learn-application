import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './motion'

const COLORS = ['#f97316', '#e11d48', '#10b981', '#0ea5e9', '#8b5cf6', '#facc15']

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  shape: 'rect' | 'circle'
}

/** Full-screen canvas confetti burst. `fire` changes → new burst. Skipped with reduced motion. */
export default function Confetti({ fire = 1, pieces = 140, duration = 2800 }: { fire?: number; pieces?: number; duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !fire || prefersReducedMotion()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const w = window.innerWidth
    const h = window.innerHeight
    // two cannons from the bottom corners + a shower from the top centre
    const parts: Piece[] = Array.from({ length: pieces }, (_, i) => {
      const side = i % 3
      const fromLeft = side === 0
      const top = side === 2
      return {
        x: top ? w / 2 + (Math.random() - 0.5) * w * 0.6 : fromLeft ? 0 : w,
        y: top ? -20 : h * 0.85,
        vx: top ? (Math.random() - 0.5) * 4 : (fromLeft ? 1 : -1) * (4 + Math.random() * 7),
        vy: top ? 2 + Math.random() * 3 : -(10 + Math.random() * 9),
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length],
        shape: Math.random() < 0.3 ? 'circle' : 'rect',
      }
    })
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = now - start
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - duration * 0.6) / (duration * 0.4))
      for (const p of parts) {
        p.vy += 0.28 // gravity
        p.vx *= 0.985 // air
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx.fill()
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (t < duration) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [fire, pieces, duration])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />
}
