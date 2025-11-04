# Implementation Plan

- [-] 1. Create new database schema and migration system
  - Create new v2 product tables with enhanced sensor control fields
  - Implement database migration service for CSV import and data processing
  - Set up proper indexing and constraints for optimal performance
  - _Requirements: 1.1, 1.3, 4.1, 4.4_

- [x] 1.1 Create new database tables with enhanced schema
  - Write SQL migration to create `indoor_products_v2` and `outdoor_products_v2` tables
  - Add all required columns including sensor control boolean fields
  - Set up proper data types, constraints, and default values
  - _Requirements: 1.1, 1.3, 4.2_

- [x] 1.2 Implement CSV import and processing service
  - Create migration service class for handling CSV data import
  - Implement CSV parsing with proper data validation and cleaning
  - Add error handling for malformed or missing data
  - _Requirements: 1.1, 1.4, 4.1_

- [ ] 1.3 Create product variation generation logic
  - Implement algorithm to generate sensor control combinations
  - Create separate database rows for each valid sensor/control variation
  - Ensure proper mapping of CSV sensor data to boolean fields
  - _Requirements: 1.4, 2.5, 4.1, 4.3_

- [ ]* 1.4 Add database indexes and performance optimization
  - Create indexes on frequently queried fields (model_number, category, sensors)
  - Optimize query performance for filtering and searching
  - Set up database connection pooling for import operations
  - _Requirements: 1.1, 4.4_

- [ ] 2. Import and process new CSV data
  - Execute CSV import for both indoor and outdoor lighting matrix files
  - Generate all product variations based on sensor control combinations
  - Validate imported data integrity and completeness
  - _Requirements: 1.1, 1.4, 2.5, 4.1_

- [ ] 2.1 Import indoor lighting matrix CSV data
  - Process the indoor CSV file and import into `indoor_products_v2` table
  - Generate product variations for all sensor control combinations
  - Validate data consistency and handle any import errors
  - _Requirements: 1.1, 1.4, 4.1_

- [ ] 2.2 Import outdoor lighting matrix CSV data
  - Process the outdoor CSV file and import into `outdoor_products_v2` table
  - Generate product variations for all sensor control combinations
  - Ensure IP rating and outdoor-specific fields are properly handled
  - _Requirements: 1.1, 1.4, 4.1_

- [ ] 2.3 Validate imported data and generate reports
  - Run data validation checks on imported products
  - Generate import summary reports showing product counts and variations
  - Verify all sensor combinations are correctly represented
  - _Requirements: 1.4, 4.1, 4.4_

- [ ] 3. Update database service layer for new schema
  - Create new database service classes for v2 product tables
  - Implement enhanced filtering and search capabilities for sensor controls
  - Update existing database functions to use new table structure
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 3.1 Create ProductsV2Service class
  - Implement new service class for accessing v2 product tables
  - Add methods for querying indoor and outdoor products with enhanced filtering
  - Include sensor-specific query methods and product variation retrieval
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Implement enhanced product filtering and search
  - Add filtering capabilities for sensor control options
  - Implement search across new sensor and control fields
  - Create methods for retrieving products by sensor type combinations
  - _Requirements: 2.1, 2.2, 2.3, 3.2_

- [ ] 3.3 Update existing database service integration
  - Modify existing product service calls to use new v2 tables
  - Ensure backward compatibility with existing API contracts
  - Update error handling for new database schema
  - _Requirements: 3.1, 3.4_

- [ ] 4. Update API endpoints to use new product tables
  - Modify all product-related API endpoints to query v2 tables
  - Add new sensor selection API endpoints
  - Ensure existing API contracts remain compatible
  - _Requirements: 3.1, 3.4, 2.1_

- [ ] 4.1 Update existing product API endpoints
  - Modify `/api/products/indoor` and `/api/products/outdoor` to use v2 tables
  - Update product detail endpoints to return sensor control information
  - Ensure response format remains compatible with existing frontend
  - _Requirements: 3.1, 3.4_

- [ ] 4.2 Create new sensor selection API endpoints
  - Implement `/api/products/sensor-options` for sensor selection flow
  - Add endpoints for filtering products by sensor combinations
  - Create API for retrieving product variations by model number
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 4.3 Update product filtering and search APIs
  - Enhance filter options API to include sensor control fields
  - Update search API to query across new sensor and control columns
  - Add pagination and sorting for large product variation lists
  - _Requirements: 3.2, 5.3_

- [ ] 5. Create sensor selection user interface components
  - Implement new sensor selection component with simplified flow
  - Update product display components to show sensor information
  - Add sensor filtering options to product filter modal
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

