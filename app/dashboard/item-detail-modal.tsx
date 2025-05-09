"use client"

import {
  Calendar,
  Clock,
  Info,
  Package,
  PenToolIcon as Tool,
  Shield,
  Tag,
  MapPin,
  Ruler,
  Wrench,
  AlertTriangle,
  ImageIcon,
  Printer,
} from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { InventoryItem, MaterialItem, APDItem, ToolItem } from "@/lib/data"
import { motion } from "framer-motion"
import Image from "next/image"
import { Barcode } from "@/components/ui/barcode"
import { BarcodePrintModal } from "@/components/barcode-print-modal"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ItemDetailModalProps {
  item: InventoryItem | null
  open: boolean
  onClose: () => void
}

export default function ItemDetailModal({ item, open, onClose }: ItemDetailModalProps) {
  const [printBarcodeModalOpen, setPrintBarcodeModalOpen] = useState(false)

  if (!item) return null

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Get the appropriate icon based on item type
  const getItemIcon = () => {
    switch (item.type) {
      case "tool":
        return <Tool className="h-5 w-5 text-blue-500" />
      case "material":
        return <Package className="h-5 w-5 text-green-500" />
      case "apd":
        return <Shield className="h-5 w-5 text-orange-500" />
      default:
        return null
    }
  }

  // Get the appropriate condition badge color
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs whitespace-nowrap">
            {condition}
          </Badge>
        )
      case "Good":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs whitespace-nowrap">{condition}</Badge>
        )
      case "Fair":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs whitespace-nowrap">
            {condition}
          </Badge>
        )
      case "Poor":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs whitespace-nowrap">{condition}</Badge>
      default:
        return <Badge className="text-xs whitespace-nowrap">{condition}</Badge>
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {getItemIcon()}
            <span className="truncate">{item.name}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="capitalize">{item.type}</span>
            <span>•</span>
            <span>ID: {item.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="space-y-4">
            <div className="aspect-square w-full max-w-[300px] mx-auto rounded-lg overflow-hidden bg-gray-100 relative">
              {item.image ? (
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(item.name.charAt(0))}`
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="h-16 w-16" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Deskripsi
              </h3>
              <p className="text-sm text-muted-foreground">{item.description || "Tidak ada deskripsi tersedia."}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">Tanggal Ditambahkan</h4>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.addedDate)}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">Ketersediaan</h4>
                <p className="text-sm font-medium">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      item.available === 0
                        ? "bg-red-100 text-red-800"
                        : item.available < item.quantity / 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {item.available} / {item.quantity} {item.available === 1 ? "unit" : "unit"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Informasi Umum</h3>
              <div className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Merek
                  </div>
                  <div className="font-medium truncate">{item.brand || "N/A"}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Tahun
                  </div>
                  <div className="font-medium">{item.year}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> Satuan
                  </div>
                  <div className="font-medium truncate">{item.unit}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Lokasi
                  </div>
                  <div className="font-medium truncate">{item.location}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Kondisi
                  </div>
                  <div className="font-medium">{getConditionBadge(item.condition)}</div>
                </div>
              </div>
            </div>

            {/* Type-specific information */}
            {item.type === "tool" && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-medium">Informasi Khusus Alat</h3>
                <div className="space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Nomor Alat</div>
                    <div className="font-medium truncate">{(item as ToolItem).toolNumber}</div>
                  </div>
                  {(item as ToolItem).serialNumber && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Nomor Seri</div>
                      <div className="font-medium truncate">{(item as ToolItem).serialNumber}</div>
                    </div>
                  )}
                  {(item as ToolItem).lastCalibration && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Kalibrasi Terakhir</div>
                      <div className="font-medium">{formatDate((item as ToolItem).lastCalibration)}</div>
                    </div>
                  )}
                  {(item as ToolItem).nextCalibration && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Kalibrasi Berikutnya</div>
                      <div className="font-medium">{formatDate((item as ToolItem).nextCalibration)}</div>
                    </div>
                  )}
                </div>

                {(item as ToolItem).sop && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Prosedur Operasi Standar
                    </h4>
                    <p className="text-sm text-muted-foreground border rounded-md p-3 break-words">
                      {(item as ToolItem).sop}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {(item.type === "material" || item.type === "apd") && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-medium">
                  {item.type === "material" ? "Informasi Khusus Material" : "Informasi Khusus APD"}
                </h3>
                <div className="space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Masa Pakai
                    </div>
                    <div className="font-medium truncate">
                      {item.type === "material" ? (item as MaterialItem).usagePeriod : (item as APDItem).usagePeriod}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="font-medium">Barcode Information</h3>
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex flex-col items-center">
              <Barcode value={item.barcode} height={60} />
              <p className="mt-1 text-xs font-mono">{item.barcode}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setPrintBarcodeModalOpen(true)}>
                <Printer className="mr-2 h-3 w-3" />
                Print Barcode
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="pt-4 text-sm text-muted-foreground">
          <p>Untuk meminjam item ini, klik tombol "Pinjam" pada kartu inventaris.</p>
        </div>
      </DialogContent>

      <BarcodePrintModal
        open={printBarcodeModalOpen}
        onClose={() => setPrintBarcodeModalOpen(false)}
        barcode={item.barcode}
        title={item.name}
        subtitle={`${item.type.toUpperCase()} - ${item.id}`}
      />
    </Dialog>
  )
}
