"use client"

import { useState, useEffect } from "react"
import { Calendar, CheckCircle, Printer, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type BorrowRecord,
  type InventoryItem,
  getBorrowRecordsByUser,
  getInventoryItemById,
  returnBorrowedItem,
  getBorrowRecords,
  getInventoryItems,
} from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import { BarcodePrintModal } from "@/components/barcode-print-modal"

interface BorrowingHistoryProps {
  userEmail: string
}

interface EnhancedBorrowRecord extends BorrowRecord {
  item: InventoryItem | undefined
}

export default function BorrowingHistory({ userEmail }: BorrowingHistoryProps) {
  const [records, setRecords] = useState<EnhancedBorrowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printBarcodeModalOpen, setPrintBarcodeModalOpen] = useState(false)
  const [selectedRecordForBarcode, setSelectedRecordForBarcode] = useState<EnhancedBorrowRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get borrow records asynchronously
      const userRecords = await getBorrowRecordsByUser(userEmail)

      console.log("User email:", userEmail)
      console.log("Found records:", userRecords.length)

      // Enhance records with item details
      const enhancedRecords: EnhancedBorrowRecord[] = []

      for (const record of userRecords) {
        const item = await getInventoryItemById(record.itemId)
        enhancedRecords.push({
          ...record,
          item,
        })
      }

      // Sort by date, most recent first
      enhancedRecords.sort((a, b) => b.borrowDate.getTime() - a.borrowDate.getTime())

      setRecords(enhancedRecords)
    } catch (err) {
      console.error("Error fetching borrowing records:", err)
      setError("Failed to load borrowing records. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadBorrowingData = async () => {
      try {
        setIsLoading(true)

        // Get data directly from Supabase
        const records = await getBorrowRecords()
        setBorrowRecords(records)

        // Also load inventory items for reference
        const items = await getInventoryItems()
        setInventoryItems(items)
      } catch (error) {
        console.error("Error loading borrowing data:", error)
        toast({
          title: "Error",
          description: "Failed to load borrowing history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBorrowingData()
  }, [])

  const handleReturn = async (recordId: string) => {
    try {
      const success = await returnBorrowedItem(recordId)
      if (success) {
        // Refresh the records after returning
        await fetchRecords()

        // Show toast notification
        toast({
          title: "Item Dikembalikan",
          description: "Item telah berhasil dikembalikan ke inventaris.",
        })
      }
    } catch (err) {
      console.error("Error returning item:", err)
      toast({
        title: "Error",
        description: "Gagal mengembalikan item. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const handlePrintBarcode = (record: EnhancedBorrowRecord) => {
    setSelectedRecordForBarcode(record)
    setPrintBarcodeModalOpen(true)
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
          className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchRecords} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
        Riwayat Peminjaman Saya
      </motion.h2>

      {records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-dashed p-8 text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <h3 className="text-lg font-medium mb-1">Tidak ada riwayat peminjaman</h3>
          <p className="text-muted-foreground">
            Anda belum meminjam item apapun. Kunjungi halaman inventaris untuk meminjam item.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {records.map((record) => (
            <motion.div
              key={record.id}
              variants={item}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card
                className={`h-full ${record.status === "returned" ? "opacity-75" : ""} hover:shadow-md transition-all duration-300`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {record.item && (
                        <img
                          src={record.item.image || "/placeholder.svg"}
                          alt={record.item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate font-medium">{record.item?.name || "Unknown Item"}</span>
                      <span className="text-xs text-muted-foreground capitalize">{record.item?.type || "unknown"}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Dipinjam:</span>
                      <span className="font-medium">{formatDate(record.borrowDate)}</span>
                    </div>

                    {record.returnDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Dikembalikan:</span>
                        <span className="font-medium">{formatDate(record.returnDate)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Jumlah:</span>
                      <span className="font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                        {record.quantity}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.status === "active" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {record.status === "active" ? "Aktif" : "Dikembalikan"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handlePrintBarcode(record)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Barcode
                  </Button>
                </CardContent>
                {record.status === "active" && (
                  <CardFooter>
                    <Button
                      className="w-full transition-all hover:bg-green-600 hover:scale-105"
                      onClick={() => handleReturn(record.id)}
                    >
                      Kembalikan Item
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      {selectedRecordForBarcode && (
        <BarcodePrintModal
          open={printBarcodeModalOpen}
          onClose={() => setPrintBarcodeModalOpen(false)}
          barcode={selectedRecordForBarcode.barcode}
          title={`Borrowing Record: ${selectedRecordForBarcode.item?.name || "Unknown Item"}`}
          subtitle={`Status: ${selectedRecordForBarcode.status === "active" ? "Active" : "Returned"}`}
        />
      )}
    </div>
  )
}
