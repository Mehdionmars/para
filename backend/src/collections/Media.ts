import type { CollectionConfig } from 'payload'

import { adminOrManager, canEditContent, staffOnlyInAdmin } from '../access/roles'

/** Product photography off a phone camera tops out well under this; anything
 * larger is a mistake or an attack.
 *
 * The byte ceiling itself is enforced at config level (`upload.limits` in
 * payload.config.ts, which Payload spreads straight into Busboy) because
 * `UploadConfig` has no per-collection size option. It lives here so the one
 * collection it applies to, and the dashboard proxy that mirrors it, read the
 * same number. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    admin: staffOnlyInAdmin,
    create: canEditContent,
    delete: adminOrManager,
    read: () => true,
    update: canEditContent,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  folders: true,
  // Was `upload: true`, which accepts any MIME type at any size: an
  // authenticated content editor could store an HTML file (served back from
  // the media host, so stored XSS) or a multi-gigabyte upload that Sharp then
  // tries to load into memory. Images only, and bounded.
  //
  // SVG is deliberately absent: it is a script-bearing document, not a
  // picture, and every image on this site is a raster photo or logo. Add it
  // back only alongside a sanitiser.
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  },
}
