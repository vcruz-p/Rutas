import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'client'
  full_name?: string
  created_at?: string
  updated_at?: string
}

export interface Vehicle {
  id?: string
  user_id?: string
  name: string
  consumption: number
  fuel_type: string
  tracker_id?: string | null
  phone_number?: string | null
  use_phone_gps?: boolean
  created_at?: string
}

export interface RouteHistory {
  id?: string
  user_id?: string
  vehicle_id?: string | null
  vehicle_name: string
  origin_lat: number
  origin_lng: number
  origin_label?: string | null
  dest_lat: number
  dest_lng: number
  dest_label?: string | null
  waypoints?: any[]
  distance_km: number
  duration_seconds: number
  fuel_consumed: number
  fuel_price: number
  total_cost: number
  created_at?: string
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'client' = 'client') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const id = userId || (await getCurrentUser())?.id
  if (!id) return null
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Row not found
    throw error
  }
  return data
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Admin functions - only accessible by admins
export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, role: 'admin' | 'client') {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteUser(userId: string) {
  // Note: This will cascade delete related data due to ON DELETE CASCADE
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId)
  
  if (error) throw error
}

// Vehicle functions with user context
export async function loadVehicles(userId?: string): Promise<Vehicle[]> {
  let query = supabase.from('vehicles').select('*')
  
  // If userId is provided and user is not admin, filter by user_id
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function saveVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at'> & { id?: string }): Promise<Vehicle> {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')
  
  const vehicleData = {
    ...vehicle,
    user_id: vehicle.user_id || user.id,
    updated_at: new Date().toISOString()
  }
  
  let result
  if (vehicle.id) {
    // Update existing
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', vehicle.id)
      .select()
      .single()
    
    if (error) throw error
    result = data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()
    
    if (error) throw error
    result = data
  }
  
  return result
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Route history functions with user context
export async function loadRouteHistory(userId?: string): Promise<RouteHistory[]> {
  let query = supabase.from('route_history').select('*')
  
  // If userId is provided, filter by user_id
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  query = query.order('created_at', { ascending: false }).limit(50)
  
  const { data, error } = await query
  if (error) throw error
  
  // Parse waypoints from JSON
  return (data || []).map(route => ({
    ...route,
    waypoints: route.waypoints ? (typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints) : []
  }))
}

export async function saveRoute(routeData: Omit<RouteHistory, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')
  
  const route = {
    ...routeData,
    user_id: routeData.user_id || user.id,
    waypoints: Array.isArray(routeData.waypoints) ? JSON.stringify(routeData.waypoints) : '[]'
  }
  
  if (routeData.id) {
    // Update existing
    const { error } = await supabase
      .from('route_history')
      .update(route)
      .eq('id', routeData.id)
    
    if (error) throw error
  } else {
    // Insert new
    const { error } = await supabase
      .from('route_history')
      .insert(route)
    
    if (error) throw error
  }
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase
    .from('route_history')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Helper to check if current user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const profile = await getUserProfile()
    return profile?.role === 'admin'
  } catch {
    return false
  }
}
