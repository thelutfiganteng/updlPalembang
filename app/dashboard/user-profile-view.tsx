"use client"

import { Calendar, Mail, MapPin, User, CircleUser, Printer } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User as UserType } from "@/lib/data"
import { Barcode } from "@/components/ui/barcode"
import { BarcodePrintModal } from "@/components/barcode-print-modal"
import { Button } from "@/components/ui/button"
import UserBorrowingReport from "./user-borrowing-report"

interface UserProfileViewProps {
  user: UserType
}

// Update the component to include tabs for profile and borrowing report
export default function UserProfileView({ user }: UserProfileViewProps) {
  const [printBarcodeModalOpen, setPrintBarcodeModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "borrowing-report">("profile")

  const formatDate = (date: Date | null) => {
    if (!date) return "Tidak disediakan"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6 py-4 overflow-y-auto max-h-[65vh] custom-scrollbar px-1">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "profile" | "borrowing-report")}>
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="borrowing-report" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Laporan Peminjaman</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-primary/10 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border">
                  <CircleUser className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </motion.div>
              <div className="mt-4 text-center">
                <h3 className="font-bold text-base sm:text-lg break-words max-w-full">{user.name}</h3>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1 capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="md:w-2/3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                    </div>
                    <span className="text-sm font-medium break-words">{user.email}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">NIP:</span>
                    </div>
                    <span className="text-sm font-medium">{user.nip || "Tidak disediakan"}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Tanggal Lahir:</span>
                    </div>
                    <span className="text-sm font-medium">{formatDate(user.birthDate)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Alamat:</span>
                    </div>
                    <span className="text-sm font-medium break-words">{user.address || "Tidak disediakan"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Informasi Akun</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[120px]">Akun Dibuat:</span>
                    <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[120px]">Login Terakhir:</span>
                    <span className="text-sm font-medium">Hari ini</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">User Barcode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Barcode value={user.barcode} height={60} />
              <p className="mt-1 text-xs font-mono">{user.barcode}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setPrintBarcodeModalOpen(true)}>
                <Printer className="mr-2 h-3 w-3" />
                Print Barcode
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="borrowing-report">
          <UserBorrowingReport userEmail={user.email} />
        </TabsContent>
      </Tabs>

      <BarcodePrintModal
        open={printBarcodeModalOpen}
        onClose={() => setPrintBarcodeModalOpen(false)}
        barcode={user.barcode}
        title={`User: ${user.name}`}
        subtitle={`Role: ${user.role.toUpperCase()}`}
      />
    </div>
  )
}
