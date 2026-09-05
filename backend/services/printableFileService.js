const fs = require('fs/promises')
const path = require('path')
const { getPdfPageCount } = require('./pdfService')
const { withOfficePdf } = require('./officeToPdfService')

const TEXT_LINE_WIDTH = 100
const TEXT_LINES_PER_PAGE = 60

const SUPPORTED_FILE_TYPES = {
  '.pdf': { label: 'PDF', mimeTypes: ['application/pdf'] },
  '.doc': { label: 'DOC', mimeTypes: ['application/msword'] },
  '.docx': { label: 'DOCX', mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  '.ppt': { label: 'PPT', mimeTypes: ['application/vnd.ms-powerpoint'] },
  '.pptx': { label: 'PPTX', mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
  '.xls': { label: 'XLS', mimeTypes: ['application/vnd.ms-excel'] },
  '.xlsx': { label: 'XLSX', mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
  '.jpg': { label: 'JPG', mimeTypes: ['image/jpeg'] },
  '.jpeg': { label: 'JPEG', mimeTypes: ['image/jpeg'] },
  '.png': { label: 'PNG', mimeTypes: ['image/png'] },
  '.txt': { label: 'TXT', mimeTypes: ['text/plain'] },
}

const OFFICE_EXTENSIONS = new Set(['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'])

const getFileExtension = (fileName) => path.extname(fileName || '').toLowerCase()

const getFileType = (fileName) => SUPPORTED_FILE_TYPES[getFileExtension(fileName)]

const readFileSignature = async (filePath) => {
  const handle = await fs.open(filePath, 'r')
  try {
    const signature = Buffer.alloc(16)
    const { bytesRead } = await handle.read(signature, 0, signature.length, 0)
    return signature.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

const validateFileContent = async (filePath, extension) => {
  const signature = await readFileSignature(filePath)
  const isPdf = extension === '.pdf'
  const isJpeg = ['.jpg', '.jpeg'].includes(extension) && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
  const isPng = extension === '.png' && signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const isLegacyOffice = OFFICE_EXTENSIONS.has(extension) && ['.doc', '.ppt', '.xls'].includes(extension) && signature.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  const isOpenXmlOffice = OFFICE_EXTENSIONS.has(extension) && ['.docx', '.pptx', '.xlsx'].includes(extension) && signature.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))

  if (isPdf || isJpeg || isPng || isLegacyOffice || isOpenXmlOffice) return

  if (extension === '.txt') {
    const text = await fs.readFile(filePath, 'utf8')
    if (!text.includes('\u0000')) return
  }

  const error = new Error('The uploaded file content does not match its file type.')
  error.code = 'INVALID_PRINTABLE_FILE'
  throw error
}

const getTextPageCount = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8')
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const printableLines = lines.reduce((total, line) => total + Math.max(1, Math.ceil(Array.from(line).length / TEXT_LINE_WIDTH)), 0)
  return Math.max(1, Math.ceil(printableLines / TEXT_LINES_PER_PAGE))
}

const getPrintablePageCount = async ({ filePath, originalFileName }) => {
  const extension = getFileExtension(originalFileName)
  if (!getFileType(originalFileName)) {
    const error = new Error('Unsupported printable file type.')
    error.code = 'UNSUPPORTED_PRINTABLE_FILE'
    throw error
  }

  await validateFileContent(filePath, extension)

  if (extension === '.pdf') return getPdfPageCount(filePath)
  if (['.jpg', '.jpeg', '.png'].includes(extension)) return 1
  if (extension === '.txt') return getTextPageCount(filePath)

  return withOfficePdf(filePath, getPdfPageCount)
}

module.exports = {
  OFFICE_EXTENSIONS,
  SUPPORTED_FILE_TYPES,
  getFileExtension,
  getFileType,
  getPrintablePageCount,
}
