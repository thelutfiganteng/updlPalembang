"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

export function DatabaseTablesCheck() {
  const [tablesStatus, setTablesStatus] = useState<{ [key: string]: boolean | null }>({
    users: null,
    inventory_items: null,
    borrow_records: null,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState<string>("Checking database tables...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkTables()
  }, [])

  async function checkTables() {
    setMessage("Checking database tables...")
    setError(null)

    const newStatus = {
      users: null,
      inventory_items: null,
      borrow_records: null,
    }

    try {
      // Check each table individually
      for (const table of Object.keys(newStatus)) {
        try {
          // Try to get the table's schema
          const { error } = await supabase.from(table).select("*").limit(1)

          // If there's no error, the table exists
          if (!error) {
            newStatus[table] = true
          } else if (error.code === "PGRST116") {
            // Table doesn't exist
            newStatus[table] = false
          } else {
            // Some other error
            console.error(`Error checking table ${table}:`, error)
            newStatus[table] = false
          }
        } catch (err) {
          console.error(`Error checking table ${table}:`, err)
          newStatus[table] = false
        }
      }

      setTablesStatus(newStatus)

      // Determine overall message
      const allExist = Object.values(newStatus).every((status) => status === true)
      const anyExist = Object.values(newStatus).some((status) => status === true)

      if (allExist) {
        setMessage("All database tables exist.")
      } else if (anyExist) {
        setMessage("Some database tables exist, but not all. Click 'Create Missing Tables' to create the missing ones.")
      } else {
        setMessage("No database tables found. Click 'Create Tables' to set up the database.")
      }
    } catch (err) {
      console.error("Error checking tables:", err)
      setError(`Error checking database tables: ${err instanceof Error ? err.message : "Unknown error"}`)
      setMessage("Failed to check database tables.")
    }
  }

  async function createTables() {
    try {
      setIsCreating(true)
      setMessage("Creating database tables...")
      setError(null)

      // Create each table that doesn't exist
      if (!tablesStatus.users) {
        const { error } = await supabase.rpc("exec_sql", {
          sql_string: `
            CREATE TABLE IF NOT EXISTS users (
              email TEXT PRIMARY KEY,
              password TEXT NOT NULL,
              role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
              name TEXT NOT NULL,
              nip TEXT,
              birth_date TIMESTAMP WITH TIME ZONE,
              address TEXT,
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              barcode TEXT NOT NULL
            );
          `,
        })

        if (error) {
          throw new Error(`Error creating users table: ${error.message}`)
        }
      }

      if (!tablesStatus.inventory_items) {
        const { error } = await supabase.rpc("exec_sql", {
          sql_string: `
            CREATE TABLE IF NOT EXISTS inventory_items (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              type TEXT NOT NULL CHECK (type IN ('material', 'tool', 'apd')),
              quantity INTEGER NOT NULL,
              available INTEGER NOT NULL,
              image TEXT,
              added_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              description TEXT,
              barcode TEXT NOT NULL,
              brand TEXT,
              year INTEGER,
              unit TEXT,
              location TEXT,
              condition TEXT,
              tool_number TEXT,
              serial_number TEXT,
              last_calibration TIMESTAMP WITH TIME ZONE,
              next_calibration TIMESTAMP WITH TIME ZONE,
              notes TEXT,
              measuring_tool_number TEXT,
              sop TEXT,
              usage_period TEXT
            );
          `,
        })

        if (error) {
          throw new Error(`Error creating inventory_items table: ${error.message}`)
        }
      }

      if (!tablesStatus.borrow_records) {
        const { error } = await supabase.rpc("exec_sql", {
          sql_string: `
            CREATE TABLE IF NOT EXISTS borrow_records (
              id TEXT PRIMARY KEY,
              item_id TEXT NOT NULL,
              user_email TEXT NOT NULL,
              borrow_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              return_date TIMESTAMP WITH TIME ZONE,
              quantity INTEGER NOT NULL,
              status TEXT NOT NULL CHECK (status IN ('active', 'returned')),
              estimated_duration INTEGER NOT NULL,
              barcode TEXT NOT NULL
            );
          `,
        })

        if (error) {
          throw new Error(`Error creating borrow_records table: ${error.message}`)
        }
      }

      // Create indexes
      const { error: indexError } = await supabase.rpc("exec_sql", {
        sql_string: `
          CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(type);
          CREATE INDEX IF NOT EXISTS idx_borrow_records_user_email ON borrow_records(user_email);
          CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status);
          CREATE INDEX IF NOT EXISTS idx_borrow_records_item_id ON borrow_records(item_id);
        `,
      })

      if (indexError) {
        console.warn("Error creating indexes:", indexError)
        // Continue anyway, indexes are not critical
      }

      setMessage("Database tables created successfully!")
      await checkTables() // Refresh table status
    } catch (error) {
      console.error("Error creating tables:", error)
      setError(`${error instanceof Error ? error.message : "Unknown error"}`)
      setMessage("Error creating database tables. You may need to create them manually.")
    } finally {
      setIsCreating(false)
    }
  }

  const allTablesExist = Object.values(tablesStatus).every((status) => status === true)
  const anyTablesMissing = Object.values(tablesStatus).some((status) => status === false)
  const stillChecking = Object.values(tablesStatus).some((status) => status === null)

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-medium mb-2">Database Status</h3>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <p
        className={`mb-4 ${allTablesExist ? "text-green-600" : anyTablesMissing ? "text-yellow-600" : "text-blue-600"}`}
      >
        {message}
      </p>

      {!stillChecking && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Table Status:</h4>
          <ul className="space-y-1">
            {Object.entries(tablesStatus).map(([table, exists]) => (
              <li key={table} className="flex items-center">
                <span className={`w-4 h-4 rounded-full mr-2 ${exists ? "bg-green-500" : "bg-red-500"}`}></span>
                {table}: {exists ? "Exists" : "Missing"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {anyTablesMissing && (
        <button
          onClick={createTables}
          disabled={isCreating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? "Creating Tables..." : allTablesExist ? "Refresh Status" : "Create Missing Tables"}
        </button>
      )}

      {allTablesExist && (
        <button onClick={checkTables} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Refresh Status
        </button>
      )}
    </div>
  )
}
