import { AlertCircle, ArrowLeft, Clock3, FileText, Store } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PrintConfigurationForm from '../components/PrintConfigurationForm'
import { printFlowStore } from '../services/printFlowStore'

function UploadPrintPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const shop = location.state?.shop
  const reorder = location.state?.reorder
  const initialConfiguration = location.state?.configuration || (reorder ? {
    options: {
      printType: reorder.printType,
      priority: reorder.priority || 'normal',
      copies: reorder.copies,
      paperSize: reorder.paperSize,
      side: reorder.printSide,
    },
  } : undefined)

  if (!shop) {
    return (
      <div className="app-shell page-shell">
        <div className="container placeholder-wrap">
          <div className="placeholder-card">
            <AlertCircle size={30} />
            <h1>Select a shop first</h1>
            <p>Choose an approved shop from the nearby search page before configuring a print job.</p>
            <Link to="/shops" className="primary-button">Find Xerox Shops</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell print-shell">
      <div className="container print-container">
        <div className="print-topbar">
          <Link to="/shops" className="back-link"><ArrowLeft size={16} /> Back to Shops</Link>
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
        </div>

        <div className="print-heading">
          <span className="section-tag"><FileText size={15} /> Print setup</span>
          <h1>Upload and configure your print</h1>
          <p>{reorder ? 'Previous print settings restored. Please select your PDF to continue.' : 'Prepare your PDF for a new order. It will be uploaded securely when you place the order.'}</p>
        </div>

        <div className="selected-shop-strip">
          <div className="selected-shop-icon"><Store size={20} /></div>
          <div><span className="card-kicker">Printing at</span><strong>{shop.name}</strong><span>{shop.address}, {shop.city}</span></div>
          <div className="shop-price-summary"><span>B/W ₹{shop.bwPrice}/page</span><span>Colour ₹{shop.colorPrice}/page</span></div>
        </div>

        <div className="print-layout">
          <div className="dashboard-card print-form-card">
            <PrintConfigurationForm
              shop={shop}
              initialConfiguration={initialConfiguration}
              onContinue={(configuration) => {
                printFlowStore.setFile(configuration.file)
                navigate('/order-summary', { state: { shop, configuration } })
              }}
            />
          </div>
          <aside className="dashboard-card print-info-card">
            <div className="prompt-icon"><Clock3 size={24} /></div>
            <h2>One step at a time</h2>
            <p>Choose your options now. Page count and final pricing will be confirmed after PDF upload is available.</p>
            <div className="info-row"><FileText size={17} /><span>PDF files only</span></div>
            <div className="info-row"><Store size={17} /><span>Selected shop prices apply</span></div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default UploadPrintPage
