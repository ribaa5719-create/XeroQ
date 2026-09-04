import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Edit3,
  LocateFixed,
  MapPin,
  Phone,
  Save,
  Store,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { shopApi } from '../services/shopApi'

const emptyForm = {
  name: '',
  address: '',
  city: '',
  phone: '',
  latitude: '',
  longitude: '',
  openingTime: '',
  closingTime: '',
  bwPrice: '',
  colorPrice: '',
}

const detailFields = [
  ['name', 'Shop name', 'text'],
  ['address', 'Address', 'text'],
  ['city', 'City', 'text'],
  ['phone', 'Phone number', 'tel'],
]

const hoursFields = [
  ['openingTime', 'Opening time'],
  ['closingTime', 'Closing time'],
]

const priceFields = [
  ['bwPrice', 'B/W price per page', 'number'],
  ['colorPrice', 'Colour price per page', 'number'],
]

const toForm = (shop) => ({
  name: shop.name || '',
  address: shop.address || '',
  city: shop.city || '',
  phone: shop.phone || '',
  latitude: shop.latitude ?? '',
  longitude: shop.longitude ?? '',
  openingTime: shop.openingTime || '',
  closingTime: shop.closingTime || '',
  bwPrice: shop.bwPrice ?? '',
  colorPrice: shop.colorPrice ?? '',
})

