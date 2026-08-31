import { Hash } from 'lucide-react'

function TokenDisplay({ token }) {
  return (
    <div className="token-display">
      <Hash size={18} />
      <span>{token || 'Not assigned yet'}</span>
    </div>
  )
}

export default TokenDisplay
