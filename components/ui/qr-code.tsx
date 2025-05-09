"use client"
import { QRCodeSVG } from "qrcode.react"

interface QRCodeProps {
  value: string
  size?: number
  level?: "L" | "M" | "Q" | "H"
  includeMargin?: boolean
  className?: string
}

export function QRCode({ value, size = 128, level = "M", includeMargin = true, className = "" }: QRCodeProps) {
  if (!value) {
    return null
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <QRCodeSVG value={value} size={size} level={level} includeMargin={includeMargin} className="rounded-md" />
    </div>
  )
}
