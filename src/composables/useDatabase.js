import { initSqlJs } from 'sql.js'

let db = null
let dbReady = false

async function getDb() {
  if (db) return db
  
  const SQL = await initSqlJs()
  db = new SQL.Database()
  
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
}

export async function loadVehicles() {
  await getDb()
  const result = db.exec('SELECT * FROM vehicles ORDER BY created_at DESC')
  if (!result.length) return []
  
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    columns.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

export async function saveVehicle(vehicle) {
  await getDb()
  db.run(
    'INSERT INTO vehicles (name, consumption, fuel_type) VALUES (?, ?, ?)',
    [vehicle.name, vehicle.consumption, vehicle.fuelType]
  )
  
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0]
  
  const vehicleData = { ...vehicle, id }
  return vehicleData
}

export async function deleteVehicle(id) {
  await getDb()
  db.run('DELETE FROM vehicles WHERE id = ?', [id])
}

export async function loadRouteHistory() {
  await getDb()
  const result = db.exec('SELECT * FROM route_history ORDER BY created_at DESC LIMIT 50')
  if (!result.length) return []
  
  const columns = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    columns.forEach((col, i) => obj[col] = row[i])
    // Parse waypoints from JSON string
    if (obj.waypoints) {
      try {
        obj.waypoints = JSON.parse(obj.waypoints)
      } catch (e) {
        obj.waypoints = []
      }
    }
    return obj
  })
}

export async function saveRoute(routeData) {
  await getDb()
  const waypointsJson = JSON.stringify(routeData.waypoints || [])
  
  db.run(
    `INSERT INTO route_history (
      vehicle_id, vehicle_name, origin_lat, origin_lng, origin_label,
      dest_lat, dest_lng, dest_label, waypoints,
      distance_km, duration_seconds, fuel_consumed, fuel_price, total_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      routeData.vehicle_id || null,
      routeData.vehicle_name,
      routeData.origin_lat,
      routeData.origin_lng,
      routeData.origin_label || null,
      routeData.dest_lat,
      routeData.dest_lng,
      routeData.dest_label || null,
      waypointsJson,
      routeData.distance_km,
      routeData.duration_seconds,
      routeData.fuel_consumed,
      routeData.fuel_price,
      routeData.total_cost
    ]
  )
}

export async function deleteRoute(id) {
  await getDb()
  db.run('DELETE FROM route_history WHERE id = ?', [id])
}
