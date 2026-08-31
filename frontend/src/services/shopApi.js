import api from './api'

const getPlaceSearchBounds = ({ latitude, longitude, radius }) => {
  const latitudeDelta = radius / 111.32
  const longitudeDelta = radius / (111.32 * Math.cos((latitude * Math.PI) / 180))

  return {
    minLat: latitude - latitudeDelta,
    maxLat: latitude + latitudeDelta,
    minLng: longitude - longitudeDelta,
    maxLng: longitude + longitudeDelta,
  }
}

export const shopApi = {
  getNearby: ({ latitude, longitude, radius }) =>
    api.get('/shops/nearby', { params: { latitude, longitude, radius } }),
  getPublicById: (shopId) => api.get(`/shops/${shopId}`),
  getMyShop: () => api.get('/shops/my'),
  create: (shopData) => api.post('/shops', shopData),
  update: (shopData) => api.put('/shops/my', shopData),
  updateAvailability: (availability) => api.patch('/shops/my/availability', { availability }),
  getNearbyPlaces: async ({ latitude, longitude, radius }) => {
    const { minLat, maxLat, minLng, maxLng } = getPlaceSearchBounds({ latitude, longitude, radius })
    const query = encodeURIComponent('xerox print shop copy shop')
    const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&bounded=1&addressdetails=1&extratags=1&q=${query}&viewbox=${viewbox}`,
      { headers: { Accept: 'application/json' } },
    )

    if (!response.ok) {
      throw new Error('Unable to load nearby print shops.')
    }

    const results = await response.json()
    return results.filter((place) => place && place.lat && place.lon).map((place) => ({
      id: `place-${place.place_id}`,
      name: place.name || place.display_name.split(',')[0],
      address: place.address?.road || place.address?.village || place.address?.city || place.display_name,
      city: place.address?.city || place.address?.town || place.address?.village || place.address?.state || 'Nearby area',
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      isRegistered: false,
      isUnregistered: true,
      availability: 'not_registered',
      ratingAverage: null,
      ratingCount: 0,
      placeType: place.type || 'print shop',
      displayName: place.display_name,
    }))
  },
}
