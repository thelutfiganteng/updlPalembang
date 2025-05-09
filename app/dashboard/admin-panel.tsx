"use client"

import { useState, useEffect, useRef } from "react"
import {
  BarChart3,
  Box,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash,
  Users,
  Search,
  Plus,
  Printer,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import type { jsPDF } from "jspdf"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  type BorrowRecord,
  type InventoryItem,
  type User as UserType,
  deleteUser,
  getBorrowRecords,
  getInventoryItemById,
  getInventoryItems,
  getUserByEmail,
  getUsers,
  updateUser,
  addUser,
  loadInventoryItems,
  loadBorrowRecords,
  loadUsers,
} from "@/lib/data"
import { toast } from "@/hooks/use-toast"

import InventoryManagement from "./inventory-management"
import UserProfileView from "./user-profile-view"

interface AutoTableOptions {
  head: string[][]
  body: string[][]
  startY: number
  theme: string
  styles: { fontSize: number }
  headStyles: { fillColor: number[] }
}

interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => JsPDFWithAutoTable
  lastAutoTable?: { finalY: number }
}

export default function AdminPanel() {
  // State for active tab
  const [activeTab, setActiveTab] = useState("inventory")

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  // Initialize state with empty arrays
  const [items, setItems] = useState<InventoryItem[]>([])
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Statistics state
  const [totalItems, setTotalItems] = useState(0)
  const [availableItems, setAvailableItems] = useState(0)
  const [borrowedItems, setBorrowedItems] = useState(0)
  const [activeRecordsCount, setActiveRecordsCount] = useState(0)
  const [materialCount, setMaterialCount] = useState(0)
  const [toolCount, setToolCount] = useState(0)
  const [apdCount, setApdCount] = useState(0)

  const [editUserDialog, setEditUserDialog] = useState(false)
  const [deleteUserDialog, setDeleteUserDialog] = useState(false)
  const [viewUserDialog, setViewUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedUserData, setSelectedUserData] = useState<UserType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [newUserDialog, setNewUserDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add new user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    name: "",
    nip: "",
    birthDate: "",
    address: "",
  })

  // Edit user form state
  const [editUser, setEditUser] = useState({
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    name: "",
    nip: "",
    birthDate: "",
    address: "",
  })

  // Refs for tab buttons
  const inventoryTabRef = useRef<HTMLButtonElement>(null)
  const borrowingsTabRef = useRef<HTMLButtonElement>(null)
  const usersTabRef = useRef<HTMLButtonElement>(null)

  // Function to add debug info
  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString()}: ${info}`])
  }

  // Fetch data on component mount
  useEffect(() => {
    addDebugInfo("Component mounted")
    fetchData()
  }, [])

  // Function to fetch all data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    addDebugInfo("fetchData started")

    try {
      // Fetch inventory items from localStorage first as a fallback
      let fetchedItems: InventoryItem[] = []
      try {
        // Try to get items from API first
        fetchedItems = await getInventoryItems()
        addDebugInfo(`Fetched ${fetchedItems.length} items from API`)
      } catch (err) {
        console.error("Error fetching items from API, falling back to localStorage:", err)
        addDebugInfo("Error fetching items from API, falling back to localStorage")
        // Fallback to localStorage
        fetchedItems = loadInventoryItems()
        addDebugInfo(`Loaded ${fetchedItems.length} items from localStorage`)
      }

      setItems(fetchedItems)

      // Calculate statistics
      const total = fetchedItems.reduce((sum, item) => sum + item.quantity, 0)
      const available = fetchedItems.reduce((sum, item) => sum + item.available, 0)
      setTotalItems(total)
      setAvailableItems(available)
      setBorrowedItems(total - available)

      // Fetch borrow records with fallback to localStorage
      let fetchedRecords: BorrowRecord[] = []
      try {
        // Try to get records from API first
        fetchedRecords = await getBorrowRecords()
        addDebugInfo(`Fetched ${fetchedRecords.length} borrow records from API`)
      } catch (err) {
        console.error("Error fetching records from API, falling back to localStorage:", err)
        addDebugInfo("Error fetching records from API, falling back to localStorage")
        // Fallback to localStorage
        fetchedRecords = loadBorrowRecords()
        addDebugInfo(`Loaded ${fetchedRecords.length} borrow records from localStorage`)
      }

      // Ensure we have valid records
      fetchedRecords = fetchedRecords.filter((record) => record && record.itemId && record.userEmail)
      setRecords(fetchedRecords)
      setActiveRecordsCount(fetchedRecords.filter((record) => record.status === "active").length)

      // Fetch users with fallback to localStorage
      let fetchedUsers: UserType[] = []
      try {
        // Try to get users from API first
        fetchedUsers = await getUsers()
        addDebugInfo(`Fetched ${fetchedUsers.length} users from API`)
      } catch (err) {
        console.error("Error fetching users from API, falling back to localStorage:", err)
        addDebugInfo("Error fetching users from API, falling back to localStorage")
        // Fallback to localStorage
        fetchedUsers = loadUsers()
        addDebugInfo(`Loaded ${fetchedUsers.length} users from localStorage`)
      }

      // Ensure we have valid users
      fetchedUsers = fetchedUsers.filter((user) => user && user.email)
      setUsers(fetchedUsers)

      // Calculate counts by type
      const materialItems = fetchedItems.filter((item) => item.type === "material")
      const toolItems = fetchedItems.filter((item) => item.type === "tool")
      const apdItems = fetchedItems.filter((item) => item.type === "apd")

      setMaterialCount(materialItems.reduce((sum, item) => sum + item.quantity, 0))
      setToolCount(toolItems.reduce((sum, item) => sum + item.quantity, 0))
      setApdCount(apdItems.reduce((sum, item) => sum + item.quantity, 0))

      addDebugInfo("fetchData completed successfully")
    } catch (err) {
      console.error("Error fetching data:", err)
      addDebugInfo(`Error in fetchData: ${err}`)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Filter borrowing records based on search term and selected user
  const filteredRecords = records.filter((record) => {
    if (!record || !record.itemId || !record.userEmail) return false

    // Get item and user asynchronously
    const item = items.find((i) => i.id === record.itemId)
    const user = users.find((u) => u.email === record.userEmail)

    const matchesSearch =
      !searchTerm ||
      (item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user && user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.userEmail && record.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user && user.nip && user.nip.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesUser = !selectedUser || record.userEmail === selectedUser

    return matchesSearch && matchesUser
  })

  const handleEditClick = async (email: string) => {
    try {
      // First try to get user from the users array in state
      let user = users.find((u) => u.email === email)

      // If not found in state, try to fetch from API
      if (!user) {
        user = await getUserByEmail(email)
      }

      if (user) {
        setSelectedUserData(user)
        setEditUser({
          email: user.email,
          password: "", // Don't show the password
          role: user.role,
          name: user.name,
          nip: user.nip || "",
          birthDate: user.birthDate ? user.birthDate.toISOString().split("T")[0] : "",
          address: user.address || "",
        })
        setEditUserDialog(true)
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedUserData) return

    try {
      const updatedUser = {
        ...selectedUserData,
        name: editUser.name,
        role: editUser.role,
        nip: editUser.nip,
        birthDate: editUser.birthDate ? new Date(editUser.birthDate) : selectedUserData.birthDate,
        address: editUser.address,
      }

      // Only update password if a new one was provided
      if (editUser.password) {
        updatedUser.password = editUser.password
      }

      await updateUser(selectedUserData.email, updatedUser)

      // Refresh users list
      try {
        const updatedUsers = await getUsers()
        setUsers(updatedUsers)
      } catch (err) {
        console.error("Error fetching updated users from API, updating locally:", err)
        // Update the user in the local state
        setUsers((prevUsers) => prevUsers.map((u) => (u.email === selectedUserData.email ? updatedUser : u)))
      }

      toast({
        title: "Pengguna Diperbarui",
        description: `${updatedUser.name} telah diperbarui.`,
        variant: "success",
      })

      // Close the dialog
      setEditUserDialog(false)

      // Set a short timeout before redirecting to inventory tab
      setTimeout(() => {
        setActiveTab("inventory")
      }, 1500)
    } catch (err) {
      console.error("Error updating user:", err)
      toast({
        title: "Error",
        description: "Gagal memperbarui pengguna. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = async (email: string) => {
    try {
      // First try to get user from the users array in state
      let user = users.find((u) => u.email === email)

      // If not found in state, try to fetch from API
      if (!user) {
        user = await getUserByEmail(email)
      }

      if (user) {
        setSelectedUserData(user)
        setDeleteUserDialog(true)
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedUserData) return

    try {
      await deleteUser(selectedUserData.email)

      // Refresh users list
      try {
        const updatedUsers = await getUsers()
        setUsers(updatedUsers)
      } catch (err) {
        console.error("Error fetching updated users from API, updating locally:", err)
        // Update the user list in the local state
        setUsers((prevUsers) => prevUsers.filter((u) => u.email !== selectedUserData.email))
      }

      toast({
        title: "Pengguna Dihapus",
        description: `${selectedUserData.name} telah dihapus dari sistem.`,
      })

      setDeleteUserDialog(false)
    } catch (err) {
      console.error("Error deleting user:", err)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewProfile = async (email: string) => {
    try {
      // First try to get user from the users array in state
      let user = users.find((u) => u.email === email)

      // If not found in state, try to fetch from API
      if (!user) {
        user = await getUserByEmail(email)
      }

      if (user) {
        setSelectedUserData(user)
        setViewUserDialog(true)
      }
    } catch (err) {
      console.error("Error fetching user:", err)
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const refreshData = async () => {
    await fetchData()
    toast({
      title: "Data Refreshed",
      description: "All data has been refreshed successfully.",
    })
  }

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  }

  const downloadBorrowingsXLS = () => {
    // Show loading toast
    toast({
      title: "Membuat XLS",
      description: "Mohon tunggu sementara kami menyiapkan unduhan Anda...",
    })

    // Use setTimeout to prevent UI freezing
    setTimeout(async () => {
      try {
        // Create header row with additional user details
        const header = [
          "Item",
          "User Name",
          "Email",
          "NIP",
          "Role",
          "Quantity",
          "Est. Duration (days)",
          "Borrow Date",
          "Return Date",
          "Status",
        ]

        // Create data rows with additional user details
        const rows = await Promise.all(
          filteredRecords.map(async (record) => {
            let item
            let user

            try {
              // First try to get item from the items array in state
              item = items.find((i) => i.id === record.itemId)
              if (!item) {
                item = await getInventoryItemById(record.itemId)
              }

              // First try to get user from the users array in state
              user = users.find((u) => u.email === record.userEmail)
              if (!user) {
                user = await getUserByEmail(record.userEmail)
              }
            } catch (err) {
              console.error("Error fetching item or user:", err)
            }

            return [
              item?.name || "Unknown",
              user?.name || "Unknown",
              user?.email || "Unknown",
              user?.nip || "N/A",
              user?.role || "unknown",
              record.quantity.toString(),
              record.estimatedDuration?.toString() || "N/A",
              record.borrowDate.toLocaleDateString(),
              record.returnDate ? record.returnDate.toLocaleDateString() : "Not returned",
              record.status === "active" ? "Aktif" : "Dikembalikan",
            ]
          }),
        )

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
        link.download = `peminjaman-${new Date().toISOString().split("T")[0]}.xls`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Unduhan Siap",
          description: "File XLS Anda telah diunduh.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "Gagal membuat file XLS. Silakan coba lagi.",
          variant: "destructive",
        })
      }
    }, 100) // Small delay to allow UI to update
  }

  const downloadBorrowingsCSV = () => {
    // Show loading toast
    toast({
      title: "Generating CSV",
      description: "Please wait while we prepare your download...",
    })

    // Use setTimeout to prevent UI freezing
    setTimeout(async () => {
      try {
        // Create simplified CSV header with additional user details
        const header = "Item,User Name,Email,NIP,Role,Quantity,Est. Duration (days),Borrow Date,Return Date,Status\n"

        // Create CSV rows more efficiently with additional user details
        const rows = await Promise.all(
          filteredRecords.map(async (record) => {
            let item
            let user

            try {
              // First try to get item from the items array in state
              item = items.find((i) => i.id === record.itemId)
              if (!item) {
                item = await getInventoryItemById(record.itemId)
              }

              // First try to get user from the users array in state
              user = users.find((u) => u.email === record.userEmail)
              if (!user) {
                user = await getUserByEmail(record.userEmail)
              }
            } catch (err) {
              console.error("Error fetching item or user:", err)
            }

            return [
              `"${item?.name || "Unknown"}"`,
              `"${user?.name || "Unknown"}"`,
              `"${user?.email || "Unknown"}"`,
              `"${user?.nip || "N/A"}"`,
              `"${user?.role || "unknown"}"`,
              record.quantity,
              record.estimatedDuration || "N/A",
              `"${record.borrowDate.toLocaleDateString()}"`,
              `"${record.returnDate ? record.returnDate.toLocaleDateString() : "Not returned"}"`,
              `"${record.status}"`,
            ].join(",")
          }),
        )

        // Combine header and rows
        const csv = header + rows.join("\n")

        // Create a blob and download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `borrowings-${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download Ready",
          description: "Your CSV has been downloaded.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "Failed to generate CSV. Please try again.",
          variant: "destructive",
        })
      }
    }, 100) // Small delay to allow UI to update
  }

  const [detailedRecordView, setDetailedRecordView] = useState<BorrowRecord | null>(null)
  const [detailedItem, setDetailedItem] = useState<InventoryItem | null>(null)
  const [detailedUser, setDetailedUser] = useState<UserType | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const viewBorrowingDetails = async (record: BorrowRecord) => {
    setLoadingDetails(true)
    try {
      // Create a new object to avoid reference issues
      setDetailedRecordView({ ...record })

      // Fetch item and user details
      let item, user

      // First try to get item from the items array in state
      item = items.find((i) => i.id === record.itemId)
      if (!item) {
        item = await getInventoryItemById(record.itemId)
      }

      // First try to get user from the users array in state
      user = users.find((u) => u.email === record.userEmail)
      if (!user) {
        user = await getUserByEmail(record.userEmail)
      }

      setDetailedItem(item || null)
      setDetailedUser(user || null)
    } catch (err) {
      console.error("Error fetching details:", err)
      toast({
        title: "Error",
        description: "Failed to load borrowing details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  // Function to print borrowing record details
  const printBorrowingRecord = () => {
    if (!detailedRecordView || !detailedItem || !detailedUser) return

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      })
      return
    }

    // Format date for display
    const formatDate = (date: Date | null) => {
      if (!date) return "N/A"
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date)
    }

    // Calculate days borrowed
    const calculateDaysBorrowed = () => {
      if (!detailedRecordView) return 0
      const endDate = detailedRecordView.returnDate || new Date()
      const diffTime = Math.abs(endDate.getTime() - detailedRecordView.borrowDate.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Generate HTML content for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Borrowing Record - ${detailedItem?.name || "Unknown Item"}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            font-size: 20px;
            margin: 10px 0;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .item-details, .user-details, .borrow-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .detail-row {
            margin-bottom: 8px;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            min-width: 150px;
          }
          .value {
            display: inline-block;
          }
          .status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 14px;
            font-weight: bold;
          }
          .status-active {
            background-color: #e6f7ff;
            color: #0070f3;
          }
          .status-returned {
            background-color: #e6f9e6;
            color: #00a651;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .signature {
            margin-top: 70px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          .sign-section {
            text-align: center;
          }
          .sign-line {
            border-top: 1px solid #333;
            width: 80%;
            margin: 50px auto 10px;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">PLN Inventory System</div>
          <div class="title">Borrowing Record Details</div>
          <div class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Item Details</div>
          <div class="item-details">
            <div class="detail-row">
              <span class="label">Item Name:</span>
              <span class="value">${detailedItem?.name || "Unknown Item"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Item Type:</span>
              <span class="value">${detailedItem?.type.toUpperCase() || "Unknown"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Brand:</span>
              <span class="value">${detailedItem?.brand || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">${detailedItem?.location || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Quantity Borrowed:</span>
              <span class="value">${detailedRecordView.quantity}</span>
            </div>
            <div class="detail-row">
              <span class="label">Item Description:</span>
              <span class="value">${detailedItem?.description || "No description available"}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">User Details</div>
          <div class="user-details">
            <div class="detail-row">
              <span class="label">Full Name:</span>
              <span class="value">${detailedUser?.name || "Unknown"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email Address:</span>
              <span class="value">${detailedUser?.email || "Unknown"}</span>
            </div>
            <div class="detail-row">
              <span class="label">NIP (Employee ID):</span>
              <span class="value">${detailedUser?.nip || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Role:</span>
              <span class="value">${detailedUser?.role || "Unknown"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date of Birth:</span>
              <span class="value">${detailedUser?.birthDate ? formatDate(detailedUser.birthDate) : "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Address:</span>
              <span class="value">${detailedUser?.address || "N/A"}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Borrowing Details</div>
          <div class="borrow-details">
            <div class="detail-row">
              <span class="label">Borrow Date:</span>
              <span class="value">${formatDate(detailedRecordView.borrowDate)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Return Date:</span>
              <span class="value">${detailedRecordView.returnDate ? formatDate(detailedRecordView.returnDate) : "Not returned yet"}</span>
            </div>
            <div class="detail-row">
              <span class="label">Estimated Duration:</span>
              <span class="value">${detailedRecordView.estimatedDuration || "N/A"} days</span>
            </div>
            <div class="detail-row">
              <span class="label">Actual Duration:</span>
              <span class="value">${calculateDaysBorrowed()} days</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="status ${detailedRecordView.status === "active" ? "status-active" : "status-returned"}">
                ${detailedRecordView.status === "active" ? "Active" : "Returned"}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Record ID:</span>
              <span class="value">${detailedRecordView.id}</span>
            </div>
          </div>
        </div>

        <div class="signature">
          <div class="sign-section">
            <div class="sign-line"></div>
            <div>Borrower's Signature</div>
            <div>${detailedUser?.name || "Unknown"}</div>
          </div>
          <div class="sign-section">
            <div class="sign-line"></div>
            <div>Authorized by</div>
            <div>Inventory Manager</div>
          </div>
        </div>

        <div class="footer">
          <p>This is an official document from the PLN Inventory Management System.</p>
          <p>For any inquiries, please contact the inventory management department.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Document
          </button>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()

    // Focus on the new window
    printWindow.focus()
  }

  const handleAddUser = async () => {
    // Reset error state
    setFormError(null)

    // Validate form
    if (!newUser.email || !newUser.password || !newUser.name) {
      setFormError("Email, kata sandi, dan nama lengkap wajib diisi")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setFormError("Format email tidak valid")
      return
    }

    // Password validation
    if (newUser.password.length < 6) {
      setFormError("Kata sandi harus minimal 6 karakter")
      return
    }

    setIsSubmitting(true)

    try {
      const user = await addUser({
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        name: newUser.name,
        nip: newUser.nip,
        birthDate: newUser.birthDate ? new Date(newUser.birthDate) : null,
        address: newUser.address,
      })

      // Refresh users list
      try {
        const updatedUsers = await getUsers()
        setUsers(updatedUsers)
      } catch (err) {
        console.error("Error fetching updated users from API, updating locally:", err)
        // Update the users list in the local state
        setUsers((prevUsers) => [...prevUsers, user])
      }

      toast({
        title: "Pengguna Ditambahkan",
        description: `${user.name} telah ditambahkan sebagai ${user.role}`,
      })

      // Reset form
      setNewUser({
        email: "",
        password: "",
        role: "user",
        name: "",
        nip: "",
        birthDate: "",
        address: "",
      })

      setNewUserDialog(false)
    } catch (error) {
      console.error("Error adding user:", error)
      setFormError("Gagal menambahkan pengguna. Email mungkin sudah digunakan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-destructive mb-4 text-center">
          <p className="text-lg font-semibold">Error Loading Data</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // Function to handle tab change
  const handleTabChange = (tab: string) => {
    addDebugInfo(`Tab changed to: ${tab}`)
    setActiveTab(tab)

    // Force data refresh when changing tabs
    if (tab === "borrowings" || tab === "users") {
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
        Panel Admin
      </motion.h2>

      <div className="flex justify-between items-center mb-4">
        <div>
          <Button onClick={refreshData} variant="default" size="sm" className="transition-all">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Data
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {records.length} borrowings, {users.length} users, {items.length} items
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={statsVariants} whileHover={{ scale: 1.03 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{totalItems}</div>
              <p className="text-xs text-muted-foreground truncate">
                <span className="inline-flex items-center gap-1">
                  <span>{availableItems} available</span>
                  <span className="whitespace-nowrap">
                    ({totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0}%)
                  </span>
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={statsVariants} whileHover={{ scale: 1.03 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Borrowed Items</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{borrowedItems}</div>
              <p className="text-xs text-muted-foreground truncate">{activeRecordsCount} active borrowings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={statsVariants} whileHover={{ scale: 1.03 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{users.length}</div>
              <p className="text-xs text-muted-foreground truncate">
                <span className="inline-flex items-center gap-1">
                  <span>{users.filter((u) => u.role === "admin").length} admin,</span>
                  <span>{users.filter((u) => u.role === "user").length} regular</span>
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={statsVariants} whileHover={{ scale: 1.03 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Inventory Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{materialCount + toolCount + apdCount}</div>
              <div className="text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                  <span className="whitespace-nowrap">{materialCount} materials,</span>
                  <span className="whitespace-nowrap">{toolCount} tools,</span>
                  <span className="whitespace-nowrap">{apdCount} APD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Simple Tab Navigation - No shadcn Tabs component */}
      <div className="border-b border-gray-200">
        <div className="flex -mb-px">
          <button
            ref={inventoryTabRef}
            onClick={() => handleTabChange("inventory")}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm flex-1 ${
              activeTab === "inventory"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Inventory Management
          </button>
          <button
            ref={borrowingsTabRef}
            onClick={() => handleTabChange("borrowings")}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm flex-1 ${
              activeTab === "borrowings"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Borrowings
          </button>
          <button
            ref={usersTabRef}
            onClick={() => handleTabChange("users")}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm flex-1 ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manajemen Pengguna
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {/* Inventory Management Tab */}
        {activeTab === "inventory" && <InventoryManagement />}

        {/* All Borrowings Tab */}
        {activeTab === "borrowings" && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>All Borrowings</CardTitle>
                <CardDescription>View and manage all borrowing records in the system.</CardDescription>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBorrowingsCSV}
                  className="transition-all hover:bg-muted"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBorrowingsXLS}
                  className="transition-all hover:bg-muted"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">XLS</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Borrowing Records</h3>
                  <p className="text-muted-foreground">There are no borrowing records in the system yet.</p>
                  <Button onClick={refreshData} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                    <div className="relative sm:col-span-3">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                      </div>
                      <Input
                        placeholder="Search by item, user, or NIP..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-full">
                      <Select
                        value={selectedUser || "all"}
                        onValueChange={(value) => setSelectedUser(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Filter by user" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="w-full min-w-[8rem]">
                          <SelectItem value="all">All Users</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.email} value={user.email}>
                              <span className="truncate block">
                                {user.name} ({user.role})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              NIP
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Est. Days
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Borrowed
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Returned
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-background divide-y divide-border">
                          {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => {
                              const item = items.find((i) => i.id === record.itemId)
                              const user = users.find((u) => u.email === record.userEmail)
                              return (
                                <motion.tr
                                  key={record.id}
                                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      {item && (
                                        <img
                                          src={item.image || "/placeholder.svg"}
                                          alt={item.name}
                                          className="h-5 w-5 rounded-md object-cover flex-shrink-0"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = "/placeholder.svg?height=24&width=24&text=Error"
                                          }}
                                        />
                                      )}
                                      <span className="truncate max-w-[100px] sm:max-w-[150px]">
                                        {item?.name || "Unknown"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="truncate block max-w-[100px]">
                                      {user?.name || record.userEmail}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="truncate block max-w-[100px]">{user?.nip || "N/A"}</span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap capitalize">{user?.role || "unknown"}</td>

                                  <td className="px-3 py-2 whitespace-nowrap">{record.quantity}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{record.estimatedDuration || "N/A"}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {record.borrowDate.toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {record.returnDate ? record.returnDate.toLocaleDateString() : "Not returned"}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span
                                      className={`inline-block rounded-full px-1.5 py-0.5 text-xs ${
                                        record.status === "active"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {record.status === "active" ? "Active" : "Returned"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-blue-500"
                                      onClick={() => viewBorrowingDetails(record)}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </motion.tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={10} className="px-3 py-4 text-center text-muted-foreground">
                                No borrowing records found matching your criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Lihat dan kelola pengguna sistem.</CardDescription>
              </div>
              <Button onClick={() => setNewUserDialog(true)} className="transition-all hover:scale-105 shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengguna Baru
              </Button>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Users Found</h3>
                  <p className="text-muted-foreground">There are no users in the system yet.</p>
                  <Button onClick={refreshData} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto -mx-4 sm:-mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="rounded-md border">
                        <div className="grid grid-cols-5 border-b bg-muted p-2 text-xs md:text-sm font-medium">
                          <div>Name</div>
                          <div>Email</div>
                          <div>Role</div>
                          <div>Created Date</div>
                          <div className="text-center">Actions</div>
                        </div>

                        {users.map((user) => (
                          <motion.div
                            key={user.email}
                            className="grid grid-cols-5 items-center border-b p-2 text-xs md:text-sm last:border-0"
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <div className="truncate pr-2">{user.name}</div>
                            <div className="truncate pr-2">{user.email}</div>
                            <div className="capitalize">{user.role}</div>
                            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="flex justify-center gap-1 md:gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-8 md:w-8 text-blue-500"
                                onClick={() => handleViewProfile(user.email)}
                              >
                                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-8 md:w-8 text-amber-500"
                                onClick={() => handleEditClick(user.email)}
                              >
                                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 md:h-8 md:w-8 text-red-500"
                                onClick={() => handleDeleteClick(user.email)}
                              >
                                <Trash className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Debug Information (only visible in development) */}
      {/* {process.env.NODE_ENV === "development" && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Debug Information</AlertTitle>
          <AlertDescription>
            <div className="text-xs mt-2 max-h-[200px] overflow-y-auto">
              <p>Active Tab: {activeTab}</p>
              <p>Records: {records.length}</p>
              <p>Users: {users.length}</p>
              <p>Items: {items.length}</p>
              <div className="mt-2 border-t pt-2">
                <p className="font-semibold">Log:</p>
                {debugInfo.map((info, i) => (
                  <p key={i} className="whitespace-nowrap">
                    {info}
                  </p>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )} */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedUserData?.name}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteUserDialog(false)}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Tutup
            </Button>
          </div>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Semua data terkait pengguna ini akan dihapus secara permanen dari sistem.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Hapus Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Profile Dialog */}
      {selectedUserData && (
        <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
              <DialogTitle>Profil Pengguna</DialogTitle>
              <DialogDescription>Informasi detail tentang {selectedUserData.name}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end px-4 sm:px-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewUserDialog(false)}
                className="flex items-center gap-1 text-muted-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Tutup
              </Button>
            </div>
            <UserProfileView user={selectedUserData} />
            <DialogFooter className="p-4 sm:p-6 border-t">
              <Button onClick={() => setViewUserDialog(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detailed Borrowing Record View - Enhanced with User Details */}
      <Dialog
        open={!!detailedRecordView}
        onOpenChange={(open) => {
          if (!open) {
            setDetailedRecordView(null)
            setDetailedItem(null)
            setDetailedUser(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-0 overflow-hidden max-h-[85vh]">
          <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
            <DialogTitle className="text-xl">Detail Peminjaman</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDetailedRecordView(null)
                setDetailedItem(null)
                setDetailedUser(null)
              }}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Tutup
            </Button>
          </div>

          {loadingDetails ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading details...</span>
            </div>
          ) : (
            detailedRecordView && (
              <div className="overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 max-h-[60vh] custom-scrollbar">
                <div className="space-y-6">
                  {/* Item and image section */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b pb-3">
                    <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                      <img
                        src={detailedItem?.image || "/placeholder.svg"}
                        alt={detailedItem?.name || "Unknown Item"}
                        className="h-16 w-16 rounded-md object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=64&width=64&text=Item"
                        }}
                      />
                    </div>
                    <div className="text-center sm:text-left mt-2 sm:mt-0">
                      <h3 className="font-medium text-lg">{detailedItem?.name || "Unknown Item"}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{detailedItem?.type || "unknown"} item</p>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            detailedRecordView.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {detailedRecordView.status === "active" ? "Active" : "Returned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Borrowing details */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase">Borrowing Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm bg-muted/30 rounded-lg p-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <div className="font-medium">{detailedRecordView.quantity}</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Estimated Duration</p>
                        <div className="font-medium">{detailedRecordView.estimatedDuration || "N/A"} days</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Actual Duration</p>
                        <div className="font-medium">
                          {(() => {
                            const endDate = detailedRecordView.returnDate || new Date()
                            const diffTime = Math.abs(endDate.getTime() - detailedRecordView.borrowDate.getTime())
                            return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                          })()} days
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Borrow Date</p>
                        <div className="font-medium">
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(detailedRecordView.borrowDate)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Return Date</p>
                        <div className="font-medium">
                          {detailedRecordView.returnDate
                            ? new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }).format(detailedRecordView.returnDate)
                            : "Not yet returned"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User details section */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase">User Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm bg-muted/30 rounded-lg p-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <div className="font-medium">{detailedUser?.name || "Unknown"}</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Email Address</p>
                        <div className="font-medium break-words">{detailedUser?.email || "Unknown"}</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">NIP (Employee ID)</p>
                        <div className="font-medium">{detailedUser?.nip || "N/A"}</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Role</p>
                        <div className="font-medium capitalize">{detailedUser?.role || "Unknown"}</div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <div className="font-medium">
                          {detailedUser?.birthDate
                            ? new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }).format(detailedUser.birthDate)
                            : "N/A"}
                        </div>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <div className="font-medium break-words">{detailedUser?.address || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          <DialogFooter className="p-4 sm:p-6 border-t mt-0">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={printBorrowingRecord}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={!detailedRecordView || !detailedItem || !detailedUser}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Record
              </Button>
              <Button
                onClick={() => {
                  setDetailedRecordView(null)
                  setDetailedItem(null)
                  setDetailedUser(null)
                }}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog
        open={newUserDialog}
        onOpenChange={(open) => {
          setNewUserDialog(open)
          if (!open) {
            setFormError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Isi detail untuk menambahkan pengguna baru ke sistem.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-2">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Nama Lengkap <span className="text-red-500 ml-1">*</span>
                  <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Peran Pengguna</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "admin" | "user") => setNewUser({ ...newUser, role: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="role"
                    className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  >
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-full min-w-[8rem]">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Pengguna Biasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                Email <span className="text-red-500 ml-1">*</span>
                <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="nama@contoh.com"
                className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center">
                  Kata Sandi <span className="text-red-500 ml-1">*</span>
                  <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (ID Karyawan)</Label>
                <Input
                  id="nip"
                  value={newUser.nip}
                  onChange={(e) => setNewUser({ ...newUser, nip: e.target.value })}
                  placeholder="Masukkan ID karyawan (opsional)"
                  className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={newUser.birthDate}
                  onChange={(e) => setNewUser({ ...newUser, birthDate: e.target.value })}
                  className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="Masukkan alamat (opsional)"
                  className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              <p>
                Kolom dengan tanda <span className="text-destructive">*</span> wajib diisi
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setNewUserDialog(false)}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddUser}
              className="transition-all hover:scale-105 w-full sm:w-auto relative"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menambahkan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pengguna
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Perbarui informasi pengguna.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditUserDialog(false)}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Tutup
            </Button>
          </div>
          <div className="overflow-y-auto px-4 sm:px-6 py-4 max-h-[60vh] custom-scrollbar">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Peran Pengguna</Label>
                  <Select
                    value={editUser.role}
                    onValueChange={(value: "admin" | "user") => setEditUser({ ...editUser, role: value })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-full min-w-[8rem]">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Pengguna Biasa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <div className="relative">
                  <Input
                    id="edit-email"
                    type="email"
                    value={editUser.email}
                    disabled
                    className="bg-muted pr-2 truncate"
                  />
                  <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Kata Sandi (kosongkan untuk mempertahankan yang sekarang)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                    placeholder="Masukkan kata sandi baru"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nip">NIP (ID Karyawan)</Label>
                  <Input
                    id="edit-nip"
                    value={editUser.nip}
                    onChange={(e) => setEditUser({ ...editUser, nip: e.target.value })}
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-birthDate">Tanggal Lahir</Label>
                  <Input
                    id="edit-birthDate"
                    type="date"
                    value={editUser.birthDate}
                    onChange={(e) => setEditUser({ ...editUser, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Alamat</Label>
                  <Input
                    id="edit-address"
                    value={editUser.address}
                    onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 sm:p-6 border-t">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button variant="outline" onClick={() => setEditUserDialog(false)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button onClick={handleSaveEdit} className="transition-all hover:scale-105 w-full sm:w-auto">
                Simpan Perubahan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
