"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Scan, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseBarcode } from "@/lib/barcode-utils"

interface BarcodeScannerProps {
  onScan: (barcode: string, type: "item" | "borrowing" | "user" | "unknown") => void
  placeholder?: string
  className?: string
}

export function BarcodeScanner({
  onScan,
  placeholder = "Scan or enter barcode...",
  className = "",
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on input when scanning mode is activated
  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isScanning])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcode.trim()) {
      const { id, type } = parseBarcode(barcode)
      onScan(barcode, type)
      setBarcode("")
      setIsScanning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Most barcode scanners send an Enter key after scanning
    if (e.key === "Enter") {
      handleSubmit(e)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          {isScanning ? (
            <>
              <Input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="pl-10 pr-10"
                autoComplete="off"
                autoFocus
              />
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setIsScanning(false)
                  setBarcode("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full flex justify-start pl-3"
              onClick={() => setIsScanning(true)}
            >
              <Scan className="mr-2 h-4 w-4" />
              {placeholder}
            </Button>
          )}
        </div>
        {isScanning && barcode && <Button type="submit">Scan</Button>}
      </form>
    </div>
  )
}