const toPayload = (form) => {
  const payload = {
    ...form,
    latitude: form.latitude === '' ? undefined : Number(form.latitude),
    longitude: form.longitude === '' ? undefined : Number(form.longitude),
    bwPrice: Number(form.bwPrice),
    colorPrice: Number(form.colorPrice),
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

const toTwelveHourTime = (value) => {
  const [rawHours = '09', minutes = '00'] = value.split(':')
  const hours = Number(rawHours)
  return {
    hour: String(hours % 12 || 12).padStart(2, '0'),
    minute: minutes,
    period: hours >= 12 ? 'PM' : 'AM',
  }
}

const toTwentyFourHourTime = (hour, minute, period) => {
  let hours = Number(hour) % 12
  if (period === 'PM') hours += 12
  return `${String(hours).padStart(2, '0')}:${minute}`
}

function ShopForm({ initialValues, isCreating, onSaved }) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [locationState, setLocationState] = useState(
    initialValues.latitude !== '' && initialValues.longitude !== '' ? 'captured' : 'idle',
  )
  const [locationError, setLocationError] = useState('')

  const validate = () => {
    const nextErrors = {}
    const phonePattern = /^[0-9+()\-\s]{7,15}$/
    const latitude = form.latitude === '' ? null : Number(form.latitude)
    const longitude = form.longitude === '' ? null : Number(form.longitude)

    if (!form.name.trim()) nextErrors.name = 'Shop name is required.'
    if (!form.address.trim()) nextErrors.address = 'Address is required.'
    if (!form.city.trim()) nextErrors.city = 'City is required.'
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
    else if (!phonePattern.test(form.phone)) nextErrors.phone = 'Enter a valid phone number.'
    if (!form.openingTime) nextErrors.openingTime = 'Opening time is required.'
    if (!form.closingTime) nextErrors.closingTime = 'Closing time is required.'
    if (form.bwPrice === '' || Number(form.bwPrice) < 0) nextErrors.bwPrice = 'B/W price must be 0 or more.'
    if (form.colorPrice === '' || Number(form.colorPrice) < 0) nextErrors.colorPrice = 'Colour price must be 0 or more.'
    if (latitude === null || longitude === null) {
      nextErrors.location = 'Shop location is required. Use the location button before submitting.'
    }
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      nextErrors.latitude = 'Latitude must be between -90 and 90.'
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      nextErrors.longitude = 'Longitude must be between -180 and 180.'
    }

    return nextErrors
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('error')
      setLocationError('Your browser does not support location services.')
      return
    }

    setLocationState('loading')
    setLocationError('')
    setErrors((prev) => ({ ...prev, location: '' }))

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }))
        setLocationState('captured')
      },
      (error) => {
        setLocationState('error')
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access and try again.'
          : 'Your location is currently unavailable. Please try again.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setRequestError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    setRequestError('')

    try {
      const response = isCreating
        ? await shopApi.create(toPayload(form))
        : await shopApi.update(toPayload(form))
      onSaved(response.data.shop, isCreating ? 'Shop is active and ready for customers.' : 'Shop profile updated successfully.')
    } catch (error) {
      setRequestError(error.response?.data?.message || 'Unable to save shop details. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="shop-form" onSubmit={handleSubmit} noValidate>
      <ShopFormSection title="Shop details" fields={detailFields} form={form} errors={errors} onChange={handleChange} />
      <section className="shop-form-section compact">
        <div className="shop-form-section-heading">
          <h2>Opening hours</h2>
          <span className="shop-form-note">12-hour format</span>
        </div>
        <div className="shop-form-grid">
          {hoursFields.map(([name, label]) => (
            <TimeField key={name} name={name} label={label} value={form[name]} error={errors[name]} onChange={(value) => {
              setForm((prev) => ({ ...prev, [name]: value }))
              setErrors((prev) => ({ ...prev, [name]: '' }))
            }} />
          ))}
        </div>
      </section>
      <ShopFormSection title="Pricing" fields={priceFields} form={form} errors={errors} onChange={handleChange} />

      <div className="shop-form-section">
        <div className="shop-form-section-heading">
          <div>
            <span className="card-kicker">Shop location</span>
            <h2>Where can customers find you?</h2>
          </div>
          <MapPin size={22} className="card-icon" />
        </div>
        <p className="shop-form-help">Capture your shop's current location so customers can find it nearby.</p>
        <button type="button" className={`location-capture ${locationState === 'captured' ? 'captured' : ''}`} onClick={captureLocation} disabled={locationState === 'loading'}>
          <LocateFixed size={18} />
          {locationState === 'loading' ? 'Capturing location...' : locationState === 'captured' ? 'Shop location captured' : 'Use Current Location'}
        </button>
        {locationError && <span className="field-error">{locationError}</span>}
        {errors.location && <span className="field-error">{errors.location}</span>}
      </div>

      {requestError && <div className="auth-error">{requestError}</div>}

      <button type="submit" className="primary-button" disabled={isSaving}>
        <Save size={18} />
        {isSaving ? 'Creating shop...' : isCreating ? 'Create Active Shop' : 'Save Changes'}
      </button>
    </form>
  )
}

function ShopFormSection({ title, fields, form, errors, onChange }) {
  return (
    <section className="shop-form-section compact">
      <div className="shop-form-section-heading">
        <h2>{title}</h2>
      </div>
      <div className="shop-form-grid">
        {fields.map(([name, label, type]) => (
          <div className={`field-group ${name === 'address' ? 'full-field' : ''}`} key={name}>
            <label htmlFor={`shop-${name}`}>{label}</label>
            <input
              id={`shop-${name}`}
              name={name}
              type={type}
              min={type === 'number' ? 0 : undefined}
              step={type === 'number' ? 'any' : undefined}
              value={form[name]}
              onChange={onChange}
              className={errors[name] ? 'input-error' : ''}
            />
            {errors[name] && <span className="field-error">{errors[name]}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}

function TimeField({ name, label, value, error, onChange }) {
  const time = toTwelveHourTime(value || '09:00')
  const update = (key, nextValue) => {
    const nextTime = { ...time, [key]: nextValue }
    onChange(toTwentyFourHourTime(nextTime.hour, nextTime.minute, nextTime.period))
  }

  return (
    <div className="field-group">
      <label htmlFor={`shop-${name}-hour`}>{label}</label>
      <div className={`time-select-group ${error ? 'input-error' : ''}`}>
        <select id={`shop-${name}-hour`} value={time.hour} onChange={(event) => update('hour', event.target.value)} aria-label={`${label} hour`}>
          {Array.from({ length: 12 }, (_, index) => {
            const hour = String(index + 1).padStart(2, '0')
            return <option key={hour} value={hour}>{hour}</option>
          })}
        </select>
        <span>:</span>
        <select value={time.minute} onChange={(event) => update('minute', event.target.value)} aria-label={`${label} minute`}>
          {['00', '15', '30', '45'].map((minute) => <option key={minute} value={minute}>{minute}</option>)}
        </select>
        <select value={time.period} onChange={(event) => update('period', event.target.value)} aria-label={`${label} AM or PM`}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function StatusBanner({ status }) {
  const config = {
    pending: {
      icon: Clock3,
      title: 'Pending approval',
      text: 'Your shop profile is waiting for admin approval. It will not be active for students until approved.',
    },
    approved: {
      icon: CheckCircle2,
      title: 'Shop is active',
      text: 'Your shop has been approved and is active on XeroQ.',
    },
    rejected: {
      icon: XCircle,
      title: 'Shop rejected',
      text: 'Your shop profile was rejected by an administrator. Please review your details and contact support.',
    },
  }[status]
  const Icon = config.icon

  return (
    <div className={`status-banner ${status}`}>
      <Icon size={24} />
      <div>
        <strong>{config.title}</strong>
        <p>{config.text}</p>
      </div>
    </div>
  )
}

function ShopDashboardPage() {
  const [shop, setShop] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)

  const loadShop = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const response = await shopApi.getMyShop()
      setShop(response.data.shop)
    } catch (error) {
      if (error.response?.status !== 404) {
        setLoadError(error.response?.data?.message || 'Unable to load your shop profile.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    shopApi.getMyShop()
      .then((response) => {
        if (isMounted) setShop(response.data.shop)
      })
      .catch((error) => {
        if (isMounted && error.response?.status !== 404) {
          setLoadError(error.response?.data?.message || 'Unable to load your shop profile.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSaved = (savedShop, message) => {
    setShop(savedShop)
    setIsEditing(false)
    setSuccessMessage(message)
  }

  const handleAvailability = async (event) => {
    const availability = event.target.value
    setIsUpdatingAvailability(true)
    setAvailabilityError('')
    setSuccessMessage('')

    try {
      const response = await shopApi.updateAvailability(availability)
      setShop(response.data.shop)
      setSuccessMessage('Availability updated successfully.')
    } catch (error) {
      setAvailabilityError(error.response?.data?.message || 'Unable to update availability.')
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  if (isLoading) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><p>Loading your shop dashboard...</p></div></div></div>
  }

  if (loadError) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><AlertCircle size={32} /><h1>Unable to load shop</h1><p>{loadError}</p><button type="button" className="primary-button" onClick={loadShop}>Try Again</button></div></div></div>
  }

  if (!shop || isEditing) {
    return (
      <div className="app-shell shop-dashboard-shell">
        <div className="container dashboard-container">
          <div className="dashboard-topbar">
            <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
            <Link to="/" className="back-link">Back to Home</Link>
          </div>
          <div className="dashboard-heading">
            <span className="section-tag"><Store size={15} /> Shop owner</span>
            <h1>{shop ? 'Edit shop profile' : 'Create Your Xerox Shop'}</h1>
            <p>{shop ? 'Keep your public shop details accurate and up to date.' : 'Add your shop details and location to submit your listing for admin approval.'}</p>
          </div>
          <div className="dashboard-card form-card">
            <ShopForm key={shop ? shop.id : 'create'} initialValues={shop ? toForm(shop) : emptyForm} isCreating={!shop} onSaved={handleSaved} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell shop-dashboard-shell">
      <div className="container dashboard-container">
        <div className="dashboard-topbar">
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>

        <div className="dashboard-heading dashboard-heading-row">
          <div>
            <span className="section-tag"><Store size={15} /> Shop owner dashboard</span>
            <h1>{shop.name}</h1>
            <p>Manage your shop profile and availability from one place.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => { setSuccessMessage(''); setIsEditing(true) }}>
            <Edit3 size={18} /> Edit shop
          </button>
          <Link to="/shop/analytics" className="secondary-button">
            <BarChart3 size={18} /> View analytics
          </Link>
        </div>

        {successMessage && <div className="auth-success dashboard-message">{successMessage}</div>}
        <StatusBanner status={shop.approvalStatus} />

        <div className="dashboard-grid">
          <section className="dashboard-card availability-card">
            <div className="card-title-row">
              <div>
                <span className="card-kicker">Current status</span>
                <h2>Availability</h2>
              </div>
              <span className={`availability-dot ${shop.availability}`} />
            </div>
            <p>Let customers know whether your shop is ready to accept print requests.</p>
            <select value={shop.availability} onChange={handleAvailability} disabled={isUpdatingAvailability}>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="closed">Closed</option>
            </select>
            {isUpdatingAvailability && <span className="loading-note">Updating status...</span>}
            {availabilityError && <span className="field-error">{availabilityError}</span>}
          </section>

          <section className="dashboard-card details-card">
            <div className="card-title-row">
              <div>
                <span className="card-kicker">Shop information</span>
                <h2>Profile details</h2>
              </div>
              <MapPin size={22} className="card-icon" />
            </div>
            <div className="detail-list">
              <div><MapPin size={17} /><span><strong>Address</strong>{shop.address}, {shop.city}</span></div>
              <div><Phone size={17} /><span><strong>Phone</strong>{shop.phone}</span></div>
              <div><Clock3 size={17} /><span><strong>Hours</strong>{shop.openingTime} to {shop.closingTime}</span></div>
              <div><Store size={17} /><span><strong>Prices</strong>B/W ₹{shop.bwPrice} · Colour ₹{shop.colorPrice} per page</span></div>
              {(shop.latitude !== undefined || shop.longitude !== undefined) && (
                <div><MapPin size={17} /><span><strong>Coordinates</strong>{shop.latitude ?? '—'}, {shop.longitude ?? '—'}</span></div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ShopDashboardPage
