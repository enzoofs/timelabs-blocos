// Som de "presença confirmada": batida grave tipo surdo + estalo de
// caixa, sintetizados na hora com Web Audio — sem arquivo de áudio.
//
// Navegador de celular (principalmente iPhone) só deixa tocar som depois
// de um toque do usuário. Por isso unlockAudio() é chamado nos toques que
// antecedem o check-in (ABRIR CÂMERA, MARCAR PRESENÇA). Se a pessoa chegou
// direto pelo link do QR na câmera do sistema, o contexto pode continuar
// bloqueado — aí o som é simplesmente pulado.

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (ctx) return ctx
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    return ctx
  } catch {
    return null
  }
}

export function unlockAudio() {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  // tocar um buffer silencioso dentro do gesto é o que destrava no iOS
  try {
    const src = c.createBufferSource()
    src.buffer = c.createBuffer(1, 1, 22050)
    src.connect(c.destination)
    src.start(0)
  } catch {
    // ignora
  }
}

export function playCheckinSound() {
  const c = getContext()
  if (!c || c.state !== 'running') return

  const now = c.currentTime
  const master = c.createGain()
  master.gain.value = 0.55
  master.connect(c.destination)

  // surdo: seno grave com queda rápida de afinação
  const drum = c.createOscillator()
  const drumGain = c.createGain()
  drum.type = 'sine'
  drum.frequency.setValueAtTime(140, now)
  drum.frequency.exponentialRampToValueAtTime(55, now + 0.18)
  drumGain.gain.setValueAtTime(0.0001, now)
  drumGain.gain.exponentialRampToValueAtTime(1, now + 0.008)
  drumGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
  drum.connect(drumGain).connect(master)
  drum.start(now)
  drum.stop(now + 0.5)

  // caixa: dois toques curtos de ruído filtrado logo depois
  const noiseBuffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.12), c.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  for (const offset of [0.14, 0.24]) {
    const t = now + offset
    const noise = c.createBufferSource()
    noise.buffer = noiseBuffer
    const filter = c.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1800
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(offset === 0.14 ? 0.35 : 0.55, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)
    noise.connect(filter).connect(g).connect(master)
    noise.start(t)
    noise.stop(t + 0.12)
  }
}
