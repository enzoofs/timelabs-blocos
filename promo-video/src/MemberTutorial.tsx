import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { BRAND, display } from './styles'
import { BigText } from './components/BigText'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenHome, ScreenLoginTyping, ScreenScanner, ScreenSuccess } from './components/Screens'
import './fonts'

const sans: React.CSSProperties = { fontFamily: '"Manrope", sans-serif' }

const FPS = 30
const sec = (s: number) => Math.round(s * FPS)

const SceneHook: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet }}>
    <BigText
      title="COMO ENTRAR"
      subtitle="no sistema do seu bloco"
      color="#fff"
      x={540}
      y={880}
      width={900}
      fontSize={72}
    />
  </AbsoluteFill>
)

const SceneLogin: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 900 }}>
      <BigText
        eyebrow="SEU LOGIN"
        title="E-mail e senha"
        subtitle={'e-mail: o mesmo cadastrado\nsenha: 6 últimos dígitos do WhatsApp'}
        x={0}
        y={0}
        width={900}
        align="left"
        fontSize={58}
      />
    </div>
    <PhoneFrame x={540} y={1150} scale={1.55}>
      <ScreenLoginTyping
        emailStart={sec(1)}
        emailDur={sec(2)}
        passwordStart={sec(4)}
        passwordDur={sec(1.3)}
        pressStart={sec(6.5)}
      />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneHome: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 900 }}>
      <BigText
        eyebrow="PRONTO"
        title="Você já está dentro"
        subtitle={'toque em "Marcar presença"\nquando o ensaio começar'}
        x={0}
        y={0}
        width={900}
        align="left"
        fontSize={58}
      />
    </div>
    <PhoneFrame x={540} y={1150} scale={1.55}>
      <ScreenHome />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneCheckin: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 900 }}>
      <BigText
        eyebrow="ÚLTIMO PASSO"
        title="Aponte pro QR"
        subtitle={'a presença é confirmada\nna hora, automaticamente'}
        x={0}
        y={0}
        width={900}
        align="left"
        fontSize={58}
      />
    </div>
    <PhoneFrame x={540} y={1150} scale={1.55}>
      <Sequence from={0} durationInFrames={sec(4)}>
        <ScreenScanner />
      </Sequence>
      <Sequence from={sec(4)} durationInFrames={sec(4)}>
        <ScreenSuccess />
      </Sequence>
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneClosing: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet, alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: '0 80px' }}>
      <div style={{ fontSize: 48, color: '#fff', ...display, lineHeight: 1.35 }}>
        Dúvidas? Fale com
        <br />a diretoria do seu bloco.
      </div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 50, ...sans, fontWeight: 700 }}>
        UMA INICIATIVA
      </div>
      <div style={{ fontSize: 40, color: BRAND.lime, marginTop: 8, ...display }}>TIMELABS</div>
    </div>
  </AbsoluteFill>
)

const S = {
  hook: { start: 0, dur: sec(3) },
  login: { start: sec(3), dur: sec(8) },
  home: { start: sec(11), dur: sec(5) },
  checkin: { start: sec(16), dur: sec(8) },
  closing: { start: sec(24), dur: sec(4) },
}

export const MemberTutorial: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.paper }}>
      <Sequence from={S.hook.start} durationInFrames={S.hook.dur}>
        <SceneHook />
      </Sequence>
      <Sequence from={S.login.start} durationInFrames={S.login.dur}>
        <SceneLogin />
      </Sequence>
      <Sequence from={S.home.start} durationInFrames={S.home.dur}>
        <SceneHome />
      </Sequence>
      <Sequence from={S.checkin.start} durationInFrames={S.checkin.dur}>
        <SceneCheckin />
      </Sequence>
      <Sequence from={S.closing.start} durationInFrames={S.closing.dur}>
        <SceneClosing />
      </Sequence>
    </AbsoluteFill>
  )
}
