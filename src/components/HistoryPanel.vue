<template>
  <div class="history-panel" v-if="show">
    <div class="history-header">
      <h3>Historial de Rutas</h3>
      <button class="btn-close" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="history-list">
      <div v-if="routeHistory.length === 0" class="history-empty">No hay rutas guardadas</div>
      <div v-for="route in routeHistory" :key="route.id" class="history-item" :class="{ active: selectedRouteId === route.id }" @click="$emit('select', route)">
        <div class="history-main">
          <div class="history-route">
            <span class="route-from">{{ route.origin_label || 'Origen' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span class="route-to">{{ route.dest_label || 'Destino' }}</span>
          </div>
          <div class="history-date">{{ formatDate(route.created_at) }}</div>
        </div>
        <div class="history-stats">
          <span class="stat"><strong>{{ route.distance_km?.toFixed(1) || 0 }} km</strong></span>
          <span class="stat">{{ route.fuel_consumed?.toFixed(2) || 0 }} L</span>
          <span class="stat cost">{{ fmtCur(route.total_cost || 0) }}</span>
        </div>
        <div class="history-vehicle" v-if="route.vehicle_name">Vehiculo: {{ route.vehicle_name }}</div>
        <div class="history-actions">
          <button class="btn-view-route" @click.stop="$emit('view-route', route)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver ruta
          </button>
          <button class="btn-delete-route" @click.stop="$emit('delete', route.id)">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  routeHistory: Array,
  selectedRouteId: String
})

defineEmits(['close', 'select', 'view-route', 'delete'])

function formatDate(d) { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtCur(n) { return `${Math.round(n).toLocaleString('es-ES')} CUP` }
</script>

<style scoped>
.history-item {
  cursor: pointer;
  transition: all 0.15s;
}
.history-item:hover {
  border-color: var(--primary-light);
}
.history-item.active {
  border-color: var(--primary);
  background: rgba(37, 99, 235, 0.15);
}
.history-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.btn-view-route {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.3rem 0.5rem;
  background: var(--primary-bg);
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 4px;
  color: var(--primary-light);
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-view-route:hover {
  background: rgba(37, 99, 235, 0.2);
}
</style>
