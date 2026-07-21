<template>
  <div class="app-container">
    <header class="header">
      <div class="header-inner">
        <div class="header-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          <div>
            <h1>Planificador de Rutas</h1>
            <p class="subtitle">Cuba - Guarda vehiculos e historial de consumo</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="history-btn" @click="toggleHistory" :class="{ active: showHistory }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Historial
          </button>
          <button class="gps-live-btn" :class="{ active: isTracking }" @click="toggleLiveTracking">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
            {{ isTracking ? 'Siguiendo...' : 'GPS en vivo' }}
          </button>
        </div>
      </div>
    </header>

    <div class="main-content">
      <div class="sidebar">
        <WaypointsPanel
          :waypoints="waypoints"
          :addWaypointMode="addWaypointMode"
          :activeSearchIndex="activeSearchIndex"
          @search="openSearch"
          @locate="useMyLocation"
          @remove="removeWaypoint"
          @toggle-add-mode="addWaypointMode = !addWaypointMode"
          @clear-all="clearAllWaypoints"
          @search-result="applySearchResult"
        />

        <VehiclePanel
          :vehicles="vehicles"
          v-model="vehicleState"
          @vehicles-changed="loadAllVehicles"
        />

        <ResultsPanel
          :routeInfo="routeInfo"
          :isSavingRoute="isSavingRoute"
          @save="saveCurrentRoute"
          @send="sendCurrentRoute"
        />
      </div>

      <HistoryPanel
        :show="showHistory"
        :routeHistory="routeHistory"
        :selectedRouteId="selectedRouteId"
        @close="closeHistory"
        @select="selectRoute"
        @view-route="viewRouteDetail"
        @delete="deleteRouteItem"
      />

      <RouteDetailPanel
        :route="selectedRouteDetail"
        @close="selectedRouteDetail = null"
        @load-route="loadRouteOnMap"
      />

      <div class="map-area">
        <div v-if="isLoadingRoute" class="loading-overlay">
          <div class="spinner"></div>
          <span>Calculando ruta...</span>
        </div>
        <div ref="mapEl" class="map"></div>
        <div class="map-hint" v-if="waypoints.length < 2 && !isTracking">
          {{ addWaypointMode || waypoints.length === 0 ? 'Clic para agregar origen' : 'Clic para agregar destino' }}
        </div>
        <div v-if="isTracking" class="tracking-status">
          <span class="pulse"></span>
          GPS Activo
        </div>
        <div v-if="isTracking && gpsStats.totalDistance > 0" class="gps-stats-tooltip">
          <div class="gps-stat-row">
            <span class="gps-stat-label">Recorrido</span>
            <span class="gps-stat-value">{{ formatGpsDist(gpsStats.totalDistance) }}</span>
          </div>
          <div class="gps-stat-row">
            <span class="gps-stat-label">Consumo</span>
            <span class="gps-stat-value accent">{{ gpsStats.fuelConsumed.toFixed(2) }} L</span>
          </div>
          <div class="gps-stat-row">
            <span class="gps-stat-label">Costo</span>
            <span class="gps-stat-value accent">{{ fmtCur(gpsStats.totalCost) }}</span>
          </div>
          <div class="gps-stat-row small">
            <span class="gps-stat-label">Puntos GPS</span>
            <span class="gps-stat-value">{{ gpsStats.pointCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import L from 'leaflet'
import { loadVehicles, loadRouteHistory, saveRoute, deleteRoute } from './composables/useDatabase'
import { useMap } from './composables/useMap'
import WaypointsPanel from './components/WaypointsPanel.vue'
import VehiclePanel from './components/VehiclePanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import RouteDetailPanel from './components/RouteDetailPanel.vue'

const toast = useToast()

const mapEl = ref(null)
const mapApi = useMap()

const waypoints = ref([])
const addWaypointMode = ref(true)
const activeSearchIndex = ref(null)
const isLoadingRoute = ref(false)
const isTracking = ref(false)
const showHistory = ref(false)
const isSavingRoute = ref(false)
const selectedRouteId = ref(null)
const selectedRouteDetail = ref(null)

const routeDistance = ref(0)
const routeDuration = ref(0)

const gpsStats = ref({
  totalDistance: 0,
  fuelConsumed: 0,
  totalCost: 0,
  pointCount: 0
})
const gpsPositions = ref([])

const vehicles = ref([])
const vehicleState = ref({
  selectedVehicleId: null,
  selectedVehicle: null,
  customConsumption: null,
  fuelPrice: 132
})

const routeHistory = ref([])

let watchId = null

const effectiveConsumption = computed(() => vehicleState.value.customConsumption || vehicleState.value.selectedVehicle?.consumption || 12)

const routeInfo = computed(() => {
  if (routeDistance.value === 0) return { distance: 0, duration: 0, fuelNeeded: 0, cost: 0 }
  const fuelNeeded = routeDistance.value / effectiveConsumption.value
  return { distance: routeDistance.value, duration: routeDuration.value, fuelNeeded, cost: fuelNeeded * vehicleState.value.fuelPrice }
})

// ─── Data Loading ──────────────────────────────────────────────
async function loadAllVehicles() {
  try {
    const data = await loadVehicles()
    vehicles.value = data
    if (data.length > 0 && !vehicleState.value.selectedVehicleId) {
      vehicleState.value.selectedVehicleId = data[0].id
      vehicleState.value.selectedVehicle = data[0]
    }
  } catch (e) {
    console.error('Error loading vehicles:', e)
    toast.error('Error al cargar vehículos: ' + (e as Error).message)
  }
}

async function loadAllRouteHistory() {
  try {
    const data = await loadRouteHistory()
    routeHistory.value = data
  } catch (e) {
    console.error('Error loading route history:', e)
    toast.error('Error al cargar historial: ' + (e as Error).message)
  }
}

// ─── Map Interactions ──────────────────────────────────────────
function onMapClick(e) {
  if (activeSearchIndex.value !== null) return
  if (addWaypointMode.value || waypoints.value.length < 2) addWaypoint(e.latlng)
}

function addWaypoint(latlng, label = '') {
  waypoints.value.push({ latlng, label })
  mapApi.createWaypointMarker({ latlng, label }, waypoints.value.length - 1, waypoints.value.length)
  if (waypoints.value.length >= 2) calculateMultiRoute()
}

function removeWaypoint(index) {
  waypoints.value.splice(index, 1)
  mapApi.removeMarker(index)
  for (let i = 0; i < waypoints.value.length; i++) {
    mapApi.updateMarkerStyle(i, waypoints.value.length)
  }
  if (waypoints.value.length >= 2) calculateMultiRoute()
  else mapApi.clearRoute()
}

function clearAllWaypoints() {
  mapApi.clearAllMarkers()
  waypoints.value = []
  mapApi.clearRoute()
  addWaypointMode.value = true
  routeDistance.value = 0
  routeDuration.value = 0
}

async function calculateMultiRoute() {
  if (waypoints.value.length < 2) return
  isLoadingRoute.value = true
  mapApi.clearRoute()

  try {
    const coords = waypoints.value.map(wp => `${wp.latlng.lng},${wp.latlng.lat}`).join(';')
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
    const data = await res.json()

    if (data.code === 'Ok' && data.routes?.length > 0) {
      const route = data.routes[0]
      routeDistance.value = route.distance / 1000
      routeDuration.value = route.duration
      const pts = route.geometry.coordinates.map(c => [c[1], c[0]])
      mapApi.drawRoute(pts)
    }
  } catch (e) {
    console.error('Route error:', e)
  } finally {
    isLoadingRoute.value = false
  }
}

// ─── Search ────────────────────────────────────────────────────
function openSearch(index) {
  activeSearchIndex.value = index
}

function applySearchResult(result) {
  const idx = activeSearchIndex.value
  if (idx === null) return
  const latlng = L.latLng(result.lat, result.lng)

  if (idx < waypoints.value.length) {
    waypoints.value[idx].latlng = latlng
    waypoints.value[idx].label = result.display_name
    mapApi.clearAllMarkers()
    waypoints.value.forEach((wp, i) => mapApi.createWaypointMarker(wp, i, waypoints.value.length))
    if (waypoints.value.length >= 2) calculateMultiRoute()
  } else {
    addWaypoint(latlng, result.display_name)
  }

  mapApi.setView(latlng, 13)
  activeSearchIndex.value = null
}

// ─── GPS ───────────────────────────────────────────────────────
function useMyLocation(index) {
  if (!navigator.geolocation) return alert('GPS no disponible')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)
      if (index < waypoints.value.length) {
        waypoints.value[index].latlng = latlng
        waypoints.value[index].label = 'Mi ubicacion'
        mapApi.clearAllMarkers()
        waypoints.value.forEach((wp, i) => mapApi.createWaypointMarker(wp, i, waypoints.value.length))
        if (waypoints.value.length >= 2) calculateMultiRoute()
      } else {
        addWaypoint(latlng, 'Mi ubicacion')
      }
      mapApi.setView(latlng, 15)
      activeSearchIndex.value = null
    },
    () => alert('No se pudo obtener ubicacion'),
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function toggleLiveTracking() {
  isTracking.value ? stopTracking() : startTracking()
}

function startTracking() {
  if (!navigator.geolocation) return alert('GPS no disponible')
  isTracking.value = true
  gpsPositions.value = []
  gpsStats.value = { totalDistance: 0, fuelConsumed: 0, totalCost: 0, pointCount: 0 }
  mapApi.clearTrack()
  let firstFix = true

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)
      gpsPositions.value.push(latlng)
      gpsStats.value.pointCount = gpsPositions.value.length

      // Draw track on map
      mapApi.addTrackPoint(latlng)

      // Calculate distance from previous point
      if (gpsPositions.value.length > 1) {
        const prev = gpsPositions.value[gpsPositions.value.length - 2]
        const distKm = prev.distanceTo(latlng) / 1000
        gpsStats.value.totalDistance += distKm
        const fuel = distKm / effectiveConsumption.value
        gpsStats.value.fuelConsumed += fuel
        gpsStats.value.totalCost += fuel * vehicleState.value.fuelPrice
      }

      if (firstFix) {
        mapApi.createUserMarker(latlng)
        firstFix = false
      } else {
        mapApi.updateUserMarker(latlng)
      }
      if (mapApi.map) mapApi.map.panTo(latlng)
    },
    (err) => { console.error('GPS error:', err); stopTracking() },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  )
}

