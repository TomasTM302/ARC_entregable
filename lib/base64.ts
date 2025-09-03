/**
 * Converts an image file to base64 string
 * @param file - The image file to convert
 * @returns Promise that resolves to base64 string
 */
export const getBase64Image = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert file to base64"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Converts a base64 string to a File object
 * @param base64 - The base64 string to convert
 * @param filename - The name for the file
 * @returns File object
 */
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}

/**
 * Validates if a string is a valid base64 image
 * @param base64 - The base64 string to validate
 * @returns boolean indicating if the string is valid
 */
export const isValidBase64Image = (base64: string): boolean => {
  try {
    const regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
    return regex.test(base64)
  } catch {
    return false
  }
}

/**
 * Compresses an image file and returns base64
 * @param file - The image file to compress
 * @param quality - Compression quality (0-1)
 * @param maxWidth - Maximum width for the image
 * @param maxHeight - Maximum height for the image
 * @returns Promise that resolves to compressed base64 string
 */
export const compressImageToBase64 = (file: File, quality = 0.8, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedBase64)
    }

    img.onerror = () => {
      reject(new Error("Error loading image"))
    }

    // Convert file to data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }
    reader.readAsDataURL(file)
  })
}
