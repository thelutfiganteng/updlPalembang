// Add these imports at the top of the file
import { generateItemBarcode, generateBorrowingBarcode, generateUserBarcode } from "./barcode-utils"
import { supabase } from "./supabase-client"
import { setupDatabase } from "./db-setup"

// Types for our inventory system
export type InventoryItemType = "material" | "tool" | "apd"

// Base inventory item interface
export interface BaseInventoryItem {
  id: string
  name: string
  type: InventoryItemType
  quantity: number
  available: number
  image: string
  addedDate: Date
  description: string
  barcode: string
}

// Tool specific properties
export interface ToolItem extends BaseInventoryItem {
  type: "tool"
  brand: string
  year: number
  unit: string
  toolNumber: string
  sop: string
  location: string
  condition: string
  serialNumber: string
  lastCalibration: Date | null
  nextCalibration: Date | null
  notes: string
  measuringToolNumber: string
}

// Material specific properties
export interface MaterialItem extends BaseInventoryItem {
  type: "material"
  brand: string
  year: number
  unit: string
  location: string
  usagePeriod: string // masaPakai
  condition: string
}

// PPE specific properties
export interface APDItem extends BaseInventoryItem {
  type: "apd"
  brand: string
  year: number
  unit: string
  location: string
  usagePeriod: string // masaPakai
  condition: string
}

// Union type for all inventory items
export type InventoryItem = ToolItem | MaterialItem | APDItem

// Update the BorrowRecord interface to include estimatedDuration
export interface BorrowRecord {
  id: string
  itemId: string
  userEmail: string
  borrowDate: Date
  returnDate: Date | null
  quantity: number
  status: "active" | "returned"
  estimatedDuration: number
  barcode: string
}

// Update the User interface to include additional fields
export interface User {
  email: string
  password: string
  role: "admin" | "user"
  name: string
  nip: string
  birthDate: Date | null
  address: string
  createdAt: Date
  barcode: string
}

// Initialize the database
if (typeof window !== "undefined") {
  setupDatabase().catch(console.error)
}

// Helper function to convert database item to InventoryItem
function dbItemToInventoryItem(item: any): InventoryItem {
  const baseItem = {
    id: item.id,
    name: item.name,
    type: item.type as InventoryItemType,
    quantity: item.quantity,
    available: item.available,
    image: item.image || "",
    addedDate: new Date(item.added_date),
    description: item.description || "",
    barcode: item.barcode,
  }

  if (item.type === "tool") {
    return {
      ...baseItem,
      type: "tool",
      brand: item.brand || "",
      year: item.year || new Date().getFullYear(),
      unit: item.unit || "pcs",
      toolNumber: item.tool_number || "",
      sop: item.sop || "",
      location: item.location || "",
      condition: item.condition || "Good",
      serialNumber: item.serial_number || "",
      lastCalibration: item.last_calibration ? new Date(item.last_calibration) : null,
      nextCalibration: item.next_calibration ? new Date(item.next_calibration) : null,
      notes: item.notes || "",
      measuringToolNumber: item.measuring_tool_number || "",
    } as ToolItem
  } else if (item.type === "material") {
    return {
      ...baseItem,
      type: "material",
      brand: item.brand || "",
      year: item.year || new Date().getFullYear(),
      unit: item.unit || "pcs",
      location: item.location || "",
      usagePeriod: item.usage_period || "",
      condition: item.condition || "Good",
    } as MaterialItem
  } else {
    return {
      ...baseItem,
      type: "apd",
      brand: item.brand || "",
      year: item.year || new Date().getFullYear(),
      unit: item.unit || "pcs",
      location: item.location || "",
      usagePeriod: item.usage_period || "",
      condition: item.condition || "Good",
    } as APDItem
  }
}

// Helper function to convert database record to BorrowRecord
function dbRecordToBorrowRecord(record: any): BorrowRecord {
  return {
    id: record.id,
    itemId: record.item_id,
    userEmail: record.user_email,
    borrowDate: new Date(record.borrow_date),
    returnDate: record.return_date ? new Date(record.return_date) : null,
    quantity: record.quantity,
    status: record.status as "active" | "returned",
    estimatedDuration: record.estimated_duration,
    barcode: record.barcode,
  }
}

// Helper function to convert database user to User
function dbUserToUser(user: any): User {
  return {
    email: user.email,
    password: user.password,
    role: user.role as "admin" | "user",
    name: user.name,
    nip: user.nip || "",
    birthDate: user.birth_date ? new Date(user.birth_date) : null,
    address: user.address || "",
    createdAt: new Date(user.created_at),
    barcode: user.barcode,
  }
}

// Empty arrays for initial data
export const users: User[] = []

// Empty array for inventory items
const inventoryItems: InventoryItem[] = []

// Empty array for borrow records
export const borrowRecords: BorrowRecord[] = []

// In a real application, these would be API calls or database queries
// For this demo, we'll use these functions to simulate data operations

// Save inventory items to localStorage
export function saveInventoryItems(items: InventoryItem[]) {
  try {
    // Convert dates to strings for proper JSON serialization
    const itemsToSave = items.map((item) => ({
      ...item,
      addedDate: item.addedDate.toISOString(),
      lastCalibration:
        item.type === "tool" && (item as ToolItem).lastCalibration
          ? (item as ToolItem).lastCalibration?.toISOString()
          : null,
      nextCalibration:
        item.type === "tool" && (item as ToolItem).nextCalibration
          ? (item as ToolItem).nextCalibration?.toISOString()
          : null,
    }))

    // Save to localStorage
    localStorage.setItem("inventoryItems", JSON.stringify(itemsToSave))

    // Log success for debugging
    console.log(`Saved ${items.length} items to localStorage`)
  } catch (error) {
    console.error("Error saving inventory items to localStorage:", error)
    throw new Error("Failed to save inventory items")
  }
}

