# Home page gallery – how to add or change images

**Recommendation:** Store images in the repo and list them in one file. No S3, no extra services. Next.js serves files from `public/`, so load time is good (same origin, simple caching).

---

## 1. Add image files

Put your photos in **`public/gallery/`**.

- Name them whatever you like (e.g. `1.jpg`, `renaissance.jpg`).
- For best load time: use **~800px width** and **JPG or WebP** (e.g. 80% quality). No need to go huge.

---

## 2. List them in the data file

Edit **`lib/gallery-images.ts`** and add one entry per image:

```ts
export const GALLERY_IMAGES: { image: string; text: string }[] = [
  { image: '/gallery/1.jpg', text: 'Renaissance' },
  { image: '/gallery/2.jpg', text: 'Baroque' },
  { image: '/gallery/3.jpg', text: 'Victorian' },
  // add more…
]
```

- **`image`**: path from the site root, so `/gallery/yourfile.jpg` for `public/gallery/yourfile.jpg`.
- **`text`**: label shown under the image in the gallery.

The home page already imports `GALLERY_IMAGES` and passes it to the gallery. Add/remove/reorder entries in that file to change what appears.

---

## Summary

| What              | Where                          |
|-------------------|---------------------------------|
| Image files       | `public/gallery/` (e.g. `1.jpg`) |
| List + labels     | `lib/gallery-images.ts`         |

No imports of image files in code – only paths as strings. Keep images reasonably sized for fast load.
