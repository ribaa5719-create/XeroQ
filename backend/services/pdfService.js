const fs = require('fs/promises')
const { PDFDocument } = require('pdf-lib')

const getPdfPageCount = async (filePath) => {
  const pdfBytes = await fs.readFile(filePath)
  const pdfDocument = await PDFDocument.load(pdfBytes, { ignoreEncryption: false })
  const pageCount = pdfDocument.getPageCount()

  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error('The PDF page count could not be determined.')
  }

  return pageCount
}

module.exports = { getPdfPageCount }
