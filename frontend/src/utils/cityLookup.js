// Approximate closest US city based on lat/lng
const cities = [
  { name: "Washington D.C.", state: "DC", lat: 38.90, lng: -77.03 },
  { name: "New York City",   state: "NY", lat: 40.71, lng: -74.00 },
  { name: "Los Angeles",     state: "CA", lat: 34.05, lng: -118.24 },
  { name: "Chicago",         state: "IL", lat: 41.87, lng: -87.62 },
  { name: "Houston",         state: "TX", lat: 29.76, lng: -95.36 },
  { name: "Phoenix",         state: "AZ", lat: 33.44, lng: -112.07 },
  { name: "Seattle",         state: "WA", lat: 47.60, lng: -122.33 },
  { name: "Miami",           state: "FL", lat: 25.76, lng: -80.19 },
  { name: "Philadelphia",    state: "PA", lat: 39.95, lng: -75.16 },
  { name: "Dallas",          state: "TX", lat: 32.77, lng: -96.79 },
  { name: "San Francisco",   state: "CA", lat: 37.77, lng: -122.41 },
  { name: "Boston",          state: "MA", lat: 42.36, lng: -71.05 },
]

function getDistance(lat1, lng1, lat2, lng2) {
  const R    = 3959 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getClosestCity(lat, lng) {
  let closest = cities[0]
  let minDist = Infinity
  for (const city of cities) {
    const dist = getDistance(lat, lng, city.lat, city.lng)
    if (dist < minDist) {
      minDist  = dist
      closest  = city
    }
  }
  return { ...closest, distanceMiles: Math.round(minDist) }
}

export function getRegionRisk(lat, lng) {
  if (lat > 45 && lng < -115)
    return { label: 'Wildfire / Forest Fire Risk', icon: '🌲', level: 'high' }
  if (lat > 32 && lat < 42 && lng < -114)
    return { label: 'Wildfire / Drought Risk', icon: '🔥', level: 'high' }
  if (lat < 30 && lng > -85)
    return { label: 'Hurricane Exposure', icon: '🌀', level: 'medium' }
  if (lat < 32 && lng > -97 && lng < -85)
    return { label: 'Flood / Storm Surge Risk', icon: '🌊', level: 'medium' }
  return { label: 'Standard Grid Risk', icon: '⚡', level: 'low' }
}
