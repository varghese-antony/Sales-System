# Requirements Document

## Introduction

This feature updates the lighting product catalog system to use new CSV data with an enhanced schema and implements a simplified sensor selection flow. The system will create new indoor and outdoor product tables with expanded sensor and control options while maintaining backward compatibility with the existing application.

## Glossary

- **Lighting_System**: The web application that manages indoor and outdoor lighting product catalogs
- **CSV_Data**: The new lighting matrix data files containing product specifications and sensor configurations
- **Sensor_Controls**: Hardware components that control lighting behavior (PIR, Microwave, Bluetooth, etc.)
- **Product_Variations**: Multiple configurations of the same base product with different sensor combinations
- **Database_Schema**: The structure of tables and columns that store product information
- **Legacy_Tables**: The existing indoor and outdoor tables that will remain unchanged

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to import new lighting matrix data into separate tables, so that I can maintain the existing system while adding enhanced product data.

#### Acceptance Criteria

1. WHEN new CSV data is imported, THE Lighting_System SHALL create new indoor and outdoor tables with updated schema
2. WHILE preserving existing data, THE Lighting_System SHALL maintain the current indoor and outdoor tables unchanged
3. THE Lighting_System SHALL support all columns from the new CSV structure including sensor control fields
4. THE Lighting_System SHALL automatically generate product variations based on sensor combinations
5. THE Lighting_System SHALL import both indoor and outdoor CSV data into their respective new tables

### Requirement 2

**User Story:** As a customer, I want to select products using a simplified sensor control flow, so that I can easily choose the right lighting configuration for my needs.

#### Acceptance Criteria

1. WHEN selecting sensors and controls, THE Lighting_System SHALL present options for Occupancy, Bi-Level, Daylight, Photo cell, and None
2. WHERE Occupancy is selected, THE Lighting_System SHALL offer PIR, Microwave, and Bluetooth options with mandatory Remote control
3. WHERE Bi-Level is selected, THE Lighting_System SHALL offer PIR, Microwave, and Bluetooth options with mandatory Remote control
4. WHERE Daylight is selected, THE Lighting_System SHALL provide Photo cell configuration options
5. THE Lighting_System SHALL generate product variations automatically based on sensor selection combinations

### Requirement 3

**User Story:** As a developer, I want the application to use the new product tables throughout the system, so that all product displays and searches utilize the enhanced data structure.

#### Acceptance Criteria

1. THE Lighting_System SHALL update all product queries to use the new indoor and outdoor tables
2. THE Lighting_System SHALL modify product filtering to work with the new sensor control fields
3. THE Lighting_System SHALL update product display components to show sensor and control information
4. THE Lighting_System SHALL maintain existing API endpoints while using new data sources
5. THE Lighting_System SHALL ensure cart and enquiry functionality works with new product structure

### Requirement 4

**User Story:** As a system administrator, I want the new schema to support extensive product variations, so that customers can see all available sensor and control combinations.

#### Acceptance Criteria

1. THE Lighting_System SHALL create separate rows for each sensor control combination
2. THE Lighting_System SHALL support boolean fields for Remote Control, Plugin Sensor, Emergency Backup Battery, and Junction Cover
3. THE Lighting_System SHALL maintain product relationships through model numbers and base specifications
4. THE Lighting_System SHALL generate unique identifiers for each product variation
5. THE Lighting_System SHALL preserve all original CSV data fields in the new schema

### Requirement 5

**User Story:** As a customer, I want to see accurate product information with sensor details, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. THE Lighting_System SHALL display sensor control options clearly in product listings
2. THE Lighting_System SHALL show Remote Control requirements when applicable
3. THE Lighting_System SHALL indicate which sensor combinations are available for each product
4. THE Lighting_System SHALL maintain product images and documentation links
5. THE Lighting_System SHALL preserve pricing and specification information for all variations