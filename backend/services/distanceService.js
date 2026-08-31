const toRadians = (degrees) => (degrees * Math.PI) / 180

const calculateDistanceInKilometers = (fromLatitude, fromLongitude, toLatitude, toLongitude) => {
  const earthRadiusInKilometers = 6371
  const latitudeDelta = toRadians(toLatitude - fromLatitude)
  const longitudeDelta = toRadians(toLongitude - fromLongitude)
  const latitudeOne = toRadians(fromLatitude)
  const latitudeTwo = toRadians(toLatitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusInKilometers * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

module.exports = { calculateDistanceInKilometers }