- [ ] 5.1 Create SensorSelector component
  - Implement simplified sensor selection flow (Occupancy, Bi-Level, Daylight, Photo cell, None)
  - Add mandatory remote control indication for Occupancy and Bi-Level
  - Include additional options for plugin sensor, emergency backup, junction cover
  - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [ ] 5.2 Update ProductCard component for sensor display
  - Add sensor control information display to product cards
  - Show remote control requirements and additional options
  - Implement visual indicators for different sensor types
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.3 Enhance ProductFilterModal with sensor options
  - Add sensor control filtering options to the filter modal
  - Implement filtering by sensor type, remote control, and additional options
  - Update filter state management to handle new sensor fields
  - _Requirements: 2.1, 2.2, 2.3, 5.3_

- [ ] 6. Update product display and detail components
  - Modify product detail views to show comprehensive sensor information
  - Update product listing components to display sensor control options
  - Ensure product images and documentation links are properly displayed
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.1 Update ProductDetails component
  - Display detailed sensor control information in product details
  - Show all available sensor combinations for the product model
  - Include remote control requirements and additional option details
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6.2 Update product listing components
  - Modify product grid and list views to show sensor information
  - Add sensor type badges and indicators to product listings
  - Ensure pricing and specification information is displayed for all variations
  - _Requirements: 5.1, 5.3, 5.5_

- [ ] 6.3 Update product search and navigation
  - Enhance product search to include sensor control fields
  - Update category navigation to work with new product structure
  - Ensure product URLs and routing work with new product variations
  - _Requirements: 3.2, 5.3_

- [ ] 7. Update cart and enquiry system integration
  - Ensure cart functionality works with new product structure
  - Update enquiry system to handle sensor control information
  - Maintain existing cart and enquiry data formats for compatibility
  - _Requirements: 3.5, 5.4, 5.5_

- [ ] 7.1 Update cart integration for new products
  - Modify cart system to handle products from v2 tables
  - Ensure product variations are properly identified in cart
  - Update cart display to show sensor control information
  - _Requirements: 3.5_

- [ ] 7.2 Update enquiry system for sensor information
  - Modify enquiry forms to capture sensor control selections
  - Update enquiry data structure to include sensor information
  - Ensure enquiry processing handles new product data format
  - _Requirements: 3.5, 5.4_

- [ ]* 7.3 Add cart and enquiry data migration utilities
  - Create utilities to migrate existing cart data to new format
  - Implement data transformation for existing enquiries
  - Add validation for cart and enquiry data integrity
  - _Requirements: 3.5_

- [ ] 8. Implement comprehensive testing and validation
  - Create unit tests for all new database and API functionality
  - Add integration tests for the complete sensor selection flow
  - Perform data validation and performance testing
  - _Requirements: 1.4, 2.5, 4.1, 4.4_

- [ ] 8.1 Create unit tests for database and API layers
  - Test CSV import and product variation generation functions
  - Add tests for new database service methods and API endpoints
  - Validate sensor selection logic and filtering functionality
  - _Requirements: 1.4, 2.5, 3.1, 3.2_

- [ ] 8.2 Add integration tests for sensor selection flow
  - Test complete user flow from sensor selection to cart
  - Validate product filtering and search with sensor options
  - Test enquiry submission with sensor control information
  - _Requirements: 2.1, 2.2, 2.3, 3.5_

- [ ]* 8.3 Perform performance and data validation testing
  - Test query performance with large product variation datasets
  - Validate data integrity after CSV import and variation generation
  - Test system performance under load with new database schema
  - _Requirements: 1.4, 4.1, 4.4_

- [ ] 9. Deploy and validate system functionality
  - Deploy new database schema and import CSV data
  - Validate all application functionality with new product data
  - Monitor system performance and address any issues
  - _Requirements: 1.1, 3.1, 4.1, 5.1_

- [ ] 9.1 Execute database migration and CSV import
  - Run database migration to create v2 tables in production
  - Import both indoor and outdoor CSV files with full validation
  - Verify all product variations are correctly generated
  - _Requirements: 1.1, 1.4, 4.1_

- [ ] 9.2 Validate application functionality end-to-end
  - Test all product browsing, filtering, and search functionality
  - Validate sensor selection flow and product variation display
  - Ensure cart and enquiry systems work correctly with new data
  - _Requirements: 2.1, 3.1, 3.5, 5.1_

- [ ]* 9.3 Monitor performance and optimize as needed
  - Monitor database query performance and optimize slow queries
  - Track application performance metrics and user experience
  - Address any performance issues or data inconsistencies
  - _Requirements: 4.4, 5.1_