// Modify the loadInventoryItems function to prioritize Supabase and only use localStorage as a fallback
export function loadInventoryItems(): InventoryItem[] {
  try {
    // Try to get items from Supabase first (asynchronously)
    if (typeof window !== "undefined") {
      // Trigger an async fetch but don't wait for it
      ;(async () => {
        try {
          const { data, error } = await supabase.from("inventory_items").select("*")
          if (error) throw error

          if (data && data.length > 0) {
            // Convert the data to the correct format
            const items = data.map(dbItemToInventoryItem)

            // Update localStorage with the latest data from Supabase
            const itemsToSave = items.map((item) => ({
              ...item,
              addedDate: item.addedDate.toISOString(),
              lastCalibration:
                item.type === "tool" && (item as ToolItem).lastCalibration
                  ? (item as ToolItem).lastCalibration?.toISOString()
                  : null,
              nextCalibration:
                item.type === "tool" && (item as ToolItem).nextCalibration
                  ? (item as ToolItem).nextCalibration?.toISOString()
                  : null,
            }))

            localStorage.setItem("inventoryItems", JSON.stringify(itemsToSave))
            console.log(`Updated localStorage with ${items.length} items from Supabase`)
          }
        } catch (error) {
          console.error("Error fetching from Supabase in loadInventoryItems:", error)
        }
      })()
    }

    // Meanwhile, return data from localStorage as a temporary measure
    console.log("Loading inventory items from localStorage while waiting for Supabase data")
    const savedItems = localStorage.getItem("inventoryItems")

    if (savedItems) {
      // Parse the JSON and convert string dates back to Date objects
      const parsedItems = JSON.parse(savedItems)
      console.log(`Found ${parsedItems.length} items in localStorage`)

      const items = parsedItems.map((item: any) => {
        // Create a base item with common properties
        const baseItem = {
          ...item,
          addedDate: new Date(item.addedDate),
          // Ensure barcode exists, generate if not
          barcode: item.barcode || generateItemBarcode(item.id),
        }

        // Add type-specific properties
        if (item.type === "tool") {
          return {
            ...baseItem,
            lastCalibration: item.lastCalibration ? new Date(item.lastCalibration) : null,
            nextCalibration: item.nextCalibration ? new Date(item.nextCalibration) : null,
          }
        }

        return baseItem
      })

      return items
    }

    // If no saved items, initialize localStorage with empty array
    console.log("No items found in localStorage, initializing with empty array")
    localStorage.setItem("inventoryItems", JSON.stringify([]))
    return []
  } catch (error) {
    console.error("Error loading inventory items from localStorage:", error)
    // Return empty array if there's an error
    return []
  }
}

// Modify getInventoryItems to always try Supabase first and wait for the result
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    console.log("Fetching inventory items from Supabase")
    const { data, error } = await supabase.from("inventory_items").select("*")

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    const items = (data || []).map(dbItemToInventoryItem)
    console.log(`Fetched ${items.length} items from Supabase`)

    // Update localStorage with the latest data for offline access
    if (typeof window !== "undefined") {
      const itemsToSave = items.map((item) => ({
        ...item,
        addedDate: item.addedDate.toISOString(),
        lastCalibration:
          item.type === "tool" && (item as ToolItem).lastCalibration
            ? (item as ToolItem).lastCalibration?.toISOString()
            : null,
        nextCalibration:
          item.type === "tool" && (item as ToolItem).nextCalibration
            ? (item as ToolItem).nextCalibration?.toISOString()
            : null,
      }))

      localStorage.setItem("inventoryItems", JSON.stringify(itemsToSave))
    }

    return items
  } catch (error) {
    console.error("Error getting inventory items from Supabase:", error)

    // Fallback to localStorage if Supabase fails
    if (typeof window !== "undefined") {
      console.log("Falling back to localStorage for inventory items")
      const savedItems = localStorage.getItem("inventoryItems")
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems)
        console.log(`Found ${parsedItems.length} items in localStorage (fallback)`)

        // Ensure dates are properly converted
        return parsedItems.map((item: any) => {
          const processedItem = {
            ...item,
            addedDate: new Date(item.addedDate),
          }

          // Handle type-specific date fields
          if (item.type === "tool") {
            processedItem.lastCalibration = item.lastCalibration ? new Date(item.lastCalibration) : null
            processedItem.nextCalibration = item.nextCalibration ? new Date(item.nextCalibration) : null
          }

          return processedItem
        })
      } else {
        console.log("No items found in localStorage")
      }
    }

    return []
  }
}

// Override the getInventoryItemsByType function to use localStorage
// Override the original getInventoryItemsByType function to use localStorage
// Override the getInventoryItemsByType function to use localStorage
// Update getInventoryItemsByType to prioritize Supabase
export async function getInventoryItemsByType(type: InventoryItemType): Promise<InventoryItem[]> {
  try {
    console.log(`Fetching ${type} items from Supabase`)
    const { data, error } = await supabase.from("inventory_items").select("*").eq("type", type)

    if (error) throw error

    const items = (data || []).map(dbItemToInventoryItem)
    console.log(`Fetched ${items.length} ${type} items from Supabase`)

    return items
  } catch (error) {
    console.error(`Error getting ${type} items from Supabase:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      console.log(`Falling back to localStorage for ${type} items`)
      const allItems = loadInventoryItems()
      return allItems.filter((item) => item.type === type)
    }

    return []
  }
}

// Get inventory item by ID
export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
  try {
    const { data, error } = await supabase.from("inventory_items").select("*").eq("id", id).single()

    if (error) throw error

    return data ? dbItemToInventoryItem(data) : undefined
  } catch (error) {
    console.error(`Error getting item with ID ${id}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedItems = localStorage.getItem("inventoryItems")
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems)
        const item = parsedItems.find((item: any) => item.id === id)
        if (item) {
          return {
            ...item,
            addedDate: new Date(item.addedDate),
            lastCalibration: item.lastCalibration ? new Date(item.lastCalibration) : null,
            nextCalibration: item.nextCalibration ? new Date(item.nextCalibration) : null,
          }
        }
      }
    }

    return undefined
  }
}

