import multer from "multer";
// In-memory storage: files are parsed/forwarded to Cloudinary/S3 in the handler,
// never written to local disk (avoids the legacy app's public-webroot-upload RCE risk).
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
//# sourceMappingURL=upload.js.map