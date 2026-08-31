import { AlertCircle, ArrowLeft, Clock3, FileText, MapPin, Navigation, Phone, Star, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ShopMap from '../components/ShopMap'
import { shopApi } from '../services/shopApi'
import { calculateDistanceInKilometers } from '../utils/distance'
import { reviewApi } from '../services/reviewApi'

const getDirectionsUrl = (userLocation, shop) =>
  userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${shop.latitude},${shop.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`

function ShopDetailsPage() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let isMounted = true

    shopApi.getPublicById(id)
      .then((response) => {
        if (isMounted) setShop(response.data.shop)
        reviewApi.getForShop(id).then((reviewResponse) => { if (isMounted) setReviews(reviewResponse.data.reviews) }).catch(() => {})
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error.response?.data?.message || 'Unable to load this shop.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (isMounted) setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
      )
    }

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><p>Loading shop details...</p></div></div></div>
  }

  if (errorMessage || !shop) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><AlertCircle size={30} /><h1>Shop unavailable</h1><p>{errorMessage || 'This approved shop could not be found.'}</p><Link to="/shops" className="primary-button">Back to Shops</Link></div></div></div>
  }

  return (
    <div className="app-shell discovery-shell">
      <div className="container details-container">
        <div className="discovery-topbar">
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
          <Link to="/shops" className="back-link"><ArrowLeft size={16} /> Back to Shops</Link>
        </div>

        <div className="shop-details-header">
          <div>
            <span className="section-tag"><Store size={15} /> Approved Xerox shop</span>
            <h1>{shop.name}</h1>
            <p><MapPin size={16} /> {shop.address}, {shop.city}</p>
          </div>
          <span className={`availability-label ${shop.availability}`}>{shop.availability}</span>
        </div>

        <div className="details-layout">
          <section className="dashboard-card details-main-card">
            <div className="detail-list">
              <div><MapPin size={18} /><span><strong>Location</strong>{shop.address}, {shop.city}</span></div>
              <div><Phone size={18} /><span><strong>Phone</strong>{shop.phone}</span></div>
              <div><Clock3 size={18} /><span><strong>Working hours</strong>{shop.openingTime} to {shop.closingTime}</span></div>
              <div><Store size={18} /><span><strong>Prices</strong>B/W ₹{shop.bwPrice} · Colour ₹{shop.colorPrice} per page</span></div>
              <div><Star size={18} /><span><strong>Rating</strong>{shop.ratingAverage ? `${Number(shop.ratingAverage).toFixed(1)} / 5 (${shop.ratingCount} ratings)` : 'No ratings yet'}</span></div>
              {userLocation && <div><MapPin size={18} /><span><strong>Distance</strong>{calculateDistanceInKilometers(userLocation, shop).toFixed(2)} km away</span></div>}
            </div>
            <div className="details-actions">
              <Link to="/upload-print" state={{ shop }} className="secondary-button"><FileText size={17} /> Configure Print</Link>
              <a href={getDirectionsUrl(userLocation, shop)} target="_blank" rel="noreferrer" className="primary-button"><Navigation size={17} /> Get Direction</a>
            </div>
          </section>

          <div className="details-map-card">
            {shop.latitude !== undefined && shop.longitude !== undefined ? (
              <ShopMap userLocation={userLocation || { latitude: shop.latitude, longitude: shop.longitude }} shops={[shop]} selectedShopId={shop.id} onSelectShop={() => {}} />
            ) : <div className="empty-results"><MapPin size={28} /><p>Location coordinates are not available for this shop.</p></div>}
          </div>
        </div>
        <section className="shop-reviews dashboard-card"><div className="detail-section-heading"><Star size={19} /><h2>Customer Reviews</h2></div>{reviews.length === 0 ? <p>No reviews yet.</p> : reviews.map((review) => <article className="review-card" key={review.id}><div className="review-stars">{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><strong>{review.reviewerName || 'Student'}</strong>{review.comment && <p>“{review.comment}”</p>}<small>{new Date(review.createdAt).toLocaleDateString()}</small></article>)}</section>
      </div>
    </div>
  )
}

export default ShopDetailsPage