// Update the addToolItem function to persist changes
// Add a tool item
export async function addToolItem(item: Omit<ToolItem, "id" | "type" | "barcode">): Promise<ToolItem> {
  try {
    // Generate a unique ID
    const { data: toolItems } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("type", "tool")
      .order("id", { ascending: false })
      .limit(1)

    const lastId = toolItems && toolItems.length > 0 ? Number.parseInt(toolItems[0].id.substring(1)) : 0

    const id = `t${lastId + 1}`
    const barcode = generateItemBarcode(id)

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        id,
        name: item.name,
        type: "tool",
        quantity: item.quantity,
        available: item.available || item.quantity,
        image: item.image || null,
        added_date: new Date().toISOString(),
        description: item.description || null,
        barcode,
        brand: item.brand || null,
        year: item.year || new Date().getFullYear(),
        unit: item.unit || "pcs",
        location: item.location || null,
        condition: item.condition || "Good",
        tool_number: item.toolNumber || null,
        serial_number: item.serialNumber || null,
        last_calibration: item.lastCalibration ? item.lastCalibration.toISOString() : null,
        next_calibration: item.nextCalibration ? item.nextCalibration.toISOString() : null,
        notes: item.notes || null,
        measuring_tool_number: item.measuringToolNumber || null,
        sop: item.sop || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create the tool item to return
    const newToolItem = dbItemToInventoryItem(data) as ToolItem

    // IMPORTANT: Also update localStorage for immediate access
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newToolItem,
        addedDate: newToolItem.addedDate.toISOString(),
        lastCalibration: newToolItem.lastCalibration ? newToolItem.lastCalibration.toISOString() : null,
        nextCalibration: newToolItem.nextCalibration ? newToolItem.nextCalibration.toISOString() : null,
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("Tool added to localStorage, total items:", items.length)
    }

    return newToolItem
  } catch (error) {
    console.error("Error adding tool item:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      const toolItems = items.filter((i: any) => i.type === "tool")
      const lastId = toolItems.length > 0 ? Number.parseInt(toolItems[toolItems.length - 1].id.substring(1)) : 0

      const id = `t${lastId + 1}`
      const barcode = generateItemBarcode(id)

      const newItem: ToolItem = {
        ...item,
        id,
        type: "tool",
        addedDate: new Date(),
        barcode,
      }

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newItem,
        addedDate: newItem.addedDate.toISOString(),
        lastCalibration: newItem.lastCalibration ? newItem.lastCalibration.toISOString() : null,
        nextCalibration: newItem.nextCalibration ? newItem.nextCalibration.toISOString() : null,
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("Tool added to localStorage (fallback), total items:", items.length)

      return newItem
    }

    throw error
  }
}

// Update the addMaterialItem function to persist changes
// Add a material item
export async function addMaterialItem(item: Omit<MaterialItem, "id" | "type" | "barcode">): Promise<MaterialItem> {
  try {
    // Generate a unique ID
    const { data: materialItems } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("type", "material")
      .order("id", { ascending: false })
      .limit(1)

    const lastId = materialItems && materialItems.length > 0 ? Number.parseInt(materialItems[0].id.substring(1)) : 0

    const id = `m${lastId + 1}`
    const barcode = generateItemBarcode(id)

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        id,
        name: item.name,
        type: "material",
        quantity: item.quantity,
        available: item.available || item.quantity,
        image: item.image || null,
        added_date: new Date().toISOString(),
        description: item.description || null,
        barcode,
        brand: item.brand || null,
        year: item.year || new Date().getFullYear(),
        unit: item.unit || "pcs",
        location: item.location || null,
        condition: item.condition || "Good",
        usage_period: item.usagePeriod || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create the material item to return
    const newMaterialItem = dbItemToInventoryItem(data) as MaterialItem

    // IMPORTANT: Also update localStorage for immediate access
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newMaterialItem,
        addedDate: newMaterialItem.addedDate.toISOString(),
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("Material added to localStorage, total items:", items.length)
    }

    return newMaterialItem
  } catch (error) {
    console.error("Error adding material item:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      const materialItems = items.filter((i: any) => i.type === "material")
      const lastId =
        materialItems.length > 0 ? Number.parseInt(materialItems[materialItems.length - 1].id.substring(1)) : 0

      const id = `m${lastId + 1}`
      const barcode = generateItemBarcode(id)

      const newItem: MaterialItem = {
        ...item,
        id,
        type: "material",
        addedDate: new Date(),
        barcode,
      }

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newItem,
        addedDate: newItem.addedDate.toISOString(),
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("Material added to localStorage (fallback), total items:", items.length)

      return newItem
    }

    throw error
  }
}

// Update the addPPEItem function to persist changes
// Add an APD item
export async function addAPDItem(item: Omit<APDItem, "id" | "type" | "barcode">): Promise<APDItem> {
  try {
    // Generate a unique ID
    const { data: apdItems } = await supabase
      .from("inventory_items")
      .select("id")
      .eq("type", "apd")
      .order("id", { ascending: false })
      .limit(1)

    const lastId = apdItems && apdItems.length > 0 ? Number.parseInt(apdItems[0].id.substring(1)) : 0

    const id = `p${lastId + 1}`
    const barcode = generateItemBarcode(id)

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        id,
        name: item.name,
        type: "apd",
        quantity: item.quantity,
        available: item.available || item.quantity,
        image: item.image || null,
        added_date: new Date().toISOString(),
        description: item.description || null,
        barcode,
        brand: item.brand || null,
        year: item.year || new Date().getFullYear(),
        unit: item.unit || "pcs",
        location: item.location || null,
        condition: item.condition || "Good",
        usage_period: item.usagePeriod || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create the APD item to return
    const newAPDItem = dbItemToInventoryItem(data) as APDItem

    // IMPORTANT: Also update localStorage for immediate access
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newAPDItem,
        addedDate: newAPDItem.addedDate.toISOString(),
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("APD added to localStorage, total items:", items.length)
    }

    return newAPDItem
  } catch (error) {
    console.error("Error adding APD item:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      const apdItems = items.filter((i: any) => i.type === "apd")
      const lastId = apdItems.length > 0 ? Number.parseInt(apdItems[apdItems.length - 1].id.substring(1)) : 0

      const id = `p${lastId + 1}`
      const barcode = generateItemBarcode(id)

      const newItem: APDItem = {
        ...item,
        id,
        type: "apd",
        addedDate: new Date(),
        barcode,
      }

      // Create a localStorage-friendly version of the item
      const localStorageItem = {
        ...newItem,
        addedDate: newItem.addedDate.toISOString(),
      }

      items.push(localStorageItem)
      localStorage.setItem("inventoryItems", JSON.stringify(items))
      console.log("APD added to localStorage (fallback), total items:", items.length)

      return newItem
    }

    throw error
  }
}

