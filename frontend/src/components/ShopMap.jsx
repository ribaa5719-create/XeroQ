import { MapContainer, Popup, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

function MapViewport({ userLocation, selectedShop }) {
  const map = useMap()

  useEffect(() => {
    const target = selectedShop
      ? [selectedShop.latitude, selectedShop.longitude]
      : [userLocation.latitude, userLocation.longitude]

    map.setView(target, selectedShop ? 15 : 13, { animate: true })
  }, [map, selectedShop, userLocation])

  return null
}

function ShopMap({ userLocation, shops, selectedShopId, onSelectShop }) {
  const selectedShop = shops.find((shop) => shop.id === selectedShopId)
  const center = [userLocation.latitude, userLocation.longitude]

  return (
    <div className="shop-map-wrap">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="shop-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport userLocation={userLocation} selectedShop={selectedShop} />

        <CircleMarker center={center} radius={10} pathOptions={{ color: '#1d4ed8', fillColor: '#2563eb', fillOpacity: 1 }}>
          <Popup>You are here</Popup>
        </CircleMarker>

        {shops.map((shop) => {
          const isRegistered = shop.isRegistered !== false
          const isSelected = shop.id === selectedShopId
          const markerStyle = isRegistered
            ? {
                color: isSelected ? '#7c3aed' : '#0f766e',
                fillColor: isSelected ? '#8b5cf6' : '#14b8a6',
              }
            : {
                color: isSelected ? '#b45309' : '#d97706',
                fillColor: isSelected ? '#f59e0b' : '#fbbf24',
              }

          return (
            <CircleMarker
              key={shop.id}
              center={[shop.latitude, shop.longitude]}
              radius={isSelected ? 12 : 9}
              pathOptions={{ ...markerStyle, fillOpacity: 0.9 }}
              eventHandlers={{ click: () => onSelectShop(shop.id) }}
            >
              <Popup>
                <strong>{shop.name}</strong>
                <br />
                {shop.address || 'Nearby print shop'}
                <br />
                {shop.distance !== undefined ? `${Number(shop.distance).toFixed(2)} km away` : 'Nearby place'}
                <br />
                <em>{isRegistered ? 'XeroQ registered shop' : 'Not registered on XeroQ'}</em>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default ShopMap
