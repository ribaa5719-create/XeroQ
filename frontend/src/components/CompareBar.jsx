import { ArrowRight, GitCompare, X } from 'lucide-react'

function CompareBar({ selectedCount, maxItems, onCompare, onClear }) {
  return (
    <div className="compare-bar">
      <div className="compare-bar-info">
        <div className="compare-bar-icon"><GitCompare size={18} /></div>
        <div>
          <strong>{selectedCount} shop{selectedCount === 1 ? '' : 's'} selected</strong>
          <span>Choose up to {maxItems} shops to compare</span>
        </div>
      </div>
      <div className="compare-bar-actions">
        <button type="button" className="clear-compare-button" onClick={onClear}>
          <X size={16} /> Clear
        </button>
        <button type="button" className="primary-button compare-button" onClick={onCompare} disabled={selectedCount < 2}>
          Compare Selected <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default CompareBar
