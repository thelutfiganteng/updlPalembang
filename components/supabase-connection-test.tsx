"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function testConnection() {
    try {
      setStatus("loading")
      setMessage("Testing connection to Supabase...")

      // Use the correct syntax for counting records in Supabase
      const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage("Successfully connected to Supabase!")
    } catch (error) {
      console.error("Error connecting to Supabase:", error)
      setStatus("error")
      setMessage(`Failed to connect to Supabase: ${(error as any).message || "Unknown error"}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>

      <Button onClick={testConnection} disabled={status === "loading"}>
        {status === "loading" ? "Testing..." : "Test Connection"}
      </Button>

      {message && (
        <div
          className={`mt-2 p-2 rounded ${
            status === "success"
              ? "bg-green-100 text-green-800"
              : status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}
