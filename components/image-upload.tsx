"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  maxFiles?: number
  maxSize?: number // in MB
  onImagesChange?: (images: string[]) => void
  folder?: string // subcarpeta opcional en Drive
}

type UploadItem = {
  id: string
  file: File
  localUrl: string
  remoteUrl?: string
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

export default function ImageUpload({ maxFiles = 5, maxSize = 5, onImagesChange, folder = "uploads" }: ImageUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Efecto para notificar cambios de URLs de Drive (evitar loops)
  const lastUrlsRef = useRef<string[]>([])
  useEffect(() => {
    if (!onImagesChange) return
    const urls = items.map((it) => it.remoteUrl).filter((u): u is string => Boolean(u))
    const prev = lastUrlsRef.current
    const changed =
      urls.length !== prev.length || urls.some((u, i) => u !== prev[i])
    if (!changed) return
    lastUrlsRef.current = urls
    onImagesChange(urls)
  }, [items])

  const startUpload = async (index: number) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, status: "uploading", error: undefined } : it)))
    const item = items[index]
    if (!item) return

    try {
      const formData = new FormData()
      formData.append("file", item.file)
      if (folder) formData.append("folder", folder)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.message || "Error al subir la imagen")
      }
      const remoteUrl: string = data.url
      // Liberar blob y usar URL remota
      if (item.localUrl?.startsWith("blob:")) URL.revokeObjectURL(item.localUrl)
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, remoteUrl, status: "done", localUrl: remoteUrl } : it)))
    } catch (e: any) {
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, status: "error", error: e?.message || "Fallo de subida" } : it)))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Check if adding these files would exceed the max number
    if (items.length + selectedFiles.length > maxFiles) {
      setError(`No puedes subir más de ${maxFiles} imágenes`)
      return
    }

    // Check file sizes
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`)
      return
    }

    // Clear any previous errors
    setError(null)

    // Build items and start upload
    const toAdd: UploadItem[] = selectedFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      localUrl: URL.createObjectURL(file),
      status: "pending",
    }))
    const startIndex = items.length
    setItems((prev) => [...prev, ...toAdd])
    // Lanzar subidas async tras el render
    setTimeout(() => {
      toAdd.forEach((_, offset) => startUpload(startIndex + offset))
    }, 0)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setItems((prev) => {
      const it = prev[index]
      if (it?.localUrl?.startsWith("blob:")) URL.revokeObjectURL(it.localUrl)
      const next = prev.filter((_, i) => i !== index)
      return next
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    const imageFiles = droppedFiles.filter((file) => file.type.startsWith("image/"))
    if (items.length + imageFiles.length > maxFiles) {
      setError(`No puedes subir más de ${maxFiles} imágenes`)
      return
    }
    const oversizedFiles = imageFiles.filter((file) => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`)
      return
    }
    setError(null)
    const toAdd: UploadItem[] = imageFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file,
      localUrl: URL.createObjectURL(file),
      status: "pending",
    }))
    const startIndex = items.length
    setItems((prev) => [...prev, ...toAdd])
    setTimeout(() => {
      toAdd.forEach((_, offset) => startUpload(startIndex + offset))
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          error ? "border-red-400 bg-red-50" : "border-gray-300"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Arrastra y suelta imágenes aquí o</p>
          <Button
            type="button"
            className="bg-[#e8f0fe] text-[#0e2c52] hover:bg-[#d8e0ee]"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar archivos
          </Button>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF hasta {maxSize}MB</p>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {items.map((it, index) => {
            const src = it.remoteUrl || it.localUrl || "/placeholder.svg"
            return (
              <div key={it.id} className="relative group">
                <img
                  src={src}
                  alt={`Imagen ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-md"
                />
                {it.status !== "done" && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs rounded-md">
                    {it.status === "uploading" ? "Subiendo..." : it.status === "error" ? (it.error || "Error") : "Pendiente"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
