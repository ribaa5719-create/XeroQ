const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')

const privateUploadDirectory = path.resolve(__dirname, '..', 'private', 'orders')
fs.mkdirSync(privateUploadDirectory, { recursive: true })

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
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})

module.exports = { uploadPdf, privateUploadDirectory }
