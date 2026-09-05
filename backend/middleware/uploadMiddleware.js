const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const { getFileExtension, getFileType } = require('../services/printableFileService')

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const privateUploadDirectory = path.resolve(__dirname, '..', 'private', 'orders')

try {
  fs.mkdirSync(privateUploadDirectory, { recursive: true })
} catch (error) {
  console.warn('Order upload directory could not be created. Render local filesystem is not persistent and uploads may fail until storage is available.')
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, privateUploadDirectory),
  filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${getFileExtension(file.originalname)}`),
})

const fileFilter = (req, file, callback) => {
  const fileType = getFileType(file.originalname)
  const isSupported = Boolean(fileType) && (!file.mimetype || fileType.mimeTypes.includes(file.mimetype))
  callback(isSupported ? null : new Error('This file type is not supported. Upload PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, JPEG, PNG, or TXT.'), isSupported)
}

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
})

module.exports = { MAX_FILE_SIZE_BYTES, uploadPdf, privateUploadDirectory }
