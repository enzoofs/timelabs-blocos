import React from 'react'
import { BRAND } from '../styles'

export const PhoneFrame: React.FC<{
  children: React.ReactNode
  x: number
  y: number
  scale?: number
  rotate?: number
}> = ({ children, x, y, scale = 1, rotate = 0 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 380,
        height: 780,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
        borderRadius: 48,
        background: BRAND.ink,
        padding: 14,
        boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 34,
          overflow: 'hidden',
          position: 'relative',
          background: BRAND.paper,
        }}
      >
        {children}
      </div>
      {/* notch */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 130,
          height: 22,
          borderRadius: 12,
          background: BRAND.ink,
        }}
      />
    </div>
  )
}
