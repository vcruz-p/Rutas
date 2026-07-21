import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function loadVehicles() {
  const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveVehicle(vehicle) {
  const { data, error } = await supabase.from('vehicles').insert([{
    name: vehicle.name,
    consumption: vehicle.consumption,
    fuel_type: vehicle.fuelType
  }]).select()
  if (error) throw error
  return data?.[0]
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

export async function loadRouteHistory() {
  const { data, error } = await supabase.from('route_history').select('*').order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return data || []
}

export async function saveRoute(routeData) {
  const { error } = await supabase.from('route_history').insert([routeData])
  if (error) throw error
}

export async function deleteRoute(id) {
  const { error } = await supabase.from('route_history').delete().eq('id', id)
  if (error) throw error
}
