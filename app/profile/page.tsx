"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Mail, MapPin, Save, UserIcon } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { type User, getUserByEmail, updateUserProfile } from "@/lib/data"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    birthDate: "",
    address: "",
  })

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        setError(null)

        // Check if user is logged in
        const userData = localStorage.getItem("currentUser")
        if (!userData) {
          console.log("No user data found in localStorage, redirecting to login")
          redirectToLogin("Please log in to view your profile.")
          return
        }

        // Parse user data from localStorage
        let parsedUser
        try {
          parsedUser = JSON.parse(userData)

          // Check if parsedUser is an empty object
          if (parsedUser && Object.keys(parsedUser).length === 0) {
            console.error("Empty user object in localStorage")
            localStorage.removeItem("currentUser") // Clear invalid data
            redirectToLogin("Your session has expired. Please log in again.")
            return
          }
        } catch (err) {
          console.error("Error parsing user data from localStorage:", err)
          localStorage.removeItem("currentUser") // Clear invalid data
          redirectToLogin("Invalid session data. Please log in again.")
          return
        }

        // Check if parsed user has email
        if (!parsedUser || !parsedUser.email) {
          console.error("Invalid user data in localStorage (no email):", parsedUser)
          localStorage.removeItem("currentUser") // Clear invalid data
          redirectToLogin("Invalid user data. Please log in again.")
          return
        }

        console.log("Found user in localStorage:", parsedUser.email)

        // Set initial user state from localStorage
        setUser({
          email: parsedUser.email,
          name: parsedUser.name || "",
          role: parsedUser.role || "user",
          password: "", // We don't store password in state
          nip: "",
          birthDate: null,
          address: "",
          createdAt: new Date(),
          barcode: parsedUser.barcode || "",
        })

        // Try to get full user data from Supabase
        let fullUserData = null
        try {
          console.log("Fetching user data from Supabase for email:", parsedUser.email)
          const supabaseUser = await getUserByEmail(parsedUser.email)

          if (supabaseUser) {
            console.log("User found in Supabase:", supabaseUser.email)
            fullUserData = supabaseUser

            // Update user state with Supabase data
            setUser(supabaseUser)

            // Set form data from Supabase user
            setFormData({
              name: supabaseUser.name || "",
              nip: supabaseUser.nip || "",
              birthDate: supabaseUser.birthDate ? new Date(supabaseUser.birthDate).toISOString().split("T")[0] : "",
              address: supabaseUser.address || "",
            })

            console.log("Form data set from Supabase user")
          } else {
            console.log("User not found in Supabase, falling back to localStorage")
            // Fallback to localStorage for full user data
            fallbackToLocalStorage(parsedUser)
          }
        } catch (err) {
          console.error("Error fetching user from Supabase:", err)
          // Fallback to localStorage
          fallbackToLocalStorage(parsedUser)
        }
      } catch (err) {
        console.error("Error in fetchUserData:", err)
        setError("Failed to load user profile. Please try again.")
        // If there's a critical error, redirect to login after a short delay
        setTimeout(() => {
          redirectToLogin("An error occurred. Please log in again.")
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    // Helper function to redirect to login with a message
    function redirectToLogin(message: string) {
      // Store the message in sessionStorage to display it on the login page
      sessionStorage.setItem("loginMessage", message)
      router.push("/login")
    }

    // Helper function to fallback to localStorage
    function fallbackToLocalStorage(parsedUser: any) {
      const storedUserData = localStorage.getItem(`userData_${parsedUser.email}`)
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData)
          console.log("Found user data in localStorage:", userData)

          // Set form data from localStorage
          setFormData({
            name: userData.name || parsedUser.name || "",
            nip: userData.nip || "",
            birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split("T")[0] : "",
            address: userData.address || "",
          })

          console.log("Form data set from localStorage")
        } catch (err) {
          console.error("Error parsing user data from localStorage:", err)

          // Set form data from current user as fallback
          setFormData({
            name: parsedUser.name || "",
            nip: "",
            birthDate: "",
            address: "",
          })
        }
      } else {
        console.log("No detailed user data found in localStorage")
        // Set form data from current user
        setFormData({
          name: parsedUser.name || "",
          nip: "",
          birthDate: "",
          address: "",
        })
      }
    }

    fetchUserData()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (user && user.email) {
        console.log("Updating profile for user:", user.email)

        // Update user profile
        const updatedData = {
          name: formData.name,
          nip: formData.nip,
          birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
          address: formData.address,
        }

        // Update in database
        await updateUserProfile(user.email, updatedData)
        console.log("Profile updated in database")

        // Update local user state
        const updatedUser = {
          ...user,
          name: formData.name,
          nip: formData.nip,
          birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
          address: formData.address,
        }
        setUser(updatedUser)

        // Update in local storage for backward compatibility
        const localStorageUser = {
          email: user.email,
          name: formData.name,
          role: user.role || "user",
          barcode: user.barcode || "",
        }

        localStorage.setItem("currentUser", JSON.stringify(localStorageUser))
        localStorage.setItem(
          `userData_${user.email}`,
          JSON.stringify({
            ...updatedData,
            email: user.email,
            role: user.role || "user",
          }),
        )

        console.log("Profile updated in localStorage")

        toast({
          title: "Profil Diperbarui",
          description: "Profil Anda telah berhasil diperbarui.",
          variant: "success",
        })

        // Set a short timeout before redirecting to inventory
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        throw new Error("No user found or user email is missing")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
      toast({
        title: "Error",
        description: "Gagal memperbarui profil. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="mt-2">Loading profile...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-500">{error}</div>
          <Button onClick={() => router.push("/login")} className="mr-2">
            Go to Login
          </Button>
          <Button onClick={() => router.refresh()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!user || !user.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">User not found or invalid user data. Please log in again.</div>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 md:py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Profil Karyawan PLN</h1>
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
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
                className="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Kembali
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
              <CardDescription>Perbarui informasi pribadi Anda di sini.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Email Anda tidak dapat diubah.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP (ID Karyawan)</Label>
                    <Input
                      id="nip"
                      name="nip"
                      value={formData.nip}
                      onChange={handleInputChange}
                      placeholder="Masukkan ID karyawan Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="min-h-[100px] pl-10"
                      placeholder="Masukkan alamat Anda"
                    />
                  </div>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      {user.role ? user.role.toUpperCase() : "USER"}
                    </div>
                    <span className="text-muted-foreground">Jenis Akun</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full transition-all hover:scale-105" disabled={saving}>
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                      className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
