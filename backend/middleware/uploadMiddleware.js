const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Ensure private receipts directory exists
const receiptsDir = path.join(__dirname, "../uploads/receipts");
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// 5 MB maximum file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Inspects buffer header for authentic image magic bytes.
 * @param {Buffer} buffer
 * @returns {{ mime: string, ext: string } | null}
 */
const detectImageSignature = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
};

// Memory storage allows byte inspection before persisting to private disk
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.mimetype)) {
      const err = new Error("Only JPEG, PNG, and WebP images are allowed");
      err.code = "INVALID_FILE_TYPE";
      return cb(err, false);
    }
    cb(null, true);
  }
});

/**
 * Middleware wrapper that enforces magic-byte signature validation and persists
 * validated file to private disk with a collision-resistant, non-guessable storage key.
 */
const processReceiptUpload = (fieldName = "screenshot") => {
  const uploadSingle = upload.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "Payment screenshot must not exceed 5 MB.",
            code: "FILE_TOO_LARGE"
          });
        }
        if (err.code === "INVALID_FILE_TYPE") {
          return res.status(400).json({
            message: "Invalid file type. Only JPEG, PNG, and WebP images are accepted.",
            code: "INVALID_FILE_TYPE"
          });
        }
        return res.status(400).json({
          message: err.message || "File upload failed",
          code: "UPLOAD_ERROR"
        });
      }

      // If no file uploaded in this multipart request
      if (!req.file) {
        return next();
      }

      // Deep inspection: verify file signature / magic bytes
      const detected = detectImageSignature(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          message: "Uploaded file is corrupted or not a valid JPEG, PNG, or WebP image.",
          code: "INVALID_FILE_SIGNATURE"
        });
      }

      // Generate safe server filename (no client filename or path traversal)
      const randomHex = crypto.randomBytes(8).toString("hex");
      const safeFilename = `${Date.now()}_${randomHex}.${detected.ext}`;
      const absolutePath = path.join(receiptsDir, safeFilename);

      try {
        fs.writeFileSync(absolutePath, req.file.buffer);
        // Attach private relative storage key only (never absolute path or public URL)
        req.file.savedFilename = safeFilename;
        req.file.screenshotRef = `receipts/${safeFilename}`;
        req.file.absolutePath = absolutePath;
        next();
      } catch (writeErr) {
        console.error("Receipt Storage Write Error:", writeErr);
        return res.status(500).json({
          message: "Failed to store payment receipt securely.",
          code: "STORAGE_ERROR"
        });
      }
    });
  };
};

/**
 * Safely removes a stored receipt file in case of downstream database rollback.
 * @param {string} screenshotRef - Relative reference e.g. "receipts/123_abc.jpg"
 */
const cleanupReceiptFile = (screenshotRef) => {
  if (!screenshotRef || typeof screenshotRef !== "string") return;
  const basename = path.basename(screenshotRef);
  const targetPath = path.join(receiptsDir, basename);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch (e) {
      console.warn("Failed to clean up orphan receipt file:", targetPath, e.message);
    }
  }
};

module.exports = {
  processReceiptUpload,
  cleanupReceiptFile,
  detectImageSignature,
  MAX_FILE_SIZE,
  receiptsDir
};