// Add function to delete an inventory item
// Delete an inventory item
export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedItems = localStorage.getItem("inventoryItems")
      if (savedItems) {
        const items = JSON.parse(savedItems)
        const updatedItems = items.filter((item: any) => item.id !== id)
        localStorage.setItem("inventoryItems", JSON.stringify(updatedItems))
        return true
      }
    }

    return false
  }
}

// Add function to update an inventory item
// Update an inventory item
export async function updateInventoryItem(id: string, updatedItem: Partial<InventoryItem>): Promise<boolean> {
  try {
    // Convert the updatedItem to database format
    const dbItem: any = {}

    if (updatedItem.name !== undefined) dbItem.name = updatedItem.name
    if (updatedItem.quantity !== undefined) dbItem.quantity = updatedItem.quantity
    if (updatedItem.available !== undefined) dbItem.available = updatedItem.available
    if (updatedItem.image !== undefined) dbItem.image = updatedItem.image
    if (updatedItem.description !== undefined) dbItem.description = updatedItem.description

    if (updatedItem.type === "tool") {
      if ((updatedItem as ToolItem).brand !== undefined) dbItem.brand = (updatedItem as ToolItem).brand
      if ((updatedItem as ToolItem).year !== undefined) dbItem.year = (updatedItem as ToolItem).year
      if ((updatedItem as ToolItem).unit !== undefined) dbItem.unit = (updatedItem as ToolItem).unit
      if ((updatedItem as ToolItem).toolNumber !== undefined) dbItem.tool_number = (updatedItem as ToolItem).toolNumber
      if ((updatedItem as ToolItem).serialNumber !== undefined)
        dbItem.serial_number = (updatedItem as ToolItem).serialNumber
      if ((updatedItem as ToolItem).lastCalibration !== undefined)
        dbItem.last_calibration = (updatedItem as ToolItem).lastCalibration
          ? (updatedItem as ToolItem).lastCalibration.toISOString()
          : null
      if ((updatedItem as ToolItem).nextCalibration !== undefined)
        dbItem.next_calibration = (updatedItem as ToolItem).nextCalibration
          ? (updatedItem as ToolItem).nextCalibration.toISOString()
          : null
      if ((updatedItem as ToolItem).notes !== undefined) dbItem.notes = (updatedItem as ToolItem).notes
      if ((updatedItem as ToolItem).measuringToolNumber !== undefined)
        dbItem.measuring_tool_number = (updatedItem as ToolItem).measuringToolNumber
      if ((updatedItem as ToolItem).sop !== undefined) dbItem.sop = (updatedItem as ToolItem).sop
      if ((updatedItem as ToolItem).location !== undefined) dbItem.location = (updatedItem as ToolItem).location
      if ((updatedItem as ToolItem).condition !== undefined) dbItem.condition = (updatedItem as ToolItem).condition
    } else if (updatedItem.type === "material" || updatedItem.type === "apd") {
      const item = updatedItem as MaterialItem | APDItem
      if (item.brand !== undefined) dbItem.brand = item.brand
      if (item.year !== undefined) dbItem.year = item.year
      if (item.unit !== undefined) dbItem.unit = item.unit
      if (item.location !== undefined) dbItem.location = item.location
      if (item.usagePeriod !== undefined) dbItem.usage_period = item.usagePeriod
      if (item.condition !== undefined) dbItem.condition = item.condition
    }

    const { error } = await supabase.from("inventory_items").update(dbItem).eq("id", id)

    if (error) throw error

    // Also update localStorage for immediate access
    if (typeof window !== "undefined") {
      const savedItems = localStorage.getItem("inventoryItems")
      if (savedItems) {
        const items = JSON.parse(savedItems)
        const index = items.findIndex((item: any) => item.id === id)

        if (index !== -1) {
          // Create a new object with the updated properties
          const updatedStorageItem = { ...items[index] }

          // Update all the fields from updatedItem
          if (updatedItem.name !== undefined) updatedStorageItem.name = updatedItem.name
          if (updatedItem.quantity !== undefined) updatedStorageItem.quantity = updatedItem.quantity
          if (updatedItem.available !== undefined) updatedStorageItem.available = updatedItem.available
          if (updatedItem.image !== undefined) updatedStorageItem.image = updatedItem.image
          if (updatedItem.description !== undefined) updatedStorageItem.description = updatedItem.description

          // Type-specific fields
          if (updatedItem.type === "tool") {
            if ((updatedItem as ToolItem).brand !== undefined)
              updatedStorageItem.brand = (updatedItem as ToolItem).brand
            if ((updatedItem as ToolItem).year !== undefined) updatedStorageItem.year = (updatedItem as ToolItem).year
            if ((updatedItem as ToolItem).unit !== undefined) updatedStorageItem.unit = (updatedItem as ToolItem).unit
            if ((updatedItem as ToolItem).toolNumber !== undefined)
              updatedStorageItem.toolNumber = (updatedItem as ToolItem).toolNumber
            if ((updatedItem as ToolItem).serialNumber !== undefined)
              updatedStorageItem.serialNumber = (updatedItem as ToolItem).serialNumber
            if ((updatedItem as ToolItem).lastCalibration !== undefined)
              updatedStorageItem.lastCalibration = (updatedItem as ToolItem).lastCalibration
                ? (updatedItem as ToolItem).lastCalibration.toISOString()
                : null
            if ((updatedItem as ToolItem).nextCalibration !== undefined)
              updatedStorageItem.nextCalibration = (updatedItem as ToolItem).nextCalibration
                ? (updatedItem as ToolItem).nextCalibration.toISOString()
                : null
            if ((updatedItem as ToolItem).notes !== undefined)
              updatedStorageItem.notes = (updatedItem as ToolItem).notes
            if ((updatedItem as ToolItem).measuringToolNumber !== undefined)
              updatedStorageItem.measuringToolNumber = (updatedItem as ToolItem).measuringToolNumber
            if ((updatedItem as ToolItem).sop !== undefined) updatedStorageItem.sop = (updatedItem as ToolItem).sop
            if ((updatedItem as ToolItem).location !== undefined)
              updatedStorageItem.location = (updatedItem as ToolItem).location
            if ((updatedItem as ToolItem).condition !== undefined)
              updatedStorageItem.condition = (updatedItem as ToolItem).condition
          } else if (updatedItem.type === "material" || updatedItem.type === "apd") {
            const item = updatedItem as MaterialItem | APDItem
            if (item.brand !== undefined) updatedStorageItem.brand = item.brand
            if (item.year !== undefined) updatedStorageItem.year = item.year
            if (item.unit !== undefined) updatedStorageItem.unit = item.unit
            if (item.location !== undefined) updatedStorageItem.location = item.location
            if (item.usagePeriod !== undefined) updatedStorageItem.usagePeriod = item.usagePeriod
            if (item.condition !== undefined) updatedStorageItem.condition = item.condition
          }

          // Replace the old item with the updated one
          items[index] = updatedStorageItem

          // Save back to localStorage
          localStorage.setItem("inventoryItems", JSON.stringify(items))
          console.log(`Item ${id} updated in localStorage`)
        }
      }
    }

    return true
  } catch (error) {
    console.error(`Error updating item with ID ${id}:`, error)

    // Fallback to localStorage only
    if (typeof window !== "undefined") {
      const savedItems = localStorage.getItem("inventoryItems")
      if (savedItems) {
        const items = JSON.parse(savedItems)
        const index = items.findIndex((item: any) => item.id === id)

        if (index !== -1) {
          // Create a new object with the updated properties
          const updatedStorageItem = { ...items[index] }

          // Update all the fields from updatedItem
          if (updatedItem.name !== undefined) updatedStorageItem.name = updatedItem.name
          if (updatedItem.quantity !== undefined) updatedStorageItem.quantity = updatedItem.quantity
          if (updatedItem.available !== undefined) updatedStorageItem.available = updatedItem.available
          if (updatedItem.image !== undefined) updatedStorageItem.image = updatedItem.image
          if (updatedItem.description !== undefined) updatedStorageItem.description = updatedItem.description

          // Type-specific fields
          if (updatedItem.type === "tool") {
            if ((updatedItem as ToolItem).brand !== undefined)
              updatedStorageItem.brand = (updatedItem as ToolItem).brand
            if ((updatedItem as ToolItem).year !== undefined) updatedStorageItem.year = (updatedItem as ToolItem).year
            if ((updatedItem as ToolItem).unit !== undefined) updatedStorageItem.unit = (updatedItem as ToolItem).unit
            if ((updatedItem as ToolItem).toolNumber !== undefined)
              updatedStorageItem.toolNumber = (updatedItem as ToolItem).toolNumber
            if ((updatedItem as ToolItem).serialNumber !== undefined)
              updatedStorageItem.serialNumber = (updatedItem as ToolItem).serialNumber
            if ((updatedItem as ToolItem).lastCalibration !== undefined)
              updatedStorageItem.lastCalibration = (updatedItem as ToolItem).lastCalibration
                ? (updatedItem as ToolItem).lastCalibration.toISOString()
                : null
            if ((updatedItem as ToolItem).nextCalibration !== undefined)
              updatedStorageItem.nextCalibration = (updatedItem as ToolItem).nextCalibration
                ? (updatedItem as ToolItem).nextCalibration.toISOString()
                : null
            if ((updatedItem as ToolItem).notes !== undefined)
              updatedStorageItem.notes = (updatedItem as ToolItem).notes
            if ((updatedItem as ToolItem).measuringToolNumber !== undefined)
              updatedStorageItem.measuringToolNumber = (updatedItem as ToolItem).measuringToolNumber
            if ((updatedItem as ToolItem).sop !== undefined) updatedStorageItem.sop = (updatedItem as ToolItem).sop
            if ((updatedItem as ToolItem).location !== undefined)
              updatedStorageItem.location = (updatedItem as ToolItem).location
            if ((updatedItem as ToolItem).condition !== undefined)
              updatedStorageItem.condition = (updatedItem as ToolItem).condition
          } else if (updatedItem.type === "material" || updatedItem.type === "apd") {
            const item = updatedItem as MaterialItem | APDItem
            if (item.brand !== undefined) updatedStorageItem.brand = item.brand
            if (item.year !== undefined) updatedStorageItem.year = item.year
            if (item.unit !== undefined) updatedStorageItem.unit = item.unit
            if (item.location !== undefined) updatedStorageItem.location = item.location
            if (item.usagePeriod !== undefined) updatedStorageItem.usagePeriod = item.usagePeriod
            if (item.condition !== undefined) updatedStorageItem.condition = item.condition
          }

          // Replace the old item with the updated one
          items[index] = updatedStorageItem

          // Save back to localStorage
          localStorage.setItem("inventoryItems", JSON.stringify(items))
          console.log(`Item ${id} updated in localStorage (fallback)`)
          return true
        }
      }
    }

    return false
  }
}

