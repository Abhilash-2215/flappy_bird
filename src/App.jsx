import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const WIDTH = 420
const HEIGHT = 600
const GROUND_Y = 540
const BIRD_X = 112
const BIRD_RADIUS = 14
const PIPE_WIDTH = 68
const PIPE_GAP = 158
const PIPE_SPEED = 154
const GRAVITY = 1280
const FLAP_STRENGTH = -405

function makePipe(x) {
  return {
    x,
    gapCenter: 174 + Math.random() * 204,
    scored: false,
  }
}

function drawCloud(context, x, y, scale = 1) {
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(255, 255, 255, 0.72)'
  context.beginPath()
  context.ellipse(0, 5, 26, 10, 0, 0, Math.PI * 2)
  context.ellipse(-12, 1, 13, 11, 0, 0, Math.PI * 2)
  context.ellipse(4, -4, 16, 16, 0, 0, Math.PI * 2)
  context.ellipse(18, 3, 12, 9, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawPipe(context, x, top, height, upsideDown = false) {
  const bodyGradient = context.createLinearGradient(x, 0, x + PIPE_WIDTH, 0)
  bodyGradient.addColorStop(0, '#398c55')
  bodyGradient.addColorStop(0.18, '#62b96e')
  bodyGradient.addColorStop(0.52, '#4aa35e')
  bodyGradient.addColorStop(1, '#317848')

  context.fillStyle = bodyGradient
  context.strokeStyle = '#28643f'
  context.lineWidth = 2
  context.fillRect(x + 5, top, PIPE_WIDTH - 10, height)
  context.strokeRect(x + 5, top, PIPE_WIDTH - 10, height)

  const capHeight = 24
  const capY = upsideDown ? top + height - capHeight : top
  const capGradient = context.createLinearGradient(x, 0, x + PIPE_WIDTH, 0)
  capGradient.addColorStop(0, '#347e4c')
  capGradient.addColorStop(0.2, '#73c777')
  capGradient.addColorStop(0.52, '#58ae65')
  capGradient.addColorStop(1, '#347e4c')
  context.fillStyle = capGradient
  context.fillRect(x, capY, PIPE_WIDTH, capHeight)
  context.strokeRect(x, capY, PIPE_WIDTH, capHeight)
  context.fillStyle = 'rgba(255, 255, 255, 0.18)'
  context.fillRect(x + 10, capY + (upsideDown ? 15 : 4), 5, 7)
}

function drawBird(context, bird, time, idle) {
  const bob = idle ? Math.sin(time / 260) * 7 : 0
  const y = bird.y + bob
  const rotation = idle ? -0.08 : Math.min(0.85, Math.max(-0.55, bird.velocity / 650))

  context.save()
  context.translate(BIRD_X, y)
  context.rotate(rotation)

  context.fillStyle = 'rgba(45, 63, 43, 0.12)'
  context.beginPath()
  context.ellipse(1, 17, 18, 5, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#eaa83a'
  context.beginPath()
  context.ellipse(-3, 1, 17, 14, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#ffe08a'
  context.beginPath()
  context.ellipse(-5, -3, 12, 9, -0.2, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#f3b844'
  context.beginPath()
  context.ellipse(-10, 5 + Math.sin(time / 75) * 2, 8, 5, -0.3, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#e98243'
  context.beginPath()
  context.moveTo(10, -1)
  context.lineTo(24, 3)
  context.lineTo(10, 7)
  context.closePath()
  context.fill()

  context.fillStyle = '#fff'
  context.beginPath()
  context.arc(4, -6, 5.3, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#25382f'
  context.beginPath()
  context.arc(6, -6, 2.2, 0, Math.PI * 2)
  context.fill()

  context.restore()
}

function drawScene(context, game, time) {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT)
  sky.addColorStop(0, '#8fd8d1')
  sky.addColorStop(0.68, '#c9e7be')
  sky.addColorStop(1, '#f5d995')
  context.fillStyle = sky
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle = 'rgba(255, 245, 194, 0.65)'
  context.beginPath()
  context.arc(334, 102, 38, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'rgba(255, 255, 255, 0.32)'
  context.beginPath()
  context.arc(334, 102, 52, 0, Math.PI * 2)
  context.fill()

  const cloudShift = (time * (game.phase === 'playing' ? 0.018 : 0.008)) % 520
  drawCloud(context, 75 - cloudShift, 133, 0.82)
  drawCloud(context, 278 - cloudShift, 205, 0.62)
  drawCloud(context, 465 - cloudShift, 87, 0.76)
  drawCloud(context, 590 - cloudShift, 154, 0.55)

  context.fillStyle = '#a9d39c'
  context.beginPath()
  context.moveTo(0, 426)
  context.quadraticCurveTo(83, 356, 177, 426)
  context.quadraticCurveTo(282, 352, 420, 421)
  context.lineTo(420, GROUND_Y)
  context.lineTo(0, GROUND_Y)
  context.closePath()
  context.fill()

  context.fillStyle = '#83bd82'
  context.beginPath()
  context.moveTo(0, 469)
  context.quadraticCurveTo(115, 398, 220, 468)
  context.quadraticCurveTo(319, 412, 420, 463)
  context.lineTo(420, GROUND_Y)
  context.lineTo(0, GROUND_Y)
  context.closePath()
  context.fill()

  game.pipes.forEach((pipe) => {
    const topHeight = pipe.gapCenter - PIPE_GAP / 2
    const bottomY = pipe.gapCenter + PIPE_GAP / 2
    drawPipe(context, pipe.x, 0, topHeight, true)
    drawPipe(context, pipe.x, bottomY, GROUND_Y - bottomY)
  })

  context.fillStyle = '#e8c981'
  context.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y)
  context.fillStyle = '#f6e0a7'
  context.fillRect(0, GROUND_Y, WIDTH, 8)
  context.fillStyle = 'rgba(145, 111, 65, 0.16)'
  const groundOffset = (game.groundOffset || 0) % 34
  for (let x = -34 + groundOffset; x < WIDTH + 34; x += 34) {
    context.beginPath()
    context.moveTo(x, GROUND_Y + 12)
    context.lineTo(x + 16, GROUND_Y + 12)
    context.lineTo(x + 6, HEIGHT)
    context.lineTo(x - 10, HEIGHT)
    context.closePath()
    context.fill()
  }

  drawBird(context, game.bird, time, game.phase === 'ready')
}

function circleHitsRect(cx, cy, radius, x, y, width, height) {
  const nearestX = Math.max(x, Math.min(cx, x + width))
  const nearestY = Math.max(y, Math.min(cy, y + height))
  const dx = cx - nearestX
  const dy = cy - nearestY
  return dx * dx + dy * dy < radius * radius
}

function App() {
  const canvasRef = useRef(null)
  const gameRef = useRef({
    phase: 'ready',
    bird: { y: 270, velocity: 0 },
    pipes: [],
    groundOffset: 0,
    score: 0,
  })
  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const bestRef = useRef(0)

  const flap = useCallback(() => {
    const game = gameRef.current
    if (game.phase === 'gameover') return

    if (game.phase === 'ready') {
      game.phase = 'playing'
      game.pipes = [makePipe(WIDTH + 30)]
      game.score = 0
      setScore(0)
      setPhase('playing')
    }

    game.bird.velocity = FLAP_STRENGTH
  }, [])

  const restart = useCallback(() => {
    gameRef.current = {
      phase: 'ready',
      bird: { y: 270, velocity: 0 },
      pipes: [],
      groundOffset: 0,
      score: 0,
    }
    setScore(0)
    setPhase('ready')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      throw new Error('Canvas 2D is not supported in this browser.')
    }

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = WIDTH * pixelRatio
      canvas.height = HEIGHT * pixelRatio
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let animationFrame
    let previousTime = 0
    const animate = (time) => {
      const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.033) : 0
      previousTime = time
      const game = gameRef.current

      if (game.phase === 'playing') {
        game.bird.velocity += GRAVITY * delta
        game.bird.y += game.bird.velocity * delta
        game.groundOffset = (game.groundOffset + PIPE_SPEED * delta) % 34

        game.pipes.forEach((pipe) => {
          pipe.x -= PIPE_SPEED * delta
          const gapTop = pipe.gapCenter - PIPE_GAP / 2
          const gapBottom = pipe.gapCenter + PIPE_GAP / 2
          const hitTop = circleHitsRect(
            BIRD_X,
            game.bird.y,
            BIRD_RADIUS,
            pipe.x,
            0,
            PIPE_WIDTH,
            gapTop,
          )
          const hitBottom = circleHitsRect(
            BIRD_X,
            game.bird.y,
            BIRD_RADIUS,
            pipe.x,
            gapBottom,
            PIPE_WIDTH,
            GROUND_Y - gapBottom,
          )

          if (hitTop || hitBottom) game.phase = 'gameover'

          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.scored = true
            game.score += 1
            setScore(game.score)
          }
        })

        game.pipes = game.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -5)
        const lastPipe = game.pipes[game.pipes.length - 1]
        if (!lastPipe || lastPipe.x < WIDTH - 205) {
          game.pipes.push(makePipe(WIDTH + 8))
        }

        if (game.bird.y + BIRD_RADIUS >= GROUND_Y || game.bird.y - BIRD_RADIUS <= 0) {
          game.phase = 'gameover'
        }

        if (game.phase === 'gameover') {
          setPhase('gameover')
          if (game.score > bestRef.current) {
            bestRef.current = game.score
            setBest(game.score)
          }
        }
      }

      drawScene(context, game, time)
      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return
      if (event.target instanceof HTMLElement && event.target.tagName === 'BUTTON') return
      event.preventDefault()
      if (!event.repeat) flap()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flap])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Sunny Side home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M6 18c0-5.5 4.3-10 10-10 4.1 0 7.4 2.2 9 5.8-2.4-1.2-4.7-1.2-6.5-.2 3 .3 5.1 2.2 6 5.2-3.4-.9-5.7-.4-7.3 1.4-4.1 4.7-11.2 3-11.2-2.2Z" fill="currentColor" />
              <circle cx="20.7" cy="14.7" r="1.1" fill="#fff8e7" />
            </svg>
          </span>
          <span>little<span className="brand-accent">wing</span></span>
        </a>
        <span className="topbar-note"><span className="online-dot" /> YOUR FIVE-MINUTE ESCAPE</span>
      </header>

      <section className="arcade-layout" aria-label="Flappy Bird game">
        <div className="intro">
          <p className="eyebrow"><span className="eyebrow-line" /> THE SKY IS YOURS</p>
          <h1>A little<br />flight of <span>fancy.</span></h1>
          <p className="intro-copy">
            One tiny bird. A whole lot of sky. Find your rhythm, mind the pipes,
            and see how far those little wings can take you.
          </p>

          <div className="personal-best">
            <span className="best-icon" aria-hidden="true">✳</span>
            <span className="best-label">PERSONAL BEST</span>
            <span className="best-value">{String(best).padStart(2, '0')}</span>
          </div>

          <div className="controls-card">
            <p className="controls-heading">A VERY SIMPLE GAME PLAN</p>
            <div className="control-row">
              <span className="key-cap">SPACE</span>
              <span>or tap anywhere to flap</span>
            </div>
            <div className="control-row">
              <span className="key-cap key-cap--arrow">↑</span>
              <span>stay light, stay in the air</span>
            </div>
          </div>
          <p className="made-note">MADE FOR THE JOY OF THE JOURNEY <span>✦</span></p>
        </div>

        <div className="game-column">
          <div className="game-frame">
            <div className="game-topline">
              <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
              <span>THE MEADOW, SOMEWHERE</span>
              <span className="live-label"><span /> LIVE</span>
            </div>
            <div
              className="game-screen"
              onPointerDown={(event) => {
                if (event.target instanceof Element && event.target.closest('button')) return
                flap()
              }}
            >
              <canvas
                ref={canvasRef}
                className="game-canvas"
                aria-label="Flappy Bird game. Press space, arrow up, or tap to flap."
              />
              <div className="score-display" aria-live="polite" aria-label={`Score ${score}`}>
                <span>SCORE</span>
                <strong>{String(score).padStart(2, '0')}</strong>
              </div>

              {phase !== 'playing' && (
                <div className={`game-overlay ${phase === 'gameover' ? 'game-overlay--over' : ''}`}>
                  {phase === 'ready' ? (
                    <div className="overlay-card">
                      <span className="overlay-sun" aria-hidden="true">✳</span>
                      <p className="overlay-kicker">A SUNNY LITTLE ADVENTURE</p>
                      <h2>Ready to<br />take off?</h2>
                      <p className="overlay-copy">The breeze is just right.</p>
                      <button className="play-button" type="button" onClick={flap}>
                        Let&apos;s fly <span aria-hidden="true">→</span>
                      </button>
                      <span className="overlay-hint">OR TAP THE SKY</span>
                    </div>
                  ) : (
                    <div className="overlay-card overlay-card--compact">
                      <span className="overlay-sun" aria-hidden="true">✳</span>
                      <p className="overlay-kicker">THAT WAS A LOVELY FLIGHT</p>
                      <h2>Good try,<br />little bird.</h2>
                      <div className="final-score">
                        <span>YOUR SCORE</span>
                        <strong>{String(score).padStart(2, '0')}</strong>
                        {score >= best && score > 0 && <em>NEW BEST!</em>}
                      </div>
                      <button className="play-button" type="button" onClick={restart}>
                        Fly again <span aria-hidden="true">↻</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="game-footer">
            <span><span className="footer-sparkle">✳</span> TAKE A DEEP BREATH. YOU&apos;VE GOT THIS.</span>
            <span>EST. RIGHT NOW</span>
          </div>
        </div>
      </section>
      <footer className="page-footer">
        <span>GO ON, GIVE IT A WING.</span>
        <span>✳ &nbsp; A LITTLE BIT OF PLAY GOES A LONG WAY &nbsp; ✳</span>
        <span>HAVE A LOVELY DAY</span>
      </footer>
    </main>
  )
}

export default App
