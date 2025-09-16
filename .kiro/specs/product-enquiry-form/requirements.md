# Requirements Document

## Introduction

This feature enables customers to submit product inquiries directly from the product details page. When a customer clicks the "Make Enquiry" button, a modal form will appear allowing them to provide their contact details. The system will then send the customer information along with the product ID to a webhook endpoint for processing.

## Requirements

### Requirement 1

**User Story:** As a customer, I want to click the "Make Enquiry" button and fill out my contact details, so that I can request more information about a specific product.

#### Acceptance Criteria

1. WHEN a customer clicks the "Make Enquiry" button THEN the system SHALL display a modal dialog with a contact form
2. WHEN the modal opens THEN the system SHALL display input fields for customer name, email, phone number, and optional message
3. WHEN a customer enters invalid email format THEN the system SHALL display validation error messages
4. WHEN a customer leaves required fields empty THEN the system SHALL prevent form submission and show validation errors
5. WHEN a customer fills all required fields correctly THEN the system SHALL enable the submit button

### Requirement 2

**User Story:** As a customer, I want to submit my inquiry form, so that the business can contact me about the product I'm interested in.

#### Acceptance Criteria

1. WHEN a customer submits a valid form THEN the system SHALL send a POST request to https://n8n.werposolutions.com/webhook/inquiry
2. WHEN sending the webhook request THEN the system SHALL include the product ID and customer details object in the request body
3. WHEN the webhook request is successful THEN the system SHALL display a success message to the customer
4. WHEN the webhook request fails THEN the system SHALL display an error message and allow the customer to retry
5. WHEN the form is successfully submitted THEN the system SHALL close the modal and reset the form

### Requirement 3

**User Story:** As a customer, I want to be able to cancel or close the inquiry form, so that I can continue browsing without submitting an inquiry.

#### Acceptance Criteria

1. WHEN a customer clicks the close button or outside the modal THEN the system SHALL close the modal without submitting data
2. WHEN a customer presses the Escape key THEN the system SHALL close the modal
3. WHEN the modal is closed without submission THEN the system SHALL clear any entered form data
4. WHEN the modal is closed THEN the system SHALL return focus to the "Make Enquiry" button

### Requirement 4

**User Story:** As a business owner, I want to receive structured inquiry data, so that I can efficiently process customer requests.

#### Acceptance Criteria

1. WHEN an inquiry is submitted THEN the system SHALL send data in JSON format with productID and customer details
2. WHEN sending customer details THEN the system SHALL include name, email, phone, and message fields
3. WHEN the product ID is available THEN the system SHALL include it in the webhook payload
4. WHEN sending the request THEN the system SHALL use proper HTTP headers including Content-Type: application/json