// Save users to localStorage
export function saveUsers(userList: User[]) {
  localStorage.setItem("users", JSON.stringify(userList))
}

// Load users from localStorage
export function loadUsers(): User[] {
  const savedUsers = localStorage.getItem("users")
  if (savedUsers) {
    // Parse the JSON and convert string dates back to Date objects
    const parsedUsers = JSON.parse(savedUsers)
    const usersWithBarcodes = parsedUsers.map((user: any) => ({
      ...user,
      birthDate: user.birthDate ? new Date(user.birthDate) : null,
      createdAt: new Date(user.createdAt),
      // Ensure barcode exists, generate if not
      barcode: user.barcode || generateUserBarcode(user.email),
    }))

    // Save users back to ensure barcodes are stored
    saveUsers(usersWithBarcodes)

    return usersWithBarcodes
  }

  // If no saved users, initialize localStorage with default admin user
  const usersWithBarcodes = users.map((user) => ({
    ...user,
    barcode: generateUserBarcode(user.email),
  }))

  saveUsers(usersWithBarcodes)
  return [...usersWithBarcodes]
}

// Add function to load borrow records from localStorage
export function loadBorrowRecords(): BorrowRecord[] {
  const savedRecords = localStorage.getItem("borrowRecords")
  if (savedRecords) {
    // Parse the JSON and convert string dates back to Date objects
    const parsedRecords = JSON.parse(savedRecords)
    const records = parsedRecords.map((record: any) => ({
      ...record,
      borrowDate: new Date(record.borrowDate),
      returnDate: record.returnDate ? new Date(record.returnDate) : null,
      // Ensure barcode exists, generate if not
      barcode: record.barcode || generateBorrowingBarcode(record.id),
    }))

    // Save records back to ensure barcodes are stored
    localStorage.setItem("borrowRecords", JSON.stringify(records))

    return records
  }

  // If no saved records, initialize localStorage with empty array
  localStorage.setItem("borrowRecords", JSON.stringify([]))
  return []
}

