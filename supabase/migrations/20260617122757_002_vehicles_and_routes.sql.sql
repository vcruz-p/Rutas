-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  consumption DECIMAL(5,2) NOT NULL,
  fuel_type TEXT NOT NULL DEFAULT 'Gasolina',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Route history table
CREATE TABLE route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  origin_lat DECIMAL(10,7) NOT NULL,
  origin_lng DECIMAL(10,7) NOT NULL,
  origin_label TEXT,
  dest_lat DECIMAL(10,7) NOT NULL,
  dest_lng DECIMAL(10,7) NOT NULL,
  dest_label TEXT,
  waypoints JSONB,
  distance_km DECIMAL(10,2) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  fuel_consumed DECIMAL(10,2) NOT NULL,
  fuel_price DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles (public access for this demo)
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_vehicles" ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vehicles" ON vehicles FOR DELETE TO authenticated USING (true);

-- RLS Policies for route_history (public access for this demo)
CREATE POLICY "select_routes" ON route_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_routes" ON route_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "delete_routes" ON route_history FOR DELETE TO authenticated USING (true);

-- Add some default vehicles
INSERT INTO vehicles (name, consumption, fuel_type) VALUES
  ('Auto Compacto', 6.5, 'Gasolina'),
  ('Auto Sedan', 8.0, 'Gasolina'),
  ('SUV', 10.5, 'Gasolina'),
  ('Camioneta', 12.0, 'Diesel'),
  ('Motocicleta', 3.5, 'Gasolina'),
  ('Microbus', 14.0, 'Diesel');