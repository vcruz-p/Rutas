<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
        <h1>Planificador de Rutas Cuba</h1>
      </div>

      <div class="auth-form">
        <h2>Iniciar Sesión</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" v-model="username" required placeholder="tu_usuario" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" v-model="password" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Cargando...' : 'Entrar' }}
          </button>
        </form>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { signIn } from '../composables/useAuth'

const toast = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const emit = defineEmits<{
  (e: 'auth-success'): void
}>()

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await signIn(username.value, password.value)
    toast.success('¡Bienvenido!')
    emit('auth-success')
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header svg {
  color: #4f46e5;
  margin-bottom: 15px;
}

.auth-header h1 {
  font-size: 1.5rem;
  color: #1a1a2e;
  margin: 0;
  font-weight: 600;
}

.auth-form h2 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 0.875rem;
  color: #6b7280;
}

.auth-switch a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
}

.auth-switch a:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
}
</style>
