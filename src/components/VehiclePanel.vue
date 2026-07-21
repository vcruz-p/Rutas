<template>
  <div class="panel vehicle-panel">
    <div class="panel-header">
      <h2>Vehiculo</h2>
      <button class="btn-add-vehicle" @click="showAddVehicle = true" v-if="!showAddVehicle">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Nuevo
      </button>
    </div>

    <!-- Add Vehicle Form -->
    <div v-if="showAddVehicle" class="add-vehicle-form">
      <div class="form-group">
        <label>Nombre del vehiculo</label>
        <input v-model="newVehicle.name" type="text" class="input" placeholder="Ej: Mi Auto" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Consumo (km/L)</label>
          <input v-model.number="newVehicle.consumption" type="number" class="input" min="1" max="50" step="0.1" />
        </div>
        <div class="form-group">
          <label>Combustible</label>
          <select v-model="newVehicle.fuelType" class="input">
            <option value="Gasolina">Gasolina</option>
            <option value="Diesel">Diesel</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-save" @click="saveVehicle" :disabled="!newVehicle.name || !newVehicle.consumption">Guardar vehiculo</button>
        <button class="btn-cancel" @click="cancelAdd">Cancelar</button>
      </div>
    </div>

    <!-- Vehicle Select -->
    <div v-if="!showAddVehicle">
      <div class="form-group">
        <label>Seleccionar vehiculo</label>
        <select v-model="selectedVehicleId" class="input" @change="onVehicleSelect">
          <option :value="null">-- Selecciona --</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.name }} ({{ v.consumption }} km/L)</option>
        </select>
      </div>

      <div class="vehicle-specs" v-if="selectedVehicle">
        <div class="spec"><span class="spec-l">Consumo</span><span class="spec-v">{{ selectedVehicle.consumption }} km/L</span></div>
        <div class="spec"><span class="spec-l">Combustible</span><span class="spec-v">{{ selectedVehicle.fuel_type || selectedVehicle.fuelType }}</span></div>
        <button class="btn-delete-vehicle" @click="deleteVehicle(selectedVehicle.id)" v-if="selectedVehicle.id" title="Eliminar vehiculo">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="form-group">
        <label>Consumo ajustado (km/L)</label>
        <input type="number" v-model.number="customConsumption" class="input" min="1" max="50" step="0.1" :placeholder="selectedVehicle?.consumption || '8.0'">
      </div>

      <div class="form-group">
        <label>Precio combustible (CUP/L)</label>
        <input type="number" v-model.number="fuelPrice" class="input" min="1" step="1">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { saveVehicle as saveVehicleDb, deleteVehicle as deleteVehicleDb } from '../composables/useDatabase'

const toast = useToast()

const props = defineProps({
  vehicles: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'vehicles-changed'])

const selectedVehicleId = ref(props.modelValue?.selectedVehicleId || null)
const selectedVehicle = ref(props.modelValue?.selectedVehicle || null)
const customConsumption = ref(props.modelValue?.customConsumption || null)
const fuelPrice = ref(props.modelValue?.fuelPrice || 132)
const showAddVehicle = ref(false)
const newVehicle = ref({ name: '', consumption: 12, fuelType: 'Gasolina' })

const currentVehicle = computed(() => {
  return props.vehicles.find(v => v.id === selectedVehicleId.value) || null
})

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedVehicleId.value = val.selectedVehicleId ?? null
    selectedVehicle.value = val.selectedVehicle ?? null
    customConsumption.value = val.customConsumption ?? null
    fuelPrice.value = val.fuelPrice ?? 132
  }
}, { deep: true })

watch(() => props.vehicles, () => {
  if (selectedVehicleId.value) {
    const found = props.vehicles.find(v => v.id === selectedVehicleId.value)
    if (found) selectedVehicle.value = found
  }
}, { deep: true })

watch([selectedVehicleId, selectedVehicle, customConsumption, fuelPrice], () => {
  emit('update:modelValue', {
    selectedVehicleId: selectedVehicleId.value,
    selectedVehicle: selectedVehicle.value,
    customConsumption: customConsumption.value,
    fuelPrice: fuelPrice.value
  })
}, { deep: true })

function onVehicleSelect() {
  selectedVehicle.value = props.vehicles.find(v => v.id === selectedVehicleId.value) || null
  customConsumption.value = null
}

function cancelAdd() {
  showAddVehicle.value = false
  newVehicle.value = { name: '', consumption: 12, fuelType: 'Gasolina' }
}

async function saveVehicle() {
  if (!newVehicle.value.name || !newVehicle.value.consumption) {
    toast.error('Nombre y consumo son requeridos')
    return
  }

  try {
    const saved = await saveVehicleDb(newVehicle.value)
    emit('vehicles-changed')
    selectedVehicleId.value = saved.id
    selectedVehicle.value = saved
    showAddVehicle.value = false
    newVehicle.value = { name: '', consumption: 12, fuelType: 'Gasolina' }
    toast.success('Vehículo guardado')
  } catch (error) {
    console.error('Error saving vehicle:', error)
    toast.error('Error al guardar vehículo: ' + (error as Error).message)
  }
}

async function deleteVehicle(id) {
  if (!confirm('Eliminar este vehiculo?')) return

  try {
    await deleteVehicleDb(id)
    emit('vehicles-changed')

    if (selectedVehicleId.value === id) {
      selectedVehicleId.value = props.vehicles[0]?.id || null
      selectedVehicle.value = props.vehicles[0] || null
    }
    toast.success('Vehículo eliminado')
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    toast.error('Error al eliminar vehículo: ' + (error as Error).message)
  }
}
</script>
