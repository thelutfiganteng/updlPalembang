"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginOptions() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-4 md:px-6 bg-white shadow-sm">
        <div className="container mx-auto flex items-center">
          {/* <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link> */}
          <div className="mx-auto">
            <img src="/assets/image/logoPLN.png" alt="Logo PLN" className="h-10" />
          </div>
          <div className="w-[100px]"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Pilih Divisi Login</h1>
          <p className="text-muted-foreground">Silakan pilih divisi Anda untuk melanjutkan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* Divisi JAR Card */}
          <Link href="/login" className="block h-full">
            <Card
              className={`h-full transition-all duration-300 hover:shadow-lg ${
                hoveredCard === "jar" ? "border-blue-500 shadow-lg" : ""
              }`}
              onMouseEnter={() => setHoveredCard("jar")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl">Divisi JAR</CardTitle>
                <CardDescription>Jaringan dan Distribusi</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-12 h-12 text-blue-600"
                  >
                    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path>
                    <path d="M2 20h20"></path>
                    <path d="M14 12v.01"></path>
                  </svg>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button className="w-full">Login Divisi JAR</Button>
              </CardFooter>
            </Card>
          </Link>

          {/* Divisi PKU Card */}
          <Link href="https://divisi-pku.vercel.app/" className="block h-full">
            <Card
              className={`h-full transition-all duration-300 hover:shadow-lg ${
                hoveredCard === "pku" ? "border-blue-500 shadow-lg" : ""
              }`}
              onMouseEnter={() => setHoveredCard("pku")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl">Divisi PKU</CardTitle>
                <CardDescription>Pengembangan Kualitas Usaha</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-12 h-12 text-blue-600"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button className="w-full">Login Divisi PKU</Button>
              </CardFooter>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-sm text-muted-foreground">
        <p>© 2025 PLN UPDL Palembang. All rights reserved.</p>
      </footer>
    </div>
  )
}
