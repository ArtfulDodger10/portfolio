// A small celesta-like chime for house points, synthesised with Web Audio (no audio files).
// Only ever played right after a click or key press, so browsers allow it.

let ctx: AudioContext | null = null

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem('sound') !== '0'
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem('sound', on ? '1' : '0')
  } catch {
    /* private mode: setting lasts for this visit */
  }
}

function bell(ac: AudioContext, freq: number, at: number, gain: number) {
  // a sine plus a quiet octave partial, fast attack, long ring
  for (const [mult, g] of [[1, gain], [2, gain * 0.25]] as const) {
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    amp.gain.setValueAtTime(0, at)
    amp.gain.linearRampToValueAtTime(g, at + 0.008)
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 1.1)
    osc.connect(amp).connect(ac.destination)
    osc.start(at)
    osc.stop(at + 1.2)
  }
}

export function chime(big = false) {
  if (!soundEnabled()) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime + 0.02
    // rising G major arpeggio; the patronus gets one more step
    const notes = big ? [784, 988, 1175, 1568, 1976] : [784, 988, 1175, 1568]
    notes.forEach((f, i) => bell(ctx!, f, now + i * 0.075, 0.07))
  } catch {
    /* no Web Audio: stay silent */
  }
}

// "points taken away": two low, falling notes, softer than the chime
export function groan() {
  if (!soundEnabled()) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime + 0.02
    ;[392, 311].forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const amp = ctx!.createGain()
      osc.type = 'triangle'
      const at = now + i * 0.22
      osc.frequency.setValueAtTime(f, at)
      osc.frequency.exponentialRampToValueAtTime(f * 0.94, at + 0.4)
      amp.gain.setValueAtTime(0, at)
      amp.gain.linearRampToValueAtTime(0.08, at + 0.02)
      amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
      osc.connect(amp).connect(ctx!.destination)
      osc.start(at)
      osc.stop(at + 0.7)
    })
  } catch {
    /* no Web Audio: stay silent */
  }
}