function stopTracking() {
  if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
  isTracking.value = false
  mapApi.removeUserMarker()
}

function formatGpsDist(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(2)} km`
}

// ─── History ───────────────────────────────────────────────────
function toggleHistory() {
  showHistory.value = !showHistory.value
  if (showHistory.value) selectedRouteDetail.value = null
}

function closeHistory() {
  showHistory.value = false
  selectedRouteId.value = null
}

function selectRoute(route) {
  selectedRouteId.value = route.id
}

function viewRouteDetail(route) {
  selectedRouteDetail.value = route
  selectedRouteId.value = route.id
}

async function deleteRouteItem(id) {
  try {
    await deleteRoute(id)
    routeHistory.value = routeHistory.value.filter(r => r.id !== id)
    if (selectedRouteId.value === id) {
      selectedRouteId.value = null
      selectedRouteDetail.value = null
    }
    toast.success('Ruta eliminada')
  } catch (e) {
    console.error('Error deleting route:', e)
    toast.error('Error al eliminar ruta: ' + (e as Error).message)
  }
}

async function saveCurrentRoute() {
  if (waypoints.value.length < 2 || routeDistance.value === 0) {
    toast.error('Debe agregar al menos 2 puntos y calcular la ruta')
    return
  }
  isSavingRoute.value = true

  const origin = waypoints.value[0]
  const dest = waypoints.value[waypoints.value.length - 1]

  try {
    await saveRoute({
      vehicle_id: vehicleState.value.selectedVehicle?.id || null,
      vehicle_name: vehicleState.value.selectedVehicle?.name || 'Sin vehiculo',
      origin_lat: origin.latlng.lat,
      origin_lng: origin.latlng.lng,
      origin_label: origin.label || null,
      dest_lat: dest.latlng.lat,
      dest_lng: dest.latlng.lng,
      dest_label: dest.label || null,
      waypoints: waypoints.value.map(w => ({ lat: w.latlng.lat, lng: w.latlng.lng, label: w.label })),
      distance_km: routeDistance.value,
      duration_seconds: routeDuration.value,
      fuel_consumed: routeInfo.value.fuelNeeded,
      fuel_price: vehicleState.value.fuelPrice,
      total_cost: routeInfo.value.cost
    })
    await loadAllRouteHistory()
    toast.success('Ruta guardada en el historial!')
  } catch (e) {
    console.error('Error saving route:', e)
    toast.error('Error al guardar la ruta: ' + (e as Error).message)
  } finally {
    isSavingRoute.value = false
  }
}

function sendCurrentRoute() {
  if (waypoints.value.length < 2 || routeDistance.value === 0) {
    toast.error('Debe agregar al menos 2 puntos y calcular la ruta')
    return
  }
  
  const origin = waypoints.value[0]
  const dest = waypoints.value[waypoints.value.length - 1]
  const summary = `🚗 *Ruta Planificada*\n\n📍 *Origen:* ${origin.label || `${origin.latlng.lat.toFixed(4)}, ${origin.latlng.lng.toFixed(4)}`}\n🏁 *Destino:* ${dest.label || `${dest.latlng.lat.toFixed(4)}, ${dest.latlng.lng.toFixed(4)}`}\n\n📏 *Distancia:* ${routeDistance.value.toFixed(1)} km\n⏱️ *Duración estimada:* ${formatDur(routeDuration.value)}\n⛽ *Combustible necesario:* ${routeInfo.value.fuelNeeded.toFixed(2)} L\n💰 *Costo estimado:* ${fmtCur(routeInfo.value.cost)}\n\n_Viaje planificado con Planificador de Rutas Cuba_`
  
  const encodedText = encodeURIComponent(summary)
  const phone = vehicleState.value.selectedVehicle?.phone_number || ''
  
  if (phone) {
    window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}?text=${encodedText}`, '_blank')
  } else {
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }
}

