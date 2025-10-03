-- Sample enquiry data for testing the dashboard
INSERT INTO public.enquiries (customer_details, cart_items, status, created_at, updated_at) VALUES
(
  '{"name": "John Smith", "email": "john.smith@example.com", "phone": "+1-555-0123", "company": "Smith Construction", "address": "123 Main St, New York, NY 10001", "message": "Looking for LED downlights for office renovation", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "led-downlight-001", "modelNumber": "DL-6W-3000K", "productType": "LED Downlight", "quantity": 24, "table": "indoor"}]',
  'new',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  '{"name": "Sarah Johnson", "email": "sarah.j@techcorp.com", "phone": "+1-555-0456", "company": "TechCorp Solutions", "address": "456 Business Ave, San Francisco, CA 94102", "message": "Need outdoor lighting for parking lot", "deliveryMethod": "boat", "deliveryTime": "35 days"}',
  '[{"id": "flood-light-002", "modelNumber": "FL-50W-4000K", "productType": "LED Flood Light", "quantity": 12, "table": "outdoor"}, {"id": "pole-light-003", "modelNumber": "PL-30W-5000K", "productType": "Pole Light", "quantity": 6, "table": "outdoor"}]',
  'contacted',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
),
(
  '{"name": "Michael Chen", "email": "m.chen@retailstore.com", "phone": "+1-555-0789", "company": "Retail Store Chain", "address": "789 Shopping Blvd, Chicago, IL 60601", "message": "Retail store lighting upgrade project", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "track-light-004", "modelNumber": "TL-20W-3000K", "productType": "Track Light", "quantity": 36, "table": "indoor"}, {"id": "pendant-light-005", "modelNumber": "PD-15W-2700K", "productType": "Pendant Light", "quantity": 8, "table": "indoor"}]',
  'quoted',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '3 days'
),
(
  '{"name": "Emily Rodriguez", "email": "emily.r@hospitalgroup.org", "phone": "+1-555-0321", "company": "City Hospital Group", "address": "321 Medical Center Dr, Houston, TX 77002", "message": "Hospital corridor and room lighting", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "panel-light-006", "modelNumber": "PNL-40W-4000K", "productType": "LED Panel", "quantity": 48, "table": "indoor"}, {"id": "emergency-light-007", "modelNumber": "EM-8W-6500K", "productType": "Emergency Light", "quantity": 16, "table": "indoor"}]',
  'won',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '2 days'
),
(
  '{"name": "David Wilson", "email": "d.wilson@schooldistrict.edu", "phone": "+1-555-0654", "company": "Metro School District", "address": "654 Education Way, Denver, CO 80202", "message": "Classroom and hallway LED conversion", "deliveryMethod": "boat", "deliveryTime": "35 days"}',
  '[{"id": "tube-light-008", "modelNumber": "TB-18W-4000K", "productType": "LED Tube", "quantity": 120, "table": "indoor"}, {"id": "exit-light-009", "modelNumber": "EX-3W-6500K", "productType": "Exit Sign", "quantity": 24, "table": "indoor"}]',
  'lost',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '8 days'
),
(
  '{"name": "Lisa Thompson", "email": "lisa.t@restaurant.com", "phone": "+1-555-0987", "company": "Fine Dining Restaurant", "address": "987 Gourmet St, Miami, FL 33101", "message": "Ambient lighting for dining area", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "chandelier-010", "modelNumber": "CH-25W-2700K", "productType": "Chandelier", "quantity": 4, "table": "indoor"}, {"id": "wall-sconce-011", "modelNumber": "WS-12W-3000K", "productType": "Wall Sconce", "quantity": 12, "table": "indoor"}]',
  'new',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  '{"name": "Robert Garcia", "email": "r.garcia@warehouse.com", "phone": "+1-555-0147", "company": "Logistics Warehouse", "address": "147 Industrial Pkwy, Phoenix, AZ 85001", "message": "High bay lighting for warehouse", "deliveryMethod": "boat", "deliveryTime": "35 days"}',
  '[{"id": "highbay-light-012", "modelNumber": "HB-100W-5000K", "productType": "High Bay Light", "quantity": 32, "table": "indoor"}, {"id": "motion-sensor-013", "modelNumber": "MS-PIR-001", "productType": "Motion Sensor", "quantity": 16, "table": "indoor"}]',
  'contacted',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day'
),
(
  '{"name": "Amanda Lee", "email": "amanda.l@hotel.com", "phone": "+1-555-0258", "company": "Luxury Hotel Chain", "address": "258 Hospitality Blvd, Las Vegas, NV 89101", "message": "Hotel room and lobby lighting renovation", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "bedside-lamp-014", "modelNumber": "BL-8W-2700K", "productType": "Bedside Lamp", "quantity": 200, "table": "indoor"}, {"id": "lobby-light-015", "modelNumber": "LB-35W-3000K", "productType": "Lobby Light", "quantity": 24, "table": "indoor"}]',
  'quoted',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '2 days'
),
(
  '{"name": "James Park", "email": "j.park@citycouncil.gov", "phone": "+1-555-0369", "company": "City Council", "address": "369 Municipal Ave, Seattle, WA 98101", "message": "Street lighting upgrade project", "deliveryMethod": "boat", "deliveryTime": "35 days"}',
  '[{"id": "street-light-016", "modelNumber": "SL-80W-4000K", "productType": "Street Light", "quantity": 150, "table": "outdoor"}, {"id": "bollard-light-017", "modelNumber": "BL-15W-3000K", "productType": "Bollard Light", "quantity": 48, "table": "outdoor"}]',
  'new',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
(
  '{"name": "Jennifer White", "email": "j.white@sportscenter.com", "phone": "+1-555-0741", "company": "Community Sports Center", "address": "741 Athletic Dr, Portland, OR 97201", "message": "Sports facility lighting upgrade", "deliveryMethod": "air", "deliveryTime": "30 days"}',
  '[{"id": "sports-light-018", "modelNumber": "SP-200W-5000K", "productType": "Sports Light", "quantity": 16, "table": "outdoor"}, {"id": "emergency-exit-019", "modelNumber": "EE-5W-6500K", "productType": "Emergency Exit", "quantity": 12, "table": "indoor"}]',
  'won',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '5 days'
);
