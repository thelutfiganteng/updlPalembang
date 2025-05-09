"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Menu, CircleUser, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import InventoryList from "./inventory-list"
import BorrowingHistory from "./borrowing-history"
import AdminPanel from "./admin-panel"
import Reports from "./reports"
import ActiveBorrowingsModal from "./active-borrowings-modal"
import ClearDataUtility from "./clear-data"
import UserBorrowingReport from "./user-borrowing-report"
import { SupabaseConnectionTest } from "@/components/supabase-connection-test"
import { toast } from "@/components/ui/use-toast"
import { debugDataAvailability } from "@/lib/data"

interface User {
  email: string
  role: string
  name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("inventory")
  const [activeBorrowingsModalOpen, setActiveBorrowingsModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showClearData, setShowClearData] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

  const handleProfileClick = () => {
    router.push("/profile")
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          Loading...
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null // Router will redirect to login
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 font-bold"
          >
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
            <span>PLN</span>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-4"
          >
            <div className="text-sm">
              Masuk sebagai <span className="font-medium">{user.name}</span> ({user.role})
            </div>
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveBorrowingsModalOpen(true)}
                    className="transition-all hover:bg-blue-50"
                  >
                    Peminjaman Aktif
                  </Button>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearData(!showClearData)}
                    className="transition-all hover:bg-red-50 text-red-600 border-red-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Data
                  </Button> */}
                </>
              )}
              {/* Debug button - only visible in development */}
              {/* {process.env.NODE_ENV !== "production" && user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const stats = debugDataAvailability()
                    toast({
                      title: "Data Availability Check",
                      description: `Inventory: ${stats.inventoryItems} items | Borrowings: ${stats.borrowRecords} records | Users: ${stats.users} users`,
                    })
                  }}
                  className="ml-2"
                >
                  Debug Data
                </Button>
              )} */}
              <Button variant="ghost" size="sm" onClick={handleProfileClick} className="transition-all hover:bg-muted">
                <CircleUser className="mr-2 h-4 w-4" />
                Profil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="transition-all hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Masuk sebagai</p>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">({user.role})</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    {user.role === "admin" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveBorrowingsModalOpen(true)
                            setMobileMenuOpen(false)
                          }}
                          className="w-full justify-start"
                        >
                          Peminjaman Aktif
                        </Button>
                        {/* <Button
                          variant="outline"
                          onClick={() => {
                            setShowClearData(!showClearData)
                            setMobileMenuOpen(false)
                          }}
                          className="w-full justify-start text-red-600 border-red-200"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Data
                        </Button> */}
                      </>
                    )}
                    <Button variant="ghost" onClick={handleProfileClick} className="w-full justify-start">
                      <CircleUser className="mr-2 h-4 w-4" />
                      Profil
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full justify-start text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Keluar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 text-2xl md:text-3xl font-bold"
        >
          Dasbor
        </motion.h1>

        {showClearData && user.role === "admin" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-6">
              <Button variant="outline" onClick={() => setShowClearData(false)} className="mb-4">
                ← Back to Dashboard
              </Button>
              <ClearDataUtility />
            </div>
          </motion.div>
        ) : (
          <Tabs defaultValue="inventory" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <TabsList className="mb-6 w-full overflow-x-auto flex whitespace-nowrap pb-px">
                <TabsTrigger value="inventory" className="transition-all flex-1">
                  Inventaris
                </TabsTrigger>
                <TabsTrigger value="borrowing" className="transition-all flex-1">
                  Peminjaman Saya
                </TabsTrigger>
                <TabsTrigger value="report" className="transition-all flex-1">
                  Laporan Peminjaman
                </TabsTrigger>
                {user.role === "admin" && (
                  <>
                    <TabsTrigger value="admin" className="transition-all flex-1">
                      Panel Admin
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="transition-all flex-1">
                      Laporan
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="inventory">
                  <InventoryList userEmail={user.email} />
                </TabsContent>

                <TabsContent value="borrowing">
                  <BorrowingHistory userEmail={user.email} />
                </TabsContent>

                <TabsContent value="report">
                  <UserBorrowingReport userEmail={user.email} />
                </TabsContent>

                {user.role === "admin" && (
                  <>
                    <TabsContent value="admin">
                      <AdminPanel />
                      <div className="mt-4">
                        <SupabaseConnectionTest />
                      </div>
                    </TabsContent>

                    <TabsContent value="reports">
                      <Reports />
                    </TabsContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        )}
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 PLN Indonesia. Hak Cipta Dilindungi.
        </div>
      </footer>

      {/* Active Borrowings Modal */}
      <ActiveBorrowingsModal open={activeBorrowingsModalOpen} onClose={() => setActiveBorrowingsModalOpen(false)} />
    </motion.div>
  )
}
