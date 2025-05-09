"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { authenticateUser } from "@/lib/data"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)

  useEffect(() => {
    // Check if there's a message from another page (like profile)
    const message = sessionStorage.getItem("loginMessage")
    if (message) {
      setLoginMessage(message)
      // Clear the message so it doesn't show again on refresh
      sessionStorage.removeItem("loginMessage")
    }

    // Check if user is already logged in
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user && user.email) {
          router.push("/dashboard")
        } else {
          // Invalid user data, clear it
          localStorage.removeItem("currentUser")
        }
      } catch (err) {
        // Invalid JSON, clear it
        localStorage.removeItem("currentUser")
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate input
      if (!email || !password) {
        toast({
          title: "Error",
          description: "Email dan password harus diisi",
          variant: "destructive",
        })
        return
      }

      // Authenticate user
      const user = await authenticateUser(email, password)

      if (user) {
        // Ensure user has email before storing
        if (!user.email) {
          throw new Error("Invalid user data: missing email")
        }

        // Store user in localStorage
        localStorage.setItem("currentUser", JSON.stringify(user))

        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${user.name || email}!`,
        })

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        toast({
          title: "Login Gagal",
          description: "Email atau password salah",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Inventory Management System</h1>
          <p className="mt-2 text-gray-600">PT PLN (Persero)</p>
        </div>

        {loginMessage && (
          <div className="mb-4 rounded-md bg-amber-50 p-4 text-amber-800 border border-amber-200">
            <p>{loginMessage}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Masuk ke akun Anda untuk mengakses sistem</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pln.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full transition-all hover:scale-105" disabled={loading}>
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                      className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
              <div className="flex flex-col space-y-2 text-center text-sm">
                <div>
                  Belum punya akun?{" "}
                  <Link href="/register">
                    <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                      Daftar sekarang
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link href="/login-options">
                    <Button variant="link" className="p-0 h-auto font-semibold text-primary">
                      Kembali Ke Beranda
                    </Button>
                  </Link>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}