"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

interface BarcodeProps {
  value: string
  format?: string
  width?: number
  height?: number
  displayValue?: boolean
  className?: string
}

export function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 50,
  displayValue = true,
  className = "",
}: BarcodeProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
          textMargin: 2,
          fontSize: 12,
          valid: () => true,
        })
      } catch (error) {
        console.error("Error generating barcode:", error)
      }
    }
  }, [value, format, width, height, displayValue])

  if (!value) {
    return null
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg ref={barcodeRef} className="w-full"></svg>
    </div>
  )
}
