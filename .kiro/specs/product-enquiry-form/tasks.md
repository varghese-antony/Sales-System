# Implementation Plan

- [ ] 1. Create form validation utilities and types
  - Create TypeScript interfaces for customer data and form validation
  - Implement validation functions for email, phone, and required fields
  - Write unit tests for validation logic
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 2. Create enquiry service for webhook communication
  - Implement API service function to send POST requests to webhook endpoint
  - Add proper error handling and timeout configuration
  - Include request/response type definitions
  - Write unit tests for API service with mock responses
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Create EnquiryForm component with validation
  - Build form component with name, email, phone, and message fields
  - Implement real-time validation with error display
  - Add form submission handling with loading states
  - Include proper accessibility attributes and keyboard navigation
  - Write component tests for form behavior and validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Create EnquiryModal component with state management
  - Build modal wrapper using existing Dialog component
  - Implement modal state management (open/close/loading/success/error)
  - Add success message display after successful submission
  - Include proper focus management and escape key handling
  - Write tests for modal behavior and state transitions
  - _Requirements: 1.1, 2.5, 3.1, 3.2, 3.3_

- [ ] 5. Integrate enquiry modal with ProductDetails component
  - Add modal trigger to existing "Make Enquiry" button
  - Pass product ID and name to the modal component
  - Ensure proper product context is maintained
  - Test integration with existing ProductDetails functionality
  - _Requirements: 1.1, 4.3_

- [ ] 6. Add error handling and retry functionality
  - Implement comprehensive error handling for API failures
  - Add retry mechanism for failed submissions
  - Display user-friendly error messages
  - Preserve form data during error states
  - Write tests for error scenarios and recovery
  - _Requirements: 2.3, 2.4_

- [ ] 7. Create textarea UI component for message field
  - Build reusable textarea component following existing input component patterns
  - Include proper styling and focus states
  - Add character count and validation
  - Write component tests
  - _Requirements: 1.2_

- [ ] 8. Add loading states and animations
  - Implement loading spinner during form submission
  - Add smooth transitions for modal open/close
  - Include success animation after submission
  - Add form field focus animations
  - Test loading states and user feedback
  - _Requirements: 2.1, 2.5_

- [ ] 9. Implement responsive design and mobile optimization
  - Ensure modal works properly on mobile devices
  - Optimize form layout for different screen sizes
  - Test touch interactions and mobile keyboard behavior
  - Verify accessibility on mobile devices
  - _Requirements: 1.1, 1.2_

- [ ] 10. Add comprehensive error boundary and fallback UI
  - Implement error boundary for the enquiry feature
  - Create fallback UI for component failures
  - Add logging for debugging purposes
  - Test error boundary behavior
  - _Requirements: 2.3, 2.4_