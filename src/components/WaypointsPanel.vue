<template>
  <div class="panel waypoints-panel">
    <div class="panel-header">
      <h2>Paradas de la Ruta</h2>
      <span class="waypoint-count">{{ waypoints.length }} puntos</span>
    </div>

    <div class="waypoints-list" v-if="waypoints.length > 0">
      <div v-for="(wp, index) in waypoints" :key="index" class="waypoint-item" :class="{ first: index === 0, last: index === waypoints.length - 1 }">
        <div class="waypoint-marker">
          <span class="marker-num">{{ index === 0 ? 'A' : index === waypoints.length - 1 ? 'B' : index }}</span>
        </div>
        <div class="waypoint-info">
          <span class="waypoint-label">{{ index === 0 ? 'Origen' : index === waypoints.length - 1 ? 'Destino' : 'Parada ' + index }}</span>
          <span class="waypoint-coords">{{ wp.label || `${wp.latlng.lat.toFixed(4)}, ${wp.latlng.lng.toFixed(4)}` }}</span>
        </div>
        <div class="waypoint-actions">
          <button class="wp-btn" title="Buscar lugar" @click="$emit('search', index)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button class="wp-btn" title="Mi ubicacion" @click="$emit('locate', index)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
          </button>
          <button class="wp-btn delete" title="Eliminar" @click="$emit('remove', index)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeSearchIndex !== null" class="search-popup">
      <div class="search-row">
        <input ref="searchInputRef" v-model="searchQuery" type="text" class="input" placeholder="Buscar lugar en Cuba..." @keyup.enter="doSearch" :disabled="isSearching" />
        <button class="btn-go" @click="doSearch" :disabled="isSearching || !searchQuery">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      <div v-if="searchResults.length > 0" class="search-results">
        <div v-for="(r, i) in searchResults" :key="i" class="sr-item" @click="applySearchResult(r)">{{ r.display_name }}</div>
      </div>
    </div>

    <div class="add-waypoint-section">
      <button class="btn-add-waypoint" @click="$emit('toggle-add-mode')" :class="{ active: addWaypointMode }">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Agregar parada
      </button>
      <button class="btn-clear-all" v-if="waypoints.length > 0" @click="$emit('clear-all')">Limpiar todo</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  waypoints: Array,
  addWaypointMode: Boolean,
  activeSearchIndex: Number
})

const emit = defineEmits(['search', 'locate', 'remove', 'toggle-add-mode', 'clear-all', 'search-result', 'update:activeSearchIndex'])

const searchInputRef = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

watch(() => props.activeSearchIndex, (val) => {
  if (val !== null) {
    searchQuery.value = props.waypoints[val]?.label || ''
    searchResults.value = []
    nextTick(() => searchInputRef.value?.focus())
  }
})

async function doSearch() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  searchResults.value = []

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value + ', Cuba')}&limit=5&countrycodes=cu`)
    const data = await res.json()
    searchResults.value = data.map(item => ({ display_name: item.display_name.split(',').slice(0, 3).join(', '), lat: parseFloat(item.lat), lng: parseFloat(item.lon) }))
  } catch (e) {
    console.error(e)
  } finally {
    isSearching.value = false
  }
}

function applySearchResult(result) {
  emit('search-result', result)
  searchQuery.value = ''
  searchResults.value = []
}
</script>
