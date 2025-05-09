"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Search, User, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActiveBorrowings, getInventoryItemById, getUserByEmail } from "@/lib/data"
import { UserIcon } from "lucide-react"
import type { BorrowRecord, User as UserType } from "@/lib/data"

interface ActiveBorrowingsModalProps {
  open: boolean
  onClose: () => void
}

export default function ActiveBorrowingsModal({ open, onClose }: ActiveBorrowingsModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [activeBorrowings, setActiveBorrowings] = useState<BorrowRecord[]>([])
  const [uniqueUsers, setUniqueUsers] = useState<(UserType | null)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [borrowings, setBorrowings] = useState<BorrowRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!open) return // Don't fetch if modal is closed

      setLoading(true)
      setError(null)

      try {
        // Get active borrowings
        const borrowings = await getActiveBorrowings()
        setActiveBorrowings(borrowings)

        // Get unique users
        const uniqueEmails = [...new Set(borrowings.map((record) => record.userEmail))]
        const users = await Promise.all(
          uniqueEmails.map(async (email) => {
            try {
              return await getUserByEmail(email)
            } catch (error) {
              console.error(`Error fetching user ${email}:`, error)
              return null
            }
          }),
        )

        setUniqueUsers(users.filter(Boolean))
      } catch (error) {
        console.error("Error fetching active borrowings:", error)
        setError("Failed to load active borrowings. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open])

  // Filter borrowings based on search and user filter
  const filteredBorrowings = activeBorrowings.filter((record) => {
    // We'll fetch item and user details on demand for each record
    const matchesSearch =
      !searchTerm ||
      record.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUser = !userFilter || record.userEmail === userFilter

    return matchesSearch && matchesUser
  })

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Calculate days borrowed
  const calculateDaysBorrowed = (borrowDate: Date) => {
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - borrowDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path d="M12 2L4 6V12C4 15.31 7.58 20 12 22C16.42 20 20 15.31 20 12V6L12 2Z" fill="currentColor" />
                <path d="M9 12H15M9 8H15M9 16H13" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>Peminjaman Aktif</span>
            </div>
          </DialogTitle>
          <DialogDescription>Lihat semua peminjaman aktif dalam sistem.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan item atau pengguna..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={userFilter || "all"}
                onValueChange={(value) => setUserFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter berdasarkan pengguna" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full min-w-[8rem]">
                  <SelectItem value="all">Semua Pengguna</SelectItem>
                  {uniqueUsers.map(
                    (user) =>
                      user && (
                        <SelectItem key={user.email} value={user.email}>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{user.name}</span>
                          </div>
                        </SelectItem>
                      ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-medium mb-1">Memuat data peminjaman...</h3>
              <p className="text-muted-foreground">Mohon tunggu sebentar.</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-1 text-red-600">Error</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredBorrowings.length > 0 ? (
            <div className="space-y-4">
              {filteredBorrowings.map((record) => {
                // We'll use a component for each borrowing record to handle async data loading
                return <BorrowingRecordItem key={record.id} record={record} />
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-lg font-medium mb-1">Tidak ada peminjaman aktif</h3>
              <p className="text-muted-foreground">Tidak ada peminjaman aktif yang sesuai dengan kriteria Anda.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Separate component to handle async loading of item and user data for each borrowing record
function BorrowingRecordItem({ record }: { record: BorrowRecord }) {
  const [item, setItem] = useState<any>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load item and user data in parallel
        const [itemData, userData] = await Promise.all([
          getInventoryItemById(record.itemId),
          getUserByEmail(record.userEmail),
        ])

        setItem(itemData)
        setUser(userData)
      } catch (error) {
        console.error("Error loading borrowing record data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [record.itemId, record.userEmail])

  // Calculate days borrowed
  const daysBorrowed = calculateDaysBorrowed(record.borrowDate)

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Calculate days borrowed
  function calculateDaysBorrowed(borrowDate: Date) {
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - borrowDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-4 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border p-4 hover:shadow-md"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4 flex justify-center md:justify-start">
          <div className="relative h-24 w-full max-w-[120px] overflow-hidden rounded-md bg-gray-100">
            <img
              src={item?.image || "/placeholder.svg"}
              alt={item?.name || "Unknown Item"}
              className="h-full w-full object-cover transition-all duration-300 hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=100&width=100&text=No+Image"
              }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="font-medium text-lg text-center md:text-left truncate">{item?.name || "Unknown Item"}</h3>
            <div className="flex flex-wrap justify-center md:justify-end gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {item?.type?.toUpperCase() || "UNKNOWN"}
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                {daysBorrowed} {daysBorrowed === 1 ? "hari" : "hari"} borrowed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Dipinjam oleh:</span>
              <span className="font-medium truncate">{user?.name || record.userEmail}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Tanggal pinjam:</span>
              <span className="font-medium">{formatDate(record.borrowDate)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Jumlah:</span>
              <span className="font-medium">
                {record.quantity} {record.quantity === 1 ? "unit" : "unit"}
              </span>
            </div>

            {user?.nip && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">NIP:</span>
                <span className="font-medium truncate">{user.nip}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
