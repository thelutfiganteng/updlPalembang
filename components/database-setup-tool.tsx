"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function DatabaseSetupTool() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Modify the setupTables function to not add any temporary data
  const setupTables = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Check if tables exist without inserting temporary data
      await supabase
        .from("users")
        .select("count(*)")
        .limit(1)
        .catch(() => {
          console.log("users table needs to be created manually")
        })

      await supabase
        .from("inventory_items")
        .select("count(*)")
        .limit(1)
        .catch(() => {
          console.log("inventory_items table needs to be created manually")
        })

      await supabase
        .from("borrow_records")
        .select("count(*)")
        .limit(1)
        .catch(() => {
          console.log("borrow_records table needs to be created manually")
        })

      setResult({
        success: true,
        message: "Database tables checked. Please run the SQL setup script in Supabase SQL Editor for complete setup.",
      })
    } catch (error) {
      console.error("Error setting up database tables:", error)
      setResult({
        success: false,
        message: "Error setting up database tables. Please run the SQL setup script manually.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Setup</CardTitle>
        <CardDescription>Use this tool to check and setup the required database tables in Supabase.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This tool will attempt to check if the required tables exist in your Supabase database. For a complete setup,
          you should run the SQL setup script in the Supabase SQL Editor.
        </p>
        {result && (
          <div
            className={`p-4 mb-4 rounded ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {result.message}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={setupTables} disabled={isLoading}>
          {isLoading ? "Checking..." : "Check Database Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
}
