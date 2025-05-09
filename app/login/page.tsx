"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticateUser } from "@/lib/data"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if there's a message in sessionStorage (e.g., from profile page redirect)
    const loginMessage = sessionStorage.getItem("loginMessage")
    if (loginMessage) {
      setMessage(loginMessage)
      sessionStorage.removeItem("loginMessage") // Clear the message after displaying it
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = await authenticateUser(email, password)

      if (user) {
        // Store user info in localStorage
        localStorage.setItem("currentUser", JSON.stringify(user))

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setError("Email atau kata sandi tidak valid")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 font-bold">
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

          <Link href="/">
            <Button variant="ghost" size="sm">
              Kembali Ke Beranda
            </Button>
          </Link>
        </div>
      </header>

      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-md">
          <Card className="border-border/40 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Masuk</CardTitle>
              <CardDescription className="text-center">
                Masukkan email dan kata sandi Anda untuk mengakses sistem
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">{error}</div>
                )}

                {message && (
                  <div className="rounded-md bg-blue-500/15 p-3 text-center text-sm text-blue-500">{message}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Kata Sandi</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Masuk...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    Daftar
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
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
