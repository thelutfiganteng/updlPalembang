"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Printer, BarChart3, Package, PenToolIcon as Tool, Shield } from "lucide-react"
import { motion } from "framer-motion"
import type { jsPDF } from "jspdf"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type BorrowRecord,
  type InventoryItem,
  getInventoryItemById,
  getInventoryItems,
  getInventoryItemsByType,
  getBorrowRecords,
} from "@/lib/data"
import { toast } from "@/hooks/use-toast"

// Define a more specific type for jsPDF with autoTable
interface AutoTableOptions {
  head: string[][]
  body: string[][]
  startY: number
  theme: string
  styles: { fontSize: number }
  headStyles: { fillColor: number[] }
}

interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => jsPDF
}

interface EnhancedBorrowRecord extends BorrowRecord {
  itemName: string
  itemType: string
}

export default function Reports() {
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [records, setRecords] = useState<EnhancedBorrowRecord[]>([])
  const [inventoryReportType, setInventoryReportType] = useState<"all" | "material" | "tool" | "apd">("all")
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab] = useState<"borrowings" | "inventory">("borrowings")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Get date ranges based on report type
  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()

    if (reportType === "weekly") {
      // Set to beginning of current week (Sunday)
      startDate.setDate(now.getDate() - now.getDay())
    } else if (reportType === "monthly") {
      // Set to beginning of current month
      startDate.setDate(1)
    } else if (reportType === "yearly") {
      // Set to beginning of current year
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Reset time to beginning of day
    startDate.setHours(0, 0, 0, 0)

    return {
      startDate,
      endDate: now,
    }
  }

  // Generate borrowing report based on selected type
  const generateBorrowingReport = async () => {
    try {
      setIsLoading(true)
      const { startDate, endDate } = getDateRange()

      // Get records in date range
      const allRecords = await getBorrowRecords()
      console.log(`Fetched ${allRecords.length} total borrow records`)

      // Filter by date range
      const filteredRecords = allRecords.filter((record) => {
        const borrowDate = record.borrowDate instanceof Date ? record.borrowDate : new Date(record.borrowDate)
        return borrowDate >= startDate && borrowDate <= endDate
      })

      console.log(`Filtered to ${filteredRecords.length} records in date range`)

      // Enhance records with item details
      const enhancedRecords = await Promise.all(
        filteredRecords.map(async (record) => {
          const item = await getInventoryItemById(record.itemId)
          return {
            ...record,
            itemName: item?.name || "Unknown Item",
            itemType: item?.type || "Unknown Type",
          }
        }),
      )

      // Sort by date, most recent first
      enhancedRecords.sort((a, b) => {
        const dateA = a.borrowDate instanceof Date ? a.borrowDate : new Date(a.borrowDate)
        const dateB = b.borrowDate instanceof Date ? b.borrowDate : new Date(b.borrowDate)
        return dateB.getTime() - dateA.getTime()
      })

      setRecords(enhancedRecords)

      toast({
        title: "Borrowing Report Generated",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been generated with ${enhancedRecords.length} records.`,
      })
    } catch (error) {
      console.error("Error generating borrowing report:", error)
      toast({
        title: "Error Generating Report",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate inventory report based on selected type
  const generateInventoryReport = async () => {
    try {
      setIsLoading(true)
      let items: InventoryItem[] = []

      if (inventoryReportType === "all") {
        items = await getInventoryItems()
        console.log(`Fetched ${items.length} total inventory items`)
      } else {
        items = await getInventoryItemsByType(inventoryReportType)
        console.log(`Fetched ${items.length} ${inventoryReportType} items`)
      }

      // Ensure items are properly loaded
      if (items.length === 0 && typeof window !== "undefined") {
        // Fallback to direct localStorage access if API returns empty
        const savedItems = localStorage.getItem("inventoryItems")
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems)
          const processedItems = parsedItems.map((item: any) => ({
            ...item,
            addedDate: new Date(item.addedDate),
            lastCalibration: item.lastCalibration ? new Date(item.lastCalibration) : null,
            nextCalibration: item.nextCalibration ? new Date(item.nextCalibration) : null,
          }))

          if (inventoryReportType !== "all") {
            items = processedItems.filter((item: any) => item.type === inventoryReportType)
          } else {
            items = processedItems
          }
          console.log(`Loaded ${items.length} items from localStorage fallback`)
        }
      }

      setInventoryItems(items)

      toast({
        title: "Inventory Report Generated",
        description: `${inventoryReportType.charAt(0).toUpperCase() + inventoryReportType.slice(1)} inventory report has been generated with ${items.length} items.`,
      })
    } catch (error) {
      console.error("Error generating inventory report:", error)
      toast({
        title: "Error Generating Report",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Print report
  const printReport = () => {
    window.print()
  }

  // Download borrowing report as PDF
  const downloadBorrowingXLS = () => {
    const { startDate, endDate } = getDateRange()

    // Create header row
    const header = ["Item", "Jenis", "Pengguna", "Jumlah", "Tanggal Pinjam", "Tanggal Kembali", "Status"]

    // Create data rows
    const rows = records.map((record) => [
      record.itemName,
      record.itemType,
      record.userEmail,
      record.quantity.toString(),
      formatDate(record.borrowDate),
      formatDate(record.returnDate),
      record.status === "active" ? "Aktif" : "Dikembalikan",
    ])

    // Combine header and rows into CSV format
    let csvContent = header.join(",") + "\n"
    rows.forEach((row) => {
      // Wrap text fields in quotes to handle commas in text
      const formattedRow = row.map((cell) => `"${cell}"`).join(",")
      csvContent += formattedRow + "\n"
    })

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)

    // Create a link and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = `laporan-peminjaman-${reportType}-${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "XLS Diunduh",
      description: "Laporan peminjaman Anda telah diunduh sebagai file Excel.",
    })
  }

  // Download inventory report as PDF
  const downloadInventoryXLS = () => {
    // Create header row based on inventory type
    const header = ["Nama", "Jenis", "Merek", "Jumlah", "Tersedia", "Lokasi", "Deskripsi"]

    // Create data rows
    const rows = inventoryItems.map((item) => [
      item.name,
      item.type,
      item.brand,
      item.quantity.toString(),
      item.available.toString(),
      item.location,
      item.description.substring(0, 50) + (item.description.length > 50 ? "..." : ""),
    ])

    // Combine header and rows into CSV format
    let csvContent = header.join(",") + "\n"
    rows.forEach((row) => {
      // Wrap text fields in quotes to handle commas in text
      const formattedRow = row.map((cell) => `"${cell}"`).join(",")
      csvContent += formattedRow + "\n"
    })

    // Create a Blob with the CSV data
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)

    // Create a link and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = `laporan-inventaris-${inventoryReportType}-${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "XLS Diunduh",
      description: "Laporan inventaris Anda telah diunduh sebagai file Excel.",
    })
  }

  // Calculate inventory statistics
  const getInventoryStats = () => {
    const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
    const availableItems = inventoryItems.reduce((sum, item) => sum + item.available, 0)
    const unavailableItems = totalItems - availableItems
    const percentAvailable = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0

    return {
      totalItems,
      availableItems,
      unavailableItems,
      percentAvailable,
    }
  }

  useEffect(() => {
    // Pre-load some data when component mounts
    const preloadData = async () => {
      try {
        // Check if we have inventory items
        const items = await getInventoryItems()
        console.log(`Preloaded ${items.length} inventory items`)

        // Check if we have borrow records
        const records = await getBorrowRecords()
        console.log(`Preloaded ${records.length} borrow records`)

        // If we don't have any data, try to load from localStorage
        if (items.length === 0 && typeof window !== "undefined") {
          const savedItems = localStorage.getItem("inventoryItems")
          if (savedItems) {
            console.log("Found inventory items in localStorage")
          } else {
            console.log("No inventory items found in localStorage")
          }
        }

        if (records.length === 0 && typeof window !== "undefined") {
          const savedRecords = localStorage.getItem("borrowRecords")
          if (savedRecords) {
            console.log("Found borrow records in localStorage")
          } else {
            console.log("No borrow records found in localStorage")
          }
        }
      } catch (error) {
        console.error("Error preloading data:", error)
      }
    }

    preloadData()
  }, [])

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path d="M12 2L4 6V12C4 15.31 7.58 20 12 22C16.42 20 20 15.31 20 12V6L12 2Z" fill="currentColor" />
            <path d="M9 12H15M9 8H15M9 16H13" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Laporan PLN</span>
        </div>
      </motion.h2>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "borrowings" | "inventory")}>
        <TabsList className="mb-4">
          <TabsTrigger value="borrowings" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Laporan Peminjaman</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Laporan Inventaris</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="borrowings">
          <Card>
            <CardHeader>
              <CardTitle>Buat Laporan Peminjaman</CardTitle>
              <CardDescription>Buat laporan untuk aktivitas peminjaman inventaris.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="space-y-2 w-full sm:w-auto">
                    <label className="text-sm font-medium">Periode Laporan</label>
                    <Select
                      value={reportType}
                      onValueChange={(value: "weekly" | "monthly" | "yearly") => setReportType(value)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select report period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Mingguan</SelectItem>
                        <SelectItem value="monthly">Bulanan</SelectItem>
                        <SelectItem value="yearly">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={generateBorrowingReport}
                    className="transition-all hover:scale-105 w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Buat Laporan
                      </>
                    )}
                  </Button>
                </div>

                {records.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Laporan Peminjaman
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(getDateRange().startDate)} - {formatDate(getDateRange().endDate)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printReport}
                          className="transition-all hover:bg-muted"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Cetak
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadBorrowingXLS}
                          className="transition-all hover:bg-muted"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Unduh XLS
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:-mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="rounded-md border print:border-black overflow-hidden">
                          <div className="grid grid-cols-7 border-b bg-muted p-2 text-xs md:text-sm font-medium print:bg-gray-200 print:text-black">
                            <div className="truncate">Item</div>
                            <div className="truncate">Jenis</div>
                            <div className="truncate">Pengguna</div>
                            <div className="truncate">Jumlah</div>
                            <div className="truncate">Tanggal Pinjam</div>
                            <div className="truncate">Tanggal Kembali</div>
                            <div className="truncate">Status</div>
                          </div>

                          {records.map((record, index) => (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="grid grid-cols-7 items-center border-b p-2 text-xs md:text-sm last:border-0 print:text-black"
                            >
                              <div className="truncate max-w-[150px]" title={record.itemName}>
                                {record.itemName}
                              </div>
                              <div className="capitalize truncate">{record.itemType}</div>
                              <div className="truncate max-w-[120px]" title={record.userEmail}>
                                {record.userEmail}
                              </div>
                              <div>{record.quantity}</div>
                              <div className="truncate">{formatDate(record.borrowDate)}</div>
                              <div className="truncate">{formatDate(record.returnDate)}</div>
                              <div>
                                <span
                                  className={`inline-block rounded-full px-2 py-1 text-xs ${
                                    record.status === "active"
                                      ? "bg-blue-100 text-blue-800 print:bg-gray-200 print:text-black"
                                      : "bg-green-100 text-green-800 print:bg-gray-200 print:text-black"
                                  }`}
                                >
                                  {record.status === "active" ? "Aktif" : "Dikembalikan"}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {records.length === 0 && (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-muted-foreground">Tidak ada data peminjaman untuk periode ini.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Coba pilih periode waktu yang berbeda atau tambahkan beberapa peminjaman terlebih dahulu.
                        </p>
                      </div>
                    )}

                    <div className="print:hidden">
                      <p className="text-sm text-muted-foreground">
                        Total Catatan: {records.length} | Aktif: {records.filter((r) => r.status === "active").length} |
                        Dikembalikan: {records.filter((r) => r.status === "returned").length}
                      </p>
                    </div>

                    {/* Print-only summary - will only show when printing */}
                    <div className="hidden print:block print:mt-4">
                      <h4 className="font-medium">Ringkasan</h4>
                      <p>Total Catatan: {records.length}</p>
                      <p>Peminjaman Aktif: {records.filter((r) => r.status === "active").length}</p>
                      <p>Item Dikembalikan: {records.filter((r) => r.status === "returned").length}</p>
                      <p>Laporan Dibuat: {new Date().toLocaleString()}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Buat Laporan Inventaris</CardTitle>
              <CardDescription>Buat laporan untuk item inventaris berdasarkan jenis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="space-y-2 w-full sm:w-auto">
                    <label className="text-sm font-medium">Jenis Inventaris</label>
                    <Select
                      value={inventoryReportType}
                      onValueChange={(value: "all" | "material" | "tool" | "apd") => setInventoryReportType(value)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select inventory type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Semua Item</span>
                        </SelectItem>
                        <SelectItem value="material" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Material</span>
                        </SelectItem>
                        <SelectItem value="tool" className="flex items-center gap-2">
                          <Tool className="h-4 w-4" />
                          <span>Alat</span>
                        </SelectItem>
                        <SelectItem value="apd" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>APD</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={generateInventoryReport}
                    className="transition-all hover:scale-105 w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Buat Laporan
                      </>
                    )}
                  </Button>
                </div>

                {inventoryItems.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {inventoryReportType.charAt(0).toUpperCase() + inventoryReportType.slice(1)} Laporan
                          Inventaris
                        </h3>
                        <p className="text-sm text-muted-foreground">Dibuat pada {formatDate(new Date())}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printReport}
                          className="transition-all hover:bg-muted"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Cetak
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadInventoryXLS}
                          className="transition-all hover:bg-muted"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Unduh XLS
                        </Button>
                      </div>
                    </div>

                    {/* Inventory Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Item</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getInventoryStats().totalItems}</div>
                          <p className="text-xs text-muted-foreground">{inventoryItems.length} unique items</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Tersedia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getInventoryStats().availableItems}</div>
                          <p className="text-xs text-muted-foreground">
                            {getInventoryStats().percentAvailable}% of total
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Dipinjam</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getInventoryStats().unavailableItems}</div>
                          <p className="text-xs text-muted-foreground">
                            {100 - getInventoryStats().percentAvailable}% of total
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Jenis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {new Set(inventoryItems.map((item) => item.type)).size}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {inventoryReportType === "all"
                              ? "Semua jenis"
                              : inventoryReportType.charAt(0).toUpperCase() + inventoryReportType.slice(1)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:-mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="rounded-md border print:border-black overflow-hidden">
                          <div className="grid grid-cols-7 border-b bg-muted p-2 text-xs md:text-sm font-medium print:bg-gray-200 print:text-black">
                            <div className="truncate">Nama</div>
                            <div className="truncate">Jenis</div>
                            <div className="truncate">Merek</div>
                            <div className="truncate">Jumlah</div>
                            <div className="truncate">Tersedia</div>
                            <div className="truncate">Lokasi</div>
                            <div className="truncate">Deskripsi</div>
                          </div>

                          {inventoryItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className="grid grid-cols-7 items-center border-b p-2 text-xs md:text-sm last:border-0 print:text-black"
                            >
                              <div className="font-medium truncate max-w-[150px]" title={item.name}>
                                {item.name}
                              </div>
                              <div className="capitalize truncate">{item.type}</div>
                              <div className="truncate" title={item.brand}>
                                {item.brand}
                              </div>
                              <div>{item.quantity}</div>
                              <div>
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                                    item.available === 0
                                      ? "bg-red-100 text-red-800"
                                      : item.available < item.quantity / 2
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.available}
                                </span>
                              </div>
                              <div className="truncate max-w-[100px]" title={item.location}>
                                {item.location}
                              </div>
                              <div className="truncate max-w-[150px]" title={item.description}>
                                {item.description}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {inventoryItems.length === 0 && (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-muted-foreground">Tidak ada data inventaris untuk ditampilkan.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Coba tambahkan beberapa item inventaris terlebih dahulu.
                        </p>
                      </div>
                    )}

                    {/* Type-specific details */}
                    {inventoryReportType !== "all" && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium">
                          {inventoryReportType.charAt(0).toUpperCase() + inventoryReportType.slice(1)} Detail Khusus
                        </h3>

                        <div className="overflow-x-auto -mx-4 sm:-mx-0">
                          <div className="inline-block min-w-full align-middle">
                            <div className="rounded-md border print:border-black overflow-hidden">
                              <div className="grid grid-cols-4 border-b bg-muted p-2 text-xs md:text-sm font-medium print:bg-gray-200 print:text-black">
                                <div className="truncate">Nama</div>
                                {inventoryReportType === "tool" ? (
                                  <>
                                    <div className="truncate">Nomor Alat</div>
                                    <div className="truncate">Nomor Seri</div>
                                    <div className="truncate">Kalibrasi</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="truncate">Masa Pakai</div>
                                    <div className="truncate">Kondisi</div>
                                    <div className="truncate">Tahun</div>
                                  </>
                                )}
                              </div>

                              {inventoryItems.map((item, index) => (
                                <motion.div
                                  key={`detail-${item.id}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.02 }}
                                  className="grid grid-cols-4 items-center border-b p-2 text-xs md:text-sm last:border-0 print:text-black"
                                >
                                  <div className="font-medium truncate max-w-[150px]" title={item.name}>
                                    {item.name}
                                  </div>
                                  {inventoryReportType === "tool" ? (
                                    <>
                                      <div className="truncate" title={(item as any).toolNumber || "N/A"}>
                                        {(item as any).toolNumber || "N/A"}
                                      </div>
                                      <div className="truncate" title={(item as any).serialNumber || "N/A"}>
                                        {(item as any).serialNumber || "N/A"}
                                      </div>
                                      <div className="truncate">
                                        {(item as any).lastCalibration
                                          ? formatDate((item as any).lastCalibration)
                                          : "N/A"}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="truncate" title={(item as any).usagePeriod || "N/A"}>
                                        {(item as any).usagePeriod || "N/A"}
                                      </div>
                                      <div className="truncate" title={item.condition}>
                                        {item.condition}
                                      </div>
                                      <div>{item.year}</div>
                                    </>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="print:hidden">
                      <p className="text-sm text-muted-foreground">
                        Total Item: {getInventoryStats().totalItems} | Tersedia: {getInventoryStats().availableItems} |
                        Dipinjam: {getInventoryStats().unavailableItems}
                      </p>
                    </div>

                    {/* Print-only summary - will only show when printing */}
                    <div className="hidden print:block print:mt-4">
                      <h4 className="font-medium">Ringkasan</h4>
                      <p>Total Item: {getInventoryStats().totalItems}</p>
                      <p>Item Tersedia: {getInventoryStats().availableItems}</p>
                      <p>Item Dipinjam: {getInventoryStats().unavailableItems}</p>
                      <p>Laporan Dibuat: {new Date().toLocaleString()}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
