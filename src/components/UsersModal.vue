<template>
  <div class="users-modal-overlay" @click="$emit('close')">
    <div class="users-modal" @click.stop>
      <div class="modal-header">
        <h2>Gestión de Usuarios</h2>
        <button @click="$emit('close')" class="btn-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Cargando usuarios...</span>
        </div>

        <div v-else-if="error" class="error-state">{{ error }}</div>

        <div v-else class="users-list">
          <div v-for="user in users" :key="user.id" class="user-item">
            <div class="user-item-info">
              <div class="user-item-avatar">{{ user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase() }}</div>
              <div class="user-item-details">
                <span class="user-item-name">{{ user.full_name || 'Sin nombre' }}</span>
                <span class="user-item-email">{{ user.email }}</span>
                <span class="user-item-date">Registrado: {{ formatDate(user.created_at) }}</span>
              </div>
            </div>
            
            <div class="user-item-actions">
              <select 
                v-model="user.role" 
                @change="handleChangeRole(user)"
                class="role-select"
                :disabled="changingRole.includes(user.id)"
              >
                <option value="client">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
              
              <button 
                @click="handleDeleteUser(user)" 
                class="btn-delete"
                :disabled="deletingUsers.includes(user.id)"
                title="Eliminar usuario"
              >
                <svg v-if="!deletingUsers.includes(user.id)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span v-else class="spinner-small"></span>
              </button>
            </div>
          </div>

          <div v-if="users.length === 0" class="empty-state">
            No hay usuarios registrados
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { UserProfile, getAllUsers, updateUserRole, deleteUser } from '../composables/useAuth'

const toast = useToast()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const users = ref<UserProfile[]>([])
const loading = ref(true)
const error = ref('')
const changingRole = ref<string[]>([])
const deletingUsers = ref<string[]>([])

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  error.value = ''
  
  try {
    const data = await getAllUsers()
    users.value = data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar usuarios'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

async function handleChangeRole(user: UserProfile) {
  if (changingRole.value.includes(user.id)) return
  
  changingRole.value.push(user.id)
  
  try {
    await updateUserRole(user.id, user.role)
    toast.success(`Rol de ${user.email} actualizado a ${user.role === 'admin' ? 'administrador' : 'cliente'}`)
  } catch (e: any) {
    toast.error('Error al actualizar rol: ' + e.message)
    // Revertir el cambio en la UI
    user.role = user.role === 'admin' ? 'client' : 'admin'
  } finally {
    changingRole.value = changingRole.value.filter(id => id !== user.id)
  }
}

async function handleDeleteUser(user: UserProfile) {
  if (!confirm(`¿Estás seguro de eliminar al usuario ${user.email}? Esta acción eliminará también sus vehículos y rutas.`)) {
    return
  }
  
  deletingUsers.value.push(user.id)
  
  try {
    await deleteUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    toast.success('Usuario eliminado correctamente')
  } catch (e: any) {
    toast.error('Error al eliminar usuario: ' + e.message)
  } finally {
    deletingUsers.value = deletingUsers.value.filter(id => id !== user.id)
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'Fecha desconocida'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.users-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.users-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1a2e;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1a1a2e;
}

.modal-body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9fafb;
  border-radius: 12px;
  transition: background 0.2s;
}

.user-item:hover {
  background: #f3f4f6;
}

.user-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-item-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.user-item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-item-name {
  font-weight: 500;
  color: #1a1a2e;
}

.user-item-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.user-item-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.user-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background: #fee2e2;
  border: none;
  color: #dc2626;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover:not(:disabled) {
  background: #fecaca;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid #fecaca;
  border-top-color: #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