// Override the getBorrowRecords function to use localStorage
// Get all borrow records
export async function getBorrowRecords(): Promise<BorrowRecord[]> {
  try {
    console.log("Fetching borrow records from Supabase")
    const { data, error } = await supabase.from("borrow_records").select("*")

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log(`Fetched ${data?.length || 0} records from Supabase`)
    return (data || []).map(dbRecordToBorrowRecord)
  } catch (error) {
    console.error("Error getting borrow records:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      console.log("Falling back to localStorage for borrow records")
      const savedRecords = localStorage.getItem("borrowRecords")
      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords)
        console.log(`Found ${parsedRecords.length} records in localStorage`)

        return parsedRecords.map((record: any) => ({
          ...record,
          borrowDate: new Date(record.borrowDate),
          returnDate: record.returnDate ? new Date(record.returnDate) : null,
        }))
      } else {
        console.log("No records found in localStorage")
      }
    }

    return []
  }
}

// Update the addBorrowRecord function to persist changes
// Add a borrow record
export async function addBorrowRecord(record: Omit<BorrowRecord, "id" | "barcode">): Promise<BorrowRecord> {
  try {
    // Generate a unique ID
    // Generate a unique ID with timestamp to avoid collisions
    const timestamp = new Date().getTime()
    const randomSuffix = Math.floor(Math.random() * 1000)
    let id = `b${timestamp}${randomSuffix}`
    const barcode = generateBorrowingBarcode(id)

    // Add a check to ensure the ID doesn't already exist
    const { data: existingRecord } = await supabase.from("borrow_records").select("id").eq("id", id).single()

    if (existingRecord) {
      // In the extremely unlikely case of a collision, add another random number
      const newRandomSuffix = Math.floor(Math.random() * 1000)
      id = `b${timestamp}${randomSuffix}${newRandomSuffix}`
    }

    const { data, error } = await supabase
      .from("borrow_records")
      .insert({
        id,
        item_id: record.itemId,
        user_email: record.userEmail,
        borrow_date: record.borrowDate.toISOString(),
        return_date: record.returnDate ? record.returnDate.toISOString() : null,
        quantity: record.quantity,
        status: record.status,
        estimated_duration: record.estimatedDuration,
        barcode,
      })
      .select()
      .single()

    if (error) throw error

    // Update available quantity in inventory
    const { data: item, error: itemError } = await supabase
      .from("inventory_items")
      .select("available")
      .eq("id", record.itemId)
      .single()

    if (itemError) throw itemError

    const newAvailable = (item.available || 0) - record.quantity

    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({ available: newAvailable })
      .eq("id", record.itemId)

    if (updateError) throw updateError

    return dbRecordToBorrowRecord(data)
  } catch (error) {
    console.error("Error adding borrow record:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const records = localStorage.getItem("borrowRecords") ? JSON.parse(localStorage.getItem("borrowRecords")!) : []

      const id = `b${records.length + 1}`
      const barcode = generateBorrowingBarcode(id)

      const newRecord = {
        ...record,
        id,
        barcode,
      }

      records.push(newRecord)
      localStorage.setItem("borrowRecords", JSON.stringify(records))

      // Update available quantity
      const items = localStorage.getItem("inventoryItems") ? JSON.parse(localStorage.getItem("inventoryItems")!) : []

      const itemIndex = items.findIndex((item: any) => item.id === record.itemId)

      if (itemIndex !== -1) {
        items[itemIndex].available -= record.quantity
        localStorage.setItem("inventoryItems", JSON.stringify(items))
      }

      return newRecord
    }

    throw error
  }
}

