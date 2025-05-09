"use client"

import { useState, useEffect } from "react"
import { Search, ImageIcon } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type InventoryItem, addBorrowRecord, getInventoryItems } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
// Add a new import for the ItemDetailModal component
import ItemDetailModal from "./item-detail-modal"

interface InventoryListProps {
  userEmail: string
}

// Update the component to refresh the inventory items when needed
export default function InventoryList({ userEmail }: InventoryListProps) {
  // Use state to store inventory items and refresh when needed
  const [items, setItems] = useState<InventoryItem[]>([]) // Initialize with empty array
  const [loading, setLoading] = useState(true) // Add loading state
  const [error, setError] = useState<string | null>(null) // Add error state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [borrowQuantity, setBorrowQuantity] = useState(1)
  const [borrowDuration, setBorrowDuration] = useState(7) // Default to 7 days
  const [dialogOpen, setDialogOpen] = useState(false)
  const [borrowSuccess, setBorrowSuccess] = useState(false)

  // Add a new state variable for the detail view modal after the existing state declarations (around line 30)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null)

  // Use useEffect to fetch inventory items when the component mounts
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true)

        // Get data directly from Supabase
        const allItems = await getInventoryItems()

        setItems(allItems)
        setError(null)
      } catch (error) {
        console.error("Error loading inventory data:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory data. Please try again.",
          variant: "destructive",
        })
        // Try to load from localStorage as fallback
        if (typeof window !== "undefined") {
          const savedItems = localStorage.getItem("inventoryItems")
          if (savedItems) {
            try {
              const parsedItems = JSON.parse(savedItems)
              setItems(
                parsedItems.map((item: any) => ({
                  ...item,
                  addedDate: new Date(item.addedDate),
                  lastCalibration: item.lastCalibration ? new Date(item.lastCalibration) : null,
                  nextCalibration: item.nextCalibration ? new Date(item.nextCalibration) : null,
                })),
              )
              setError(null)
            } catch (parseErr) {
              console.error("Error parsing localStorage items:", parseErr)
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadInventoryData()
  }, [])

  // Filter items based on search term and type
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    return matchesSearch && matchesType
  })

  const handleBorrow = (item: InventoryItem) => {
    setSelectedItem(item)
    setBorrowQuantity(1)
    setDialogOpen(true)
    setBorrowSuccess(false)
  }

  // Add a new function to handle viewing item details before the return statement
  const handleViewDetails = (item: InventoryItem) => {
    setViewItem(item)
    setDetailModalOpen(true)
  }

  // Update the confirmBorrow function to include the estimated duration
  const confirmBorrow = async () => {
    if (selectedItem && borrowQuantity > 0 && borrowQuantity <= selectedItem.available) {
      try {
        // Add the borrow record to Supabase/localStorage
        await addBorrowRecord({
          itemId: selectedItem.id,
          userEmail,
          borrowDate: new Date(),
          returnDate: null,
          quantity: borrowQuantity,
          status: "active",
          estimatedDuration: borrowDuration, // Add the estimated duration
        })

        // Refresh the inventory items
        const updatedItems = await getInventoryItems()
        setItems(updatedItems)

        setBorrowSuccess(true)

        // Show toast notification
        toast({
          title: "Item Borrowed",
          description: `You have successfully borrowed ${borrowQuantity} ${selectedItem.name}(s)`,
        })

        // Close dialog after a delay
        setTimeout(() => {
          setDialogOpen(false)
          setBorrowSuccess(false)
        }, 1500)
      } catch (err) {
        console.error("Error borrowing item:", err)
        toast({
          title: "Error",
          description: "Failed to borrow item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show error state
  if (error && items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">Error Loading Inventory</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b mb-4"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari inventaris..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Filter berdasarkan jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Item</SelectItem>
              <SelectItem value="material">Material</SelectItem>
              <SelectItem value="tool">Alat</SelectItem>
              <SelectItem value="apd">APD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="h-full flex flex-col hover:shadow-md transition-all duration-300 border-opacity-70">
              <CardHeader className="pb-2 space-y-1">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {item.image ? (
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(
                            item.name.charAt(0),
                          )}`
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <span className="truncate font-medium">{item.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Jenis:</span>
                    <span className="capitalize px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah Total:</span>
                    <span>{item.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tersedia:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.available === 0
                          ? "bg-red-100 text-red-800"
                          : item.available < item.quantity / 2
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.available}
                    </span>
                  </div>
                  <p className="pt-2 text-muted-foreground line-clamp-3 text-sm">{item.description}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full transition-all hover:bg-primary/5 text-primary"
                  onClick={() => handleViewDetails(item)}
                >
                  Lihat Detail
                </Button>
                <Button
                  className="w-full transition-all hover:scale-105 shadow-sm"
                  disabled={item.available === 0}
                  onClick={() => handleBorrow(item)}
                >
                  {item.available === 0 ? "Stok Habis" : "Pinjam"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground opacity-40" />
            </div>
            <h3 className="text-lg font-medium mb-1">Tidak ada item ditemukan</h3>
            <p className="text-muted-foreground">
              Tidak ada item yang sesuai dengan kriteria pencarian Anda. Coba sesuaikan filter Anda.
            </p>
          </motion.div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open && borrowSuccess) {
            // Reset state when dialog closes after successful borrow
            setTimeout(() => {
              setBorrowSuccess(false)
            }, 100)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pinjam Item</DialogTitle>
            <DialogDescription>
              {borrowSuccess
                ? "Item berhasil dipinjam!"
                : `Masukkan jumlah ${selectedItem?.name} yang ingin Anda pinjam.`}
            </DialogDescription>
          </DialogHeader>

          {!borrowSuccess && selectedItem && (
            <>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedItem.image ||
                      `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(selectedItem.name.charAt(0)) || "/placeholder.svg"}`
                    }
                    alt={selectedItem.name}
                    className="h-16 w-16 rounded-md object-cover bg-gray-100"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(selectedItem.name.charAt(0))}`
                    }}
                  />
                  <div>
                    <h3 className="font-medium">{selectedItem.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedItem.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah (Tersedia: {selectedItem.available})</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selectedItem.available}
                    value={borrowQuantity}
                    onChange={(e) => setBorrowQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimasi Durasi Peminjaman (hari)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={90}
                    value={borrowDuration}
                    onChange={(e) => setBorrowDuration(Number.parseInt(e.target.value) || 7)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Masukkan perkiraan berapa hari Anda akan meminjam item ini
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  Batal
                </Button>
                <Button onClick={confirmBorrow} className="transition-all hover:scale-105 w-full sm:w-auto">
                  Konfirmasi Pinjam
                </Button>
              </DialogFooter>
            </>
          )}

          {borrowSuccess && (
            <div className="py-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
              >
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p>Item Anda telah berhasil dipinjam!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Item Detail Modal */}
      <ItemDetailModal
        item={viewItem ? { ...viewItem } : null}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          // Give time for animation to complete before clearing the item
          setTimeout(() => {
            setViewItem(null)
          }, 300)
        }}
      />
    </div>
  )
}
