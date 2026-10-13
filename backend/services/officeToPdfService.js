const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')
const { execFile, spawn } = require('child_process')
const { promisify } = require('util')
const crypto = require('crypto')

const OFFICE_CONVERSION_TIMEOUT_MS = 2 * 60 * 1000
const MAX_CONCURRENT_CONVERSIONS = 1
const MAX_QUEUED_CONVERSIONS = 2
const libreOfficeBinary = process.env.LIBREOFFICE_BIN || 'soffice'
const execFileAsync = promisify(execFile)
let activeConversions = 0
let queuedConversions = 0

const sanitizeDiagnosticText = (value) => String(value || '')
  .replace(/mongodb(?:\+srv)?:\/\/[^\s'"<>]+/gi, '[redacted-mongo-uri]')
  .replace(/bearer\s+[a-z0-9._~+/=-]+/gi, 'Bearer [redacted-token]')
  .replace(/(?:authorization|password|passwd|pwd|token|jwt|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
  .replace(/\beyJ[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+\b/gi, '[redacted-jwt]')
  .replace(/[A-Z]:\\[^\r\n\s]+|\/(?:[^\r\n\s/]+\/)+[^\r\n\s]*/g, '[redacted-path]')
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
  .replace(/\b(?:\+?\d[\d ()-]{7,}\d)\b/g, '[redacted-phone]')

const resolveLibreOfficeExecutable = async () => {
  if (path.isAbsolute(libreOfficeBinary) || libreOfficeBinary.includes(path.sep)) {
    try {
      await fs.access(libreOfficeBinary)
      return libreOfficeBinary
    } catch (error) {
      return null
    }
  }

  try {
    const command = process.platform === 'win32' ? 'where' : 'which'
    const { stdout } = await execFileAsync(command, [libreOfficeBinary])
    return stdout.split(/\r?\n/).find(Boolean) || null
  } catch (error) {
    return null
  }
}

const logLibreOfficeStartupDiagnostics = async () => {
  const resolvedPath = await resolveLibreOfficeExecutable()
  let version = null
  if (resolvedPath) {
    try {
      const result = await execFileAsync(resolvedPath, ['--version'])
      version = sanitizeDiagnosticText(`${result.stdout}${result.stderr}`).trim() || null
    } catch (error) {
      version = sanitizeDiagnosticText(`${error.stdout || ''}${error.stderr || ''}`).trim() || null
    }
  }
  console.log('[office-conversion] startup diagnostic', JSON.stringify({
    executable: libreOfficeBinary,
    resolvedPath,
    available: Boolean(resolvedPath),
    version,
  }))
}

void logLibreOfficeStartupDiagnostics().catch((error) => {
  console.error('[office-conversion] startup diagnostic failed', sanitizeDiagnosticText(error.message))
})

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

const runLibreOffice = async (inputPath, outputDirectory, profileDirectory) => new Promise((resolve, reject) => {
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
  resolveLibreOfficeExecutable().then((resolvedPath) => {
    console.log('[office-conversion] executable diagnostic', JSON.stringify({
      executable: libreOfficeBinary,
      resolvedPath,
      available: Boolean(resolvedPath),
    }))
  })
  const child = spawn(libreOfficeBinary, args, { detached: process.platform !== 'win32', stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  let settled = false
  const timeout = setTimeout(() => {
    if (settled) return
    settled = true
    terminateProcess(child)
    console.error('[office-conversion] process diagnostic', JSON.stringify({
      exitCode: null,
      signal: 'SIGKILL',
      stderr: sanitizeDiagnosticText(stderr),
      errorCode: 'OFFICE_CONVERSION_TIMEOUT',
    }))
    const error = new Error('Office file conversion timed out.')
    error.code = 'OFFICE_CONVERSION_TIMEOUT'
    reject(error)
  }, OFFICE_CONVERSION_TIMEOUT_MS)

  child.stderr.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`
  })
  child.once('error', (error) => {
    console.error('[office-conversion] process diagnostic', JSON.stringify({
      exitCode: null,
      signal: null,
      stderr: sanitizeDiagnosticText(stderr),
      errorCode: error.code === 'ENOENT' ? 'OFFICE_CONVERSION_UNAVAILABLE' : 'OFFICE_CONVERSION_FAILED',
    }))
    if (settled) return
    settled = true
    clearTimeout(timeout)
    error.code = error.code === 'ENOENT' ? 'OFFICE_CONVERSION_UNAVAILABLE' : 'OFFICE_CONVERSION_FAILED'
    reject(error)
  })
  child.once('close', (code, signal) => {
    console.log('[office-conversion] process diagnostic', JSON.stringify({
      exitCode: code,
      signal,
      stderr: sanitizeDiagnosticText(stderr),
      errorCode: code === 0 ? null : 'OFFICE_CONVERSION_FAILED',
    }))
    if (settled) return
    settled = true
    clearTimeout(timeout)
    if (code !== 0) {
      const error = new Error('Office file conversion failed.')
      error.code = 'OFFICE_CONVERSION_FAILED'
      error.detail = sanitizeDiagnosticText(stderr)
      reject(error)
      return
    }
    resolve()
  })
})

const withOfficePdf = async (inputPath, callback) => {
  const inputExtension = path.extname(inputPath).toLowerCase()
  const inputStats = await fs.stat(inputPath)
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), `xeroq-office-${crypto.randomUUID()}-`))
  const outputDirectory = path.join(temporaryRoot, 'output')
  const profileDirectory = path.join(temporaryRoot, 'profile')

  try {
    await Promise.all([fs.mkdir(outputDirectory), fs.mkdir(profileDirectory)])
    console.log('[office-conversion] started', JSON.stringify({
      inputExtension,
      inputSize: inputStats.size,
      executable: libreOfficeBinary,
      outputDirectory,
    }))
    await runWithConversionSlot(() => runLibreOffice(inputPath, outputDirectory, profileDirectory))
    const outputPath = path.join(outputDirectory, `${path.basename(inputPath, path.extname(inputPath))}.pdf`)
    let outputStats
    try {
      outputStats = await fs.stat(outputPath)
    } catch (error) {
      console.error('[office-conversion] output diagnostic', JSON.stringify({
        outputExists: false,
        outputSize: null,
        errorCode: 'OFFICE_CONVERSION_FAILED',
      }))
      const outputError = new Error('Office file conversion failed.')
      outputError.code = 'OFFICE_CONVERSION_FAILED'
      throw outputError
    }
    console.log('[office-conversion] output diagnostic', JSON.stringify({
      outputExists: true,
      outputSize: outputStats.size,
      errorCode: null,
    }))
    return await callback(outputPath)
  } catch (error) {
    if (['OFFICE_CONVERSION_UNAVAILABLE', 'OFFICE_CONVERSION_BUSY'].includes(error.code)) {
      const safeError = new Error('This file format cannot currently be processed for page counting. Please try PDF or another supported format.')
      safeError.code = error.code
      throw safeError
    }
    throw error
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true })
  }
}

module.exports = { withOfficePdf }
