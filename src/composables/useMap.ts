import { ref } from 'vue'
import L from 'leaflet'

interface LatLng {
  lat: number
  lng: number
}

interface Waypoint {
  latlng: LatLng
  label?: string
}

export function useMap() {
  const map = ref<L.Map | null>(null)
  const waypointMarkers = ref<L.Marker[]>([])
  const routeLayers = ref<L.Polyline[]>([])
  const userMarker = ref<L.Marker | null>(null)
  const trackPolyline = ref<L.Polyline | null>(null)
  const trackPoints = ref<[number, number][]>([])

  function initMap(el: string, onClick: (event: L.LeafletMouseEvent) => void): L.Map {
    map.value = L.map(el, { zoomControl: true }).setView([21.5, -77.5], 7)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map.value)
    map.value.on('click', onClick)
    return map.value
  }

  function addTrackPoint(latlng: LatLng): void {
    trackPoints.value.push([latlng.lat, latlng.lng])
    if (trackPolyline.value) {
      trackPolyline.value.setLatLngs(trackPoints.value)
    } else {
      trackPolyline.value = L.polyline(trackPoints.value, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 6'
      }).addTo(map.value!)
    }
  }

  function clearTrack(): void {
    if (trackPolyline.value) {
      map.value!.removeLayer(trackPolyline.value)
      trackPolyline.value = null
    }
    trackPoints.value = []
  }

  function createWaypointMarker(wp: Waypoint, index: number, total: number): L.Marker {
    const isFirst = index === 0
    const isLast = index === total - 1
    const num = isFirst ? 'A' : isLast ? 'B' : index
    const color = isFirst ? '#10b981' : isLast ? '#ef4444' : '#3b82f6'

    const html = `<div class="pin-marker" style="--pin-color: ${color}"><div class="pin-head">${num}</div><div class="pin-dot"></div></div>`
    const icon = L.divIcon({ className: '', html, iconSize: [32, 42], iconAnchor: [16, 42] })
    const marker = L.marker(wp.latlng, { icon, draggable: true }).addTo(map.value!)

    marker.on('dragend', (e: L.DragEndEvent) => {
      wp.latlng = e.target.getLatLng()
      wp.label = ''
    })

    waypointMarkers.value.push(marker)
    return marker
  }

  function updateMarkerStyle(index: number, total: number): void {
    const m = waypointMarkers.value[index]
    if (!m) return
    const isFirst = index === 0
    const isLast = index === total - 1
    const num = isFirst ? 'A' : isLast ? 'B' : index
    const color = isFirst ? '#10b981' : isLast ? '#ef4444' : '#3b82f6'
    const html = `<div class="pin-marker" style="--pin-color: ${color}"><div class="pin-head">${num}</div><div class="pin-dot"></div></div>`
    m.setIcon(L.divIcon({ className: '', html, iconSize: [32, 42], iconAnchor: [16, 42] }))
  }

  function removeMarker(index: number): void {
    if (waypointMarkers.value[index]) {
      map.value!.removeLayer(waypointMarkers.value[index])
    }
    waypointMarkers.value.splice(index, 1)
  }

  function clearAllMarkers(): void {
    waypointMarkers.value.forEach(m => map.value!.removeLayer(m))
    waypointMarkers.value = []
  }

  function clearRoute(): void {
    routeLayers.value.forEach(l => map.value!.removeLayer(l))
    routeLayers.value = []
  }

  function drawRoute(pts: LatLng[]): void {
    clearRoute()
    const shadow = L.polyline(pts, { color: '#000', weight: 12, opacity: 0.2, lineCap: 'round', lineJoin: 'round' }).addTo(map.value!)
    const main = L.polyline(pts, { color: '#2563eb', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(map.value!)
    const inner = L.polyline(pts, { color: '#60a5fa', weight: 2, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map.value!)
    routeLayers.value = [shadow, main, inner]
    map.value!.fitBounds(L.latLngBounds(pts), { padding: [60, 60] })
  }

  function setView(latlng: LatLng, zoom: number): void {
    map.value!.setView(latlng, zoom)
  }

  function fitBounds(pts: LatLng[]): void {
    map.value!.fitBounds(L.latLngBounds(pts), { padding: [60, 60] })
  }

  function createUserMarker(latlng: LatLng): L.Marker {
    const html = `<div class="user-marker"><div class="user-dot"></div><div class="user-pulse"></div></div>`
    const icon = L.divIcon({ className: '', html, iconSize: [24, 24], iconAnchor: [12, 12] })
    userMarker.value = L.marker(latlng, { icon }).addTo(map.value!)
    return userMarker.value
  }

  function updateUserMarker(latlng: LatLng): void {
    if (userMarker.value) userMarker.value.setLatLng(latlng)
  }

  function removeUserMarker(): void {
    if (userMarker.value) {
      map.value!.removeLayer(userMarker.value)
      userMarker.value = null
    }
  }

  function destroy(): void {
    clearAllMarkers()
    clearRoute()
    removeUserMarker()
    clearTrack()
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }

  return {
    map,
    waypointMarkers,
    routeLayers,
    userMarker,
    trackPolyline,
    trackPoints,
    initMap,
    createWaypointMarker,
    updateMarkerStyle,
    removeMarker,
    clearAllMarkers,
    clearRoute,
    drawRoute,
    setView,
    fitBounds,
    createUserMarker,
    updateUserMarker,
    removeUserMarker,
    addTrackPoint,
    clearTrack,
    destroy
  }
}
