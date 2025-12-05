-- Migration: Add addon pricing fields to outdoor_products_v2 and indoor_products_v2 tables
-- This migration adds cost and price fields for various add-ons

-- Add columns to outdoor_products_v2
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS sensor_cost TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS sensor_price TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS remote_control_bluetooth_cost TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS remote_control_bluetooth_price TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS plugin_sensor_cost TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS plugin_sensor_price TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS emergency_backup_battery_cost TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS emergency_backup_battery_price TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS installation_kits_cost TEXT;
ALTER TABLE outdoor_products_v2 ADD COLUMN IF NOT EXISTS installation_kits_price TEXT;

-- Add columns to indoor_products_v2
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS sensor_cost TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS sensor_price TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS remote_control_bluetooth_cost TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS remote_control_bluetooth_price TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS plugin_sensor_cost TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS plugin_sensor_price TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS emergency_backup_battery_cost TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS emergency_backup_battery_price TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS installation_kits_cost TEXT;
ALTER TABLE indoor_products_v2 ADD COLUMN IF NOT EXISTS installation_kits_price TEXT;

-- Add comments for clarity
COMMENT ON COLUMN outdoor_products_v2.sensor_cost IS 'Internal cost for sensor add-on (not visible to users)';
COMMENT ON COLUMN outdoor_products_v2.sensor_price IS 'Price for sensor add-on (visible to users)';
COMMENT ON COLUMN outdoor_products_v2.remote_control_bluetooth_cost IS 'Internal cost for remote control/bluetooth add-on (not visible to users)';
COMMENT ON COLUMN outdoor_products_v2.remote_control_bluetooth_price IS 'Price for remote control/bluetooth add-on (visible to users)';
COMMENT ON COLUMN outdoor_products_v2.plugin_sensor_cost IS 'Internal cost for plugin sensor add-on (not visible to users)';
COMMENT ON COLUMN outdoor_products_v2.plugin_sensor_price IS 'Price for plugin sensor add-on (visible to users)';
COMMENT ON COLUMN outdoor_products_v2.emergency_backup_battery_cost IS 'Internal cost for emergency backup battery add-on (not visible to users)';
COMMENT ON COLUMN outdoor_products_v2.emergency_backup_battery_price IS 'Price for emergency backup battery add-on (visible to users)';
COMMENT ON COLUMN outdoor_products_v2.installation_kits_cost IS 'Internal cost for installation kits add-on (not visible to users)';
COMMENT ON COLUMN outdoor_products_v2.installation_kits_price IS 'Price for installation kits add-on (visible to users)';

COMMENT ON COLUMN indoor_products_v2.sensor_cost IS 'Internal cost for sensor add-on (not visible to users)';
COMMENT ON COLUMN indoor_products_v2.sensor_price IS 'Price for sensor add-on (visible to users)';
COMMENT ON COLUMN indoor_products_v2.remote_control_bluetooth_cost IS 'Internal cost for remote control/bluetooth add-on (not visible to users)';
COMMENT ON COLUMN indoor_products_v2.remote_control_bluetooth_price IS 'Price for remote control/bluetooth add-on (visible to users)';
COMMENT ON COLUMN indoor_products_v2.plugin_sensor_cost IS 'Internal cost for plugin sensor add-on (not visible to users)';
COMMENT ON COLUMN indoor_products_v2.plugin_sensor_price IS 'Price for plugin sensor add-on (visible to users)';
COMMENT ON COLUMN indoor_products_v2.emergency_backup_battery_cost IS 'Internal cost for emergency backup battery add-on (not visible to users)';
COMMENT ON COLUMN indoor_products_v2.emergency_backup_battery_price IS 'Price for emergency backup battery add-on (visible to users)';
COMMENT ON COLUMN indoor_products_v2.installation_kits_cost IS 'Internal cost for installation kits add-on (not visible to users)';
COMMENT ON COLUMN indoor_products_v2.installation_kits_price IS 'Price for installation kits add-on (visible to users)';
