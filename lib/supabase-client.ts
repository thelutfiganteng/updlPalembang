import { createClient } from "@supabase/supabase-js"

// Use the environment variables provided by the user
const supabaseUrl = "https://kazogohegbifufjgqodp.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthem9nb2hlZ2JpZnVmamdxb2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1Mzg1MTEsImV4cCI6MjA2MjExNDUxMX0.-mA8tVi19_5oiSe1JX_RD4LaloJ3DHNfk9bIOPm1wgA"

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Simple function to test the connection
export async function testSupabaseConnection() {
  try {
    // Just check if we can connect to the Supabase API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })

    if (response.ok) {
      return { success: true, message: "Connected to Supabase successfully" }
    } else {
      return {
        success: false,
        message: `Failed to connect to Supabase API: ${response.statusText}`,
        error: { status: response.status, statusText: response.statusText },
      }
    }
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return {
      success: false,
      message: `Error testing Supabase connection: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    }
  }
}
