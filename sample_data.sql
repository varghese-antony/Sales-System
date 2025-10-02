-- Insert sample enquiry data for testing
INSERT INTO public.enquiries (customer_name, company, email, phone, message, status)
VALUES
  ('John Smith', 'ABC Lighting', 'john@abclighting.com', '+1-555-0123', 'Looking for indoor LED downlights for office renovation project. Need 500 units.', 'pending'),
  ('Sarah Johnson', 'TechCorp Industries', 'sarah.j@techcorp.com', '+1-555-0456', 'Interested in outdoor lighting solutions for parking lot. Please provide specifications and pricing.', 'in_progress'),
  ('Mike Wilson', 'Retail Solutions Ltd', 'mike@retailsolutions.com', '+1-555-0789', 'Need quotation for emergency lighting systems for warehouse facility.', 'completed')
ON CONFLICT DO NOTHING;
