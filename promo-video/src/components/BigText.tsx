import React from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, display } from '../styles'

export const BigText: React.FC<{
  eyebrow?: string
  title: string
  subtitle?: string
  color?: string
  subtitleColor?: string
  x?: number
  y?: number
  width?: number
  align?: 'center' | 'left'
  fontSize?: number
  subtitleDelay?: number
}> = ({
  eyebrow,
  title,
  subtitle,
  color = BRAND.ink,
  subtitleColor,
  x = 960,
  y = 540,
  width = 1400,
  align = 'center',
  fontSize = 76,
  subtitleDelay = 12,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleSpring = spring({ frame, fps, config: { damping: 14 } })
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1])
  const titleY = interpolate(titleSpring, [0, 1], [30, 0])

  const subtitleSpring = spring({ frame: frame - subtitleDelay, fps, config: { damping: 14 } })
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1])
  const subtitleY = interpolate(subtitleSpring, [0, 1], [24, 0])

  const resolvedSubtitleColor = subtitleColor ?? (color === '#fff' ? 'rgba(255,255,255,0.88)' : BRAND.muted)

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: `translate(${align === 'center' ? '-50%' : '0'}, -50%)`,
        textAlign: align,
      }}
    >
      {eyebrow && (
        <div
          style={{
            display: 'inline-block',
            transform: 'rotate(-2deg)',
            background: BRAND.ink,
            color: BRAND.lime,
            padding: '10px 22px',
            borderRadius: 6,
            fontSize: 24,
            marginBottom: 24,
            opacity: titleOpacity,
            ...display,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontSize,
          lineHeight: 1.05,
          color,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          ...display,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 34,
            color: resolvedSubtitleColor,
            marginTop: 20,
            fontWeight: 600,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            whiteSpace: 'pre-line',
            ...({ fontFamily: '"Manrope", sans-serif' } as React.CSSProperties),
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}
