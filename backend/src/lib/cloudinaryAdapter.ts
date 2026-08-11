import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { v2 as cloudinary } from 'cloudinary'

export type CloudinaryAdapterOptions = {
  apiKey: string
  apiSecret: string
  cloudName: string
  /** Cloudinary folder every upload from this collection lands in, e.g. "para-dhiver/media". */
  folder: string
}

/**
 * Minimal Cloudinary storage adapter for @payloadcms/plugin-cloud-storage.
 * Uploads originals untouched (no eager transform, no forced resize) and lets
 * Cloudinary's URL-based transformations (f_auto,q_auto, responsive widths,
 * etc.) happen on delivery, applied by whoever builds the <img> src.
 */
export const cloudinaryAdapter = (options: CloudinaryAdapterOptions): Adapter => {
  cloudinary.config({
    api_key: options.apiKey,
    api_secret: options.apiSecret,
    cloud_name: options.cloudName,
    secure: true,
  })

  const resourceTypeFor = (mimeType?: string): 'image' | 'raw' | 'video' => {
    if (!mimeType) return 'raw'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    return 'raw'
  }

  // Cloudinary appends the resource's format as the URL extension itself, so
  // an explicit public_id must not also carry one — otherwise uploads land
  // at "name.png.png" and every generated URL 404s.
  const stripExtension = (filename: string) => filename.replace(/\.[^./]+$/, '')

  return ({ collection: _collection, prefix: adapterPrefix }): GeneratedAdapter => {
    return {
      name: 'cloudinary',

      handleUpload: async ({ data, file }) => {
        const folderPrefix = data?.prefix || adapterPrefix
        const folder = folderPrefix ? `${options.folder}/${folderPrefix}` : options.folder
        const resourceType = resourceTypeFor(file.mimeType)

        const result = await new Promise<{ public_id: string; secure_url: string }>(
          (resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                overwrite: true,
                public_id: stripExtension(file.filename),
                resource_type: resourceType,
                unique_filename: false,
                use_filename: true,
              },
              (err, uploadResult) => {
                if (err || !uploadResult) {
                  reject(err ?? new Error('Cloudinary upload returned no result'))
                  return
                }
                resolve(uploadResult)
              },
            )
            stream.end(file.buffer)
          },
        )

        return {
          filename: file.filename,
          url: result.secure_url,
        }
      },

      handleDelete: async ({ doc, filename }) => {
        const folderPrefix = doc?.prefix || adapterPrefix
        const folder = folderPrefix ? `${options.folder}/${folderPrefix}` : options.folder
        const publicId = `${folder}/${stripExtension(filename)}`
        const resourceType = resourceTypeFor((doc as { mimeType?: string })?.mimeType)

        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
        } catch {
          // Best-effort: a missing remote asset shouldn't block deleting the Payload doc.
        }
      },

      generateURL: ({ data, filename, prefix }) => {
        const folderPrefix = prefix || data?.prefix
        const folder = folderPrefix ? `${options.folder}/${folderPrefix}` : options.folder
        const resourceType = resourceTypeFor((data as { mimeType?: string })?.mimeType)
        return `https://res.cloudinary.com/${options.cloudName}/${resourceType}/upload/${folder}/${filename}`
      },

      staticHandler: async (_req, { params }) => {
        const folderPrefix = params.prefix
        const folder = folderPrefix ? `${options.folder}/${folderPrefix}` : options.folder
        const url = `https://res.cloudinary.com/${options.cloudName}/image/upload/${folder}/${params.filename}`
        return Response.redirect(url, 302)
      },
    }
  }
}
