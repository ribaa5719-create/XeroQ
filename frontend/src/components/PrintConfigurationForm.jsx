import { CheckCircle2, FileText, Minus, Plus, Upload, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { useEffect, useRef, useState } from 'react'
import { printFlowStore } from '../services/printFlowStore'

const MAX_FILE_SIZE = 25 * 1024 * 1024

const initialOptions = {
  printType: 'bw',
  priority: 'normal',
  copies: 1,
  paperSize: 'A4',
  side: 'single',
}

function PrintConfigurationForm({ shop, initialConfiguration, onContinue }) {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(initialConfiguration?.file || printFlowStore.getFile())
  const [pageCount, setPageCount] = useState(initialConfiguration?.pageCount || null)
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [options, setOptions] = useState({ ...initialOptions, ...initialConfiguration?.options })
  const [optionError, setOptionError] = useState('')

  useEffect(() => {
    let isCurrentFile = true

    if (!file || fileError) return undefined

    file.arrayBuffer()
      .then((pdfBytes) => PDFDocument.load(pdfBytes, { ignoreEncryption: false }))
      .then((pdfDocument) => {
        const parsedPageCount = pdfDocument.getPageCount()
        if (!Number.isInteger(parsedPageCount) || parsedPageCount < 1) {
          throw new Error('The PDF page count could not be determined.')
        }
        if (isCurrentFile) setPageCount(parsedPageCount)
      })
      .catch(() => {
        if (isCurrentFile) {
          setPageCount(null)
          setFileError('This PDF could not be read. Please choose a valid, readable PDF.')
        }
      })

    return () => {
      isCurrentFile = false
    }
  }, [file, fileError])

  const validateFile = (candidate) => {
    if (!candidate) return 'Please select a PDF file.'
    if (candidate.type !== 'application/pdf' || !candidate.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files with a .pdf extension are accepted.'
    }
    if (candidate.size > MAX_FILE_SIZE) return 'PDF files must be 25 MB or smaller.'
    return ''
  }

  const selectFile = (candidate) => {
    const error = validateFile(candidate)
    setFileError(error)
    setPageCount(null)
    if (!error) {
      setFile(candidate)
      printFlowStore.setFile(candidate)
    }
    else setFile(null)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files[0])
  }

  const updateOption = (name, value) => {
    setOptions((current) => ({ ...current, [name]: value }))
    setOptionError('')
  }

  const handleContinue = (event) => {
    event.preventDefault()
    const copies = Number(options.copies)
    const nextOptionError = !Number.isInteger(copies) || copies < 1 ? 'Copies must be a positive whole number.' : ''
    setOptionError(nextOptionError)

    if (fileError || !file || !pageCount || nextOptionError || !shop?.name || shop.bwPrice === undefined || shop.colorPrice === undefined) return

    onContinue({
      file,
      fileName: file.name,
      fileSize: file.size,
      pageCount,
      options: { ...options, copies },
    })
  }

  const price = options.printType === 'bw' ? shop?.bwPrice : shop?.colorPrice
  const hasPrice = price !== undefined && price !== null && Number.isFinite(Number(price))
  const estimatedTotal = pageCount && hasPrice ? pageCount * Number(options.copies) * Number(price) : null

  return (
    <form className="print-config-form" onSubmit={handleContinue}>
      <div
        className={`pdf-dropzone ${isDragging ? 'dragging' : ''} ${fileError ? 'has-error' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => selectFile(event.target.files[0])} />
        {file ? (
          <div className="selected-file" onClick={(event) => event.stopPropagation()}>
            <div className="selected-file-icon"><FileText size={22} /></div>
            <div className="selected-file-info"><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · PDF selected</span></div>
            <button type="button" className="icon-button" onClick={() => { setFile(null); setPageCount(null); setFileError('') }} aria-label="Remove PDF" title="Remove PDF"><X size={17} /></button>
          </div>
        ) : (
          <div className="dropzone-prompt"><div className="prompt-icon"><Upload size={25} /></div><strong>Drop your PDF here</strong><span>or choose a file from your device · maximum 25 MB</span><button type="button" className="secondary-button" onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click() }}>Choose PDF</button></div>
        )}
      </div>
      {fileError && <span className="field-error">{fileError}</span>}
      {file && !fileError && <div className="upload-success"><CheckCircle2 size={17} /> PDF selected successfully. {pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'} detected.` : 'Reading page count...'}</div>}

      <div className="print-option-section">
        <div className="option-heading"><span className="card-kicker">Print settings</span><h2>Configure your print</h2></div>
        <div className="option-field"><label>Print type</label><div className="segmented-options"><button type="button" className={options.printType === 'bw' ? 'active' : ''} onClick={() => updateOption('printType', 'bw')}>B/W</button><button type="button" className={options.printType === 'color' ? 'active' : ''} onClick={() => updateOption('printType', 'color')}>Colour</button></div></div>
        <div className="option-field"><label>Priority</label><div className="segmented-options"><button type="button" className={options.priority === 'normal' ? 'active' : ''} onClick={() => updateOption('priority', 'normal')}>Normal Print</button><button type="button" className={options.priority === 'urgent' ? 'active urgent-option' : ''} onClick={() => updateOption('priority', 'urgent')}>Urgent Print</button></div><span className="option-help">Urgent orders are prioritized by the selected shop.</span></div>
        <div className="option-grid">
          <div className="option-field"><label htmlFor="copies">Copies</label><div className="copies-control"><button type="button" onClick={() => updateOption('copies', Math.max(1, Number(options.copies) - 1))} aria-label="Decrease copies"><Minus size={16} /></button><input id="copies" type="number" min="1" step="1" value={options.copies} onChange={(event) => updateOption('copies', event.target.value)} /><button type="button" onClick={() => updateOption('copies', Number(options.copies) + 1)} aria-label="Increase copies"><Plus size={16} /></button></div>{optionError && <span className="field-error">{optionError}</span>}</div>
          <div className="option-field"><label htmlFor="paperSize">Paper size</label><select id="paperSize" value={options.paperSize} onChange={(event) => updateOption('paperSize', event.target.value)}><option>A4</option><option>A3</option><option>Letter</option></select></div>
        </div>
        <div className="option-field"><label>Printing side</label><div className="segmented-options"><button type="button" className={options.side === 'single' ? 'active' : ''} onClick={() => updateOption('side', 'single')}>Single-side</button><button type="button" className={options.side === 'double' ? 'active' : ''} onClick={() => updateOption('side', 'double')}>Double-side</button></div></div>
      </div>

      <div className="estimate-panel"><div><span>Price per page</span><strong>{hasPrice ? `₹${price}` : 'Price unavailable'}</strong></div><div><span>Page count</span><strong>{pageCount || 'Reading...'}</strong></div><div><span>Estimated total</span><strong className={estimatedTotal === null ? 'estimate-pending' : ''}>{estimatedTotal === null ? 'Pending page count' : `₹${estimatedTotal}`}</strong></div></div>
      <button type="submit" className="primary-button print-continue"><FileText size={18} /> Continue to Order Summary</button>
    </form>
  )
}

export default PrintConfigurationForm
