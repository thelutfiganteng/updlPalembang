"use client"

import { useState } from "react"
import Link from "next/link"
import { DatabaseTablesCheck } from "@/components/database-tables-check"

export default function DatabaseSetupPage() {
  const [showSql, setShowSql] = useState(false)

  const sqlScript = `
-- Create users table
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

-- Create inventory_items table
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

-- Create borrow_records table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(type);
CREATE INDEX IF NOT EXISTS idx_borrow_records_user_email ON borrow_records(user_email);
CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status);
CREATE INDEX IF NOT EXISTS idx_borrow_records_item_id ON borrow_records(item_id);
  `

  function copyToClipboard() {
    navigator.clipboard
      .writeText(sqlScript)
      .then(() => alert("SQL script copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Status</h2>
        <p className="mb-4">
          This page helps you set up the necessary database tables for the inventory management system.
        </p>
        <DatabaseTablesCheck />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Manual Setup Instructions</h2>
        <p className="mb-4">
          If the automatic table creation doesn't work, follow these steps to manually set up your database:
        </p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>
            Go to your Supabase dashboard at{" "}
            <a
              href="https://app.supabase.io"
              className="text-blue-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://app.supabase.io
            </a>
          </li>
          <li>Select your project</li>
          <li>Go to the SQL Editor</li>
          <li>Create a new query</li>
          <li>Copy and paste the SQL setup script below</li>
          <li>Run the query</li>
          <li>Return to this application and refresh the page</li>
        </ol>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">SQL Setup Script</h2>
        <div className="flex justify-between mb-2">
          <button onClick={() => setShowSql(!showSql)} className="text-blue-500 underline">
            {showSql ? "Hide SQL Script" : "Show SQL Script"}
          </button>
          <button onClick={copyToClipboard} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Copy to Clipboard
          </button>
        </div>

        {showSql && <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{sqlScript}</pre>}
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
