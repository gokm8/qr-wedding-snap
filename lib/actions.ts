"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

import { sendMultiplePhotosNotification, sendPhotoNotification } from "./email"
import { prisma } from "./prisma"
import { supabase } from "./supabase"

export async function uploadPhoto(file: File, name?: string) {
  try {
    const id = nanoid()
    const filename = `${id}-${file.name.replace(/\s+/g, "-").toLowerCase()}`
    const bucketName = "wedding-photos"

    // Konverter File til ArrayBuffer og derefter til Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload filen til Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      })

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`)
    }

    // Få offentlig URL til filen
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename)

    const publicPath = urlData.publicUrl

    // Gem i Prisma databasen
    const photo = await prisma.photo.create({
      data: {
        filename,
        path: publicPath,
        uploadedBy: name || "Anonym",
        bucketPath: `${bucketName}/${filename}`,
      },
    })

    // Send email notification (kun for enkelt billede upload)
    if (name === undefined) {
      console.log("Sender e-mail notifikation...")
      try {
        await sendPhotoNotification(publicPath, name)
        console.log("E-mail notifikation sendt")
      } catch (emailError) {
        console.error("Kunne ikke sende e-mail notifikation:", emailError)
        // Vi fortsætter selvom e-mail fejler - vi logger blot fejlen
      }
    }

    revalidatePath("/gallery")
    return publicPath
  } catch (error) {
    console.error("Fejl ved upload af billede:", error)
    if (error instanceof Error) {
      throw new Error(`Kunne ikke uploade billede: ${error.message}`)
    } else {
      throw new Error("Kunne ikke uploade billede: Ukendt fejl")
    }
  }
}

// Denne form funktion tager FormData i stedet for File[] for at undgå serialiseringsproblemer
export async function uploadPhotoForm(formData: FormData) {
  try {
    const files = formData.getAll("files") as File[]
    const name = formData.get("name") as string

    if (!files.length) {
      throw new Error("Ingen filer at uploade")
    }

    const uploadedPaths: string[] = []

    // Upload hvert billede enkeltvis
    for (const file of files) {
      const path = await uploadPhoto(file, name)
      uploadedPaths.push(path)
    }

    // Send én samlet e-mail med alle billeder
    console.log(
      `Sender e-mail notifikation med ${uploadedPaths.length} billeder...`
    )
    try {
      await sendMultiplePhotosNotification(uploadedPaths, name)
      console.log("E-mail notifikation med alle billeder sendt")
    } catch (emailError) {
      console.error("Kunne ikke sende e-mail notifikation:", emailError)
    }

    return { success: true, paths: uploadedPaths }
  } catch (error) {
    console.error("Fejl ved upload af billeder:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    } else {
      return {
        success: false,
        error: "Kunne ikke uploade billeder: Ukendt fejl",
      }
    }
  }
}

// Behold for bagudkompatibilitet, men brug uploadPhotoForm i stedet
export async function uploadPhotos(files: File[], name: string) {
  try {
    if (!files.length) {
      throw new Error("Ingen filer at uploade")
    }

    const uploadedPaths: string[] = []

    // Upload hvert billede enkeltvis (uden at sende mails)
    for (const file of files) {
      const path = await uploadPhoto(file, name)
      uploadedPaths.push(path)
    }

    // Send én samlet e-mail med alle billeder
    console.log(
      `Sender e-mail notifikation med ${uploadedPaths.length} billeder...`
    )
    try {
      await sendMultiplePhotosNotification(uploadedPaths, name)
      console.log("E-mail notifikation med alle billeder sendt")
    } catch (emailError) {
      console.error("Kunne ikke sende e-mail notifikation:", emailError)
      // Vi fortsætter selvom e-mail fejler - vi logger blot fejlen
    }

    return uploadedPaths
  } catch (error) {
    console.error("Fejl ved upload af billeder:", error)
    if (error instanceof Error) {
      throw new Error(`Kunne ikke uploade billeder: ${error.message}`)
    } else {
      throw new Error("Kunne ikke uploade billeder: Ukendt fejl")
    }
  }
}

export async function getPhotos() {
  try {
    // Hent alle billeder fra databasen
    const photos = await prisma.photo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    // Konverter Date objekter til strenge for at matche forventet type i UI
    return photos.map((photo) => ({
      ...photo,
      createdAt: photo.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Fejl ved hentning af billeder:", error)
    return []
  }
}

export async function clearAllPhotos() {
  try {
    // Hent alle billeder fra databasen
    const photos = await prisma.photo.findMany()

    // Slet filer i Supabase storage
    for (const photo of photos) {
      const bucketPath = photo.bucketPath
      const pathParts = bucketPath.split("/")
      if (pathParts.length >= 2) {
        const bucket = pathParts[0]
        const filename = pathParts[1]

        // Slet fra Supabase storage
        const { error } = await supabase.storage.from(bucket).remove([filename])

        if (error) {
          console.error(`Kunne ikke slette ${filename} fra Supabase:`, error)
        }
      }
    }

    // Slet alle billeder fra databasen
    await prisma.photo.deleteMany({})

    // Invalider cache for at opdatere UI
    revalidatePath("/gallery")

    return { success: true, message: `${photos.length} billeder blev slettet` }
  } catch (error) {
    console.error("Fejl ved sletning af alle billeder:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Ukendt fejl under sletning af billeder" }
  }
}