// Update the returnBorrowedItem function to persist changes
// Return a borrowed item
export async function returnBorrowedItem(recordId: string): Promise<boolean> {
  try {
    // Get the record first
    const { data: record, error: recordError } = await supabase
      .from("borrow_records")
      .select("*")
      .eq("id", recordId)
      .eq("status", "active")
      .single()

    if (recordError) throw recordError

    if (!record) return false

    // Update the record
    const { error: updateError } = await supabase
      .from("borrow_records")
      .update({
        status: "returned",
        return_date: new Date().toISOString(),
      })
      .eq("id", recordId)

    if (updateError) throw updateError

    // Update available quantity in inventory
    const { data: item, error: itemError } = await supabase
      .from("inventory_items")
      .select("available")
      .eq("id", record.item_id)
      .single()

    if (itemError) throw itemError

    const newAvailable = (item.available || 0) + record.quantity

    const { error: updateItemError } = await supabase
      .from("inventory_items")
      .update({ available: newAvailable })
      .eq("id", record.item_id)

    if (updateItemError) throw updateItemError

    return true
  } catch (error) {
    console.error(`Error returning borrowed item with record ID ${recordId}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("borrowRecords")
      if (savedRecords) {
        const records = JSON.parse(savedRecords)
        const recordIndex = records.findIndex((r: any) => r.id === recordId && r.status === "active")

        if (recordIndex !== -1) {
          // Update the record
          records[recordIndex].status = "returned"
          records[recordIndex].returnDate = new Date()

          // Save updated records
          localStorage.setItem("borrowRecords", JSON.stringify(records))

          // Update available quantity in inventory
          const savedItems = localStorage.getItem("inventoryItems")
          if (savedItems) {
            const items = JSON.parse(savedItems)
            const itemIndex = items.findIndex((item: any) => item.id === records[recordIndex].itemId)

            if (itemIndex !== -1) {
              items[itemIndex].available += records[recordIndex].quantity
              localStorage.setItem("inventoryItems", JSON.stringify(items))
            }
          }

          return true
        }
      }
    }

    return false
  }
}

// Get all borrow records by user
export async function getBorrowRecordsByUser(email: string): Promise<BorrowRecord[]> {
  try {
    const { data, error } = await supabase.from("borrow_records").select("*").eq("user_email", email)

    if (error) throw error

    return (data || []).map(dbRecordToBorrowRecord)
  } catch (error) {
    console.error(`Error getting borrow records for user ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("borrowRecords")
      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords)
        return parsedRecords
          .filter((record: any) => record.userEmail === email)
          .map((record: any) => ({
            ...record,
            borrowDate: new Date(record.borrowDate),
            returnDate: record.returnDate ? new Date(record.returnDate) : null,
          }))
      }
    }

    return []
  }
}

// Get active borrow records by user
export function getActiveBorrowRecordsByUser(email: string) {
  const records = loadBorrowRecords()
  return records.filter((record) => record.userEmail === email && record.status === "active")
}

// Get borrow records by date range
export function getBorrowRecordsByDateRange(startDate: Date, endDate: Date) {
  const records = loadBorrowRecords()
  return records.filter((record) => {
    const borrowDate = new Date(record.borrowDate)
    return borrowDate >= startDate && borrowDate <= endDate
  })
}

// Get all users
// Get all users
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from("users").select("*")

    if (error) throw error

    return (data || []).map(dbUserToUser)
  } catch (error) {
    console.error("Error getting users:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers)
        return parsedUsers.map((user: any) => ({
          ...user,
          birthDate: user.birthDate ? new Date(user.birthDate) : null,
          createdAt: new Date(user.createdAt),
        }))
      }
    }

    return []
  }
}

// Add new user
// Add a new user
export async function addUser(user: Omit<User, "createdAt" | "barcode">): Promise<User> {
  try {
    // Check if user with this email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", user.email)
      .single()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const barcode = generateUserBarcode(user.email)

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: user.email,
        password: user.password,
        role: user.role,
        name: user.name,
        nip: user.nip || null,
        birth_date: user.birthDate ? user.birthDate.toISOString() : null,
        address: user.address || null,
        created_at: new Date().toISOString(),
        barcode,
      })
      .select()
      .single()

    if (error) throw error

    return dbUserToUser(data)
  } catch (error) {
    console.error("Error adding user:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const users = localStorage.getItem("users") ? JSON.parse(localStorage.getItem("users")!) : []

      // Check if user with this email already exists
      if (users.some((u: any) => u.email === user.email)) {
        throw new Error("User with this email already exists")
      }

      const barcode = generateUserBarcode(user.email)

      const newUser = {
        ...user,
        createdAt: new Date(),
        barcode,
      }

      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))

      return newUser
    }

    throw error
  }
}

// Update user
// Update a user
export async function updateUser(email: string, updatedUser: Partial<User>): Promise<User | null> {
  try {
    const dbUser: any = {}

    if (updatedUser.password !== undefined) dbUser.password = updatedUser.password
    if (updatedUser.role !== undefined) dbUser.role = updatedUser.role
    if (updatedUser.name !== undefined) dbUser.name = updatedUser.name
    if (updatedUser.nip !== undefined) dbUser.nip = updatedUser.nip
    if (updatedUser.birthDate !== undefined)
      dbUser.birth_date = updatedUser.birthDate ? updatedUser.birthDate.toISOString() : null
    if (updatedUser.address !== undefined) dbUser.address = updatedUser.address

    const { data, error } = await supabase.from("users").update(dbUser).eq("email", email).select().single()

    if (error) throw error

    return data ? dbUserToUser(data) : null
  } catch (error) {
    console.error(`Error updating user with email ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        const users = JSON.parse(savedUsers)
        const userIndex = users.findIndex((u: any) => u.email === email)

        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...updatedUser }
          localStorage.setItem("users", JSON.stringify(users))
          return users[userIndex]
        }
      }
    }

    return null
  }
}

// Delete user
// Delete a user
export async function deleteUser(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").delete().eq("email", email)

    if (error) throw error

    return true
  } catch (error) {
    console.error(`Error deleting user with email ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        const users = JSON.parse(savedUsers)
        const updatedUsers = users.filter((u: any) => u.email !== email)

        if (updatedUsers.length < users.length) {
          localStorage.setItem("users", JSON.stringify(updatedUsers))
          return true
        }
      }
    }

    return false
  }
}

