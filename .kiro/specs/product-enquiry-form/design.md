# Design Document

## Overview

The product enquiry form feature will be implemented as a modal dialog that opens when users click the "Make Enquiry" button in the ProductDetails component. The solution leverages the existing Radix UI Dialog component and follows the established design patterns in the application.

## Architecture

### Component Structure
```
ProductDetails (existing)
├── EnquiryModal (new)
│   ├── EnquiryForm (new)
│   └── SuccessMessage (new)
└── EnquiryService (new utility)
```

### Data Flow
1. User clicks "Make Enquiry" button → Opens modal with form
2. User fills form and submits → Validates data locally
3. Valid data → Sends POST request to webhook
4. Success response → Shows success message and closes modal
5. Error response → Shows error message and allows retry

## Components and Interfaces

### EnquiryModal Component
**Purpose:** Container modal that manages the enquiry flow state

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  productId: string,
  productName?: string
}
```

**State Management:**
- Form submission state (idle, loading, success, error)
- Form data validation
- Modal open/close state

### EnquiryForm Component
**Purpose:** Form component with validation and submission logic

**Props:**
```javascript
{
  onSubmit: (formData) => void,
  isLoading: boolean,
  error: string | null,
  productName?: string
}
```

**Form Fields:**
- Name (required, text input)
- Email (required, email validation)
- Phone (required, phone number format)
- Message (optional, textarea)

### EnquiryService Utility
**Purpose:** Handles API communication with the webhook

**Interface:**
```javascript
{
  submitEnquiry: async (productId: string, customerData: object) => Promise<response>
}
```

## Data Models

### Customer Data Object
```javascript
{
  name: string,        // Required, min 2 characters
  email: string,       // Required, valid email format
  phone: string,       // Required, phone number format
  message?: string     // Optional, max 500 characters
}
```

### Webhook Payload
```javascript
{
  productID: string,
  customerDetails: {
    name: string,
    email: string,
    phone: string,
    message?: string
  }
}
```

### API Response Handling
- Success: 200-299 status codes
- Error: All other status codes or network failures
- Timeout: 30 second request timeout

## Error Handling

### Form Validation Errors
- Real-time validation on field blur
- Submit-time validation for all fields
- Clear error messages with field highlighting
- Prevent submission until all required fields are valid

### API Errors
- Network connectivity issues
- Server errors (5xx)
- Client errors (4xx)
- Timeout errors
- Generic fallback error message

### Error Recovery
- Retry mechanism for failed submissions
- Form data preservation during errors
- Clear error states on successful retry

## Testing Strategy

### Unit Tests
- Form validation logic
- API service functions
- Component state management
- Error handling scenarios

### Integration Tests
- Modal open/close behavior
- Form submission flow
- API integration with mock responses
- Error state transitions

### User Experience Tests
- Form accessibility (keyboard navigation, screen readers)
- Mobile responsiveness
- Loading states and feedback
- Success/error message clarity

## Implementation Details

### Styling Approach
- Use existing Tailwind classes and design tokens
- Follow the gradient and glass-effect patterns from ProductDetails
- Maintain consistent spacing and typography
- Responsive design for mobile and desktop

### Animation and Transitions
- Leverage Framer Motion for smooth modal transitions
- Form field focus animations
- Loading spinner during submission
- Success checkmark animation

### Accessibility Considerations
- Proper ARIA labels and descriptions
- Focus management (trap focus in modal)
- Keyboard navigation support
- Screen reader announcements for state changes
- Color contrast compliance

### Performance Optimizations
- Lazy load modal content
- Debounced form validation
- Optimistic UI updates
- Request deduplication

### Security Considerations
- Client-side input sanitization
- Email format validation
- Phone number format validation
- XSS prevention in form inputs
- HTTPS-only webhook communication