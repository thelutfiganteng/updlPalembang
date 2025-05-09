"use client"

import { useEffect, useState } from "react"
import { testSupabaseConnection } from "@/lib/supabase-client"

export function DatabaseInitializer() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("Connecting to database...")
  const [showDetails, setShowDetails] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string>("")

  useEffect(() => {
    let isMounted = true

    async function initializeDatabase() {
      try {
        console.log("Testing Supabase connection...")

        // Test the connection to Supabase
        const result = await testSupabaseConnection()

        if (!isMounted) return

        if (result.success) {
          console.log("Supabase connection successful:", result.message)
          setStatus("connected")
          setMessage("Connected to Supabase")

          // Hide the success message after 5 seconds
          setTimeout(() => {
            if (isMounted) {
              setStatus("connected")
              setMessage("")
            }
          }, 5000)
        } else {
          console.error("Supabase connection failed:", result.message, result.error)
          setStatus("error")
          setMessage("Failed to connect to Supabase. Using localStorage as fallback.")
          setErrorDetails(JSON.stringify(result.error, null, 2))
        }
      } catch (err) {
        if (!isMounted) return

        console.error("Unexpected error during database initialization:", err)
        setStatus("error")
        setMessage("An unexpected error occurred. Using localStorage as fallback.")
        setErrorDetails(err instanceof Error ? err.stack || err.message : String(err))
      }
    }

    initializeDatabase()

    return () => {
      isMounted = false
    }
  }, [])

  if (!message) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded shadow-lg text-white ${
          status === "loading" ? "bg-blue-500" : status === "connected" ? "bg-green-500" : "bg-yellow-500"
        }`}
      >
        {message}
        {status === "error" && (
          <button onClick={() => setShowDetails(!showDetails)} className="ml-2 underline text-sm">
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        )}
      </div>

      {status === "error" && showDetails && (
        <div className="mt-2 bg-white border border-gray-300 p-3 rounded shadow-lg max-w-lg max-h-60 overflow-auto">
          <pre className="text-xs text-red-600 whitespace-pre-wrap">{errorDetails}</pre>
        </div>
      )}
    </div>
  )
}
