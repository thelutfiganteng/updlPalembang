"use client"

import { useRef } from "react"
import { Printer, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Barcode } from "@/components/ui/barcode"
import { QRCode } from "@/components/ui/qr-code"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BarcodePrintModalProps {
  open: boolean
  onClose: () => void
  barcode: string
  title: string
  subtitle?: string
}

export function BarcodePrintModal({ open, onClose, barcode, title, subtitle }: BarcodePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups for this website")
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode - ${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 15px;
            }
            .barcode-container {
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: white;
            }
            .barcode-value {
              font-family: monospace;
              font-size: 12px;
              text-align: center;
              margin-top: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="title">${title}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
            <div class="barcode-container">
              ${printContent.innerHTML}
            </div>
            <div class="barcode-value">${barcode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const downloadBarcode = (format: "svg" | "png") => {
    const barcodeElement = printRef.current?.querySelector("svg")
    if (!barcodeElement) return

    if (format === "svg") {
      // Download as SVG
      const svgData = new XMLSerializer().serializeToString(barcodeElement)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)
      const downloadLink = document.createElement("a")
      downloadLink.href = svgUrl
      downloadLink.download = `barcode-${barcode}.svg`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } else if (format === "png") {
      // Download as PNG
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const svgData = new XMLSerializer().serializeToString(barcodeElement)
      const img = new Image()
      img.src = "data:image/svg+xml;base64," + btoa(svgData)

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.href = pngUrl
        downloadLink.download = `barcode-${barcode}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Print Barcode</DialogTitle>
          <DialogDescription>Print or download the barcode for {title}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="barcode" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="barcode" className="mt-4">
            <div className="flex flex-col items-center p-4 border rounded-md bg-white">
              <div ref={printRef}>
                <Barcode value={barcode} height={80} displayValue={false} />
              </div>
              <p className="mt-2 font-mono text-sm">{barcode}</p>
            </div>
          </TabsContent>

          <TabsContent value="qrcode" className="mt-4">
            <div className="flex flex-col items-center p-4 border rounded-md bg-white">
              <div ref={printRef}>
                <QRCode value={barcode} size={150} />
              </div>
              <p className="mt-2 font-mono text-sm">{barcode}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadBarcode("svg")} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              SVG
            </Button>
            <Button variant="outline" onClick={() => downloadBarcode("png")} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
