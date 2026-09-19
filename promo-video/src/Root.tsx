import React from 'react'
import { Composition } from 'remotion'
import { PromoVideo } from './PromoVideo'
import { MemberTutorial } from './MemberTutorial'
import { DirectorTutorial } from './DirectorTutorial'

const FPS = 30

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={33 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MemberTutorial"
        component={MemberTutorial}
        durationInFrames={28 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="DirectorTutorial"
        component={DirectorTutorial}
        durationInFrames={48 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  )
}
