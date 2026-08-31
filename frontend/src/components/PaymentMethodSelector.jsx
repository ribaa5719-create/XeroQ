import { Banknote, CreditCard } from 'lucide-react'

function PaymentMethodSelector({ value, onChange }) {
  return (
    <div className="payment-method-section">
      <div className="option-heading">
        <span className="card-kicker">Payment</span>
        <h2>Payment method</h2>
      </div>
      <div className="payment-method-options">
        <label className={`payment-method-option ${value === 'pay_at_shop' ? 'selected' : ''}`}>
          <input type="radio" name="paymentMethod" value="pay_at_shop" checked={value === 'pay_at_shop'} onChange={onChange} />
          <Banknote size={20} />
          <span><strong>Pay at Shop</strong><small>Pay when you collect your printed documents.</small></span>
        </label>
        <label className="payment-method-option disabled-option">
          <input type="radio" name="paymentMethod" value="online" disabled />
          <CreditCard size={20} />
          <span><strong>Online Payment</strong><small>Coming Soon</small></span>
        </label>
      </div>
    </div>
  )
}

export default PaymentMethodSelector
