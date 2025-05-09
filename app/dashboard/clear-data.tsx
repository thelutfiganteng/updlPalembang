"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function ClearDataUtility() {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isCleared, setIsCleared] = useState(false)

  // Modify the clearAllData function to not add any sample users
  const clearAllData = () => {
    setIsClearing(true)

    // Simulate a small delay to show the loading state
    setTimeout(() => {
      try {
        // Clear inventory items
        localStorage.removeItem("inventoryItems")

        // Clear borrow records
        localStorage.removeItem("borrowRecords")

        // Clear all user data
        localStorage.removeItem("users")

        setIsCleared(true)
        toast({
          title: "Data Berhasil Dihapus",
          description: "Semua data inventaris telah direset. Anda sekarang dapat memulai dari awal dengan sistem.",
          variant: "default",
        })
      } catch (error) {
        console.error("Error clearing data:", error)
        toast({
          title: "Error Clearing Data",
          description: "There was a problem clearing the data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsClearing(false)
        setConfirmDialogOpen(false)
      }
    }, 1000)
  }

  const handleReset = () => {
    // Reset the cleared state if they want to clear again
    setIsCleared(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <span>Hapus Data Inventaris</span>
        </CardTitle>
        <CardDescription className="text-base">
          Reset semua data inventaris untuk memulai dari awal dengan sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCleared ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Data Berhasil Dihapus</AlertTitle>
              <AlertDescription>
                Semua data inventaris telah direset. Anda sekarang dapat memulai dari awal dengan sistem.
                <div className="mt-2 text-sm">
                  <strong>Langkah selanjutnya:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Segarkan halaman untuk melihat perubahan</li>
                    <li>Mulai menambahkan item inventaris baru</li>
                    <li>Buat catatan peminjaman baru</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle>Peringatan: Tindakan ini tidak dapat dibatalkan</AlertTitle>
              <AlertDescription>
                <p>
                  Ini akan menghapus semua item inventaris, catatan peminjaman, dan data pengguna kecuali untuk akun
                  admin dan pengguna biasa.
                </p>

                <div className="mt-3 p-3 bg-white/50 rounded-md border border-red-100">
                  <p className="font-medium text-sm mb-2">Data berikut akan dihapus:</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Semua item inventaris (alat, material, APD)</li>
                    <li>Semua catatan peminjaman</li>
                    <li>Semua data pengguna (kecuali akun admin dan pengguna biasa)</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 flex-wrap">
        {isCleared ? (
          <div className="w-full flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => window.location.reload()} className="sm:order-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Segarkan Halaman
            </Button>
            <Button onClick={handleReset} variant="ghost" className="sm:order-1">
              Hapus Lagi
            </Button>
          </div>
        ) : (
          <Button
            variant="destructive"
            onClick={() => setConfirmDialogOpen(true)}
            className="transition-all hover:bg-red-700 w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Semua Data
          </Button>
        )}
      </CardFooter>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <div className="p-1">
            <div className="bg-red-50 p-4 rounded-t-lg">
              <DialogHeader>
                <DialogTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Konfirmasi Penghapusan Data
                </DialogTitle>
                <DialogDescription className="text-red-600">
                  Apakah Anda benar-benar yakin ingin menghapus semua data inventaris? Tindakan ini tidak dapat
                  dibatalkan.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Ini akan menghapus secara permanen:</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Semua item inventaris (alat, material, APD)</li>
                <li>Semua catatan peminjaman</li>
                <li>Semua data pengguna (kecuali akun admin dan pengguna biasa)</li>
              </ul>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                <p className="text-sm text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Tindakan ini tidak dapat dibalik dan akan menghapus semua data Anda.
                </p>
              </div>
            </div>

            <DialogFooter className="p-4 pt-2 flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={isClearing}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={clearAllData}
                disabled={isClearing}
                className="relative w-full sm:w-auto"
              >
                {isClearing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                      className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Ya, Hapus Semuanya
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
