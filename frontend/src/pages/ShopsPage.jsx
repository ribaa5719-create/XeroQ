import { AlertCircle, FileText, LocateFixed, MapPin, Navigation, RefreshCw, Search, Star, Store } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopMap from '../components/ShopMap'
import CompareBar from '../components/CompareBar'
import ShopComparison from '../components/ShopComparison'
import { shopApi } from '../services/shopApi'
import { getReliableLocation } from '../utils/geolocation'

const DEFAULT_RADIUS = 5
const MAX_COMPARE_SHOPS = 4

const getDirectionsUrl = (userLocation, shop) =>
  `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${shop.latitude},${shop.longitude}`

const getOpenInMapsUrl = (shop) =>
  `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`

const calculateDistanceKm = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(latitudeB - latitudeA)
  const deltaLongitude = toRadians(longitudeB - longitudeA)
  const latA = toRadians(latitudeA)
  const latB = toRadians(latitudeB)

  const haversine = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLongitude / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine))
}

const mergeNearbyShops = (registeredShops, nearbyPlaces, userLocation) => {
  const merged = [...registeredShops.map((shop) => ({ ...shop, isRegistered: true }))]
  const seenKeys = new Set(
    registeredShops.map((shop) => `${Number(shop.latitude).toFixed(4)}:${Number(shop.longitude).toFixed(4)}`),
  )

  nearbyPlaces.forEach((place) => {
    const key = `${Number(place.latitude).toFixed(4)}:${Number(place.longitude).toFixed(4)}`
    const duplicate = registeredShops.some((shop) => {
      const shopLat = Number(shop.latitude)
      const shopLng = Number(shop.longitude)
      return Math.abs(shopLat - place.latitude) < 0.0008 && Math.abs(shopLng - place.longitude) < 0.0008
    })

    if (!duplicate && !seenKeys.has(key)) {
      seenKeys.add(key)
      merged.push({
        ...place,
        distance: calculateDistanceKm(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude),
        isRegistered: false,
      })
    }
  })

  return merged.sort((first, second) => (first.distance ?? 0) - (second.distance ?? 0))
}

function ShopCard({ shop, userLocation, isSelected, isCompareSelected, isCompareDisabled, onSelect, onToggleCompare }) {
  const isRegistered = shop.isRegistered !== false

  return (
    <article className={`nearby-shop-card ${isSelected ? 'selected' : ''} ${isRegistered ? '' : 'unregistered'}`} onClick={() => onSelect(shop.id)}>
      <div className="shop-card-topline">
        <div className={`shop-card-icon ${isRegistered ? '' : 'unregistered'}`}><Store size={20} /></div>
        {isRegistered ? (
          <label className={`compare-check ${isCompareSelected ? 'checked' : ''} ${isCompareDisabled ? 'disabled' : ''}`} onClick={(event) => event.stopPropagation()}>
            <input type="checkbox" checked={isCompareSelected} disabled={isCompareDisabled} onChange={() => onToggleCompare(shop.id)} />
            <span>Compare</span>
          </label>
        ) : (
          <span className="shop-badge unregistered">Not registered on XeroQ</span>
        )}
      </div>
      <h2>{shop.name}</h2>
      <p className="shop-address"><MapPin size={15} /> {shop.address || shop.displayName || 'Nearby print shop'}</p>
      <div className="shop-card-meta">
        <span>{shop.distance !== undefined ? `${Number(shop.distance).toFixed(2)} km away` : 'Nearby place'}</span>
        <span className="rating-placeholder">
          <Star size={14} />
          {isRegistered ? (shop.ratingAverage ? `${Number(shop.ratingAverage).toFixed(1)} (${shop.ratingCount})` : 'No ratings yet') : 'Basic place info only'}
        </span>
      </div>

      {isRegistered ? (
        <>
          <span className={`availability-label ${shop.availability}`}>{shop.availability}</span>
          <div className="shop-prices">
            <span><strong>B/W</strong> ₹{shop.bwPrice}/page</span>
            <span><strong>Colour</strong> ₹{shop.colorPrice}/page</span>
          </div>
          <div className="shop-card-actions">
            <Link to={`/shops/${shop.id}`} className="secondary-button shop-action" onClick={(event) => event.stopPropagation()}>
              View Shop
            </Link>
            <Link to="/upload-print" state={{ shop }} className="secondary-button shop-action" onClick={(event) => event.stopPropagation()}>
              <FileText size={16} /> Print here
            </Link>
            <a
              href={getDirectionsUrl(userLocation, shop)}
              target="_blank"
              rel="noreferrer"
              className="primary-button shop-action"
              onClick={(event) => event.stopPropagation()}
            >
              <Navigation size={16} /> Directions
            </a>
          </div>
        </>
      ) : (
        <div className="shop-card-actions">
          <a
            href={getDirectionsUrl(userLocation, shop)}
            target="_blank"
            rel="noreferrer"
            className="primary-button shop-action"
            onClick={(event) => event.stopPropagation()}
          >
            <Navigation size={16} /> Directions
          </a>
          <a
            href={getOpenInMapsUrl(shop)}
            target="_blank"
            rel="noreferrer"
            className="secondary-button shop-action"
            onClick={(event) => event.stopPropagation()}
          >
            Open in Maps
          </a>
        </div>
      )}
    </article>
  )
}

