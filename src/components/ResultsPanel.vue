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
    <div class="send-options">
      <button class="btn-send-route btn-whatsapp" @click="$emit('send', 'whatsapp')" :disabled="isSavingRoute">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        Enviar por WhatsApp
      </button>
      <button class="btn-send-route btn-copy" @click="$emit('send', 'copy')" :disabled="isSavingRoute">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copiar enlace
      </button>
    </div>
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
.send-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

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
}

.btn-send-route:hover:not(:disabled) {
  background: #8b5cf6;
}

.btn-send-route:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-whatsapp {
  background: #25D366;
}

.btn-whatsapp:hover:not(:disabled) {
  background: #20bd5a;
}

.btn-copy {
  background: #6b7280;
}

.btn-copy:hover:not(:disabled) {
  background: #4b5563;
}
</style>
