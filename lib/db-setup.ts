import { generateItemBarcode, generateBorrowingBarcode, generateUserBarcode } from "./barcode-utils"
import { supabase } from "./supabase-client"

// Function to check if tables exist
async function checkTablesExist(): Promise<boolean> {
  try {
    // Try to query the users table
    const { data: usersData, error: usersError } = await supabase.from("users").select("email").limit(1).maybeSingle()

    if (usersError && usersError.code !== "PGRST116") {
      console.error("Error checking users table:", usersError)
      return false
    }

    // Try to query the inventory_items table
    const { data: itemsData, error: itemsError } = await supabase
      .from("inventory_items")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (itemsError && itemsError.code !== "PGRST116") {
      console.error("Error checking inventory_items table:", itemsError)
      return false
    }

    // Try to query the borrow_records table
    const { data: recordsData, error: recordsError } = await supabase
      .from("borrow_records")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (recordsError && recordsError.code !== "PGRST116") {
      console.error("Error checking borrow_records table:", recordsError)
      return false
    }

    // If we got here without errors, tables exist
    return true
  } catch (error) {
    console.error("Error checking if tables exist:", error)
    return false
  }
}

// Modify the addDefaultAdminUser function to not add any default users
async function addDefaultAdminUser(): Promise<boolean> {
  try {
    // We're not adding any default users anymore
    return true
  } catch (error) {
    console.error("Error adding default admin user:", error)
    return false
  }
}

// Function to migrate data from localStorage to Supabase
async function migrateDataFromLocalStorage(): Promise<boolean> {
  if (typeof window === "undefined") return true // Skip on server

  try {
    // Migrate users
    const savedUsers = localStorage.getItem("users")
    if (savedUsers) {
      const users = JSON.parse(savedUsers)

      for (const user of users) {
        // Check if user already exists
        const { data } = await supabase.from("users").select("email").eq("email", user.email).maybeSingle()

        if (!data) {
          // User doesn't exist, insert it
          const { error } = await supabase.from("users").insert({
            email: user.email,
            password: user.password,
            role: user.role,
            name: user.name,
            nip: user.nip || null,
            birth_date: user.birthDate ? new Date(user.birthDate).toISOString() : null,
            address: user.address || null,
            created_at: new Date(user.createdAt || Date.now()).toISOString(),
            barcode: user.barcode || generateUserBarcode(user.email),
          })

          if (error) {
            console.error(`Error migrating user ${user.email}:`, error)
          }
        }
      }
    }

    // Migrate inventory items
    const savedItems = localStorage.getItem("inventoryItems")
    if (savedItems) {
      const items = JSON.parse(savedItems)

      for (const item of items) {
        // Check if item already exists
        const { data } = await supabase.from("inventory_items").select("id").eq("id", item.id).maybeSingle()

        if (!data) {
          // Item doesn't exist, insert it
          const dbItem: any = {
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            available: item.available,
            image: item.image || null,
            added_date: new Date(item.addedDate || Date.now()).toISOString(),
            description: item.description || null,
            barcode: item.barcode || generateItemBarcode(item.id),
            brand: item.brand || null,
            year: item.year || null,
            unit: item.unit || null,
            location: item.location || null,
            condition: item.condition || null,
          }

          if (item.type === "tool") {
            dbItem.tool_number = item.toolNumber || null
            dbItem.serial_number = item.serialNumber || null
            dbItem.last_calibration = item.lastCalibration ? new Date(item.lastCalibration).toISOString() : null
            dbItem.next_calibration = item.nextCalibration ? new Date(item.nextCalibration).toISOString() : null
            dbItem.notes = item.notes || null
            dbItem.measuring_tool_number = item.measuringToolNumber || null
            dbItem.sop = item.sop || null
          } else if (item.type === "material" || item.type === "apd") {
            dbItem.usage_period = item.usagePeriod || null
          }

          const { error } = await supabase.from("inventory_items").insert(dbItem)

          if (error) {
            console.error(`Error migrating item ${item.id}:`, error)
          }
        }
      }
    }

    // Migrate borrow records
    const savedRecords = localStorage.getItem("borrowRecords")
    if (savedRecords) {
      const records = JSON.parse(savedRecords)

      for (const record of records) {
        // Check if record already exists
        const { data } = await supabase.from("borrow_records").select("id").eq("id", record.id).maybeSingle()

        if (!data) {
          // Record doesn't exist, insert it
          const { error } = await supabase.from("borrow_records").insert({
            id: record.id,
            item_id: record.itemId,
            user_email: record.userEmail,
            borrow_date: new Date(record.borrowDate || Date.now()).toISOString(),
            return_date: record.returnDate ? new Date(record.returnDate).toISOString() : null,
            quantity: record.quantity,
            status: record.status,
            estimated_duration: record.estimatedDuration || 7,
            barcode: record.barcode || generateBorrowingBarcode(record.id),
          })

          if (error) {
            console.error(`Error migrating borrow record ${record.id}:`, error)
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error migrating data from localStorage:", error)
    return false
  }
}

// Main setup function
export async function setupDatabase(): Promise<boolean> {
  try {
    // Check if tables exist
    const tablesExist = await checkTablesExist()

    if (!tablesExist) {
      console.error("Database tables do not exist. Please run the SQL setup script in Supabase SQL Editor.")
      return false
    }

    // Add default admin user if not exists
    const adminAdded = await addDefaultAdminUser()
    if (!adminAdded) {
      console.error("Failed to add default admin user")
      return false
    }

    // Migrate data from localStorage
    const dataMigrated = await migrateDataFromLocalStorage()
    if (!dataMigrated) {
      console.warn("Failed to migrate data from localStorage")
      // Continue anyway, this is not critical
    }

    console.log("Database setup completed successfully")
    return true
  } catch (error) {
    console.error("Error setting up database:", error)
    return false
  }
}
