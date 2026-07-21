-- Drop existing policies and recreate for anon access
DROP POLICY IF EXISTS select_vehicles ON vehicles;
DROP POLICY IF EXISTS insert_vehicles ON vehicles;
DROP POLICY IF EXISTS update_vehicles ON vehicles;
DROP POLICY IF EXISTS delete_vehicles ON vehicles;

DROP POLICY IF EXISTS select_routes ON route_history;
DROP POLICY IF EXISTS insert_routes ON route_history;
DROP POLICY IF EXISTS delete_routes ON route_history;

-- Allow anon access for this demo app
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE USING (true);

CREATE POLICY "anon_select_routes" ON route_history FOR SELECT USING (true);
CREATE POLICY "anon_insert_routes" ON route_history FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_delete_routes" ON route_history FOR DELETE USING (true);