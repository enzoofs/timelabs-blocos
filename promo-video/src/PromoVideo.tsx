import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { BRAND, display } from './styles'
import { BigText } from './components/BigText'
import { PhoneFrame } from './components/PhoneFrame'
import {
  ScreenDirectorPanel,
  ScreenLogin,
  ScreenReport,
  ScreenScanner,
  ScreenSuccess,
} from './components/Screens'
import './fonts'

const sans: React.CSSProperties = { fontFamily: '"Manrope", sans-serif' }

const FPS = 30
const sec = (s: number) => Math.round(s * FPS)

const SceneHook: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet }}>
    <BigText title="Sua bateria," subtitle="sem perder chamada." color="#fff" y={500} />
  </AbsoluteFill>
)

const SceneProblem: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <BigText
      eyebrow="O PROBLEMA"
      title="Caderno de presença?"
      subtitle="WhatsApp perdido? Chega disso."
      y={500}
    />
  </AbsoluteFill>
)

const SceneCheckin: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <BigText
      eyebrow="COMO FUNCIONA"
      title="O membro escaneia o QR"
      subtitle={'e a presença é confirmada\ncom localização de verdade.'}
      x={520}
      width={800}
      align="left"
      y={500}
    />
    <PhoneFrame x={1440} y={540} scale={0.85}>
      <Sequence from={0} durationInFrames={sec(4)}>
        <ScreenScanner />
      </Sequence>
      <Sequence from={sec(4)} durationInFrames={sec(5)}>
        <ScreenSuccess />
      </Sequence>
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneDirector: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <BigText
      eyebrow="PRA DIRETORIA"
      title="Toda a bateria,"
      subtitle={'organizada em tempo real.\nSem planilha manual.'}
      x={520}
      width={800}
      align="left"
      y={500}
    />
    <PhoneFrame x={1440} y={540} scale={0.85}>
      <ScreenDirectorPanel />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneReport: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <BigText
      eyebrow="RELATÓRIO"
      title="Presença pronta"
      subtitle={'pra exportar em um clique.\nSem depender de ninguém.'}
      x={520}
      width={800}
      align="left"
      y={500}
    />
    <PhoneFrame x={1440} y={540} scale={0.85}>
      <ScreenReport />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneCTA: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet, alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 90, color: '#fff', ...display }}>TIMELABS</div>
      <div style={{ fontSize: 40, color: BRAND.lime, marginTop: 10, ...display }}>seubloco.com</div>
      <div style={{ fontSize: 28, color: '#fff', marginTop: 40, ...sans, fontWeight: 700 }}>
        A partir de R$ 79,90/mês
      </div>
      <div
        style={{
          marginTop: 40,
          display: 'inline-block',
          background: BRAND.lime,
          color: BRAND.ink,
          padding: '18px 40px',
          borderRadius: 10,
          border: `3px solid ${BRAND.ink}`,
          fontSize: 22,
          ...display,
        }}
      >
        CADASTRE SEU BLOCO
      </div>
    </div>
  </AbsoluteFill>
)

const S = {
  hook: { start: 0, dur: sec(3) },
  problem: { start: sec(3), dur: sec(4) },
  checkin: { start: sec(7), dur: sec(9) },
  director: { start: sec(16), dur: sec(7) },
  report: { start: sec(23), dur: sec(5) },
  cta: { start: sec(28), dur: sec(5) },
}

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.paper }}>
      <Sequence from={S.hook.start} durationInFrames={S.hook.dur}>
        <SceneHook />
      </Sequence>
      <Sequence from={S.problem.start} durationInFrames={S.problem.dur}>
        <SceneProblem />
      </Sequence>
      <Sequence from={S.checkin.start} durationInFrames={S.checkin.dur}>
        <SceneCheckin />
      </Sequence>
      <Sequence from={S.director.start} durationInFrames={S.director.dur}>
        <SceneDirector />
      </Sequence>
      <Sequence from={S.report.start} durationInFrames={S.report.dur}>
        <SceneReport />
      </Sequence>
      <Sequence from={S.cta.start} durationInFrames={S.cta.dur}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  )
}