function formatDur(s) {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

function fmtCur(n) {
  return `${Math.round(n).toLocaleString('es-ES')} CUP`
}

function loadRouteOnMap(route) {
  clearAllWaypoints()
  selectedRouteDetail.value = null
  showHistory.value = false

  const wps = route.waypoints || []
  if (wps.length >= 2) {
    wps.forEach((wp, i) => {
      const latlng = L.latLng(wp.lat, wp.lng)
      waypoints.value.push({ latlng, label: wp.label || '' })
      mapApi.createWaypointMarker({ latlng, label: wp.label || '' }, i, wps.length)
    })
    calculateMultiRoute()
  } else {
    const originLatLng = L.latLng(route.origin_lat, route.origin_lng)
    const destLatLng = L.latLng(route.dest_lat, route.dest_lng)
    waypoints.value.push({ latlng: originLatLng, label: route.origin_label || 'Origen' })
    waypoints.value.push({ latlng: destLatLng, label: route.dest_label || 'Destino' })
    mapApi.createWaypointMarker({ latlng: originLatLng, label: route.origin_label || 'Origen' }, 0, 2)
    mapApi.createWaypointMarker({ latlng: destLatLng, label: route.dest_label || 'Destino' }, 1, 2)
    calculateMultiRoute()
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────
onMounted(async () => {
  mapApi.initMap(mapEl.value, onMapClick)
  await loadAllVehicles()
  await loadAllRouteHistory()
})

onUnmounted(() => {
  stopTracking()
})
</script>
