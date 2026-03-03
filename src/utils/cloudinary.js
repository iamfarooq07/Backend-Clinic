/**
 * Upload buffer to Cloudinary (e.g. prescription PDF).
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */

import { Readable } from "stream";

export async function uploadToCloudinary(buffer, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  try {
    const cloudinary = (await import("cloudinary")).default;
    cloudinary.v2.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { resource_type: "auto", public_id: publicId.replace(/\.[^.]+$/, "") },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      Readable.from(buffer).pipe(stream);
    });
  } catch (e) {
    console.error("Cloudinary upload error:", e.message);
  }
  return null;
}
