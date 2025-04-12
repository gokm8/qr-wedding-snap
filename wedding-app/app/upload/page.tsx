import Link from "next/link"
import { HeartIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { WeddingPhotoUpload } from "@/components/wedding-photo-upload"

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-rose-100">
      <div className="container px-4 py-8 mx-auto max-w-md">
        {/* Header */}
        <header className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center">
              <HeartIcon className="h-5 w-5 text-rose-400 mr-2" />
              <h1 className="text-2xl font-serif font-medium text-gray-800">
                Renas & Ayse
              </h1>
              <HeartIcon className="h-5 w-5 text-rose-400 ml-2" />
            </div>
          </Link>
          <h2 className="text-xl font-serif mb-1 text-gray-800">
            Upload Your Photos
          </h2>
          <p className="text-sm text-gray-500">
            Share your favorite moments from our celebration
          </p>
        </header>

        {/* Upload Component */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
          <WeddingPhotoUpload />
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <Link href="/gallery">
            <Button variant="link" className="text-rose-600">
              View Gallery
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
