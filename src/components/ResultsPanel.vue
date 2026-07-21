<template>
  <div class="panel results" v-if="routeInfo.distance > 0">
    <h2>Resumen del Viaje</h2>
    <div class="result-grid">
      <div class="res-item"><span class="res-l">Distancia</span><span class="res-v">{{ formatDist(routeInfo.distance) }}</span></div>
      <div class="res-item"><span class="res-l">Duracion</span><span class="res-v">{{ formatDur(routeInfo.duration) }}</span></div>
      <div class="res-item hl"><span class="res-l">Combustible</span><span class="res-v accent">{{ routeInfo.fuelNeeded.toFixed(2) }} L</span></div>
      <div class="res-item hl"><span class="res-l">Costo</span><span class="res-v accent">{{ fmtCur(routeInfo.cost) }}</span></div>
    </div>
    <div class="round-trip">
      <span>Ida y vuelta:</span>
      <strong>{{ (routeInfo.fuelNeeded * 2).toFixed(2) }} L - {{ fmtCur(routeInfo.cost * 2) }}</strong>
    </div>
    <button class="btn-save-route" @click="$emit('save')" :disabled="isSavingRoute">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Guardar ruta en historial
    </button>
    <button class="btn-send-route" @click="$emit('send')" :disabled="isSavingRoute">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      Enviar ruta
    </button>
  </div>
</template>

<script setup>
defineProps({
  routeInfo: Object,
  isSavingRoute: Boolean
})

defineEmits(['save', 'send'])

function formatDist(km) { return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km` }
function formatDur(s) { const h = Math.floor(s/3600), m = Math.round((s%3600)/60); return h > 0 ? `${h}h ${m}min` : `${m} min` }
function fmtCur(n) { return `${Math.round(n).toLocaleString('es-ES')} CUP` }
</script>

<style scoped>
.btn-send-route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.6rem;
  background: #7c3aed;
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.btn-send-route:hover {
  background: #8b5cf6;
}

.btn-send-route:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
