"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addUser } from "@/lib/data"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nip: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Silakan isi semua kolom yang diperlukan")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok")
      return
    }

    if (!formData.email.includes("@")) {
      setError("Masukkan alamat email yang valid")
      return
    }

    if (formData.password.length < 6) {
      setError("Kata sandi harus minimal 6 karakter")
      return
    }

    setIsSubmitting(true)

    try {
      // Add the new user
      const newUser = await addUser({
        email: formData.email,
        password: formData.password,
        role: "user", // Default role is user
        name: formData.name,
        nip: formData.nip,
        birthDate: null,
        address: "",
      })

      // Auto login the user
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        }),
      )

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Pendaftaran gagal. Email mungkin sudah digunakan.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Link href="/">
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
                <span>PLN</span>
              </div>
            </Link>
          </div>

          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="container flex-1 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-md"
        >
          <Card className="border-border/40 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Buat Akun</CardTitle>
              <CardDescription className="text-center">
                Daftar untuk mulai mengelola inventaris PLN dengan mudah
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">{error}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="nama@contoh.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nip">NIP (ID Karyawan)</Label>
                  <Input
                    id="nip"
                    name="nip"
                    value={formData.nip}
                    onChange={handleInputChange}
                    placeholder="Masukkan ID karyawan Anda (opsional)"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Kata Sandi</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Buat kata sandi"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Konfirmasi kata sandi Anda"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Akun...
                    </>
                  ) : (
                    "Buat Akun"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Masuk
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 font-bold">
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
            <span>PLN</span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © 2025 PLN Indonesia. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
