"use client"

import { useState } from "react"
import { Download, FileText, Printer, Calendar } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type BorrowRecord, getInventoryItemById, getBorrowRecordsByUser } from "@/lib/data"
import { toast } from "@/hooks/use-toast"

interface EnhancedBorrowRecord extends BorrowRecord {
  itemName: string
  itemType: string
}

interface UserBorrowingReportProps {
  userEmail: string
}

export default function UserBorrowingReport({ userEmail }: UserBorrowingReportProps) {
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [records, setRecords] = useState<EnhancedBorrowRecord[]>([])
  const [isReportGenerated, setIsReportGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      // Get all user records
      const userRecordsResult = await getBorrowRecordsByUser(userEmail)

      // Ensure userRecords is an array
      const userRecords = Array.isArray(userRecordsResult) ? userRecordsResult : []

      // Filter by date range
      const filteredRecords = userRecords.filter((record) => {
        const borrowDate = new Date(record.borrowDate)
        return borrowDate >= startDate && borrowDate <= endDate
      })

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
      setIsReportGenerated(true)

      toast({
        title: "Laporan Peminjaman Dibuat",
        description: `Laporan ${reportType === "weekly" ? "mingguan" : reportType === "monthly" ? "bulanan" : "tahunan"} telah dibuat.`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat laporan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj)
  }

  // Print report
  const printReport = () => {
    window.print()
  }

  // Download borrowing report as XLS
  const downloadBorrowingXLS = () => {
    const { startDate, endDate } = getDateRange()

    // Create header row
    const header = ["Item", "Jenis", "Jumlah", "Tanggal Pinjam", "Tanggal Kembali", "Status"]

    // Create data rows
    const rows = records.map((record) => [
      record.itemName,
      record.itemType,
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
    link.download = `laporan-peminjaman-saya-${reportType}-${new Date().toISOString().split("T")[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "XLS Diunduh",
      description: "Laporan peminjaman Anda telah diunduh sebagai file Excel.",
    })
  }

  // Calculate statistics
  const getStats = () => {
    const totalItems = records.reduce((sum, record) => sum + (record.quantity || 0), 0)
    const activeItems = records
      .filter((r) => r.status === "active")
      .reduce((sum, record) => sum + (record.quantity || 0), 0)
    const returnedItems = totalItems - activeItems

    return {
      totalItems,
      activeItems,
      returnedItems,
      totalRecords: records.length,
      activeRecords: records.filter((r) => r.status === "active").length,
      returnedRecords: records.filter((r) => r.status === "returned").length,
    }
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold flex items-center gap-2"
      >
        <Calendar className="h-5 w-5 text-primary" />
        <span>Laporan Peminjaman Saya</span>
      </motion.h2>

      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan Peminjaman</CardTitle>
          <CardDescription>Lihat riwayat peminjaman Anda berdasarkan periode waktu.</CardDescription>
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
                    <SelectValue placeholder="Pilih periode laporan" />
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

            {isReportGenerated && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {reportType === "weekly" ? "Mingguan" : reportType === "monthly" ? "Bulanan" : "Tahunan"} Laporan
                      Peminjaman
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(getDateRange().startDate)} - {formatDate(getDateRange().endDate)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={printReport} className="transition-all hover:bg-muted">
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

                {records.length > 0 ? (
                  <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Peminjaman</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getStats().totalRecords}</div>
                          <p className="text-xs text-muted-foreground">{getStats().totalItems} item</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Peminjaman Aktif</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getStats().activeRecords}</div>
                          <p className="text-xs text-muted-foreground">{getStats().activeItems} item</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-primary-subtle">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Dikembalikan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{getStats().returnedRecords}</div>
                          <p className="text-xs text-muted-foreground">{getStats().returnedItems} item</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:-mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="rounded-md border print:border-black overflow-hidden">
                          <div className="grid grid-cols-6 border-b bg-muted p-2 text-xs md:text-sm font-medium print:bg-gray-200 print:text-black">
                            <div className="truncate">Item</div>
                            <div className="truncate">Jenis</div>
                            <div className="truncate">Jumlah</div>
                            <div className="truncate">Tanggal Pinjam</div>
                            <div className="truncate">Tanggal Kembali</div>
                            <div className="truncate">Status</div>
                          </div>

                          {records.map((record, index) => (
                            <motion.div
                              key={record.id || index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="grid grid-cols-6 items-center border-b p-2 text-xs md:text-sm last:border-0 print:text-black"
                            >
                              <div className="truncate max-w-[150px]" title={record.itemName}>
                                {record.itemName}
                              </div>
                              <div className="capitalize truncate">{record.itemType}</div>
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
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada data peminjaman untuk periode ini.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
