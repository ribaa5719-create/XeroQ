const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024
const privateUploadDirectory = path.resolve(__dirname, '..', 'private', 'orders')

try {
  fs.mkdirSync(privateUploadDirectory, { recursive: true })
} catch (error) {
  console.warn('Order upload directory could not be created. Render local filesystem is not persistent and uploads may fail until storage is available.')
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, privateUploadDirectory),
  filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}.pdf`),
})

const fileFilter = (req, file, callback) => {
  const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf'
  callback(isPdf ? null : new Error('Only PDF files with a .pdf extension are accepted.'), isPdf)
}

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PDF_SIZE_BYTES, files: 1 },
})

module.exports = { MAX_PDF_SIZE_BYTES, uploadPdf, privateUploadDirectory }
