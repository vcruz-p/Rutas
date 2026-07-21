<template>
  <div class="user-panel">
    <div class="user-info" v-if="userProfile">
      <div class="user-avatar">{{ userAvatar }}</div>
      <div class="user-details">
        <span class="user-name">{{ userProfile.full_name || userProfile.email }}</span>
        <span class="user-role" :class="userProfile.role">{{ userProfile.role === 'admin' ? 'Administrador' : 'Cliente' }}</span>
      </div>
    </div>
    
    <div class="user-actions">
      <button v-if="isAdminUser" @click="$emit('show-users')" class="btn-icon" title="Gestionar Usuarios">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="23" y1="21" x2="17" y2="21"/>
          <line x1="16" y1="3.13" x2="16" y2="7.87"/>
          <line x1="20" y1="5.25" x2="16" y2="5.25"/>
        </svg>
      </button>
      <button @click="handleLogout" class="btn-logout" title="Cerrar Sesión">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { signOut, UserProfile } from '../composables/useAuth'
import { useToast } from 'vue-toastification'

const toast = useToast()

const props = defineProps<{
  userProfile: UserProfile | null
}>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'show-users'): void
}>()

const isAdminUser = computed(() => props.userProfile?.role === 'admin')

const userAvatar = computed(() => {
  const name = props.userProfile?.full_name || props.userProfile?.email || '?'
  return name.charAt(0).toUpperCase()
})

async function handleLogout() {
  try {
    await signOut()
    toast.info('Sesión cerrada')
    emit('logout')
  } catch (e: any) {
    toast.error('Error al cerrar sesión: ' + e.message)
  }
}
</script>

<style scoped>
.user-panel {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
}

.user-role {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.user-role.admin {
  background: #dc2626;
  color: white;
}

.user-role.client {
  background: #2563eb;
  color: white;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: #fca5a5;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.btn-logout:hover {
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.5);
}

.btn-logout span {
  display: none;
}

@media (min-width: 768px) {
  .btn-logout span {
    display: inline;
  }
}
</style>
