"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  initialImage?: string
  onImageChange: (imageData: string | null) => void
  className?: string
}

export function ImageUpload({ initialImage, onImageChange, className = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB. Please choose a smaller image.")
      setIsUploading(false)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      // Use a simpler approach to avoid the error
      if (typeof reader.result === "string") {
        // Just use the result directly without resizing for now
        setPreview(reader.result)
        onImageChange(reader.result)
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setPreview(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/gif, image/webp"
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative h-40 w-40 rounded-md overflow-hidden border bg-gray-100">
            <Image
              src={preview || "/placeholder.svg"}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="h-40 w-40 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
        >
          <ImageIcon className="h-10 w-10 text-gray-400" />
          <div className="text-sm text-center text-gray-500">
            <p>Click to upload</p>
            <p className="text-xs">JPG, PNG, GIF, WEBP</p>
            <p className="text-xs">Max 2MB</p>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="mt-2"
      >
        {isUploading ? (
          <div className="flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Uploading...</span>
          </div>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {preview ? "Change Image" : "Upload Image"}
          </>
        )}
      </Button>
    </div>
  )
}