// Get user by email
// Get a user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) throw error

    return data ? dbUserToUser(data) : null
  } catch (error) {
    console.error(`Error getting user with email ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        const users = JSON.parse(savedUsers)
        const user = users.find((u: any) => u.email === email)

        if (user) {
          return {
            ...user,
            birthDate: user.birthDate ? new Date(user.birthDate) : null,
            createdAt: new Date(user.createdAt),
          }
        }
      }
    }

    return null
  }
}

// Authenticate user
// Authenticate a user
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ email: string; role: string; name: string } | null> {
  try {
    // Remove .single() to avoid errors when no user is found
    const { data, error } = await supabase
      .from("users")
      .select("email, role, name")
      .eq("email", email)
      .eq("password", password)

    if (error) throw error

    // Check if we got any results
    if (!data || data.length === 0) {
      console.log(`No user found with email ${email} and matching password`)
      return null
    }

    // If we have multiple results (shouldn't happen with proper DB constraints),
    // just use the first one and log a warning
    if (data.length > 1) {
      console.warn(`Multiple users found with email ${email}, using the first one`)
    }

    return data[0]
  } catch (error) {
    console.error(`Error authenticating user with email ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        try {
          const users = JSON.parse(savedUsers)
          const user = users.find((u: any) => u.email === email && u.password === password)

          if (user) {
            return {
              email: user.email,
              role: user.role,
              name: user.name,
            }
          }
        } catch (parseError) {
          console.error("Error parsing users from localStorage:", parseError)
        }
      }
    }

    return null
  }
}

// Add a function to update user profile
// Update a user's profile
export async function updateUserProfile(
  email: string,
  userData: Partial<Omit<User, "email" | "password" | "role" | "createdAt">>,
): Promise<User | null> {
  try {
    const dbUser: any = {}

    if (userData.name !== undefined) dbUser.name = userData.name
    if (userData.nip !== undefined) dbUser.nip = userData.nip
    if (userData.birthDate !== undefined)
      dbUser.birth_date = userData.birthDate ? userData.birthDate.toISOString() : null
    if (userData.address !== undefined) dbUser.address = userData.address

    const { data, error } = await supabase.from("users").update(dbUser).eq("email", email).select().single()

    if (error) throw error

    return data ? dbUserToUser(data) : null
  } catch (error) {
    console.error(`Error updating profile for user with email ${email}:`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("users")
      if (savedUsers) {
        const users = JSON.parse(savedUsers)
        const userIndex = users.findIndex((u: any) => u.email === email)

        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...userData }
          localStorage.setItem("users", JSON.stringify(users))
          return users[userIndex]
        }
      }
    }

    return null
  }
}

// Add a function to get active borrowings
// Get active borrowings
export async function getActiveBorrowings(): Promise<BorrowRecord[]> {
  try {
    const { data, error } = await supabase.from("borrow_records").select("*").eq("status", "active")

    if (error) throw error

    return (data || []).map(dbRecordToBorrowRecord)
  } catch (error) {
    console.error("Error getting active borrowings:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("borrowRecords")
      if (savedRecords) {
        const records = JSON.parse(savedRecords)
        return records
          .filter((r: any) => r.status === "active")
          .map((r: any) => ({
            ...r,
            borrowDate: new Date(r.borrowDate),
            returnDate: r.returnDate ? new Date(r.returnDate) : null,
          }))
      }
    }

    return []
  }
}

// Add a function to get recent returns
// Get recent returns
export async function getRecentReturns(days = 7): Promise<BorrowRecord[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from("borrow_records")
      .select("*")
      .eq("status", "returned")
      .gte("return_date", cutoffDate.toISOString())

    if (error) throw error

    return (data || []).map(dbRecordToBorrowRecord)
  } catch (error) {
    console.error(`Error getting recent returns (${days} days):`, error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("borrowRecords")
      if (savedRecords) {
        const records = JSON.parse(savedRecords)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        return records
          .filter((r: any) => r.status === "returned" && r.returnDate && new Date(r.returnDate) >= cutoffDate)
          .map((r: any) => ({
            ...r,
            borrowDate: new Date(r.borrowDate),
            returnDate: r.returnDate ? new Date(r.returnDate) : null,
          }))
      }
    }

    return []
  }
}

export function getInventoryItemFromLocalStorageById(id: string): InventoryItem | undefined {
  const items = loadInventoryItems()
  return items.find((item) => item.id === id)
}

// Function to refresh inventory data
// Update refreshInventoryData to always fetch from Supabase
export async function refreshInventoryData(): Promise<InventoryItem[]> {
  try {
    console.log("Refreshing inventory data from Supabase")
    const { data, error } = await supabase.from("inventory_items").select("*")

    if (error) throw error

    const items = (data || []).map(dbItemToInventoryItem)
    console.log(`Refreshed ${items.length} items from Supabase`)

    // Update localStorage with the latest data
    if (typeof window !== "undefined") {
      const itemsToSave = items.map((item) => ({
        ...item,
        addedDate: item.addedDate.toISOString(),
        lastCalibration:
          item.type === "tool" && (item as ToolItem).lastCalibration
            ? (item as ToolItem).lastCalibration?.toISOString()
            : null,
        nextCalibration:
          item.type === "tool" && (item as ToolItem).nextCalibration
            ? (item as ToolItem).nextCalibration?.toISOString()
            : null,
      }))

      localStorage.setItem("inventoryItems", JSON.stringify(itemsToSave))
    }

    return items
  } catch (error) {
    console.error("Error refreshing inventory data from Supabase:", error)

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      console.log("Falling back to localStorage for inventory refresh")
      return loadInventoryItems()
    }

    return []
  }
}

// Debug function to check data availability
export function debugDataAvailability() {
  if (typeof window !== "undefined") {
    const inventoryItems = localStorage.getItem("inventoryItems")
    const borrowRecords = localStorage.getItem("borrowRecords")
    const users = localStorage.getItem("users")

    console.log("Data Availability Check:")
    console.log(`- Inventory Items: ${inventoryItems ? JSON.parse(inventoryItems).length : 0} items`)
    console.log(`- Borrow Records: ${borrowRecords ? JSON.parse(borrowRecords).length : 0} records`)
    console.log(`- Users: ${users ? JSON.parse(users).length : 0} users`)

    return {
      inventoryItems: inventoryItems ? JSON.parse(inventoryItems).length : 0,
      borrowRecords: borrowRecords ? JSON.parse(borrowRecords).length : 0,
      users: users ? JSON.parse(users).length : 0,
    }
  }

  return {
    inventoryItems: 0,
    borrowRecords: 0,
    users: 0,
  }
}
