import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { BRAND, display } from './styles'
import { BigText } from './components/BigText'
import { PhoneFrame } from './components/PhoneFrame'
import { ScreenDirectorPanel, ScreenMembros, ScreenNovoEvento, ScreenReport } from './components/Screens'
import './fonts'

const sans: React.CSSProperties = { fontFamily: '"Manrope", sans-serif' }

const FPS = 30
const sec = (s: number) => Math.round(s * FPS)

const PHONE = { x: 540, y: 1150, scale: 1.55 }

const TextBlock: React.FC<{ eyebrow: string; title: string; subtitle: string }> = ({ eyebrow, title, subtitle }) => (
  <div style={{ position: 'absolute', left: 90, top: 200, width: 900 }}>
    <BigText eyebrow={eyebrow} title={title} subtitle={subtitle} x={0} y={0} width={900} align="left" fontSize={54} />
  </div>
)

const SceneHook: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet }}>
    <BigText
      title="BEM-VINDO(A)!"
      subtitle={'tudo que você pode fazer\ncomo diretoria'}
      color="#fff"
      x={540}
      y={880}
      width={900}
      fontSize={68}
    />
  </AbsoluteFill>
)

const SceneEvento: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <TextBlock eyebrow="ENSAIOS" title="Crie um ensaio" subtitle={'define local, horário e raio —\num QR novo é gerado na hora'} />
    <PhoneFrame {...PHONE}>
      <ScreenNovoEvento />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneMembros: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <TextBlock
      eyebrow="MEMBROS"
      title="Cadastre a bateria"
      subtitle={'um por um, ou importando\numa planilha de uma vez'}
    />
    <PhoneFrame {...PHONE}>
      <ScreenMembros />
    </PhoneFrame>
  </AbsoluteFill>
)

const ScenePresenca: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <TextBlock
      eyebrow="AO VIVO"
      title="Presença em tempo real"
      subtitle={'acompanhe quem chegou\nenquanto o ensaio acontece'}
    />
    <PhoneFrame {...PHONE}>
      <ScreenDirectorPanel />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneRelatorio: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper }}>
    <TextBlock
      eyebrow="RELATÓRIO"
      title="Exporte quando quiser"
      subtitle={'planilha pronta com a %\nde presença de cada membro'}
    />
    <PhoneFrame {...PHONE}>
      <ScreenReport />
    </PhoneFrame>
  </AbsoluteFill>
)

const SceneHistorico: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper, alignItems: 'center', justifyContent: 'center' }}>
    <BigText
      eyebrow="JÁ TEVE ENSAIO ANTES?"
      title="Importe o histórico"
      subtitle={'sobe uma planilha com as presenças\nantigas e o sistema cria tudo sozinho'}
      x={540}
      y={780}
      width={880}
      fontSize={54}
    />
  </AbsoluteFill>
)

const SceneInstrumentos: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.paper, alignItems: 'center', justifyContent: 'center' }}>
    <BigText
      eyebrow="DO SEU JEITO"
      title="Instrumentos livres"
      subtitle={'adicione ou remova quando quiser —\nsurdo, timbau, chocalho, o que for'}
      x={540}
      y={780}
      width={880}
      fontSize={54}
    />
  </AbsoluteFill>
)

const SceneSuporte: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet, alignItems: 'center', justifyContent: 'center' }}>
    <BigText
      title="Precisou de ajuda?"
      subtitle={'tem um botão de WhatsApp\ndireto no seu painel'}
      color="#fff"
      x={540}
      y={880}
      width={880}
      fontSize={58}
    />
  </AbsoluteFill>
)

const SceneClosing: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.violet, alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: '0 80px' }}>
      <div style={{ fontSize: 60, color: '#fff', ...display, lineHeight: 1.2 }}>VAMOS COMEÇAR?</div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 40, ...sans, fontWeight: 700 }}>
        UMA INICIATIVA
      </div>
      <div style={{ fontSize: 40, color: BRAND.lime, marginTop: 8, ...display }}>TIMELABS</div>
    </div>
  </AbsoluteFill>
)

const S = {
  hook: { start: 0, dur: sec(3) },
  evento: { start: sec(3), dur: sec(6) },
  membros: { start: sec(9), dur: sec(7) },
  presenca: { start: sec(16), dur: sec(6) },
  relatorio: { start: sec(22), dur: sec(5) },
  historico: { start: sec(27), dur: sec(6) },
  instrumentos: { start: sec(33), dur: sec(5) },
  suporte: { start: sec(38), dur: sec(5) },
  closing: { start: sec(43), dur: sec(5) },
}

export const DirectorTutorial: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: BRAND.paper }}>
      <Sequence from={S.hook.start} durationInFrames={S.hook.dur}>
        <SceneHook />
      </Sequence>
      <Sequence from={S.evento.start} durationInFrames={S.evento.dur}>
        <SceneEvento />
      </Sequence>
      <Sequence from={S.membros.start} durationInFrames={S.membros.dur}>
        <SceneMembros />
      </Sequence>
      <Sequence from={S.presenca.start} durationInFrames={S.presenca.dur}>
        <ScenePresenca />
      </Sequence>
      <Sequence from={S.relatorio.start} durationInFrames={S.relatorio.dur}>
        <SceneRelatorio />
      </Sequence>
      <Sequence from={S.historico.start} durationInFrames={S.historico.dur}>
        <SceneHistorico />
      </Sequence>
      <Sequence from={S.instrumentos.start} durationInFrames={S.instrumentos.dur}>
        <SceneInstrumentos />
      </Sequence>
      <Sequence from={S.suporte.start} durationInFrames={S.suporte.dur}>
        <SceneSuporte />
      </Sequence>
      <Sequence from={S.closing.start} durationInFrames={S.closing.dur}>
        <SceneClosing />
      </Sequence>
    </AbsoluteFill>
  )
}
