import initSqlJs, { Database } from 'sql.js'

interface Vehicle {
  id?: number
  name: string
  consumption: number
  fuelType: string
}

interface RouteHistory {
  id?: number
  vehicle_id?: number | null
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

let db: Database | null = null
let dbReady = false
let dbInitializing = false

async function getDb(): Promise<Database> {
  if (db) return db
  
  if (dbInitializing) {
    // Esperar a que otra inicialización termine
    while (dbInitializing && !db) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (db) return db
  }
  
  dbInitializing = true
  
  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    })
    
    db = new SQL.Database()
    
    console.log('Base de datos inicializada correctamente')
    
    // Crear tablas
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        consumption REAL NOT NULL,
        fuel_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    db.run(`
      CREATE TABLE IF NOT EXISTS route_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER,
        vehicle_name TEXT NOT NULL,
        origin_lat REAL NOT NULL,
        origin_lng REAL NOT NULL,
        origin_label TEXT,
        dest_lat REAL NOT NULL,
        dest_lng REAL NOT NULL,
        dest_label TEXT,
        waypoints TEXT,
        distance_km REAL NOT NULL,
        duration_seconds REAL NOT NULL,
        fuel_consumed REAL NOT NULL,
        fuel_price REAL NOT NULL,
        total_cost REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    dbReady = true
    return db
  } catch (error) {
    console.error('Error fatal al inicializar la base de datos:', error)
    dbInitializing = false
    throw error
  } finally {
    dbInitializing = false
  }
}

export async function loadVehicles(): Promise<Vehicle[]> {
  const database = await getDb()
  const result = database.exec('SELECT * FROM vehicles ORDER BY created_at DESC')
  if (!result.length) return []
  
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj: any = {}
    columns.forEach((col, i) => obj[col] = row[i])
    return obj as Vehicle
  })
}

export async function saveVehicle(vehicle: Vehicle): Promise<Vehicle & { id: number }> {
  const database = await getDb()
  database.run(
    'INSERT INTO vehicles (name, consumption, fuel_type) VALUES (?, ?, ?)',
    [vehicle.name, vehicle.consumption, vehicle.fuelType]
  )
  
  const result = database.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0] as number
  
  const vehicleData = { ...vehicle, id }
  return vehicleData
}

export async function deleteVehicle(id: number): Promise<void> {
  const database = await getDb()
  database.run('DELETE FROM vehicles WHERE id = ?', [id])
}

export async function loadRouteHistory(): Promise<RouteHistory[]> {
  const database = await getDb()
  const result = database.exec('SELECT * FROM route_history ORDER BY created_at DESC LIMIT 50')
  if (!result.length) return []
  
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj: any = {}
    columns.forEach((col, i) => obj[col] = row[i])
    // Parse waypoints from JSON string
    if (obj.waypoints) {
      try {
        obj.waypoints = JSON.parse(obj.waypoints)
      } catch (e) {
        obj.waypoints = []
      }
    }
    return obj as RouteHistory
  })
}

export async function saveRoute(routeData: RouteHistory): Promise<void> {
  const database = await getDb()
  
  console.log('Guardando ruta:', routeData)
  
  // Validar datos requeridos
  if (!routeData.origin_lat || !routeData.origin_lng || !routeData.dest_lat || !routeData.dest_lng) {
    throw new Error('Datos de origen/destino inválidos')
  }
  
  if (typeof routeData.distance_km !== 'number' || routeData.distance_km <= 0) {
    throw new Error('Distancia inválida')
  }
  
  // Asegurar que waypoints sea un array válido antes de convertir a JSON
  const waypointsArray = Array.isArray(routeData.waypoints) ? routeData.waypoints : []
  const waypointsJson = JSON.stringify(waypointsArray)
  
  try {
    // Iniciar transacción explícita
    database.run('BEGIN TRANSACTION')
    
    database.run(
      `INSERT INTO route_history (
        vehicle_id, vehicle_name, origin_lat, origin_lng, origin_label,
        dest_lat, dest_lng, dest_label, waypoints,
        distance_km, duration_seconds, fuel_consumed, fuel_price, total_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routeData.vehicle_id ?? null,
        routeData.vehicle_name,
        routeData.origin_lat,
        routeData.origin_lng,
        routeData.origin_label ?? null,
        routeData.dest_lat,
        routeData.dest_lng,
        routeData.dest_label ?? null,
        waypointsJson,
        routeData.distance_km,
        routeData.duration_seconds ?? 0,
        routeData.fuel_consumed ?? 0,
        routeData.fuel_price ?? 0,
        routeData.total_cost ?? 0
      ]
    )
    
    // Commit explícito
    database.run('COMMIT')
    
    console.log('Ruta guardada exitosamente')
  } catch (error) {
    // Rollback en caso de error
    try {
      database.run('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error en rollback:', rollbackError)
    }
    console.error('Error al guardar la ruta:', error)
    throw error
  }
}

export async function deleteRoute(id: number): Promise<void> {
  const database = await getDb()
  database.run('DELETE FROM route_history WHERE id = ?', [id])
}
