-- Insert sample indoor products with expanded sensor variations
INSERT INTO public.indoor_products_v2 (
  sub_category, product_name, model_number, size, power_w, voltage, cct, cri_ra,
  lumen, efficacy_lumen_per_w, dimming_type, material_finish, sensors_and_controls,
  occupancy, bi_level, pir_microwave_bluetooth, remote_control, plugin_sensor,
  emergency_backup_battery, junction_cover, mounting, certifications, warranty, moq
) VALUES
-- LED Downlight Series - No sensors
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-NONE', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'None', false, false, null, false, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Occupancy with PIR
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-OCC-PIR-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Occupancy', true, false, 'PIR', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Occupancy with Microwave
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-OCC-MIC-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Occupancy', true, false, 'Microwave', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Occupancy with Bluetooth
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-OCC-BLU-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Occupancy', true, false, 'Bluetooth', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Bi-Level with PIR
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-BIL-PIR-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Bi-Level', false, true, 'PIR', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Bi-Level with Microwave
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-BIL-MIC-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Bi-Level', false, true, 'Microwave', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Bi-Level with Bluetooth
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-BIL-BLU-RC', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Bi-Level', false, true, 'Bluetooth', true, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Downlight Series - Daylight with Photo cell
('LED Downlight Series', 'LED Ultra Slim Downlight', 'FXF01185E-7A5T90W-DAY-PHO', '4"', '7.5W', 'AC120V', '2.7-5k, Tunable', 80, '615lm', '82lm/w', '0-10V', 'White-Aluminum', 'Daylight', false, false, 'Photo cell', false, false, false, false, 'Recessed', 'ETL DLC FCC ES T24 CP65', '5 Yr', '5,000'),

-- LED Flush Mount Light variations
('LED Flush Mount Light', 'LED Double Ring Ceiling Light', 'FXF23001-NONE', '10"', '8/12/16W', 'AC120V', '2.7-5k, Tunable', 80, '1200lm', '100lm/w 75lm/w', 'Triac', 'Brush Nickel/Metal', 'None', false, false, null, false, false, false, false, 'Surface', 'ETL', '5 Yr', '5,000'),

('LED Flush Mount Light', 'LED Double Ring Ceiling Light', 'FXF23001-OCC-PIR-RC', '10"', '8/12/16W', 'AC120V', '2.7-5k, Tunable', 80, '1200lm', '100lm/w 75lm/w', 'Triac', 'Brush Nickel/Metal', 'Occupancy', true, false, 'PIR', true, false, false, false, 'Surface', 'ETL', '5 Yr', '5,000'),

('LED Flush Mount Light', 'LED Double Ring Ceiling Light', 'FXF23001-BIL-MIC-RC', '10"', '8/12/16W', 'AC120V', '2.7-5k, Tunable', 80, '1200lm', '100lm/w 75lm/w', 'Triac', 'Brush Nickel/Metal', 'Bi-Level', false, true, 'Microwave', true, false, false, false, 'Surface', 'ETL', '5 Yr', '5,000'),

('LED Flush Mount Light', 'LED Double Ring Ceiling Light', 'FXF23001-BIL-BLU-RC', '10"', '8/12/16W', 'AC120V', '2.7-5k, Tunable', 80, '1200lm', '100lm/w 75lm/w', 'Triac', 'Brush Nickel/Metal', 'Bi-Level', false, true, 'Bluetooth', true, false, false, false, 'Surface', 'ETL', '5 Yr', '5,000'),

-- LED Linear Series variations
('LED Linear Series', 'Strip Light', 'ARVL-HY-2FT-LS100-20W3CCT-NONE', '2ft', '20W', 'AC120-277Vac', '4/5/6k (Tunable)', 80, '2600LM', '130lm/w', '0-10V', 'White-Aluminum', 'None', false, false, null, false, false, false, false, 'Surface/Suspension/Linkable', 'ETL DLC', '5 yr', '500'),

('LED Linear Series', 'Strip Light', 'ARVL-HY-2FT-LS100-20W3CCT-OCC-PIR', '2ft', '20W', 'AC120-277Vac', '4/5/6k (Tunable)', 80, '2600LM', '130lm/w', '0-10V', 'White-Aluminum', 'Occupancy', true, false, 'PIR', false, false, false, false, 'Surface/Suspension/Linkable', 'ETL DLC', '5 yr', '500'),

('LED Linear Series', 'Strip Light', 'ARVL-HY-2FT-LS100-20W3CCT-BIL-BLU-RC', '2ft', '20W', 'AC120-277Vac', '4/5/6k (Tunable)', 80, '2600LM', '130lm/w', '0-10V', 'White-Aluminum', 'Bi-Level', false, true, 'Bluetooth', true, false, false, false, 'Surface/Suspension/Linkable', 'ETL DLC', '5 yr', '500');