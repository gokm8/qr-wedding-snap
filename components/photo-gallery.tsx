"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { da } from "date-fns/locale"

import { Dialog, DialogContent } from "@/components/ui/dialog"

type Photo = {
  id: string
  path: string
  filename: string
  createdAt: string
  uploadedBy?: string | null
}

interface PhotoGalleryProps {
  photos: Photo[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  const handleImageLoad = (photoId: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev)
      newSet.delete(photoId)
      return newSet
    })
  }

  const handleImageLoadStart = (photoId: string) => {
    setLoadingImages((prev) => new Set(prev).add(photoId))
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 py-12 text-center shadow-lg backdrop-blur-sm">
        <p className="mb-2 text-gray-500">
          Der er ikke uploadet nogen billeder endnu.
        </p>
        <p className="text-sm text-gray-400">
          Vær den første til at dele et minde!
        </p>
      </div>
    )
  }

  // Funktion til at formatere dato
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: da })
    } catch (e) {
      return "Ukendt dato"
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg shadow-md transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedPhoto(photo)}
          >
            {loadingImages.has(photo.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-rose-50 z-10">
                <div className="animate-pulse">
                  <div className="h-4 w-4 bg-rose-300 rounded-full"></div>
                </div>
              </div>
            )}
            <Image
              src={photo.path || "/placeholder.svg"}
              alt="Bryllupsbillede"
              fill
              className="object-cover"
              onLoadStart={() => handleImageLoadStart(photo.id)}
              onLoad={() => handleImageLoad(photo.id)}
              onError={() => handleImageLoad(photo.id)}
            />
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="w-[90vw] max-w-3xl border-none bg-transparent p-1">
          {selectedPhoto && (
            <div className="flex flex-col bg-white/25 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
              <div className="relative aspect-[4/3] w-full md:aspect-[16/9]">
                <Image
                  src={selectedPhoto.path || "/placeholder.svg"}
                  alt="Bryllupsbillede"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="p-3 bg-white">
                {selectedPhoto.uploadedBy && (
                  <p className="text-sm font-medium text-gray-700">
                    Uploadet af {selectedPhoto.uploadedBy}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatDate(selectedPhoto.createdAt)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
