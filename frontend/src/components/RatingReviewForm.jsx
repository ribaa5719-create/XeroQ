import { Star } from 'lucide-react'
import { useState } from 'react'
import { reviewApi } from '../services/reviewApi'

function RatingReviewForm({ orderId, onCancel, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setErrorMessage('Please select a rating from 1 to 5 stars.')
      return
    }
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const response = await reviewApi.create({ orderId, rating, comment })
      onSubmitted(response.data.review)
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to submit your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      <div className="rating-form-heading"><span className="card-kicker">Your experience</span><h3>Rate this shop</h3></div>
      <div className="star-selector" aria-label="Rating from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= rating ? 'active' : ''} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? '' : 's'}`}><Star size={25} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}
      </div>
      <div className="rating-field"><label htmlFor="review-comment">Review (optional)</label><textarea id="review-comment" value={comment} maxLength={500} onChange={(event) => setComment(event.target.value)} placeholder="Share a little about your experience" /><span>{comment.length}/500</span></div>
      {errorMessage && <div className="auth-error rating-message">{errorMessage}</div>}
      <div className="rating-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</button></div>
    </form>
  )
}

export default RatingReviewForm
