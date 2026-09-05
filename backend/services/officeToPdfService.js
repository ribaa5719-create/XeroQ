const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')
const { spawn } = require('child_process')
const crypto = require('crypto')

const OFFICE_CONVERSION_TIMEOUT_MS = 2 * 60 * 1000
const MAX_CONCURRENT_CONVERSIONS = 1
const MAX_QUEUED_CONVERSIONS = 2
const libreOfficeBinary = process.env.LIBREOFFICE_BIN || 'soffice'
let activeConversions = 0
let queuedConversions = 0

const runWithConversionSlot = async (task) => {
  if (activeConversions >= MAX_CONCURRENT_CONVERSIONS && queuedConversions >= MAX_QUEUED_CONVERSIONS) {
    const error = new Error('Office conversion capacity is temporarily busy.')
    error.code = 'OFFICE_CONVERSION_BUSY'
    throw error
  }

  queuedConversions += 1
  while (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  queuedConversions -= 1
  activeConversions += 1

  try {
    return await task()
  } finally {
    activeConversions -= 1
  }
}

const terminateProcess = (child) => {
  if (!child.pid) return
  try {
    if (process.platform === 'win32') child.kill('SIGKILL')
    else process.kill(-child.pid, 'SIGKILL')
  } catch (error) {
    if (error.code !== 'ESRCH') child.kill('SIGKILL')
  }
}

const runLibreOffice = (inputPath, outputDirectory, profileDirectory) => new Promise((resolve, reject) => {
  const args = [
    '--headless',
    '--nologo',
    '--nodefault',
    '--nofirststartwizard',
    `-env:UserInstallation=${pathToFileURL(profileDirectory).href}`,
    '--convert-to',
    'pdf',
    '--outdir',
    outputDirectory,
    inputPath,
  ]
  const child = spawn(libreOfficeBinary, args, { detached: process.platform !== 'win32', stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  let settled = false
  const timeout = setTimeout(() => {
    if (settled) return
    settled = true
    terminateProcess(child)
    const error = new Error('Office file conversion timed out.')
    error.code = 'OFFICE_CONVERSION_TIMEOUT'
    reject(error)
  }, OFFICE_CONVERSION_TIMEOUT_MS)

  child.stderr.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-2000)
  })
  child.once('error', (error) => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    error.code = error.code === 'ENOENT' ? 'OFFICE_CONVERSION_UNAVAILABLE' : 'OFFICE_CONVERSION_FAILED'
    reject(error)
  })
  child.once('close', (code) => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    if (code !== 0) {
      const error = new Error('Office file conversion failed.')
      error.code = 'OFFICE_CONVERSION_FAILED'
      error.detail = stderr
      reject(error)
      return
    }
    resolve()
  })
})

const withOfficePdf = async (inputPath, callback) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), `xeroq-office-${crypto.randomUUID()}-`))
  const outputDirectory = path.join(temporaryRoot, 'output')
  const profileDirectory = path.join(temporaryRoot, 'profile')

  try {
    await Promise.all([fs.mkdir(outputDirectory), fs.mkdir(profileDirectory)])
    await runWithConversionSlot(() => runLibreOffice(inputPath, outputDirectory, profileDirectory))
    const outputPath = path.join(outputDirectory, `${path.basename(inputPath, path.extname(inputPath))}.pdf`)
    await fs.access(outputPath)
    return await callback(outputPath)
  } catch (error) {
    if (['OFFICE_CONVERSION_UNAVAILABLE', 'OFFICE_CONVERSION_BUSY'].includes(error.code)) {
      throw new Error('This file format cannot currently be processed for page counting. Please try PDF or another supported format.')
    }
    throw error
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true })
  }
}

module.exports = { withOfficePdf }
