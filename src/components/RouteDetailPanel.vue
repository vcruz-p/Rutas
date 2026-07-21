<template>
  <div class="route-detail-panel" v-if="route">
    <div class="route-detail-header">
      <h3>Detalle de la Ruta</h3>
      <button class="btn-close" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="route-detail-content">
      <div class="route-visual">
        <div class="route-point origin">
          <div class="point-marker origin-marker">A</div>
          <div class="point-info">
            <span class="point-label">Origen</span>
            <span class="point-name">{{ route.origin_label || `${route.origin_lat?.toFixed(4)}, ${route.origin_lng?.toFixed(4)}` }}</span>
          </div>
        </div>
        <div class="route-line">
          <div class="line-track"></div>
          <div class="line-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
        <div class="route-point dest">
          <div class="point-marker dest-marker">B</div>
          <div class="point-info">
            <span class="point-label">Destino</span>
            <span class="point-name">{{ route.dest_label || `${route.dest_lat?.toFixed(4)}, ${route.dest_lng?.toFixed(4)}` }}</span>
          </div>
        </div>
      </div>

      <div class="detail-stats">
        <div class="detail-stat">
          <span class="detail-stat-label">Distancia</span>
          <span class="detail-stat-value">{{ route.distance_km?.toFixed(1) || 0 }} km</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Duracion estimada</span>
          <span class="detail-stat-value">{{ formatDur(route.duration_seconds || 0) }}</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Combustible</span>
          <span class="detail-stat-value">{{ route.fuel_consumed?.toFixed(2) || 0 }} L</span>
        </div>
        <div class="detail-stat">
          <span class="detail-stat-label">Precio/L</span>
          <span class="detail-stat-value">{{ route.fuel_price?.toFixed(0) || 0 }} CUP</span>
        </div>
        <div class="detail-stat highlight">
          <span class="detail-stat-label">Costo total</span>
          <span class="detail-stat-value">{{ fmtCur(route.total_cost || 0) }}</span>
        </div>
        <div class="detail-stat" v-if="route.vehicle_name">
          <span class="detail-stat-label">Vehiculo</span>
          <span class="detail-stat-value">{{ route.vehicle_name }}</span>
        </div>
      </div>

      <div class="detail-date">
        Guardada el {{ formatDate(route.created_at) }}
      </div>

      <button class="btn-load-route" @click="$emit('load-route', route)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Cargar esta ruta en el mapa
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  route: Object
})

defineEmits(['close', 'load-route'])

function formatDur(s) {
  const h = Math.floor(s/3600), m = Math.round((s%3600)/60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}
function fmtCur(n) { return `${Math.round(n).toLocaleString('es-ES')} CUP` }
function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.route-detail-panel {
  position: absolute;
  top: 70px;
  right: 1rem;
  width: 340px;
  max-height: 80vh;
  background: rgba(15, 23, 42, 0.97);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  z-index: 1001;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  animation: slideIn 0.25s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.route-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
}

.route-detail-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.route-detail-content {
  padding: 1rem;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.route-visual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.point-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.origin-marker { background: var(--success); }
.dest-marker { background: var(--error); }

.point-info {
  flex: 1;
  min-width: 0;
}

.point-label {
  display: block;
  font-size: 0.7rem;
  color: var(--gray-500);
}

.point-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-200);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-line {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-track {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--success), var(--error));
  opacity: 0.5;
}

.line-arrow {
  color: var(--primary-light);
  background: var(--gray-800);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-stat {
  padding: 0.6rem;
  background: var(--gray-800);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.detail-stat.highlight {
  background: var(--success-bg);
  border-color: rgba(16, 185, 129, 0.3);
}

.detail-stat-label {
  display: block;
  font-size: 0.68rem;
  color: var(--gray-500);
  margin-bottom: 0.2rem;
}

.detail-stat-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.detail-stat.highlight .detail-stat-value {
  color: #6ee7b7;
}

.detail-date {
  text-align: center;
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.btn-load-route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.6rem;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-load-route:hover {
  background: var(--primary-light);
}

.btn-close {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover { border-color: var(--error); color: var(--error); }

@media (max-width: 900px) {
  .route-detail-panel {
    width: calc(100% - 1rem);
    left: 0.5rem;
    right: 0.5rem;
    max-height: 60vh;
  }
}
</style>
