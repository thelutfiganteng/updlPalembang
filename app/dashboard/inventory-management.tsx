"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useMemo, useEffect, useRef } from "react"
import { Download, Eye, Search, Trash, Plus, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  type InventoryItem,
  type MaterialItem,
  type APDItem,
  type ToolItem,
  deleteInventoryItem,
  updateInventoryItem,
  loadInventoryItems,
  getInventoryItems,
  refreshInventoryData,
} from "@/lib/data"
import { toast } from "@/hooks/use-toast"
// Update the ItemDetailModal import to ensure it's properly imported
import ItemDetailModal from "./item-detail-modal"
// First, update the imports to include our new ImageUpload component
import { ImageUpload } from "@/components/ui/image-upload"

// Add these imports at the top
import { BarcodeScanner } from "@/components/ui/barcode-scanner"

export default function InventoryManagement() {
  // Replace these lines:
  // const [tools, setTools] = useState<ToolItem[]>(getInventoryItemsByType("tool") as ToolItem[])
  // const [materials, setMaterials] = useState<MaterialItem[]>(getInventoryItemsByType("material") as MaterialItem[])
  // const [apdItems, setApdItems] = useState<APDItem[]>(getInventoryItemsByType("apd") as APDItem[])

  // With these lines:
  const [tools, setTools] = useState<ToolItem[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [apdItems, setApdItems] = useState<APDItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [toolSearchTerm, setToolSearchTerm] = useState("")
  const [materialSearchTerm, setMaterialSearchTerm] = useState("")
  const [apdSearchTerm, setApdSearchTerm] = useState("")

  const [toolConditionFilter, setToolConditionFilter] = useState<string>("all")
  const [materialConditionFilter, setMaterialConditionFilter] = useState<string>("all")
  const [apdConditionFilter, setApdConditionFilter] = useState<string>("all")

  // Item detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Add these state variables after the existing state declarations (around line 40)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null)

  const [newTool, setNewTool] = useState<Partial<ToolItem>>({})
  const [newMaterial, setNewMaterial] = useState<Partial<MaterialItem>>({})
  const [newAPD, setNewAPD] = useState<Partial<APDItem>>({})

  // Add these state variables after the existing state declarations (around line 40)
  const [addToolModalOpen, setAddToolModalOpen] = useState(false)
  const [addMaterialModalOpen, setAddMaterialModalOpen] = useState(false)
  const [addAPDModalOpen, setAddAPDModalOpen] = useState(false)

  // Initialize empty form states for new items
  const [newToolForm, setNewToolForm] = useState<Partial<ToolItem>>({
    name: "",
    brand: "",
    toolNumber: "",
    serialNumber: "",
    year: new Date().getFullYear(),
    quantity: 1,
    available: 1,
    unit: "pcs",
    location: "",
    condition: "Good",
    description: "",
    image: "",
    sop: "",
    notes: "",
    measuringToolNumber: "",
  })

  const [newMaterialForm, setNewMaterialForm] = useState<Partial<MaterialItem>>({
    name: "",
    brand: "",
    year: new Date().getFullYear(),
    quantity: 1,
    available: 1,
    unit: "pcs",
    location: "",
    condition: "Good",
    description: "",
    image: "",
    usagePeriod: "",
  })

  const [newAPDForm, setNewAPDForm] = useState<Partial<APDItem>>({
    name: "",
    brand: "",
    year: new Date().getFullYear(),
    quantity: 1,
    available: 1,
    unit: "pcs",
    location: "",
    condition: "Good",
    description: "",
    image: "",
    usagePeriod: "",
  })

  // Add validation state
  const [formErrors, setFormErrors] = useState<{
    tool: string | null
    material: string | null
    apd: string | null
  }>({
    tool: null,
    material: null,
    apd: null,
  })

  // Add loading state for form submissions
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Function to format date for input fields
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ""
    return date.toISOString().split("T")[0]
  }

  // Add this at the beginning of the component function, after all the state declarations
  const isMounted = useRef(true)

  // Add this new function at the beginning of the component, after all the state declarations
  // Update the forceRefreshInventory function to use the async refreshInventoryData
  const forceRefreshInventory = async () => {
    setIsLoading(true)

    try {
      // Use the async refreshInventoryData function to get data directly from Supabase
      const allItems = await refreshInventoryData()
      console.log("Force refreshing inventory from Supabase, total items:", allItems.length)

      // Filter by type
      const toolItems = allItems.filter((item) => item.type === "tool") as ToolItem[]
      const materialItems = allItems.filter((item) => item.type === "material") as MaterialItem[]
      const apdItems = allItems.filter((item) => item.type === "apd") as APDItem[]

      console.log(`Found: ${toolItems.length} tools, ${materialItems.length} materials, ${apdItems.length} APD items`)

      // Update state with new references to trigger re-renders
      if (isMounted.current) {
        setTools([...toolItems])
        setMaterials([...materialItems])
        setApdItems([...apdItems])

        // Reset search terms to ensure filtered views are also updated
        if (activeTab === "tools") setToolSearchTerm(toolSearchTerm)
        if (activeTab === "materials") setMaterialSearchTerm(materialSearchTerm)
        if (activeTab === "apd") setApdSearchTerm(apdSearchTerm)

        toast({
          title: "Inventory Refreshed",
          description: `Loaded ${toolItems.length} tools, ${materialItems.length} materials, and ${apdItems.length} APD items.`,
        })
      }
    } catch (error) {
      console.error("Error refreshing inventory:", error)
      if (isMounted.current) {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh inventory data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Clean up function to prevent state updates after unmount
    return () => {
      isMounted.current = false
    }
  }, [])

  // Add a new useEffect hook for initial data loading
  // Update the useEffect hook for initial data loading to use async getInventoryItems
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true

    // Load inventory data
    const loadInventoryData = async () => {
      try {
        setIsLoading(true)
        console.log("Initial inventory data loading from Supabase...")

        // Get data directly from Supabase
        const allItems = await getInventoryItems()
        console.log("Total items loaded from Supabase:", allItems.length)

        // Filter by type
        const toolItems = allItems.filter((item) => item.type === "tool") as ToolItem[]
        const materialItems = allItems.filter((item) => item.type === "material") as MaterialItem[]
        const apdItems = allItems.filter((item) => item.type === "apd") as APDItem[]

        console.log(`Found: ${toolItems.length} tools, ${materialItems.length} materials, ${apdItems.length} APD items`)

        if (isMounted.current) {
          // Create new array references to ensure React detects the changes
          setTools([...toolItems])
          setMaterials([...materialItems])
          setApdItems([...apdItems])
        }
      } catch (error) {
        console.error("Error loading inventory data:", error)
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    loadInventoryData()

    // Clean up function to prevent state updates after unmount
    return () => {
      isMounted.current = false
    }
  }, [])

  // Replace the existing filter functions with these safer versions
  // Replace the filteredTools function with:
  const filteredTools = useMemo(() => {
    if (!Array.isArray(tools)) return []

    return tools.filter((tool) => {
      if (!tool) return false
      const searchTermMatch =
        tool.name.toLowerCase().includes((toolSearchTerm || "").toLowerCase()) ||
        (tool.brand || "").toLowerCase().includes((toolSearchTerm || "").toLowerCase()) ||
        (tool.toolNumber || "").toLowerCase().includes((toolSearchTerm || "").toLowerCase()) ||
        (tool.serialNumber || "").toLowerCase().includes((toolSearchTerm || "").toLowerCase())
      const conditionMatch = toolConditionFilter === "all" || tool.condition === toolConditionFilter
      return searchTermMatch && conditionMatch
    })
  }, [tools, toolSearchTerm, toolConditionFilter])

  // Replace the filteredMaterials function with:
  const filteredMaterials = useMemo(() => {
    if (!Array.isArray(materials)) return []

    return materials.filter((material) => {
      if (!material) return false
      const searchTermMatch =
        material.name.toLowerCase().includes((materialSearchTerm || "").toLowerCase()) ||
        (material.brand || "").toLowerCase().includes((materialSearchTerm || "").toLowerCase())
      const conditionMatch = materialConditionFilter === "all" || material.condition === materialConditionFilter
      return searchTermMatch && conditionMatch
    })
  }, [materials, materialSearchTerm, materialConditionFilter])

  // Replace the filteredApdItems function with:
  const filteredApdItems = useMemo(() => {
    if (!Array.isArray(apdItems)) return []

    return apdItems.filter((apd) => {
      if (!apd) return false
      const searchTermMatch =
        apd.name.toLowerCase().includes((apdSearchTerm || "").toLowerCase()) ||
        (apd.brand || "").toLowerCase().includes((apdSearchTerm || "").toLowerCase())
      const conditionMatch = apdConditionFilter === "all" || apd.condition === apdConditionFilter
      return searchTermMatch && conditionMatch
    })
  }, [apdItems, apdSearchTerm, apdConditionFilter])

  // Function to export data as CSV
  const exportToCSV = (items: InventoryItem[], type: string) => {
    // Create CSV header based on item type
    let header = ""
    if (type === "tool") {
      header =
        "ID,Name,Brand,Tool Number,Serial Number,Year,Quantity,Available,Unit,Location,Condition,Description,Added Date\n"
    } else if (type === "material") {
      header = "ID,Name,Brand,Year,Quantity,Available,Unit,Location,Usage Period,Condition,Description,Added Date\n"
    } else if (type === "apd") {
      header = "ID,Name,Brand,Year,Quantity,Available,Unit,Location,Usage Period,Condition,Description,Added Date\n"
    }

    // Create CSV rows
    const rows = items
      .map((item) => {
        if (item.type === "tool" && type === "tool") {
          const tool = item as ToolItem
          return `${tool.id},"${tool.name}","${tool.brand}","${tool.toolNumber}","${tool.serialNumber}",${tool.year},${tool.quantity},${tool.available},"${tool.unit}","${tool.location}","${tool.condition}","${tool.description.replace(/"/g, '""')}","${tool.addedDate.toLocaleDateString()}"`
        } else if (item.type === "material" && type === "material") {
          const material = item as MaterialItem
          return `${material.id},"${material.name}","${material.brand}",${material.year},${material.quantity},${material.available},"${material.unit}","${material.location}","${material.usagePeriod}","${material.condition}","${material.description.replace(/"/g, '""')}","${material.addedDate.toLocaleDateString()}"`
        } else if (item.type === "apd" && type === "apd") {
          const apd = item as APDItem
          return `${apd.id},"${apd.name}","${apd.brand}",${apd.year},${apd.quantity},${apd.available},"${apd.unit}","${apd.location}","${apd.usagePeriod}","${apd.condition}","${apd.description.replace(/"/g, '""')}","${apd.addedDate.toLocaleDateString()}"`
        }
        return ""
      })
      .join("\n")

    // Combine header and rows
    const csv = header + rows

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `inventory_${type}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (isMounted.current) {
      toast({
        title: "Export Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} inventory data has been exported to CSV.`,
      })
    }
  }

  // Function to view item details
  const viewItemDetails = (item: InventoryItem) => {
    setSelectedItem(item)
    setDetailModalOpen(true)
  }

  // Add these functions before the return statement (around line 400)
  // Function to validate tool form
  const validateToolForm = (): boolean => {
    if (!newToolForm.name || newToolForm.name.trim() === "") {
      setFormErrors((prev) => ({ ...prev, tool: "Tool name is required" }))
      return false
    }

    if (!newToolForm.toolNumber || newToolForm.toolNumber.trim() === "") {
      setFormErrors((prev) => ({ ...prev, tool: "Tool number is required" }))
      return false
    }

    if (!newToolForm.quantity || newToolForm.quantity < 1) {
      setFormErrors((prev) => ({ ...prev, tool: "Quantity must be at least 1" }))
      return false
    }

    setFormErrors((prev) => ({ ...prev, tool: null }))
    return true
  }

  // Function to validate material form
  const validateMaterialForm = (): boolean => {
    if (!newMaterialForm.name || newMaterialForm.name.trim() === "") {
      setFormErrors((prev) => ({ ...prev, material: "Material name is required" }))
      return false
    }

    if (!newMaterialForm.quantity || newMaterialForm.quantity < 1) {
      setFormErrors((prev) => ({ ...prev, material: "Quantity must be at least 1" }))
      return false
    }

    setFormErrors((prev) => ({ ...prev, material: null }))
    return true
  }

  // Function to validate APD form
  const validateAPDForm = (): boolean => {
    if (!newAPDForm.name || newAPDForm.name.trim() === "") {
      setFormErrors((prev) => ({ ...prev, apd: "APD name is required" }))
      return false
    }

    if (!newAPDForm.quantity || newAPDForm.quantity < 1) {
      setFormErrors((prev) => ({ ...prev, apd: "APD quantity is required" }))
      return false
    }

    setFormErrors((prev) => ({ ...prev, apd: null }))
    return true
  }

  // Find the handleAddTool function and replace it with this improved version
  const handleAddTool = async () => {
    // Reset any previous errors
    setFormErrors((prev) => ({ ...prev, tool: null }))

    if (!validateToolForm()) return

    setIsSubmitting(true)

    try {
      // Add the tool to the database
      const { addToolItem } = await import("@/lib/data")

      const newTool = await addToolItem({
        name: newToolForm.name || "",
        brand: newToolForm.brand || "",
        toolNumber: newToolForm.toolNumber || "",
        serialNumber: newToolForm.serialNumber || "",
        year: newToolForm.year || new Date().getFullYear(),
        quantity: newToolForm.quantity || 1,
        available: newToolForm.available || newToolForm.quantity || 1,
        unit: newToolForm.unit || "pcs",
        location: newToolForm.location || "",
        condition: newToolForm.condition || "Good",
        description: newToolForm.description || "",
        image: newToolForm.image || "",
        sop: newToolForm.sop || "",
        notes: newToolForm.notes || "",
        measuringToolNumber: newToolForm.measuringToolNumber || "",
        lastCalibration: null,
        nextCalibration: null,
        addedDate: new Date(),
      })

      // Refresh the tools list
      if (isMounted.current) {
        // Use a small timeout to allow the animation to complete
        setTimeout(() => {
          if (isMounted.current) {
            // Load all items and filter by type - DIRECT APPROACH
            const allItems = loadInventoryItems()
            console.log("Loaded items after add:", allItems.length)
            const toolItems = allItems.filter((item) => item.type === "tool") as ToolItem[]
            console.log("Filtered tool items:", toolItems.length)
            setTools(toolItems)

            // Reset the form
            setNewToolForm({
              name: "",
              brand: "",
              toolNumber: "",
              serialNumber: "",
              year: new Date().getFullYear(),
              quantity: 1,
              available: 1,
              unit: "pcs",
              location: "",
              condition: "Good",
              description: "",
              image: "",
              sop: "",
              notes: "",
              measuringToolNumber: "",
            })

            // Close the modal
            setAddToolModalOpen(false)

            // Show success message
            toast({
              title: "Tool Added Successfully",
              description: `${newTool.name} has been added to the inventory.`,
              variant: "default",
            })
          }
        }, 300) // Short delay for animation
      }
    } catch (error) {
      console.error("Error adding tool:", error)
      if (isMounted.current) {
        toast({
          title: "Error Adding Tool",
          description: "Failed to add tool. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false)
      }
    }
  }

  // Find the handleAddMaterial function and replace it with this improved version
  const handleAddMaterial = async () => {
    // Reset any previous errors
    setFormErrors((prev) => ({ ...prev, material: null }))

    if (!validateMaterialForm()) return

    setIsSubmitting(true)

    try {
      // Add the material to the database
      const { addMaterialItem } = await import("@/lib/data")

      const newMaterial = await addMaterialItem({
        name: newMaterialForm.name || "",
        brand: newMaterialForm.brand || "",
        year: newMaterialForm.year || new Date().getFullYear(),
        quantity: newMaterialForm.quantity || 1,
        available: newMaterialForm.available || newMaterialForm.quantity || 1,
        unit: newMaterialForm.unit || "pcs",
        location: newMaterialForm.location || "",
        condition: newMaterialForm.condition || "Good",
        description: newMaterialForm.description || "",
        image: newMaterialForm.image || "",
        usagePeriod: newMaterialForm.usagePeriod || "",
        addedDate: new Date(),
      })

      // Refresh the materials list
      if (isMounted.current) {
        // Use a small timeout to allow the animation to complete
        setTimeout(() => {
          if (isMounted.current) {
            // Load all items and filter by type - DIRECT APPROACH
            const allItems = loadInventoryItems()
            console.log("Loaded items after add:", allItems.length)
            const materialItems = allItems.filter((item) => item.type === "material") as MaterialItem[]
            console.log("Filtered material items:", materialItems.length)
            setMaterials(materialItems)

            // Reset the form
            setNewMaterialForm({
              name: "",
              brand: "",
              year: new Date().getFullYear(),
              quantity: 1,
              available: 1,
              unit: "pcs",
              location: "",
              condition: "Good",
              description: "",
              image: "",
              usagePeriod: "",
            })

            // Close the modal
            setAddMaterialModalOpen(false)

            // Show success message
            toast({
              title: "Material Added Successfully",
              description: `${newMaterial.name} has been added to the inventory.`,
              variant: "default",
            })
          }
        }, 300) // Short delay for animation
      }
    } catch (error) {
      console.error("Error adding material:", error)
      if (isMounted.current) {
        toast({
          title: "Error Adding Material",
          description: "Failed to add material. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false)
      }
    }
  }

  // Find the handleAddAPD function and replace it with this improved version
  const handleAddAPD = async () => {
    // Reset any previous errors
    setFormErrors((prev) => ({ ...prev, apd: null }))

    if (!validateAPDForm()) return

    setIsSubmitting(true)

    try {
      // Add the APD item to the database
      const { addAPDItem } = await import("@/lib/data")

      const newAPD = await addAPDItem({
        name: newAPDForm.name || "",
        brand: newAPDForm.brand || "",
        year: newAPDForm.year || new Date().getFullYear(),
        quantity: newAPDForm.quantity || 1,
        available: newAPDForm.available || newAPDForm.quantity || 1,
        unit: newAPDForm.unit || "pcs",
        location: newAPDForm.location || "",
        condition: newAPDForm.condition || "Good",
        description: newAPDForm.description || "",
        image: newAPDForm.image || "",
        usagePeriod: newAPDForm.usagePeriod || "",
        addedDate: new Date(),
      })

      // Refresh the APD items list
      if (isMounted.current) {
        // Use a small timeout to allow the animation to complete
        setTimeout(() => {
          if (isMounted.current) {
            // Load all items and filter by type - DIRECT APPROACH
            const allItems = loadInventoryItems()
            console.log("Loaded items after add:", allItems.length)
            const apdItems = allItems.filter((item) => item.type === "apd") as APDItem[]
            console.log("Filtered APD items:", apdItems.length)
            setApdItems(apdItems)

            // Reset the form
            setNewAPDForm({
              name: "",
              brand: "",
              year: new Date().getFullYear(),
              quantity: 1,
              available: 1,
              unit: "pcs",
              location: "",
              condition: "Good",
              description: "",
              image: "",
              usagePeriod: "",
            })

            // Close the modal
            setAddAPDModalOpen(false)

            // Show success message
            toast({
              title: "APD Item Added Successfully",
              description: `${newAPD.name} has been added to the inventory.`,
              variant: "default",
            })
          }
        }, 300) // Short delay for animation
      }
    } catch (error) {
      console.error("Error adding APD item:", error)
      if (isMounted.current) {
        toast({
          title: "Error Adding APD Item",
          description: "Failed to add APD item. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false)
      }
    }
  }

  // Function to handle delete confirmation
  const handleDeleteConfirm = (item: InventoryItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  // Modify the deleteItem function to check if component is still mounted
  const deleteItem = () => {
    if (!itemToDelete) return

    // Delete from localStorage first
    const success = deleteInventoryItem(itemToDelete.id)

    // In the deleteItem function, replace:
    // if (itemToDelete.type === "tool") {
    //   setTools(getInventoryItemsByType("tool") as ToolItem[])
    // } else if (itemToDelete.type === "material") {
    //   setMaterials(getInventoryItemsByType("material") as MaterialItem[])
    // } else if (itemToDelete.type === "apd") {
    //   setApdItems(getInventoryItemsByType("apd") as APDItem[])
    // }

    // With:
    if (success && isMounted.current) {
      // Load all items and filter by type
      const allItems = loadInventoryItems()

      if (itemToDelete.type === "tool") {
        const toolItems = allItems.filter((item) => item.type === "tool") as ToolItem[]
        setTools(toolItems)
      } else if (itemToDelete.type === "material") {
        const materialItems = allItems.filter((item) => item.type === "material") as MaterialItem[]
        setMaterials(materialItems)
      } else if (itemToDelete.type === "apd") {
        const apdItems = allItems.filter((item) => item.type === "apd") as APDItem[]
        setApdItems(apdItems)
      }

      toast({
        title: "Item Deleted",
        description: `${itemToDelete.name} has been removed from inventory.`,
      })
    } else if (isMounted.current) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }

    if (isMounted.current) {
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  // Function to open edit modal
  const handleEditItem = (item: InventoryItem) => {
    // Create a deep copy of the item to avoid reference issues
    const itemCopy = JSON.parse(JSON.stringify(item))
    setItemToEdit(itemCopy)

    if (item.type === "tool") {
      setNewTool({
        name: item.name,
        quantity: item.quantity,
        available: item.available,
        description: item.description,
        image: item.image,
        addedDate: new Date(item.addedDate),
        brand: (item as ToolItem).brand,
        year: (item as ToolItem).year,
        unit: (item as ToolItem).unit,
        toolNumber: (item as ToolItem).toolNumber,
        sop: (item as ToolItem).sop,
        location: (item as ToolItem).location,
        condition: (item as ToolItem).condition,
        serialNumber: (item as ToolItem).serialNumber,
        lastCalibration: (item as ToolItem).lastCalibration ? new Date((item as ToolItem).lastCalibration!) : null,
        nextCalibration: (item as ToolItem).nextCalibration ? new Date((item as ToolItem).nextCalibration!) : null,
        notes: (item as ToolItem).notes,
        measuringToolNumber: (item as ToolItem).measuringToolNumber,
      })
    } else if (item.type === "material") {
      setNewMaterial({
        name: item.name,
        quantity: item.quantity,
        available: item.available,
        description: item.description,
        image: item.image,
        addedDate: new Date(item.addedDate),
        brand: (item as MaterialItem).brand,
        year: (item as MaterialItem).year,
        unit: (item as MaterialItem).unit,
        location: (item as MaterialItem).location,
        usagePeriod: (item as MaterialItem).usagePeriod,
        condition: (item as MaterialItem).condition,
      })
    } else if (item.type === "apd") {
      setNewAPD({
        name: item.name,
        quantity: item.quantity,
        available: item.available,
        description: item.description,
        image: item.image,
        addedDate: new Date(item.addedDate),
        brand: (item as APDItem).brand,
        year: (item as APDItem).year,
        unit: (item as APDItem).unit,
        location: (item as APDItem).location,
        usagePeriod: (item as APDItem).usagePeriod,
        condition: (item as APDItem).condition,
      })
    }

    setEditModalOpen(true)
  }

  // Modify the saveEditedItem function to check if component is still mounted
  const saveEditedItem = async () => {
    if (!itemToEdit) return

    setIsSubmitting(true)

    try {
      let updatedItem: InventoryItem

      if (itemToEdit.type === "tool") {
        updatedItem = { ...itemToEdit, ...newTool, id: itemToEdit.id, type: "tool" }
      } else if (itemToEdit.type === "material") {
        updatedItem = { ...itemToEdit, ...newMaterial, id: itemToEdit.id, type: "material" }
      } else if (itemToEdit.type === "apd") {
        updatedItem = { ...itemToEdit, ...newAPD, id: itemToEdit.id, type: "apd" }
      } else {
        return
      }

      // Update in localStorage/database
      const success = await updateInventoryItem(itemToEdit.id, updatedItem)

      if (success) {
        // Directly update the corresponding state array to ensure immediate UI update
        if (updatedItem.type === "tool") {
          setTools((prevTools) =>
            prevTools.map((tool) => (tool.id === updatedItem.id ? (updatedItem as ToolItem) : tool)),
          )
        } else if (updatedItem.type === "material") {
          setMaterials((prevMaterials) =>
            prevMaterials.map((material) =>
              material.id === updatedItem.id ? (updatedItem as MaterialItem) : material,
            ),
          )
        } else if (updatedItem.type === "apd") {
          setApdItems((prevApdItems) =>
            prevApdItems.map((apd) => (apd.id === updatedItem.id ? (updatedItem as APDItem) : apd)),
          )
        }

        // Also trigger a full refresh to ensure consistency with backend
        setTimeout(() => {
          forceRefreshInventory()
        }, 100)

        toast({
          title: "Item Updated",
          description: `${itemToEdit.name} has been updated successfully.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the item.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setEditModalOpen(false)
      setItemToEdit(null)
    }
  }

  const [activeTab, setActiveTab] = useState("tools")

  // Add this function inside the component, before the return statement
  const handleBarcodeScan = (barcode: string, type: "item" | "borrowing" | "user" | "unknown") => {
    // If it's an item barcode, search for it
    if (type === "item") {
      const allItems = loadInventoryItems()
      const foundItem = allItems.find((item) => item.barcode === barcode)

      if (foundItem) {
        // Set the appropriate search term based on item type
        if (foundItem.type === "tool") {
          setToolSearchTerm(foundItem.name)
          setActiveTab("tools")
        } else if (foundItem.type === "material") {
          setMaterialSearchTerm(foundItem.name)
          setActiveTab("materials")
        } else if (foundItem.type === "apd") {
          setApdSearchTerm(foundItem.name)
          setActiveTab("apd")
        }

        // Show a success toast
        toast({
          title: "Item Found",
          description: `Found ${foundItem.name} (${foundItem.type})`,
        })

        // Optionally, open the item detail modal
        setSelectedItem(foundItem)
        setDetailModalOpen(true)
      } else {
        // Show error toast if item not found
        toast({
          title: "Item Not Found",
          description: "No item found with this barcode",
          variant: "destructive",
        })
      }
    } else {
      // Show a message for non-item barcodes
      toast({
        title: "Invalid Barcode Type",
        description: `Expected item barcode, but got ${type} barcode`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Manajemen Inventaris</h2>
        <Button onClick={forceRefreshInventory} variant="outline" size="sm" className="self-end sm:self-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="tools" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="tools" className="transition-all">
            Tools
          </TabsTrigger>
          <TabsTrigger value="materials" className="transition-all">
            Materials
          </TabsTrigger>
          <TabsTrigger value="apd" className="transition-all">
            APD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading inventory data...</span>
            </div>
          )}
          {!isLoading && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inventaris Alat</CardTitle>
                    <CardDescription>Kelola inventaris alat Anda</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(tools, "tool")}
                      className="transition-all hover:bg-muted"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor CSV
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setAddToolModalOpen(true)}
                      className="transition-all duration-300 hover:scale-105 hover:shadow-md bg-primary text-primary-foreground"
                    >
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                        className="mr-2"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.div>
                      Tambah Alat
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="mb-4">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  placeholder="Scan item barcode or enter manually..."
                  className="w-full"
                />
              </div>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari alat..."
                        className="pl-10 h-10"
                        value={toolSearchTerm}
                        onChange={(e) => setToolSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={toolConditionFilter} onValueChange={setToolConditionFilter}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Filter berdasarkan kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kondisi</SelectItem>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:-mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Gambar
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Alat
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Nomor Alat
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Merek
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tahun
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Jumlah
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tersedia
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Kondisi
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Lokasi
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tindakan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {filteredTools.length > 0 ? (
                              filteredTools.map((tool) => (
                                <motion.tr
                                  key={tool.id}
                                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <td className="px-2 md:px-4 py-3 whitespace-nowrap">
                                    <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                      <img
                                        src={tool.image || "/placeholder.svg?height=40&width=40"}
                                        alt={tool.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.src =
                                            "/placeholder.svg?height=40&width=40&text=" +
                                            encodeURIComponent(tool.name.charAt(0))
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">{tool.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {tool.description}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">{tool.toolNumber}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{tool.brand}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{tool.year}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">{tool.quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        tool.available === 0
                                          ? "bg-red-100 text-red-800"
                                          : tool.available < tool.quantity / 2
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {tool.available}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        tool.condition === "Excellent"
                                          ? "bg-green-100 text-green-800"
                                          : tool.condition === "Good"
                                            ? "bg-blue-100 text-blue-800"
                                            : tool.condition === "Fair"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {tool.condition}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{tool.location}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                        onClick={() => viewItemDetails(tool)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-500 hover:bg-amber-50"
                                        onClick={() => handleEditItem(tool)}
                                      >
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
                                        >
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                          <path d="m15 5 4 4"></path>
                                        </svg>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                        onClick={() => handleDeleteConfirm(tool)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mb-4">
                                      <Search className="h-6 w-6 text-muted-foreground opacity-40" />
                                    </div>
                                    <p className="font-medium mb-1">Tidak ada alat ditemukan</p>
                                    <p className="text-sm">Coba sesuaikan pencarian atau filter Anda</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading inventory data...</span>
            </div>
          )}
          {!isLoading && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inventaris Material</CardTitle>
                    <CardDescription>Kelola inventaris material Anda</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(materials, "material")}
                      className="transition-all hover:bg-muted"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor CSV
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setAddMaterialModalOpen(true)}
                      className="transition-all duration-300 hover:scale-105 hover:shadow-md bg-primary text-primary-foreground"
                    >
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                        className="mr-2"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.div>
                      Tambah Material
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="mb-4">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  placeholder="Scan item barcode or enter manually..."
                  className="w-full"
                />
              </div>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari material..."
                        className="pl-10"
                        value={materialSearchTerm}
                        onChange={(e) => setMaterialSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={materialConditionFilter} onValueChange={setMaterialConditionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter berdasarkan kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kondisi</SelectItem>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:-mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Gambar
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Material
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Merek
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tahun
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Jumlah
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tersedia
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Satuan
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Masa Pakai
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Kondisi
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Lokasi
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tindakan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {filteredMaterials.length > 0 ? (
                              filteredMaterials.map((material) => (
                                <motion.tr key={material.id} whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <img
                                      src={material.image || "/placeholder.svg?height=40&width=40"}
                                      alt={material.name}
                                      className="h-10 w-10 rounded-md object-cover bg-gray-100"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src =
                                          "/placeholder.svg?height=40&width=40&text=" +
                                          encodeURIComponent(material.name.charAt(0))
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">{material.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {material.description}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{material.brand}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{material.year}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">{material.quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        material.available === 0
                                          ? "bg-red-100 text-red-800"
                                          : material.available < material.quantity / 2
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {material.available}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{material.unit}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                    {material.usagePeriod}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        material.condition === "Excellent"
                                          ? "bg-green-100 text-green-800"
                                          : material.condition === "Good"
                                            ? "bg-blue-100 text-blue-800"
                                            : material.condition === "Fair"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {material.condition}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                    {material.location}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500"
                                        onClick={() => viewItemDetails(material)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-500"
                                        onClick={() => handleEditItem(material)}
                                      >
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
                                        >
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                          <path d="m15 5 4 4"></path>
                                        </svg>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => handleDeleteConfirm(material)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                                  Tidak ada material yang sesuai dengan kriteria Anda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apd">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading inventory data...</span>
            </div>
          )}
          {!isLoading && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inventaris APD</CardTitle>
                    <CardDescription>Kelola inventaris alat pelindung diri Anda</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(apdItems, "apd")}
                      className="transition-all hover:bg-muted"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ekspor CSV
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setAddAPDModalOpen(true)}
                      className="transition-all duration-300 hover:scale-105 hover:shadow-md bg-primary text-primary-foreground"
                    >
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                        className="mr-2"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.div>
                      Tambah APD
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="mb-4">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  placeholder="Scan item barcode or enter manually..."
                  className="w-full"
                />
              </div>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari item APD..."
                        className="pl-10"
                        value={apdSearchTerm}
                        onChange={(e) => setApdSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={apdConditionFilter} onValueChange={setApdConditionFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter berdasarkan kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kondisi</SelectItem>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:-mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Gambar
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Item APD
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Merek
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tahun
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Jumlah
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tersedia
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Satuan
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Masa Pakai
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Kondisi
                              </th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Lokasi
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Tindakan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            {filteredApdItems.length > 0 ? (
                              filteredApdItems.map((apd) => (
                                <motion.tr key={apd.id} whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <img
                                      src={apd.image || "/placeholder.svg?height=40&width=40"}
                                      alt={apd.name}
                                      className="h-10 w-10 rounded-md object-cover bg-gray-100"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src =
                                          "/placeholder.svg?height=40&width=40&text=" +
                                          encodeURIComponent(apd.name.charAt(0))
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-medium">{apd.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {apd.description}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{apd.brand}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{apd.year}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">{apd.quantity}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        apd.available === 0
                                          ? "bg-red-100 text-red-800"
                                          : apd.available < apd.quantity / 2
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {apd.available}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{apd.unit}</td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                                    {apd.usagePeriod}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                                    <span
                                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                                        apd.condition === "Excellent"
                                          ? "bg-green-100 text-green-800"
                                          : apd.condition === "Good"
                                            ? "bg-blue-100 text-blue-800"
                                            : apd.condition === "Fair"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {apd.condition}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{apd.location}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500"
                                        onClick={() => viewItemDetails(apd)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-500"
                                        onClick={() => handleEditItem(apd)}
                                      >
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
                                        >
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                          <path d="m15 5 4 4"></path>
                                        </svg>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => handleDeleteConfirm(apd)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                                  Tidak ada item APD yang sesuai dengan kriteria Anda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {itemToDelete?.name}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteItem}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {itemToEdit?.type.charAt(0).toUpperCase() + itemToEdit?.type.slice(1)}</DialogTitle>
            <DialogDescription>Perbarui detail untuk {itemToEdit?.name}.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {itemToEdit?.type === "tool" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nama Alat</Label>
                      <Input
                        id="edit-name"
                        value={newTool.name}
                        onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                        placeholder="Masukkan nama alat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-brand">Merek</Label>
                      <Input
                        id="edit-brand"
                        value={newTool.brand}
                        onChange={(e) => setNewTool({ ...newTool, brand: e.target.value })}
                        placeholder="Masukkan merek"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-toolNumber">Nomor Alat</Label>
                      <Input
                        id="edit-toolNumber"
                        value={newTool.toolNumber}
                        onChange={(e) => setNewTool({ ...newTool, toolNumber: e.target.value })}
                        placeholder="Masukkan nomor alat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-serialNumber">Serial Number</Label>
                      <Input
                        id="edit-serialNumber"
                        value={newTool.serialNumber}
                        onChange={(e) => setNewTool({ ...newTool, serialNumber: e.target.value })}
                        placeholder="Masukkan nomor seri"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-year">Tahun</Label>
                      <Input
                        id="edit-year"
                        type="number"
                        value={newTool.year}
                        onChange={(e) =>
                          setNewTool({
                            ...newTool,
                            year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Jumlah Total</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        min={1}
                        value={newTool.quantity}
                        onChange={(e) => {
                          const qty = Number.parseInt(e.target.value) || 1
                          setNewTool({
                            ...newTool,
                            quantity: qty,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-available">Tersedia</Label>
                      <Input
                        id="edit-available"
                        type="number"
                        min={0}
                        max={newTool.quantity}
                        value={newTool.available}
                        onChange={(e) => {
                          const avail = Number.parseInt(e.target.value) || 0
                          setNewTool({
                            ...newTool,
                            available: Math.min(avail, newTool.quantity),
                          })
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Lokasi</Label>
                      <Input
                        id="edit-location"
                        value={newTool.location}
                        onChange={(e) => setNewTool({ ...newTool, location: e.target.value })}
                        placeholder="Masukkan lokasi penyimpanan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-condition">Kondisi</Label>
                      <Select
                        value={newTool.condition}
                        onValueChange={(value) => setNewTool({ ...newTool, condition: value })}
                      >
                        <SelectTrigger id="edit-condition">
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={newTool.description}
                      onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                      placeholder="Masukkan deskripsi alat"
                    />
                  </div>
                  {/* // Replace the URL-based image input in the Edit Item modal with our ImageUpload component // Find the
                  section with the label "URL Gambar" in the edit form for tools and replace it with: */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Gambar Alat</Label>
                    <ImageUpload
                      initialImage={newTool.image}
                      onImageChange={(imageData) => setNewTool({ ...newTool, image: imageData || "" })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {itemToEdit?.type === "material" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nama Material</Label>
                      <Input
                        id="edit-name"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        placeholder="Masukkan nama material"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-brand">Merek</Label>
                      <Input
                        id="edit-brand"
                        value={newMaterial.brand}
                        onChange={(e) => setNewMaterial({ ...newMaterial, brand: e.target.value })}
                        placeholder="Masukkan merek"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-year">Tahun</Label>
                      <Input
                        id="edit-year"
                        type="number"
                        value={newMaterial.year}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Jumlah Total</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        min={1}
                        value={newMaterial.quantity}
                        onChange={(e) => {
                          const qty = Number.parseInt(e.target.value) || 1
                          setNewMaterial({
                            ...newMaterial,
                            quantity: qty,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-available">Tersedia</Label>
                      <Input
                        id="edit-available"
                        type="number"
                        min={0}
                        max={newMaterial.quantity}
                        value={newMaterial.available}
                        onChange={(e) => {
                          const avail = Number.parseInt(e.target.value) || 0
                          setNewMaterial({
                            ...newMaterial,
                            available: Math.min(avail, newMaterial.quantity),
                          })
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Lokasi</Label>
                      <Input
                        id="edit-location"
                        value={newMaterial.location}
                        onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
                        placeholder="Masukkan lokasi penyimpanan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-condition">Kondisi</Label>
                      <Select
                        value={newMaterial.condition}
                        onChange={(value) => setNewMaterial({ ...newMaterial, condition: value })}
                      >
                        <SelectTrigger id="edit-condition">
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-usagePeriod">Masa Pakai</Label>
                    <Input
                      id="edit-usagePeriod"
                      value={newMaterial.usagePeriod}
                      onChange={(e) => setNewMaterial({ ...newMaterial, usagePeriod: e.target.value })}
                      placeholder="e.g., 6 months, 2 years"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      placeholder="Masukkan deskripsi material"
                    />
                  </div>
                  // Find the section with the label "URL Gambar" in the edit form for materials and replace it with:
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Gambar Material</Label>
                    <ImageUpload
                      initialImage={newMaterial.image}
                      onImageChange={(imageData) => setNewMaterial({ ...newMaterial, image: imageData || "" })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {itemToEdit?.type === "apd" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nama APD</Label>
                      <Input
                        id="edit-name"
                        value={newAPD.name}
                        onChange={(e) => setNewAPD({ ...newAPD, name: e.target.value })}
                        placeholder="Masukkan nama APD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-brand">Merek</Label>
                      <Input
                        id="edit-brand"
                        value={newAPD.brand}
                        onChange={(e) => setNewAPD({ ...newAPD, brand: e.target.value })}
                        placeholder="Masukkan merek"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-year">Tahun</Label>
                      <Input
                        id="edit-year"
                        type="number"
                        value={newAPD.year}
                        onChange={(e) =>
                          setNewAPD({
                            ...newAPD,
                            year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Jumlah Total</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        min={1}
                        value={newAPD.quantity}
                        onChange={(e) => {
                          const qty = Number.parseInt(e.target.value) || 1
                          setNewAPD({
                            ...newAPD,
                            quantity: qty,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-available">Tersedia</Label>
                      <Input
                        id="edit-available"
                        type="number"
                        min={0}
                        max={newAPD.quantity}
                        value={newAPD.available}
                        onChange={(e) => {
                          const avail = Number.parseInt(e.target.value) || 0
                          setNewAPD({
                            ...newAPD,
                            available: Math.min(avail, newAPD.quantity),
                          })
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Lokasi</Label>
                      <Input
                        id="edit-location"
                        value={newAPD.location}
                        onChange={(e) => setNewAPD({ ...newAPD, location: e.target.value })}
                        placeholder="Masukkan lokasi penyimpanan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-condition">Kondisi</Label>
                      <Select value={newAPD.condition} onChange={(value) => setNewAPD({ ...newAPD, condition: value })}>
                        <SelectTrigger id="edit-condition">
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Sangat Baik</SelectItem>
                          <SelectItem value="Good">Baik</SelectItem>
                          <SelectItem value="Fair">Cukup</SelectItem>
                          <SelectItem value="Poor">Buruk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-usagePeriod">Masa Pakai</Label>
                    <Input
                      id="edit-usagePeriod"
                      value={newAPD.usagePeriod}
                      onChange={(e) => setNewAPD({ ...newAPD, usagePeriod: e.target.value })}
                      placeholder="e.g., 1 year, 3 years"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={newAPD.description}
                      onChange={(e) => setNewAPD({ ...newAPD, description: e.target.value })}
                      placeholder="Masukkan deskripsi APD"
                    />
                  </div>
                  // Find the section with the label "URL Gambar" in the edit form for APD and replace it with:
                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Gambar APD</Label>
                    <ImageUpload
                      initialImage={newAPD.image}
                      onImageChange={(imageData) => setNewAPD({ ...newAPD, image: imageData || "" })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedItem} className="transition-all hover:scale-105">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {addToolModalOpen && (
          <Dialog open={addToolModalOpen} onOpenChange={setAddToolModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl">Tambah Alat Baru</DialogTitle>
                  <DialogDescription>Isi detail untuk menambahkan alat baru ke inventaris.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {formErrors.tool && (
                    <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{formErrors.tool}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-name" className="flex items-center">
                          Nama Alat <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-tool-name"
                          value={newToolForm.name}
                          onChange={(e) => setNewToolForm({ ...newToolForm, name: e.target.value })}
                          placeholder="Masukkan nama alat"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-brand">Merek</Label>
                        <Input
                          id="add-tool-brand"
                          value={newToolForm.brand}
                          onChange={(e) => setNewToolForm({ ...newToolForm, brand: e.target.value })}
                          placeholder="Masukkan merek"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-number" className="flex items-center">
                          Nama Alat <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-tool-number"
                          value={newToolForm.toolNumber}
                          onChange={(e) => setNewToolForm({ ...newToolForm, toolNumber: e.target.value })}
                          placeholder="Masukkan nomor alat"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-serial">Serial Number</Label>
                        <Input
                          id="add-tool-serial"
                          value={newToolForm.serialNumber}
                          onChange={(e) => setNewToolForm({ ...newToolForm, serialNumber: e.target.value })}
                          placeholder="Masukkan nomor seri"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-year">Tahun</Label>
                        <Input
                          id="add-tool-year"
                          type="number"
                          value={newToolForm.year}
                          onChange={(e) =>
                            setNewToolForm({
                              ...newToolForm,
                              year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                            })
                          }
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-quantity" className="flex items-center">
                          Jumlah Total <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-tool-quantity"
                          type="number"
                          min={1}
                          value={newToolForm.quantity}
                          onChange={(e) => {
                            const qty = Number.parseInt(e.target.value) || 1
                            setNewToolForm({
                              ...newToolForm,
                              quantity: qty,
                              available: qty, // Set available to match quantity for new items
                            })
                          }}
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-unit">Unit</Label>
                        <Input
                          id="add-tool-unit"
                          value={newToolForm.unit}
                          onChange={(e) => setNewToolForm({ ...newToolForm, unit: e.target.value })}
                          placeholder="e.g., pcs, sets"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-location">Lokasi</Label>
                        <Input
                          id="add-tool-location"
                          value={newToolForm.location}
                          onChange={(e) => setNewToolForm({ ...newToolForm, location: e.target.value })}
                          placeholder="Masukkan lokasi penyimpanan"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-tool-condition">Kondisi</Label>
                        <Select
                          value={newToolForm.condition}
                          onValueChange={(value) => setNewToolForm({ ...newToolForm, condition: value })}
                        >
                          <SelectTrigger
                            id="add-tool-condition"
                            className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          >
                            <SelectValue placeholder="Pilih kondisi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">Sangat Baik</SelectItem>
                            <SelectItem value="Good">Baik</SelectItem>
                            <SelectItem value="Fair">Cukup</SelectItem>
                            <SelectItem value="Poor">Buruk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="add-tool-description">Description</Label>
                      <Textarea
                        id="add-tool-description"
                        value={newToolForm.description}
                        onChange={(e) => setNewToolForm({ ...newToolForm, description: e.target.value })}
                        placeholder="Masukkan deskripsi alat"
                        className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="add-tool-sop">Prosedur Operasi Standar</Label>
                      <Textarea
                        id="add-tool-sop"
                        value={newToolForm.sop}
                        onChange={(e) => setNewToolForm({ ...newToolForm, sop: e.target.value })}
                        placeholder="Masukkan prosedur operasi standar"
                        className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    {/* // Replace the URL-based image input in the Add Tool form with our ImageUpload component // Find the
                    section with the label "URL Gambar" and replace it with: */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Label htmlFor="add-tool-image">Gambar Alat</Label>
                      <ImageUpload
                        initialImage={newToolForm.image}
                        onImageChange={(imageData) => setNewToolForm({ ...newToolForm, image: imageData || "" })}
                      />
                    </motion.div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddToolModalOpen(false)}
                    disabled={isSubmitting}
                    className="transition-all duration-200 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddTool}
                    className="transition-all duration-200 hover:scale-105 relative"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Tambah Alat
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addMaterialModalOpen && (
          <Dialog open={addMaterialModalOpen} onOpenChange={setAddMaterialModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl">Tambah Material Baru</DialogTitle>
                  <DialogDescription>Isi detail untuk menambahkan material baru ke inventaris.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {formErrors.material && (
                    <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{formErrors.material}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-material-name" className="flex items-center">
                          Nama Material <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-material-name"
                          value={newMaterialForm.name}
                          onChange={(e) => setNewMaterialForm({ ...newMaterialForm, name: e.target.value })}
                          placeholder="Masukkan nama material"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-material-brand">Merek</Label>
                        <Input
                          id="add-material-brand"
                          value={newMaterialForm.brand}
                          onChange={(e) => setNewMaterialForm({ ...newMaterialForm, brand: e.target.value })}
                          placeholder="Masukkan merek"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-material-year">Tahun</Label>
                        <Input
                          id="add-material-year"
                          type="number"
                          value={newMaterialForm.year}
                          onChange={(e) =>
                            setNewMaterialForm({
                              ...newMaterialForm,
                              year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                            })
                          }
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-material-quantity" className="flex items-center">
                          Jumlah Total <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-material-quantity"
                          type="number"
                          min={1}
                          value={newMaterialForm.quantity}
                          onChange={(e) => {
                            const qty = Number.parseInt(e.target.value) || 1
                            setNewMaterialForm({
                              ...newMaterialForm,
                              quantity: qty,
                              available: qty, // Set available to match quantity for new items
                            })
                          }}
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-material-unit">Unit</Label>
                        <Input
                          id="add-material-unit"
                          value={newMaterialForm.unit}
                          onChange={(e) => setNewMaterialForm({ ...newMaterialForm, unit: e.target.value })}
                          placeholder="e.g., pcs, kg, meters"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-material-location">Lokasi</Label>
                        <Input
                          id="add-material-location"
                          value={newMaterialForm.location}
                          onChange={(e) => setNewMaterialForm({ ...newMaterialForm, location: e.target.value })}
                          placeholder="Masukkan lokasi penyimpanan"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-material-condition">Kondisi</Label>
                        <Select
                          value={newMaterialForm.condition}
                          onValueChange={(value) => setNewMaterialForm({ ...newMaterialForm, condition: value })}
                        >
                          <SelectTrigger
                            id="add-material-condition"
                            className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          >
                            <SelectValue placeholder="Pilih kondisi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">Sangat Baik</SelectItem>
                            <SelectItem value="Good">Baik</SelectItem>
                            <SelectItem value="Fair">Cukup</SelectItem>
                            <SelectItem value="Poor">Buruk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="add-material-usage">Masa Pakai</Label>
                      <Input
                        id="add-material-usage"
                        value={newMaterialForm.usagePeriod}
                        onChange={(e) => setNewMaterialForm({ ...newMaterialForm, usagePeriod: e.target.value })}
                        placeholder="e.g., 6 months, 2 years"
                        className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="add-material-description">Description</Label>
                      <Textarea
                        id="add-material-description"
                        value={newMaterialForm.description}
                        onChange={(e) => setNewMaterialForm({ ...newMaterialForm, description: e.target.value })}
                        placeholder="Masukkan deskripsi material"
                        className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    {/* // Replace the URL-based image input in the Add Material form with our ImageUpload component // Find
                    the section with the label "URL Gambar" and replace it with: */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="add-material-image">Gambar Material</Label>
                      <ImageUpload
                        initialImage={newMaterialForm.image}
                        onImageChange={(imageData) =>
                          setNewMaterialForm({ ...newMaterialForm, image: imageData || "" })
                        }
                      />
                    </motion.div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddMaterialModalOpen(false)}
                    disabled={isSubmitting}
                    className="transition-all duration-200 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMaterial}
                    className="transition-all duration-200 hover:scale-105 relative"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Tambah Material
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addAPDModalOpen && (
          <Dialog open={addAPDModalOpen} onOpenChange={setAddAPDModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-xl">Tambah APD Baru</DialogTitle>
                  <DialogDescription>
                    Isi detail untuk menambahkan alat pelindung diri baru ke inventaris.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {formErrors.apd && (
                    <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{formErrors.apd}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-name" className="flex items-center">
                          Nama APD <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-apd-name"
                          value={newAPDForm.name}
                          onChange={(e) => setNewAPDForm({ ...newAPDForm, name: e.target.value })}
                          placeholder="Masukkan nama APD"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-brand">Merek</Label>
                        <Input
                          id="add-apd-brand"
                          value={newAPDForm.brand}
                          onChange={(e) => setNewAPDForm({ ...newAPDForm, brand: e.target.value })}
                          placeholder="Masukkan merek"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-year">Tahun</Label>
                        <Input
                          id="add-apd-year"
                          type="number"
                          value={newAPDForm.year}
                          onChange={(e) =>
                            setNewAPDForm({
                              ...newAPDForm,
                              year: Number.parseInt(e.target.value) || new Date().getFullYear(),
                            })
                          }
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-quantity" className="flex items-center">
                          Jumlah Total <span className="text-red-500 ml-1">*</span>
                          <span className="ml-1 text-xs text-muted-foreground">(Wajib)</span>
                        </Label>
                        <Input
                          id="add-apd-quantity"
                          type="number"
                          min={1}
                          value={newAPDForm.quantity}
                          onChange={(e) => {
                            const qty = Number.parseInt(e.target.value) || 1
                            setNewAPDForm({
                              ...newAPDForm,
                              quantity: qty,
                              available: qty, // Set available to match quantity for new items
                            })
                          }}
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-unit">Unit</Label>
                        <Input
                          id="add-apd-unit"
                          value={newAPDForm.unit}
                          onChange={(e) => setNewAPDForm({ ...newAPDForm, unit: e.target.value })}
                          placeholder="e.g., pcs, sets"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-location">Lokasi</Label>
                        <Input
                          id="add-apd-location"
                          value={newAPDForm.location}
                          onChange={(e) => setNewAPDForm({ ...newAPDForm, location: e.target.value })}
                          placeholder="Masukkan lokasi penyimpanan"
                          className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-apd-condition">Kondisi</Label>
                        <Select
                          value={newAPDForm.condition}
                          onChange={(value) => setNewAPDForm({ ...newAPDForm, condition: value })}
                        >
                          <SelectTrigger
                            id="add-apd-condition"
                            className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                          >
                            <SelectValue placeholder="Pilih kondisi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">Sangat Baik</SelectItem>
                            <SelectItem value="Good">Baik</SelectItem>
                            <SelectItem value="Fair">Cukup</SelectItem>
                            <SelectItem value="Poor">Buruk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="add-apd-usage">Masa Pakai</Label>
                      <Input
                        id="add-apd-usage"
                        value={newAPDForm.usagePeriod}
                        onChange={(e) => setNewAPDForm({ ...newAPDForm, usagePeriod: e.target.value })}
                        placeholder="e.g., 1 year, 3 years"
                        className="transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="add-apd-description">Description</Label>
                      <Textarea
                        id="add-apd-description"
                        value={newAPDForm.description}
                        onChange={(e) => setNewAPDForm({ ...newAPDForm, description: e.target.value })}
                        placeholder="Masukkan deskripsi APD"
                        className="min-h-[100px] transition-all focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                      />
                    </motion.div>
                    {/* // Replace the URL-based image input in the Add APD form with our ImageUpload component // Find the
                    section with the label "URL Gambar" and replace it with: */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="add-apd-image">Gambar APD</Label>
                      <ImageUpload
                        initialImage={newAPDForm.image}
                        onImageChange={(imageData) => setNewAPDForm({ ...newAPDForm, image: imageData || "" })}
                      />
                    </motion.div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddAPDModalOpen(false)}
                    disabled={isSubmitting}
                    className="transition-all duration-200 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAPD}
                    className="transition-all duration-200 hover:scale-105 relative"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menambahkan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Tambah APD
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <ItemDetailModal item={selectedItem} open={detailModalOpen} onClose={() => setDetailModalOpen(false)} />
    </div>
  )
}