function ShopsPage() {
  const [userLocation, setUserLocation] = useState(null)
  const [locationState, setLocationState] = useState('idle')
  const [locationError, setLocationError] = useState('')
  const [radius, setRadius] = useState(DEFAULT_RADIUS)
  const [shops, setShops] = useState([])
  const [registeredState, setRegisteredState] = useState('idle')
  const [externalState, setExternalState] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [nearbyPlacesError, setNearbyPlacesError] = useState('')
  const [selectedShopId, setSelectedShopId] = useState(null)
  const [compareShopIds, setCompareShopIds] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const locationRequestCancel = useRef(null)
  const searchRequestId = useRef(0)
  const searchControllers = useRef({ registered: null, external: null })

  const findLocation = useCallback(() => {
    locationRequestCancel.current?.()
    searchRequestId.current += 1
    searchControllers.current.registered?.abort()
    searchControllers.current.external?.abort()
    setShops([])
    setSelectedShopId(null)
    if (!navigator.geolocation) {
      setLocationState('error')
      setLocationError('Your browser does not support location services.')
      return
    }

    setLocationState('loading')
    setLocationError('')
    locationRequestCancel.current = getReliableLocation(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setLocationState('ready')
      },
      (error) => {
        setLocationState('error')
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission is blocked. Please enable location access in your browser/device settings.'
          : 'Location unavailable. Please try again.')
      },
    )
  }, [])

  const searchNearbyShops = useCallback(() => {
    if (!userLocation) return undefined

    const requestId = searchRequestId.current + 1
    searchRequestId.current = requestId
    searchControllers.current.registered?.abort()
    searchControllers.current.external?.abort()
    const registeredController = new AbortController()
    const externalController = new AbortController()
    searchControllers.current = { registered: registeredController, external: externalController }
    let currentRegisteredShops = []
    let currentNearbyPlaces = []

    setRegisteredState('loading')
    setExternalState('loading')
    setShops([])
    setSearchError('')
    setNearbyPlacesError('')
    setSelectedShopId(null)
    setShowComparison(false)

    const updateResults = () => {
      if (searchRequestId.current !== requestId) return
      const mergedShops = mergeNearbyShops(currentRegisteredShops, currentNearbyPlaces, userLocation)
      setShops(mergedShops)
      setSelectedShopId((currentId) => currentId && mergedShops.some((shop) => shop.id === currentId) ? currentId : mergedShops[0]?.id || null)
      setCompareShopIds((currentIds) => currentIds.filter((id) => mergedShops.some((shop) => shop.id === id)))
    }

    shopApi.getNearby({ ...userLocation, radius }, { signal: registeredController.signal })
      .then((response) => {
        if (searchRequestId.current !== requestId) return
        currentRegisteredShops = response.data.shops || []
        setRegisteredState('loaded')
        updateResults()
      })
      .catch((error) => {
        if (searchRequestId.current !== requestId || error.code === 'ERR_CANCELED') return
        setRegisteredState('error')
        setSearchError(error.response?.data?.message || 'Unable to load XeroQ shops right now.')
      })

    shopApi.getNearbyPlaces({ ...userLocation, radius }, externalController.signal)
      .then((places) => {
        if (searchRequestId.current !== requestId) return
        currentNearbyPlaces = places
        setExternalState('loaded')
        updateResults()
      })
      .catch((error) => {
        if (searchRequestId.current !== requestId || error.name === 'AbortError') return
        setExternalState('error')
        setNearbyPlacesError(error.message || 'Nearby print shops could not be loaded right now.')
      })

    return () => {
      registeredController.abort()
      externalController.abort()
    }
  }, [radius, userLocation])

  useEffect(() => {
    if (!userLocation) return undefined

    let cleanupSearch
    const searchTimer = window.setTimeout(() => {
      cleanupSearch = searchNearbyShops()
    }, 0)
    return () => {
      window.clearTimeout(searchTimer)
      cleanupSearch?.()
      searchRequestId.current += 1
    }
  }, [userLocation, radius, searchNearbyShops])

  useEffect(() => () => {
    locationRequestCancel.current?.()
    searchControllers.current.registered?.abort()
    searchControllers.current.external?.abort()
  }, [])

  const isSearching = registeredState === 'loading'

  const toggleCompareShop = (shopId) => {
    setCompareShopIds((currentIds) => currentIds.includes(shopId)
      ? currentIds.filter((id) => id !== shopId)
      : currentIds.length < MAX_COMPARE_SHOPS ? [...currentIds, shopId] : currentIds)
  }

  const selectedCompareShops = shops.filter((shop) => compareShopIds.includes(shop.id) && shop.isRegistered !== false)

  return (
    <div className="app-shell discovery-shell">
      <div className="container discovery-container">
        <div className="discovery-topbar">
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
          <Link to="/" className="back-link">Back to Home</Link>
        </div>

        <div className="discovery-heading">
          <span className="section-tag"><Search size={15} /> Find shops</span>
          <h1>Find a Xerox shop near you</h1>
          <p>Use your location to discover approved shops and nearby print stores that are not yet registered on XeroQ.</p>
        </div>

        <div className="location-toolbar">
          <div className={`location-status ${locationState}`}>
            <LocateFixed size={19} />
            <span>{locationState === 'ready' ? 'Location ready' : locationState === 'loading' ? 'Getting your location...' : locationState === 'error' ? 'Location unavailable' : 'Location permission needed'}</span>
          </div>
          <div className="radius-control">
            <label htmlFor="radius">Search radius</label>
            <select id="radius" value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
              <option value="1">Within 1 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>
          <button type="button" className="primary-button location-button" onClick={findLocation} disabled={locationState === 'loading'}>
            <LocateFixed size={17} /> {locationState === 'ready' ? 'Refresh location' : locationState === 'error' ? 'Retry location' : 'Use my location'}
          </button>
        </div>

        {locationError && <div className="auth-error discovery-error"><AlertCircle size={18} /> {locationError}</div>}
        {nearbyPlacesError && <div className="auth-error discovery-error"><AlertCircle size={18} /> {nearbyPlacesError}</div>}
        {searchError && <div className="auth-error discovery-error"><AlertCircle size={18} /> {searchError}</div>}

        {!userLocation ? (
          <div className="location-prompt dashboard-card">
            <div className="prompt-icon"><LocateFixed size={30} /></div>
            <h2>Allow location access</h2>
            <p>We use your current browser location to calculate distances and show nearby XeroQ shops and nearby print places.</p>
            <button type="button" className="primary-button" onClick={findLocation} disabled={locationState === 'loading'}>
              {locationState === 'loading' ? 'Finding your location...' : 'Find shops near me'}
            </button>
          </div>
        ) : (
          <>
          <div className="discovery-layout">
            <div className="nearby-results">
              <div className="results-heading">
                <div>
                  <span className="card-kicker">Nearby places</span>
                  <h2>{isSearching ? 'Searching XeroQ shops...' : `${shops.length} result${shops.length === 1 ? '' : 's'} found`}</h2>
                  <p className="results-source-status">{externalState === 'loading' ? 'Searching nearby places...' : externalState === 'error' ? 'External search unavailable' : externalState === 'loaded' ? 'Nearby places loaded' : ''}</p>
                </div>
                <button type="button" className="icon-button" onClick={searchNearbyShops} disabled={isSearching} aria-label="Refresh nearby shops" title="Refresh nearby shops">
                  <RefreshCw size={18} />
                </button>
              </div>
              {isSearching && <div className="empty-results"><p>{registeredState === 'loading' ? 'Searching XeroQ shops...' : 'Searching nearby places...'}</p></div>}
              {!isSearching && externalState !== 'loading' && shops.length === 0 && <div className="empty-results"><MapPin size={28} /><p>No nearby print shops were found within {radius} km. Try a wider radius.</p></div>}
              {shops.map((shop) => <ShopCard key={shop.id} shop={shop} userLocation={userLocation} isSelected={selectedShopId === shop.id} isCompareSelected={compareShopIds.includes(shop.id)} isCompareDisabled={compareShopIds.length >= MAX_COMPARE_SHOPS && !compareShopIds.includes(shop.id)} onSelect={setSelectedShopId} onToggleCompare={toggleCompareShop} />)}
            </div>
            <ShopMap userLocation={userLocation} shops={shops} selectedShopId={selectedShopId} onSelectShop={setSelectedShopId} />
          </div>
          {compareShopIds.length > 0 && <CompareBar selectedCount={compareShopIds.length} maxItems={MAX_COMPARE_SHOPS} onCompare={() => setShowComparison(true)} onClear={() => { setCompareShopIds([]); setShowComparison(false) }} />}
          {showComparison && selectedCompareShops.length >= 2 && <ShopComparison shops={selectedCompareShops} onRemove={(shopId) => setCompareShopIds((currentIds) => currentIds.filter((id) => id !== shopId))} onClose={() => setShowComparison(false)} />}
          </>
        )}
      </div>
    </div>
  )
}

export default ShopsPage
