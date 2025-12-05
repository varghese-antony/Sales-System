# Lighting Catalogue Application - Comprehensive Standard Operating Procedures (SOPs)

## Company Internal Use Only - Detailed Edition

This document provides comprehensive, step-by-step instructions for using all features of the lighting catalogue application. Written in simple, explanatory language to help team members understand and navigate the system effectively.

## Table of Contents

### User-Facing Features
1. [Homepage Navigation](#homepage-navigation)
2. [Browsing Indoor Lighting Products](#browsing-indoor-lighting-products)
3. [Browsing Outdoor Lighting Products](#browsing-outdoor-lighting-products)
4. [Viewing Product Details](#viewing-product-details)
5. [Using Shopping Cart](#using-shopping-cart)
6. [Submitting Product Enquiries](#submitting-product-enquiries)
7. [User Authentication](#user-authentication)
8. [Profile Management](#profile-management)

### Admin-Facing Features
9. [Admin Dashboard Overview](#admin-dashboard-overview)
10. [Adding New Products (Data Entry)](#adding-new-products-data-entry)
11. [Managing Product Data](#managing-product-data)
12. [Setting Product Prices](#setting-product-prices)
13. [Managing Price Variations](#managing-price-variations)
14. [Managing Customer Enquiries](#managing-customer-enquiries)
15. [Managing Customer Accounts](#managing-customer-accounts)
16. [Creating and Managing Coupons](#creating-and-managing-coupons)

### Pending/Future Features
17. [Analytics Implementation](#analytics-implementation)
18. [Server Hosting Setup](#server-hosting-setup)
19. [Domain Configuration](#domain-configuration)
20. [Manual Testing Procedures](#manual-testing-procedures)
21. [Fresh Dataset Creation](#fresh-dataset-creation)
22. [Customer Pricing Display](#customer-pricing-display)

---

## User-Facing Features

### Homepage Navigation

#### What is the Homepage?
The homepage is the main entry point of the application. It serves as a visual introduction to BH Sourcing's lighting catalogue and provides easy access to browse products.

#### Accessing the Homepage
**Step 1:** Open any web browser (Chrome, Firefox, Safari, Edge)
**Step 2:** Type the application URL in the address bar
**Step 3:** Press Enter or click Go
**Step 4:** The homepage loads automatically

#### Understanding Homepage Layout
When you first visit the homepage, you'll see:

**Visual Elements:**
- **Animated Background:** Subtle grid pattern animation for visual appeal
- **Main Title:** "Illuminate Your Space" with gradient text effect
- **Company Logo:** BH Sourcing logo in the top-left corner (blue-purple gradient circle with lightbulb icon)

**Navigation Elements:**
- **Top Navigation Bar:** Contains logo, authentication buttons, theme toggle, and mobile menu
- **Main Content Area:** Two large product category cards

**Product Category Cards:**
- **Left Card:** Indoor Lighting (blue-purple gradient)
  - Title: "Indoor Lighting"
  - Description: "Transform your interior spaces with our elegant indoor lighting collection featuring chandeliers, pendant lights, and modern fixtures"
  - Icon: Lightbulb symbol

- **Right Card:** Outdoor Lighting (green-teal gradient)
  - Title: "Outdoor Lighting"
  - Description: "Illuminate your exterior spaces with weather-resistant outdoor solutions including landscape, security, and decorative lighting"
  - Icon: Sparkles symbol

#### How to Use Homepage Features
**Browse Products:**
1. Click on either the "Indoor Lighting" or "Outdoor Lighting" card
2. This takes you to the respective product catalog page
3. From there you can explore different categories and product types

**Navigation Options:**
- **Desktop:** Use the top navigation bar dropdown menus for Indoor/Outdoor categories
- **Mobile:** Click the hamburger menu (three lines) for mobile navigation
- **Logo:** Click the BH Sourcing logo anytime to return to homepage

**Visual Features:**
- **Theme Toggle:** Switch between light and dark modes (sun/moon icon in top-right)
- **Responsive Design:** Layout automatically adjusts for desktop, tablet, and mobile screens

---

### Browsing Indoor Lighting Products

#### What is Indoor Lighting Catalog?
This section displays all indoor lighting products organized by categories like chandeliers, pendant lights, ceiling fixtures, wall sconces, and more.

#### Accessing Indoor Products
**Method 1:** From homepage, click the "Indoor Lighting" card
**Method 2:** Use the "Indoor" dropdown in the top navigation bar
**Method 3:** Navigate directly to `/indoor` URL

#### Understanding the Indoor Catalog Layout
**Header Section:**
- **Breadcrumb Navigation:** Shows "Home > Indoor Lighting"
- **Animated Lightbulb Icon:** Rotates and scales for visual interest
- **Main Title:** "Indoor Lighting" with gradient text effect
- **Description:** "Transform your interior spaces with our premium indoor lighting collection"
- **Category Badges:** Shows "Premium Quality", "Energy Efficient", and total number of categories

**Category Navigation Sidebar:**
- **Left Sidebar:** Lists all indoor lighting categories (chandeliers, pendants, etc.)
- **Active Section Highlighting:** Current category is highlighted as you scroll
- **Click to Jump:** Click any category name to instantly scroll to that section

**Product Categories Display:**
- **Category Headers:** Each category has a header with icon and description
- **Product Type Cards:** Under each category, you'll see different product types (specific models)
- **Sample Images:** Each product type shows a sample product image
- **Grid Layout:** Products arranged in responsive grid (1-3 columns based on screen size)

#### How Category Navigation Works
**Desktop Experience:**
1. **Sidebar Categories:** Visible on left side of screen
2. **Scroll Detection:** Page automatically detects which category you're viewing
3. **Active Highlighting:** Current category is highlighted in the sidebar
4. **Smooth Scrolling:** Clicking sidebar category smoothly scrolls to that section

**Mobile Experience:**
1. **Collapsible Sidebar:** Click menu button to open/close category list
2. **Touch Scrolling:** Swipe up/down to browse categories
3. **Category Headers:** Each section clearly marked for easy identification

#### Understanding Product Cards
Each product type card shows:
- **Product Type Name:** (e.g., "Crystal Chandelier", "LED Downlight")
- **Sample Image:** Representative photo of that product type
- **Description:** Brief explanation of the product category
- **Click Action:** Clicking opens detailed product listing for that specific type

#### Category Organization
Indoor lighting categories include:
- **Chandeliers:** Decorative ceiling-mounted fixtures
- **Pendant Lights:** Hanging light fixtures
- **Ceiling Lights:** Flush or semi-flush mounted fixtures
- **Wall Sconces:** Wall-mounted decorative lighting
- **Table/Floor Lamps:** Portable lighting solutions
- **Track Lighting:** Adjustable rail-mounted systems
- **Under-Cabinet Lighting:** Kitchen and workspace lighting

#### Browsing Tips
**Quick Navigation:**
- Use sidebar categories to jump between sections
- Scroll naturally to browse all options
- Click product cards to see specific models

**Search Function:**
- Use the search bar in the top navigation (when available)
- Search by product name, type, or specifications

---

### Browsing Outdoor Lighting Products

#### What is Outdoor Lighting Catalog?
This section displays weather-resistant lighting products designed for exterior use, organized by application and mounting type.

#### Accessing Outdoor Products
**Method 1:** From homepage, click the "Outdoor Lighting" card
**Method 2:** Use the "Outdoor" dropdown in the top navigation bar
**Method 3:** Navigate directly to `/outdoor` URL

#### Understanding the Outdoor Catalog Layout
**Header Section:**
- **Breadcrumb Navigation:** Shows "Home > Outdoor Lighting"
- **Animated Sparkles Icon:** Animated for visual interest
- **Main Title:** "Outdoor Lighting" with gradient text effect
- **Description:** "Illuminate your exterior spaces with weather-resistant outdoor solutions"
- **Category Badges:** Shows quality indicators and total categories

**Category Navigation Sidebar:**
- **Left Sidebar:** Lists all outdoor lighting categories
- **Weather-Resistance Focus:** Categories organized by IP ratings and application
- **Active Section Highlighting:** Current category highlighted during scroll

**Product Categories Display:**
- **Category Headers:** Each category clearly identified with icons
- **Product Type Cards:** Specific outdoor lighting models and styles
- **Durability Indicators:** Weather-resistance ratings visible
- **Grid Layout:** Responsive grid layout for easy browsing

#### Outdoor Category Organization
Outdoor lighting categories include:
- **Landscape Lighting:** Garden and pathway illumination
- **Security Lighting:** Motion-sensor and flood lights
- **Wall-Mounted:** Exterior wall sconces and brackets
- **Post/Pole Lights:** Driveway and entrance lighting
- **Deck/Patio Lighting:** Outdoor living space illumination
- **Pool/Spa Lighting:** Waterproof underwater and perimeter lighting
- **Commercial Outdoor:** Parking lot and building exterior lighting

#### Special Outdoor Features
**Weather Resistance:**
- **IP Ratings:** Ingress Protection ratings shown (IP65, IP67, etc.)
- **Material Information:** Corrosion-resistant materials highlighted
- **Durability Specs:** UV resistance, temperature ratings, saltwater resistance

**Safety Features:**
- **Motion Sensors:** Automatic activation options
- **Photocells:** Dusk-to-dawn operation
- **Emergency Lighting:** Backup power options

#### Installation Considerations
- **Mounting Types:** Surface mount, recessed, pole mount options
- **Voltage Requirements:** 120V, 240V, or low-voltage options
- **Wiring Needs:** Hardwired vs. plug-in capabilities
- **Professional Installation:** Recommendations for complex setups

---

### Viewing Product Details

#### What is Product Details Page?
This page shows comprehensive information about a specific lighting product, including technical specifications, images, and the ability to add items to cart.

#### Accessing Product Details
**From Category Pages:**
1. Browse to indoor or outdoor catalog
2. Click on any product type card
3. Select specific product from the list
4. Click "View Details" or product name

**Direct URL Access:**
- Navigate to specific product URL (e.g., `/indoor/chandeliers/crystal-chandelier-001`)

#### Understanding Product Details Layout

**Header Section:**
- **Back Button:** "← Back to Selection" to return to category
- **Product Title:** Full product name and model number
- **Category Badges:** Indoor/Outdoor classification and image availability
- **Download Options:** Cut sheet and documentation links
- **Quantity Selector:** Choose how many to add to cart
- **Add to Cart Button:** Primary action button with visual feedback

**Left Column (Image & Key Specs):**
- **Product Image:** High-quality product photo with zoom functionality
  - Click image to open full-size modal view
  - Zoom icon appears on hover
  - Image loading states with smooth transitions
- **Key Specifications:** Most important specs highlighted
  - Model number, size, power, voltage, CCT, lumen output
  - Displayed in easy-to-read format
- **Downloads Section:** Technical documentation access
  - Product cut sheets (PDF downloads)
  - IES files (coming soon)
  - Certification documents (coming soon)

**Right Column (Complete Specifications):**
- **Organized by Category:** Specs grouped logically
  - **Power & Performance:** Wattage, voltage, efficacy, lumen
  - **Design & Specifications:** Model, size, material, mounting, CCT, CRI
  - **Smart Features:** Dimming, sensors, remote control, emergency backup
  - **Certifications & Installation:** Safety ratings, installation requirements

#### How to Use Product Details Features

**Image Viewing:**
1. **Hover to Zoom:** Mouse over image to see zoom icon
2. **Click to Enlarge:** Click image for full-screen modal view
3. **Modal Controls:** Click outside or press ESC to close modal
4. **Image Loading:** Smooth loading animation for better UX

**Specification Navigation:**
1. **Category Icons:** Each section has relevant icon (zap for power, shield for warranty)
2. **Badge Counters:** Shows number of specifications in each category
3. **Grid Layout:** Two-column responsive layout for easy reading
4. **Missing Info:** Clearly marked as "Not specified" when data unavailable

**Adding to Cart:**
1. **Quantity Selection:** Use +/- buttons or direct input
2. **Visual Feedback:** Button shows "Added!" with checkmark animation
3. **Multiple Addition:** System adds specified quantity to cart
4. **Cart Integration:** Items immediately appear in cart counter

**Download Access:**
1. **Cut Sheet Button:** Opens PDF in new tab
2. **External Link Icon:** Indicates external document
3. **Coming Soon Items:** Disabled buttons for future features

#### Technical Specifications Explained

**Power & Performance:**
- **Power (W):** Electrical power consumption in watts
- **Voltage:** Operating voltage (120V, 240V, 12V DC)
- **CCT (Correlated Color Temperature):** Light color (2700K warm, 4000K cool, 5000K daylight)
- **CRI (Color Rendering Index):** Color accuracy (90+ is excellent)
- **Lumen:** Light output brightness
- **Efficacy (lm/W):** Energy efficiency rating

**Design & Specifications:**
- **Model Number:** Manufacturer's product code
- **Sizes:** Physical dimensions (diameter, height, width)
- **Material/Finish:** Construction material and surface treatment
- **Mounting:** Installation method (ceiling, wall, pendant)
- **Beam Angle:** Light spread pattern

**Smart Features:**
- **Dimming Type:** 0-10V, TRIAC, ELV, DMX compatibility
- **Sensor Types:** Motion, occupancy, daylight harvesting
- **Remote Control:** Wireless control options
- **Emergency Backup:** Battery backup for power outages

**Certifications:**
- **UL/cUL:** Underwriters Laboratories safety certification
- **CE:** European safety compliance
- **IP Rating:** Ingress Protection (dust/water resistance)
- **IK Rating:** Impact resistance rating
- **Energy Star:** Energy efficiency certification

---

### Using Shopping Cart

#### What is the Shopping Cart?
The shopping cart allows customers to collect multiple lighting products and submit them together for pricing and availability enquiries.

#### Accessing the Shopping Cart
**Method 1:** Click the cart icon (🛒) in the top navigation bar
**Method 2:** Navigate directly to `/cart` URL
**Method 3:** Add products to cart from product detail pages

#### Understanding Cart States

**Empty Cart:**
- **Visual:** Shopping cart icon with "0" badge
- **Message:** "Your Cart is Empty" with empty cart illustration
- **Actions:** "Browse Indoor Lighting" and "Browse Outdoor Lighting" buttons
- **Suggestion:** Encourages browsing product catalogs

**Cart with Items:**
- **Header:** Shows total items count and "Clear Cart" option
- **Product List:** Each item displayed with details and controls
- **Summary Section:** Shipping options and enquiry submission

#### Managing Cart Items

**Product Display:**
Each cart item shows:
- **Product Image:** Visual representation (placeholder if no image)
- **Product Name:** Full product type name
- **Category Badges:** Indoor/Outdoor classification
- **Key Specs:** Power, size, CCT, lumen (when available)
- **Quantity Controls:** +/- buttons to adjust quantity
- **Remove Button:** Trash icon to delete item

**Quantity Management:**
1. **Adjust Quantity:** Click +/- buttons or use quantity selector
2. **Real-time Updates:** Cart total updates immediately
3. **Minimum Quantity:** Cannot go below 1 item
4. **Bulk Addition:** Add multiple quantities of same product

**Item Removal:**
1. **Individual Removal:** Click trash icon next to item
2. **Clear All:** "Clear Cart" button removes all items
3. **Confirmation:** No confirmation dialog (immediate action)

#### Understanding Cart Summary

**Shipping & Manufacturing Section:**
- **Manufacturing Time:** Always 30 days (standard lead time)
- **Shipping Options:**
  - **Air Shipping:** 15 days total delivery (30 manufacturing + 15 shipping)
  - **Boat Shipping:** 35 days total delivery (30 manufacturing + 35 shipping)
- **Selection Method:** Radio buttons for shipping preference
- **Total Display:** Shows combined manufacturing + shipping time

**Enquiry Integration:**
- **Ready Message:** Explains next steps for getting pricing
- **Submit Enquiry Button:** Primary action to proceed
- **Cart Context:** Items automatically included in enquiry form

#### Submitting Cart for Enquiry

**Enquiry Process Flow:**
```
Cart → Customer Details → Submit → Admin Review → Response
```

**Submission Steps:**
1. **Review Selection:** Verify all items and quantities
2. **Choose Shipping:** Select air or boat shipping preference
3. **Click Submit Enquiry:** Opens customer details form
4. **Fill Customer Information:** Name, email, phone, company, address
5. **Add Message:** Optional specific requirements or questions
6. **Submit Form:** Sends to both n8n webhook and local database

**Post-Submission:**
1. **Success Animation:** Visual confirmation of submission
2. **Cart Clearing:** Items removed after successful submission
3. **Email Confirmation:** Automatic confirmation sent
4. **Admin Notification:** Admin team receives enquiry for processing

#### Cart Best Practices

**For Customers:**
- Add multiple items before submitting enquiry
- Choose appropriate shipping method based on timeline needs
- Provide complete contact information for follow-up
- Include specific requirements in message field

**For Admin Users:**
- Monitor enquiry submissions in admin dashboard
- Process enquiries in order of submission
- Update enquiry status as progress made
- Maintain communication with customers

---

### Submitting Product Enquiries

#### What is an Enquiry?
An enquiry is a formal request for pricing and availability information on selected lighting products. It's the primary way customers request quotes.

#### When to Submit an Enquiry
**Typical Scenarios:**
- **Multiple Products:** When selecting several items for a project
- **Custom Requirements:** Special specifications or large quantities
- **Pricing Information:** Need detailed cost breakdown
- **Availability Check:** Confirm stock and lead times
- **Technical Questions:** Require expert consultation

#### Enquiry Form Fields Explained

**Required Fields (marked with *):**
- **Full Name:** Customer's complete name for correspondence
- **Email Address:** Primary contact method for follow-up
- **Phone Number:** Alternative contact for urgent matters

**Optional Fields:**
- **Company Name:** Business or organization name
- **Address:** Physical location for shipping calculations
- **Additional Message:** Specific requirements, questions, or project details

#### Enquiry Submission Process

**Step 1: Add Products to Cart**
1. Browse product catalogs (indoor/outdoor)
2. View product details pages
3. Click "Add to Cart" with desired quantity
4. Repeat for all needed products

**Step 2: Review Cart**
1. Click cart icon in navigation
2. Verify all items and quantities
3. Select shipping method (air/boat)
4. Click "Submit Enquiry"

**Step 3: Fill Customer Details**
```
┌─────────────────────────────────────┐
│         Product Enquiry             │
├─────────────────────────────────────┤
│ Full Name *: [John Doe           ] │
│ Email *:     [john@example.com   ] │
│ Phone *:     [+1-555-0123        ] │
│ Company:     [ABC Lighting Ltd   ] │
│ Address:     [123 Main St        ] │
│ Message:     [Project requirements] │
│                                     │
│           [Cancel] [Submit]         │
└─────────────────────────────────────┘
```

**Step 4: Submit and Confirm**
1. Click "Submit Enquiry" button
2. Form validates required fields
3. Submission sends to two systems:
   - **N8N Webhook:** External workflow automation
   - **Local Database:** Internal Supabase storage
4. Success animation displays
5. Cart automatically clears

#### Enquiry Processing Workflow

**Customer Experience:**
1. **Immediate Confirmation:** Success message and animation
2. **Email Notification:** Automatic confirmation sent
3. **Admin Processing:** Enquiry appears in admin dashboard
4. **Response Time:** Typically 24-48 hours
5. **Follow-up:** Direct communication for pricing and details

**Admin Processing:**
1. **Dashboard Notification:** New enquiry appears in admin panel
2. **Status Tracking:** Updates through workflow stages
3. **Customer Communication:** Direct email/phone follow-up
4. **Quote Preparation:** Detailed pricing and availability
5. **Order Conversion:** Track from enquiry to sale

#### Enquiry Data Storage

**Dual System Architecture:**
- **Primary Storage:** Supabase database with JSONB fields
- **Backup System:** N8N webhook for external processing
- **Fallback Protection:** If one system fails, other ensures delivery

**Stored Information:**
- **Customer Details:** All form fields in JSON format
- **Cart Items:** Complete product list with quantities
- **Shipping Preference:** Selected delivery method
- **Submission Timestamp:** Automatic date/time tracking
- **Status Tracking:** Workflow progress monitoring

#### Enquiry Status Lifecycle

**Status Progression:**
```
New → Contacted → Quoted → Won/Lost
```

**Status Meanings:**
- **New:** Just submitted, needs initial review
- **Contacted:** Initial response sent to customer
- **Quoted:** Detailed pricing provided
- **Won:** Order confirmed and processed
- **Lost:** Enquiry closed without sale

---

### User Authentication

#### What is User Authentication?
Authentication allows users to create accounts, sign in, and access personalized features like profile management and admin dashboards.

#### Account Types

**Customer Accounts:**
- **Standard Users:** Can browse products, use cart, submit enquiries
- **Feature Access:** Profile management, enquiry history
- **No Admin Access:** Cannot access admin dashboard

**Admin Accounts:**
- **Full Access:** All customer features plus admin panel
- **Management Tools:** Product management, enquiry processing
- **Special Indicators:** Admin badge and dashboard access

#### Creating a New Account (Registration)

**Access Registration:**
1. Click "Sign Up" button in top navigation
2. Navigate directly to `/register` URL
3. Registration form loads in modal dialog

**Registration Form Fields:**
```
┌─────────────────────────────────────┐
│           Create Account            │
├─────────────────────────────────────┤
│ Full Name:    [Enter full name   ] │
│ Email:        [your@email.com    ] │
│ Password:     [••••••••••••      ] │
│ Confirm:      [••••••••••••      ] │
│ Account Type: ○ Customer ○ Admin  │
│                                     │
│ Terms of Service: ☑ I agree       │
│                                     │
│         [Cancel] [Create Account]   │
└─────────────────────────────────────┘
```

**Registration Process:**
1. **Fill Form:** Enter name, email, password, confirm password
2. **Select Type:** Choose Customer or Admin account type
3. **Accept Terms:** Check agreement checkbox
4. **Submit:** Click "Create Account" button
5. **Verification:** Account created immediately (no email verification required)
6. **Auto Login:** Automatically signed in after creation

**Password Requirements:**
- Minimum 8 characters (recommended)
- Mix of letters, numbers, special characters (recommended)
- Password confirmation must match exactly

#### Signing In to Account

**Access Login:**
1. Click "Sign In" button in top navigation
2. Navigate directly to `/login` URL
3. Login form loads in modal dialog

**Login Form:**
```
┌─────────────────────────────────────┐
│             Sign In                 │
├─────────────────────────────────────┤
│ Email:       [your@email.com     ] │
│ Password:    [••••••••••••       ] │
│                                     │
│ Remember Me: ☑ Keep me signed in   │
│ Forgot Password? [Reset link]      │
│                                     │
│         [Cancel] [Sign In]          │
└─────────────────────────────────────┘
```

**Login Process:**
1. **Enter Credentials:** Type email and password
2. **Remember Option:** Check to stay logged in across sessions
3. **Submit:** Click "Sign In" button
4. **Authentication:** System verifies credentials
5. **Access Granted:** Redirected to main application

**Authentication Features:**
- **Session Persistence:** Stays logged in until sign out
- **Secure Storage:** Credentials not stored locally
- **Auto-redirect:** Returns to intended page after login

#### Authentication UI Elements

**Desktop Navigation:**
- **Unauthenticated:** "Sign In" and "Sign Up" buttons visible
- **Authenticated:** User avatar dropdown with profile options

**User Dropdown Menu:**
```
┌─────────────────────────────────────┐
│ User Avatar ▼                       │
├─────────────────────────────────────┤
│ John Doe                           │
│ john@example.com                   │
│ Account: Administrator             │
│                                    │
│ 📋 Profile                        │
│ ⚙️ Dashboard (Admin only)         │
│                                    │
│ 🚪 Sign Out                        │
└─────────────────────────────────────┘
```

**Mobile Navigation:**
- **User Icon:** Circular avatar or user icon
- **Admin Badge:** Small shield icon for admin accounts
- **Dropdown Menu:** Slide-up menu with same options

#### Sign Out Process

**Desktop Sign Out:**
1. Click user avatar in top navigation
2. Click "Sign Out" (red text)
3. Immediately signed out
4. Redirected to homepage

**Mobile Sign Out:**
1. Tap user icon in mobile navigation
2. Tap "Sign Out" in dropdown
3. Immediately signed out

**Post Sign-Out:**
- **Session Cleared:** All authentication tokens removed
- **Cart Preserved:** Shopping cart contents maintained
- **Homepage Return:** Redirected to main page

---

### Profile Management

#### What is the Profile Page?
The profile page displays user account information and provides access to account-related features and admin functionality.

#### Accessing Profile Page

**Method 1:** Click "Profile" in user dropdown menu
**Method 2:** Navigate directly to `/profile` URL
**Method 3:** Mobile: Tap "Profile" in user dropdown

**Access Requirements:**
- **Authentication Required:** Must be signed in to view
- **Redirect Protection:** Unsigned users redirected to login page

#### Profile Page Layout

**Header Section:**
- **Page Title:** "Profile" with user icon
- **Breadcrumb:** Shows navigation path
- **Account Status:** Visual indicators for account type

**Profile Information Display:**
```
┌─────────────────────────────────────────────────┐
│                    Profile                      │
├─────────────────────────────────────────────────┤
│ 👤 Account Information                          │
│                                                 │
│ Full Name:     John Smith                      │
│ Email:         john.smith@company.com          │
│ Account Type:  Administrator                    │
│ Member Since:  January 15, 2024                │
│                                                 │
│ ⚙️ Account Actions                             │
│ • Change Password                              │
│ • Admin Dashboard (Admin only)                 │
│ • Account Settings                             │
└─────────────────────────────────────────────────┘
```

#### Profile Information Fields

**Personal Information:**
- **Full Name:** Complete name as entered during registration
- **Email Address:** Primary contact email (cannot be changed here)
- **Account Type:** Customer or Administrator designation
- **Member Since:** Account creation date

**Account Status Indicators:**
- **Admin Badge:** Special indicator for admin accounts
- **Verification Status:** Future: email verification status
- **Activity Status:** Shows last login, account activity

#### Profile Actions Available

**For All Users:**
- **Change Password:** Update account password
- **Account Settings:** General account preferences
- **Logout:** Sign out from current session

**For Admin Users:**
- **Admin Dashboard:** Direct link to admin panel
- **User Management:** Access to manage other users
- **System Settings:** Administrative controls

#### Password Change Process

**Access Password Change:**
1. Click "Change Password" button on profile
2. Modal dialog opens with form fields

**Password Change Form:**
```
┌─────────────────────────────────────┐
│        Change Password              │
├─────────────────────────────────────┤
│ Current Password: [••••••••••     ] │
│ New Password:     [••••••••••     ] │
│ Confirm Password: [••••••••••     ] │
│                                     │
│        [Cancel] [Update Password]   │
└─────────────────────────────────────┘
```

**Update Process:**
1. **Enter Current:** Verify identity with existing password
2. **Set New Password:** Choose new secure password
3. **Confirm New:** Re-type new password for verification
4. **Submit:** Click "Update Password" button
5. **Confirmation:** Success message displays

**Password Requirements:**
- **Current Password:** Must match existing password
- **New Password:** Minimum 8 characters recommended
- **Confirmation:** Must exactly match new password

#### Admin Dashboard Access

**For Admin Users:**
1. **Dashboard Button:** Direct link from profile page
2. **Navigation Dropdown:** Available in user menu
3. **Quick Access:** One-click to admin panel

**Admin Features:**
- **Product Management:** Add, edit, delete products
- **Enquiry Processing:** Manage customer enquiries
- **User Management:** Oversee customer accounts
- **Analytics:** View system usage and trends
- **Settings:** System configuration options

---

## Admin-Facing Features

### Admin Dashboard Overview

#### What is the Admin Dashboard?
The admin dashboard is the central control panel for managing the lighting catalogue application, providing oversight of products, enquiries, and system status.

#### Accessing Admin Dashboard

**Authentication Required:**
- Must be signed in with admin account
- Automatic redirect if not authorized

**Access Methods:**
1. **Profile Dropdown:** Click "Dashboard" in user menu
2. **Direct URL:** Navigate to `/admin-dashboard`
3. **Profile Page:** Click "Admin Dashboard" button

#### Dashboard Layout Overview

**Header Section:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔐 Secured Admin Hub                              99.9% ✓       │
│ Welcome back, Administrator                                     │
│ Manage your entire lighting catalog, pricing workflows, and    │
│ enquiry lifecycle from a single, unified dashboard.            │
│                                                                 │
│ [Quick Add Product] [Open Data Management]                     │
└─────────────────────────────────────────────────────────────────┘
```

**Quick Stats Cards:**
- **Active Products:** Total products across indoor/outdoor catalogs
- **Pending Enquiries:** Enquiries awaiting admin response
- **Unpriced Products:** Products without pricing information
- **Recent Updates:** Changes in last 7 days

**Navigation Cards:**
Six main admin function cards arranged in responsive grid layout

#### Understanding Quick Stats

**Active Products:**
- **Count:** Total number of products in system
- **Trend:** Shows percentage change from previous period
- **Description:** "Across indoor and outdoor catalog"
- **Visual:** Dashboard icon with trend indicator

**Pending Enquiries:**
- **Count:** Number of new enquiries needing response
- **Trend:** Shows if increasing or decreasing
- **Description:** "Awaiting follow-up"
- **Visual:** Users icon with activity indicator

**Unpriced Products:**
- **Count:** Products without pricing information
- **Trend:** Stability indicator
- **Description:** "Need price assignment"
- **Visual:** Dollar sign icon

**Recent Updates:**
- **Count:** Changes in last 7 days
- **Trend:** Shows if activity increasing
- **Description:** "Changes in last 7 days"
- **Visual:** File text icon

#### Admin Tools Navigation

**Six Main Function Areas:**

1. **Data Entry**
   - **Icon:** Plus symbol
   - **Description:** "Add new lighting products to catalog"
   - **Access:** `/admin-dashboard/data-entry`
   - **Color Theme:** Blue gradient

2. **Price Entry**
   - **Icon:** Dollar sign
   - **Description:** "Set prices for products without pricing"
   - **Access:** `/admin-dashboard/price-entry`
   - **Color Theme:** Green gradient

3. **Price Variation**
   - **Icon:** Calculator
   - **Description:** "Bulk price setup with custom variations"
   - **Access:** `/admin-dashboard/price-variation`
   - **Color Theme:** Purple gradient

4. **Data Management**
   - **Icon:** Database
   - **Description:** "Manage product data with Excel-like interface"
   - **Access:** `/admin-dashboard/data-management`
   - **Color Theme:** Orange gradient

5. **Enquiry Management**
   - **Icon:** Bar chart
   - **Description:** "Track and manage customer enquiries"
   - **Access:** `/admin-dashboard/enquiry-management`
   - **Color Theme:** Teal gradient

6. **Manage Customers**
   - **Icon:** Users
   - **Description:** "View and manage customer accounts and discounts"
   - **Access:** `/admin-dashboard/manage-customers`
   - **Color Theme:** Rose gradient

#### Dashboard Activity Monitoring

**Recent Activity Section:**
- **Live Updates:** Real-time view of catalog and enquiry actions
- **Activity Feed:** Chronological list of recent changes
- **Status Indicators:** Shows current state of each activity
- **Timestamp Display:** When each activity occurred

**Activity Types:**
- **Product Updates:** New products added, existing products modified
- **Enquiry Responses:** Customer communications and status changes
- **Price Changes:** Pricing updates and variations
- **System Events:** Backups, imports, maintenance activities

#### Admin Notes Section

**Important Notifications:**
- **Price Verification:** Reminders about regional pricing requirements
- **Compliance Updates:** Certification document requirements
- **Upcoming Releases:** Information about planned features
- **System Maintenance:** Scheduled downtime or updates

#### Dashboard Security Features

**Access Control:**
- **Authentication Required:** Admin account mandatory
- **Session Management:** Secure token-based authentication
- **IP Logging:** Access tracking for security auditing
- **Failed Login Monitoring:** Security event logging

**Data Protection:**
- **SSL Encryption:** All dashboard communications encrypted
- **Database Security:** Supabase with row-level security
- **Audit Trail:** All admin actions logged for compliance

---

### Adding New Products (Data Entry)

#### What is Data Entry?
The data entry system allows administrators to add new lighting products to the catalog with comprehensive technical specifications and business information.

#### Accessing Data Entry

**From Admin Dashboard:**
1. Click "Data Entry" card on main dashboard
2. Navigate to `/admin-dashboard/data-entry`

**Direct Access:**
- URL: `/admin-dashboard/data-entry`
- Requires admin authentication

#### Understanding the Data Entry Form

**Form Organization:**
The form is divided into logical sections for better organization and user experience:

**Section 1: Basic Information**
- **Type:** Indoor or Outdoor classification
- **Product Type:** Specific category (chandelier, pendant, etc.)
- **Category:** Sub-category classification
- **Name:** Product name/title
- **Description:** Detailed product description
- **Model Number:** Manufacturer's model identifier

**Section 2: Physical Specifications**
- **Sizes:** Physical dimensions (can use comma-separated for variations)
- **Mounting:** Installation method (ceiling, wall, pendant, etc.)
- **Material/Finish:** Construction material and surface treatment
- **IP Rating:** Ingress Protection rating (weather resistance)
- **IK Rating:** Impact resistance rating

**Section 3: Electrical & Performance**
- **Voltage:** Operating voltage (120V, 240V, 12V, etc.)
- **Power (W):** Power consumption in watts
- **CCT:** Color temperature (2700K warm, 4000K cool, 5000K daylight)
- **CRI (Ra):** Color Rendering Index (90+ is excellent)
- **Lumen:** Light output brightness
- **Efficacy (lm/W):** Energy efficiency rating
- **Beam Angle:** Light distribution pattern
- **Power Factor:** Electrical efficiency metric

**Section 4: Smart Features & Controls**
- **Dimming Type:** Compatible dimming systems (0-10V, TRIAC, etc.)
- **Dimmable:** Yes/No dimming capability
- **Emergency Backup Battery:** Power failure backup option
- **Plugin Sensor:** Built-in sensor options
- **Sensor Types:** Motion, occupancy, daylight sensors
- **Remote Control:** Wireless control capability
- **Installation Kits:** Included mounting hardware

**Section 5: LED & Driver Information**
- **LED Type:** LED chip specification (SMD, COB, etc.)
- **Driver Brand:** Power supply manufacturer
- **Adjustment Dial:** Manual control options

**Section 6: Compliance & Documentation**
- **Certifications:** Safety and performance certifications
- **Lead Time:** Manufacturing and delivery time
- **Warranty:** Warranty period and terms
- **MOQ:** Minimum Order Quantity

**Section 7: Pricing & Cost**
- **Price (PC):** Retail price per piece
- **Cost (China DDP USA):** Landed cost from China
- **Cost (Thailand/Vietnam):** Alternative sourcing costs

**Section 8: Media & Documentation**
- **Photo:** Product image URL or upload
- **Image URL:** Additional product images
- **Cut Sheet:** Technical specification document

#### Using the Variation System

**What are Product Variations?**
Product variations allow creating multiple similar products from a single form submission by using comma-separated values in specific fields.

**Variation-Capable Fields:**
- **Sizes:** "small, medium, large"
- **CCT:** "2700K, 3000K, 4000K"
- **Finish:** "chrome, brass, black"
- **LED Type:** "SMD2835, SMD3030, COB"
- **Driver Brand:** "Meanwell, Philips, Osram"
- **Adjustment Dial:** "yes, no"
- **Certifications:** "UL, CE, Energy Star"

**How Variations Work:**
1. **Enter Comma-Separated Values:** "small, medium, large" in sizes field
2. **System Processing:** Creates 3 separate product entries
3. **Combination Logic:** If multiple fields have variations, creates all combinations
4. **Real-time Preview:** Shows how many products will be created
5. **Batch Creation:** All variations created simultaneously

**Variation Rules:**
- **Numeric Fields:** Single values only (voltage, power, lumen, etc.)
- **Text Fields:** Comma-separated variations allowed
- **Required Combinations:** All possible combinations created
- **Unique Identification:** Each variation gets unique ID

#### Form Submission Process

**Step 1: Fill All Required Fields**
- **Required:** Type, Product Type, Name, Model Number
- **Optional:** All other fields can be left blank
- **Validation:** Form validates before submission

**Step 2: Review Variation Count**
- **Preview:** System shows how many products will be created
- **Confirmation:** Review before final submission
- **Edit Option:** Modify fields if count is too high

**Step 3: Submit Form**
- **Processing:** System creates all product variations
- **Progress:** Loading indicator during processing
- **Success Confirmation:** Shows number of products created

**Step 4: Verify in Data Management**
- **Check Results:** View created products in data management
- **Edit if Needed:** Modify any incorrect information
- **Add Pricing:** Set prices for new products

#### Best Practices for Data Entry

**Product Information:**
- **Complete Data:** Fill all available specifications
- **Accurate Specifications:** Double-check technical details
- **Consistent Formatting:** Use standard formats for measurements
- **Clear Descriptions:** Write informative product descriptions

**Variation Management:**
- **Logical Combinations:** Create sensible product variations
- **Limited Variations:** Avoid too many combinations (max 50-100 products)
- **Clear Naming:** Use descriptive variation names
- **Testing:** Test with small variations first

**Media Management:**
- **Image Quality:** Use high-resolution product photos
- **Consistent Sizing:** Standardize image dimensions
- **Documentation:** Include cut sheets when available
- **Multiple Angles:** Show product from different views

---

### Managing Product Data

#### What is Data Management?
The data management interface provides an Excel-like table view for managing all product information in the lighting catalog.

#### Accessing Data Management

**From Admin Dashboard:**
1. Click "Data Management" card
2. Navigate to `/admin-dashboard/data-management`

**Direct Access:**
- URL: `/admin-dashboard/data-management`
- Requires admin authentication

#### Understanding the Data Table Interface

**Table Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Search Bar] [Filter] [Export] [Import] [Add Column]           │
├─────────────────────────────────────────────────────────────────┤
│ ☑ | Product Name | Type | Category | Power | Price | Status |  │
│ ☑ | LED Downlight | Indoor | Ceiling | 15W | $45.00 | Active  │
│ ☐ | Chandelier    | Indoor | Pendant | 60W | $299.00| Active  │
│ ☑ | Wall Sconce   | Outdoor| Wall    | 12W | $67.00 | Active  │
│                                                 [Edit] [Delete] │
└─────────────────────────────────────────────────────────────────┘
```

**Table Features:**
- **Column Headers:** Click to sort by that column
- **Row Selection:** Checkboxes for bulk operations
- **Pagination:** Navigate through large datasets
- **Search Functionality:** Find specific products quickly

**Data Columns:**
- **Selection:** Checkbox for row selection
- **Product Name:** Primary product identifier
- **Type:** Indoor/Outdoor classification
- **Category:** Product category (chandelier, pendant, etc.)
- **Technical Specs:** Power, voltage, CCT, lumen, etc.
- **Pricing:** Cost and retail pricing information
- **Status:** Active/Inactive product status
- **Actions:** Edit and delete buttons

#### Searching and Filtering Products

**Search Functionality:**
1. **Search Bar:** Type any text to search across all columns
2. **Real-time Results:** Results update as you type
3. **Clear Search:** X button to clear search and show all products
4. **Case Insensitive:** Search works regardless of capitalization

**Filter Options:**
1. **Column Filters:** Dropdown filters on each column header
2. **Type Filter:** Filter by Indoor/Outdoor
3. **Category Filter:** Filter by product category
4. **Status Filter:** Show only active or inactive products
5. **Price Range:** Filter by price ranges

**Advanced Filtering:**
1. **Multiple Filters:** Combine multiple filter criteria
2. **Filter Preservation:** Filters maintained during navigation
3. **Filter Reset:** Clear all filters to return to full view

#### Editing Product Information

**Individual Product Editing:**
1. **Locate Product:** Find product in table or use search
2. **Click Edit:** Click edit icon in Actions column
3. **Modal Opens:** Edit form loads in modal dialog
4. **Modify Fields:** Update any product information
5. **Save Changes:** Click save to apply updates

**Bulk Editing:**
1. **Select Multiple:** Check checkboxes for products to edit
2. **Bulk Edit Button:** Click bulk edit option
3. **Field Selection:** Choose which fields to update
4. **Apply Changes:** Update all selected products simultaneously

**Edit Form Features:**
- **Field Validation:** Required fields highlighted
- **Real-time Saving:** Auto-save drafts (optional)
- **Change Preview:** See before/after comparisons
- **Undo Option:** Cancel changes before saving

#### Adding New Products via Table

**Quick Add Feature:**
1. **Add Row Button:** Click to add new product row
2. **Inline Editing:** Edit directly in table cells
3. **Form Validation:** Required fields must be completed
4. **Save Row:** Click checkmark to save new product

**Import from File:**
1. **Import Button:** Upload CSV or Excel file
2. **Field Mapping:** Map file columns to database fields
3. **Preview Import:** Review data before importing
4. **Execute Import:** Add multiple products at once

#### Product Status Management

**Status Options:**
- **Active:** Product visible to customers
- **Inactive:** Product hidden from customers
- **Draft:** Product being prepared (not visible)

**Status Changes:**
1. **Individual Toggle:** Click status button on product row
2. **Bulk Status Change:** Select multiple products and change status
3. **Immediate Effect:** Status changes apply instantly

**Status Best Practices:**
- **Hide Incomplete Products:** Set to inactive until all info complete
- **Seasonal Products:** Activate/deactivate based on demand
- **Discontinued Items:** Mark as inactive rather than deleting

#### Data Export and Backup

**Export Options:**
1. **CSV Export:** Download table data as CSV file
2. **Excel Export:** Download as Excel spreadsheet
3. **Filtered Export:** Export only filtered results
4. **Complete Export:** Export all products and fields

**Export Process:**
1. **Select Format:** Choose CSV or Excel
2. **Apply Filters:** Set any desired filters first
3. **Download:** File downloads automatically
4. **File Contents:** Includes all visible columns and rows

#### Table Navigation and Performance

**Pagination:**
- **Page Size:** Choose 10, 25, 50, or 100 items per page
- **Page Navigation:** Previous/Next and page number buttons
- **Total Count:** Shows total number of products

**Performance Features:**
- **Virtual Scrolling:** Handles large datasets efficiently
- **Lazy Loading:** Loads data as needed
- **Caching:** Remembers search and filter settings
- **Responsive Design:** Adapts to different screen sizes

---

### Setting Product Prices

#### What is Price Entry?
The price entry system allows administrators to set pricing information for products that don't have prices assigned yet.

#### Accessing Price Entry

**From Admin Dashboard:**
1. Click "Price Entry" card on dashboard
2. Navigate to `/admin-dashboard/price-entry`

**Direct Access:**
- URL: `/admin-dashboard/price-entry`
- Shows products without pricing

#### Understanding Price Entry Interface

**Product List View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Products Needing Pricing (15 items)                         │
├─────────────────────────────────────────────────────────────┤
│ Product Name       | Category | Current Price | Set Price    │
│ LED Downlight 15W  | Ceiling  | Not Set       | [   $45.00]  │
│ Crystal Chandelier | Pendant  | Not Set       | [  $299.00]  │
│ Outdoor Wall Sconce| Wall     | Not Set       | [   $67.00]  │
│                                                 [Save All]   │
└─────────────────────────────────────────────────────────────┘
```

**Interface Elements:**
- **Product Count:** Shows total products needing pricing
- **Product Information:** Name, category, current price status
- **Price Input:** Text field for entering price amount
- **Save Options:** Individual save or bulk save all

#### Setting Individual Prices

**Step-by-Step Process:**
1. **Locate Product:** Find specific product in list
2. **Enter Price:** Click in price field and type amount
3. **Include Currency:** Add $ symbol if desired (optional)
4. **Decimal Places:** Use .00 format for cents
5. **Save Price:** Click save button or press Enter

**Price Validation:**
- **Numeric Only:** Only numbers and decimal point allowed
- **Positive Values:** Prices must be greater than 0
- **Reasonable Range:** System may warn about unusually high/low prices

**Price Format Examples:**
- **Standard:** 45.00, 299.00, 67.50
- **Whole Numbers:** 45, 299, 68
- **With Currency:** $45.00, $299.00

#### Bulk Price Assignment

**Select Multiple Products:**
1. **Checkbox Selection:** Check boxes for products to price
2. **Select All:** Check header box to select all products
3. **Range Selection:** Shift+click for continuous selection

**Apply Bulk Pricing:**
1. **Bulk Price Button:** Click "Set Bulk Price" option
2. **Enter Price:** Type price to apply to all selected
3. **Confirm Application:** Review and confirm changes
4. **Apply Prices:** All selected products updated simultaneously

**Bulk Pricing Strategies:**
- **Category Pricing:** Same price for all products in category
- **Cost-Plus Pricing:** Apply standard markup to cost
- **Competitive Pricing:** Match market rates for similar products

#### Price Templates and Rules

**Pricing Templates:**
- **Cost Plus Markup:** Automatically add percentage to cost
- **Category Standards:** Standard pricing for product types
- **Regional Pricing:** Different prices for different markets

**Pricing Rules:**
1. **Minimum Margin:** Ensure minimum profit margin
2. **Maximum Discount:** Prevent prices below threshold
3. **Competitive Matching:** Match competitor pricing
4. **Volume Discounts:** Reduced pricing for large quantities

#### Price Verification and Quality Control

**Verification Steps:**
1. **Review All Prices:** Check each price before finalizing
2. **Compare Similar Products:** Ensure consistent pricing
3. **Check Cost Basis:** Verify prices against acquisition costs
4. **Market Research:** Compare against competitor pricing

**Quality Checks:**
- **Reasonable Pricing:** Prices should make business sense
- **Consistent Format:** All prices in same format
- **Complete Coverage:** No products left without pricing
- **Error Detection:** System highlights potential pricing errors

#### Saving and Confirming Prices

**Save Options:**
- **Individual Save:** Save each price as entered
- **Bulk Save:** Save all prices at once
- **Auto-Save:** Optional automatic saving as you type

**Confirmation Process:**
1. **Validation:** System checks all price entries
2. **Error Reporting:** Shows any invalid price entries
3. **Success Message:** Confirms successful price updates
4. **Database Update:** All prices saved to database

**Post-Save Actions:**
- **Dashboard Update:** Price entry count decreases
- **Product Status:** Products now have pricing information
- **Customer Visibility:** Priced products can be quoted to customers

---

### Managing Price Variations

#### What are Price Variations?
Price variations allow setting different prices for different product configurations, sizes, or market conditions.

#### Accessing Price Variations

**From Admin Dashboard:**
1. Click "Price Variation" card
2. Navigate to `/admin-dashboard/price-variation`

**Direct Access:**
- URL: `/admin-dashboard/price-variation`
- Requires admin authentication

#### Understanding Price Variation Types

**Variation Categories:**

1. **Size-Based Variations**
   - Different prices for different sizes
   - Example: Small ($45), Medium ($67), Large ($89)

2. **Regional Variations**
   - Different prices for different markets
   - Example: Domestic ($50), International ($55)

3. **Quantity-Based Variations**
   - Volume discount pricing
   - Example: 1-10 units ($50), 11-50 units ($45)

4. **Feature-Based Variations**
   - Different prices based on features
   - Example: Standard ($50), Premium ($65)

#### Setting Up Price Variations

**Step 1: Select Base Product**
1. **Choose Product:** Select product to create variations for
2. **View Current Pricing:** See existing price if any
3. **Variation Options:** Choose type of variation to create

**Step 2: Define Variation Rules**
1. **Variation Criteria:** Select field that creates variations (size, region, etc.)
2. **Value Options:** Enter possible values for that field
3. **Price Differences:** Set price adjustment for each variation

**Step 3: Apply Variations**
1. **Preview Changes:** See how prices will be affected
2. **Confirm Application:** Apply variations to product
3. **Save Variations:** Store variation rules in database

#### Variation Management Interface

**Variation Builder:**
```
┌─────────────────────────────────────────────────────────────┐
│ Price Variation Builder                                     │
├─────────────────────────────────────────────────────────────┤
│ Base Product: LED Downlight 15W                            │
│ Current Price: $45.00                                       │
│                                                             │
│ Variation Type: Size                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Size Variations:                                        │ │
│ │ Small (8"): $39.00 (-$6.00)                            │ │
│ │ Medium (10"): $45.00 (base price)                       │ │
│ │ Large (12"): $52.00 (+$7.00)                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Apply Variations] [Cancel]              │
└─────────────────────────────────────────────────────────────┘
```

**Bulk Variation Application:**
1. **Select Multiple Products:** Choose products for variation
2. **Apply Same Rules:** Use same variation logic across products
3. **Batch Processing:** Apply variations to all selected products

#### Dynamic Pricing Rules

**Rule-Based Pricing:**
1. **Condition Setup:** Define when rules apply
2. **Action Definition:** What happens when conditions met
3. **Priority Order:** Set which rules take precedence

**Example Rules:**
- **IF size = "large" THEN price = base_price * 1.15**
- **IF quantity > 50 THEN price = base_price * 0.90**
- **IF region = "international" THEN price = base_price * 1.10**

#### Variation Templates

**Predefined Templates:**
- **Standard Markup:** Cost + 40% markup
- **Volume Discount:** Quantity-based price reductions
- **Regional Adjustment:** Market-specific pricing
- **Feature Premium:** Additional cost for premium features

**Template Application:**
1. **Select Template:** Choose appropriate pricing template
2. **Customize Rules:** Modify template for specific needs
3. **Apply Template:** Use across multiple products

#### Variation Monitoring and Updates

**Performance Tracking:**
- **Variation Usage:** Track which variations are popular
- **Price Effectiveness:** Monitor conversion rates by price point
- **Margin Analysis:** Track profitability of different variations

**Update Process:**
1. **Review Performance:** Analyze variation effectiveness
2. **Modify Rules:** Adjust pricing based on performance
3. **Apply Changes:** Update variation rules
4. **Monitor Impact:** Track changes in sales and margins

---

### Managing Customer Enquiries

#### What is Enquiry Management?
The enquiry management system allows administrators to track, process, and respond to customer enquiries for product pricing and availability.

#### Accessing Enquiry Management

**From Admin Dashboard:**
1. Click "Enquiry Management" card
2. Navigate to `/admin-dashboard/enquiry-management`

**Direct Access:**
- URL: `/admin-dashboard/enquiry-management`
- Shows all customer enquiries

#### Understanding Enquiry Dashboard

**Enquiry List View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Enquiries (12 total)                               │
├─────────────────────────────────────────────────────────────┤
│ Customer | Date | Products | Status | Priority | Actions     │
│ John Doe | Jan 15 | 3 items | New | High | [View] [Respond] │
│ ABC Corp| Jan 14 | 8 items | Quoted| Medium|[View] [Update] │
│ Jane S  | Jan 13 | 2 items | Won   | Low  | [View] [Archive]│
└─────────────────────────────────────────────────────────────┘
```

**Dashboard Sections:**
- **Enquiry Count:** Total number of enquiries
- **Status Breakdown:** Visual chart of enquiry statuses
- **Recent Activity:** Latest enquiry updates
- **Search/Filter:** Find specific enquiries

#### Enquiry Status Workflow

**Status Progression:**
```
New → Contacted → Quoted → Won/Lost
```

**Status Definitions:**
- **New:** Just submitted, initial review needed
- **Contacted:** Initial response sent to customer
- **Quoted:** Detailed pricing provided to customer
- **Won:** Customer confirmed order
- **Lost:** Enquiry closed without sale

**Status Change Process:**
1. **Select Enquiry:** Click on enquiry row or View button
2. **Status Dropdown:** Choose new status
3. **Add Notes:** Optional internal notes about status change
4. **Save Update:** Apply status change

#### Processing Individual Enquiries

**Step 1: Review Enquiry Details**
1. **Click View:** Open detailed enquiry view
2. **Customer Information:** Review contact details
3. **Product List:** See requested products and quantities
4. **Special Requests:** Check for specific requirements

**Step 2: Prepare Response**
1. **Gather Information:** Collect pricing and availability data
2. **Calculate Quote:** Determine total pricing
3. **Check Inventory:** Verify product availability
4. **Timeline Estimate:** Provide delivery timeframes

**Step 3: Contact Customer**
1. **Update Status:** Change to "Contacted"
2. **Send Response:** Email or call customer with information
3. **Document Communication:** Add notes about conversation
4. **Follow-up Plan:** Schedule next contact if needed

**Step 4: Close Enquiry**
1. **Final Status:** Mark as "Won" or "Lost"
2. **Archive Option:** Move to archive for completed enquiries
3. **Reporting:** Update sales pipeline if won

#### Enquiry Details View

**Customer Information Section:**
- **Contact Details:** Name, email, phone, company
- **Submission Date:** When enquiry was submitted
- **Shipping Preference:** Air or boat shipping selected

**Requested Products Section:**
- **Product List:** All items in customer's enquiry
- **Quantities:** How many of each product requested
- **Specifications:** Technical details for each product
- **Total Items:** Sum of all quantities

**Communication History:**
- **Status Timeline:** All status changes with timestamps
- **Internal Notes:** Admin notes about enquiry
- **Customer Communications:** Record of all customer contacts

#### Bulk Enquiry Management

**Select Multiple Enquiries:**
1. **Checkbox Selection:** Check multiple enquiry rows
2. **Bulk Actions:** Apply same action to all selected
3. **Status Updates:** Change status for multiple enquiries
4. **Archive Option:** Move completed enquiries to archive

**Bulk Action Options:**
- **Status Change:** Update status for multiple enquiries
- **Priority Assignment:** Set priority levels
- **Archive:** Move to completed enquiries section
- **Export:** Download enquiry data

#### Enquiry Analytics and Reporting

**Performance Metrics:**
- **Response Time:** Average time to respond to enquiries
- **Conversion Rate:** Percentage of enquiries that become orders
- **Popular Products:** Most frequently requested items
- **Customer Trends:** Repeat customers and buying patterns

**Reporting Features:**
- **Date Range Reports:** Filter by submission date
- **Status Reports:** Breakdown by enquiry status
- **Product Reports:** Most requested products
- **Customer Reports:** Enquiry activity by customer

#### Enquiry Communication Tools

**Response Templates:**
- **Standard Responses:** Pre-written responses for common scenarios
- **Personalization:** Customize templates with customer details
- **Template Library:** Save frequently used responses

**Communication Tracking:**
- **Response History:** All communications logged
- **Follow-up Reminders:** Set reminders for pending actions
- **Escalation Rules:** Automatic escalation for high-priority enquiries

---

### Managing Customer Accounts

#### What is Customer Management?
The customer management system allows administrators to view, edit, and manage customer account information and preferences.

#### Accessing Customer Management

**From Admin Dashboard:**
1. Click "Manage Customers" card
2. Navigate to `/admin-dashboard/manage-customers`

**Direct Access:**
- URL: `/admin-dashboard/manage-customers`
- Shows all registered customers

#### Understanding Customer List

**Customer Table View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Customer Management (156 customers)                          │
├─────────────────────────────────────────────────────────────┤
│ Name | Email | Company | Type | Status | Last Login | Actions│
│ John Doe | john@email.com | ABC Corp | Customer | Active | Jan 15 │
│ Jane Smith | jane@company.com | XYZ Ltd | Customer | Active | Jan 14 │
│ Mike Johnson | mike@business.com | PQR Inc | Admin | Active | Jan 15 │
└─────────────────────────────────────────────────────────────┘
```

**Table Columns:**
- **Name:** Customer's full name
- **Email:** Primary email address
- **Company:** Associated company or organization
- **Type:** Customer or Administrator account type
- **Status:** Active/Inactive account status
- **Last Login:** Most recent login date
- **Actions:** Edit, view, disable options

#### Viewing Customer Details

**Detailed Customer Profile:**
1. **Click Customer Name:** Open detailed view
2. **Complete Information:** All customer data displayed
3. **Account History:** Login history and activity
4. **Enquiry History:** Previous enquiries and status

**Customer Information Fields:**
- **Personal Details:** Name, email, phone, address
- **Company Information:** Business name, industry, size
- **Account Settings:** Preferences, notification settings
- **Admin Notes:** Internal notes about customer

#### Editing Customer Information

**Edit Process:**
1. **Select Customer:** Click edit button or customer name
2. **Modify Fields:** Update any customer information
3. **Field Validation:** Ensure email format is valid
4. **Save Changes:** Apply updates to customer record

**Editable Fields:**
- **Contact Information:** Name, phone, address
- **Company Details:** Company name, position, industry
- **Account Settings:** Notification preferences, language
- **Admin Notes:** Internal customer notes

**Edit Restrictions:**
- **Email Changes:** May require verification
- **Password Changes:** Cannot edit customer passwords
- **Account Type:** Can upgrade to admin but not downgrade

#### Customer Status Management

**Status Options:**
- **Active:** Customer can sign in and use features
- **Inactive:** Customer account disabled
- **Suspended:** Temporary suspension for policy violations

**Status Change Process:**
1. **Select Customer:** Choose customer to modify
2. **Choose New Status:** Select appropriate status
3. **Add Reason:** Note reason for status change
4. **Apply Change:** Update customer status

**Status Change Effects:**
- **Active → Inactive:** Customer cannot sign in
- **Inactive → Active:** Customer access restored
- **Suspension:** Temporary access restriction

#### Customer Analytics

**Customer Metrics:**
- **Total Customers:** Count of registered users
- **Active Users:** Customers who logged in recently
- **Admin Users:** Number of administrator accounts
- **New Registrations:** Recent account creation trends

**Activity Tracking:**
- **Login Frequency:** How often customers use the system
- **Feature Usage:** Which features customers use most
- **Enquiry Patterns:** Types of products customers inquire about
- **Geographic Distribution:** Customer locations

#### Customer Communication Tools

**Bulk Messaging:**
1. **Select Customers:** Choose customers to message
2. **Message Template:** Use predefined message templates
3. **Personalization:** Customize messages with customer data
4. **Send Message:** Deliver to all selected customers

**Message Types:**
- **Product Updates:** New product announcements
- **Promotional Offers:** Special pricing or discounts
- **System Updates:** Platform changes or maintenance
- **Personalized Outreach:** Individual customer communications

#### Customer Segmentation

**Segmentation Criteria:**
- **Account Type:** Customer vs Administrator
- **Activity Level:** Active, inactive, new users
- **Purchase History:** Based on enquiry and order history
- **Company Size:** Small business, enterprise, individual
- **Geographic Location:** Regional customer groupings

**Segment Applications:**
- **Targeted Marketing:** Send relevant offers to segments
- **Support Prioritization:** Focus on high-value customers
- **Feature Rollout:** Test new features with specific segments
- **Communication Strategy:** Tailor messages to segment needs

---

### Creating and Managing Coupons

#### Current Status Note
**Important:** The coupon system is currently discontinued but can be revived if needed. The feature exists in the codebase but is disabled. Contact system administrator to reactivate the coupon system when required.

#### Coupon System Features (When Active)

**Coupon Management Interface:**
1. **Coupon List:** View all existing coupons
2. **Create New:** Add new discount codes
3. **Edit Existing:** Modify coupon details
4. **Delete Coupons:** Remove expired or unused coupons

**Coupon Information:**
- **Coupon Code:** Unique identifier (e.g., "SAVE10", "WELCOME20")
- **Discount Type:** Percentage-based discount
- **Discount Amount:** Positive for discount, negative for surcharge
- **Expiry Date:** When coupon becomes invalid
- **Usage Limits:** Maximum number of uses
- **Minimum Order:** Minimum purchase amount required

**Coupon Creation Process:**
1. **Access Coupon Entry:** Navigate to coupon management page
2. **Enter Code:** Create unique coupon identifier
3. **Set Discount:** Define discount percentage
4. **Configure Rules:** Set expiry, limits, and requirements
5. **Save Coupon:** Store in database for use

**Customer Coupon Experience:**
1. **Cart Integration:** Enter coupon code in cart
2. **Validation:** System checks coupon validity
3. **Discount Application:** Price reduction applied
4. **Expiry Checking:** Expired coupons rejected

---

## Pending/Future Features

### Analytics Implementation

#### Current Status
Analytics feature not yet implemented. Planning stage for user behavior tracking and performance metrics.

#### Planned Features
- **User Journey Analytics:** Track how customers navigate the site
- **Product Popularity Metrics:** Identify best-selling product categories
- **Conversion Rate Tracking:** Monitor enquiry-to-sale conversion
- **Geographic Usage Patterns:** Understand customer locations
- **Performance Monitoring:** Site speed and user experience metrics

#### Implementation Plan
1. **Install Analytics Service:** Google Analytics or similar platform
2. **Add Tracking Code:** Implement across all pages
3. **Configure Event Tracking:** Monitor key user actions
4. **Set Up Conversion Goals:** Track successful enquiries
5. **Create Dashboard:** View metrics and insights

### Server Hosting Setup

#### Current Status
Application runs in development mode locally. Production hosting not yet configured.

#### Hosting Options
- **Vercel:** Recommended for Next.js applications
- **AWS Amplify:** Full-featured hosting platform
- **Netlify:** Static site hosting with dynamic capabilities
- **Digital Ocean:** VPS hosting for more control
- **Traditional VPS:** Custom server configuration

#### Deployment Steps
1. **Choose Provider:** Select appropriate hosting platform
2. **Configure Domain:** Set up custom domain and SSL
3. **Environment Variables:** Configure production settings
4. **Deploy Code:** Upload application to hosting
5. **CDN Setup:** Configure content delivery network

### Domain Configuration

#### Current Status
No custom domain configured. Application accessible via localhost or IP address.

#### Domain Setup Process
1. **Purchase Domain:** Register domain name with registrar
2. **DNS Configuration:** Point domain to hosting provider
3. **SSL Certificate:** Set up HTTPS encryption
4. **Subdomain Setup:** Configure admin and API subdomains
5. **Email Configuration:** Set up domain email if needed

### Manual Testing Procedures

#### Current Status
No formal testing procedures documented. Basic functionality testing during development.

#### Testing Categories
- **User Interface Testing:** Visual design and responsiveness
- **Functionality Testing:** Core feature operation
- **Cross-browser Compatibility:** Chrome, Firefox, Safari, Edge
- **Mobile Responsiveness:** Phone and tablet testing
- **Performance Testing:** Load times and optimization
- **Security Testing:** Authentication and data protection

#### Testing Checklist
- User registration and login flows
- Product browsing and search functionality
- Shopping cart operations
- Enquiry submission process
- Admin dashboard access and features
- Data entry and management tools
- Mobile device compatibility

### Fresh Dataset Creation

#### Current Status
Sample data exists but limited. Need comprehensive product catalog with realistic information.

#### Dataset Requirements
- **Complete Indoor Catalog:** All indoor lighting categories
- **Complete Outdoor Catalog:** All outdoor lighting categories
- **Realistic Specifications:** Accurate technical data
- **Proper Categorization:** Organized product hierarchy
- **Sample Media:** Product images and documentation

#### Implementation Steps
1. **Data Collection:** Gather product information from manufacturers
2. **Standardization:** Create consistent data formats
3. **Variation Creation:** Generate product variations
4. **Media Addition:** Include images and documents
5. **Database Import:** Load data into system
6. **Quality Verification:** Ensure data accuracy

### Customer Pricing Display

#### Current Status
Pricing not visible to customers. Need three-tier pricing system implementation.

#### Required Price Structure
- **Cost Price:** Internal cost (not shown to customers)
- **Standard Retail Price:** Regular selling price
- **Discounted/Promotional Price:** Sale or special pricing

#### Implementation Plan
1. **Database Schema:** Add price fields to product structure
2. **Management Interface:** Create pricing administration tools
3. **Display Logic:** Show appropriate prices to customers
4. **Dynamic Rules:** Implement pricing variation logic
5. **Admin Controls:** Easy price management interface

---

## Support and Troubleshooting

### Common Issues and Solutions

**Page Loading Problems:**
- **Issue:** Page not loading or very slow
- **Causes:** Internet connection, browser cache, server issues
- **Solutions:**
  - Check internet connection
  - Clear browser cache and cookies
  - Try different browser
  - Contact administrator if persists

**Login Issues:**
- **Issue:** Cannot sign in to account
- **Causes:** Wrong credentials, account issues, browser problems
- **Solutions:**
  - Verify email and password
  - Reset password if forgotten
  - Clear browser data
  - Check account status with admin

**Cart Problems:**
- **Issue:** Items not adding to cart or cart not updating
- **Causes:** JavaScript disabled, browser cache, session issues
- **Solutions:**
  - Enable JavaScript in browser
  - Refresh page and try again
  - Clear browser cache
  - Check if signed in properly

**Enquiry Submission Failures:**
- **Issue:** Enquiry form not submitting
- **Causes:** Form validation, network issues, server problems
- **Solutions:**
  - Check all required fields completed
  - Verify internet connection
  - Try submitting again
  - Check browser console for errors

**Admin Dashboard Access:**
- **Issue:** Cannot access admin features
- **Causes:** Not signed in, insufficient permissions, account type
- **Solutions:**
  - Verify admin account credentials
  - Check if signed in as administrator
  - Contact system admin for access

### Getting Help

**Support Channels:**
1. **System Administrator:** Primary contact for technical issues
2. **Documentation:** Refer to this SOP document
3. **Browser Console:** Check for JavaScript errors
4. **Network Tools:** Use browser dev tools for debugging

**Reporting Issues:**
1. **Describe Problem:** Clear explanation of what's not working
2. **Steps to Reproduce:** How to trigger the issue
3. **Expected Behavior:** What should happen instead
4. **Environment Details:** Browser, device, error messages

### System Maintenance

**Regular Tasks:**
- **Data Backups:** Automated daily backups of all data
- **System Updates:** Regular application and security updates
- **Performance Monitoring:** Track site speed and uptime
- **Security Scans:** Regular vulnerability assessments

**Maintenance Schedule:**
- **Daily:** Automated backups and monitoring
- **Weekly:** Performance review and optimization
- **Monthly:** Security updates and feature reviews
- **Quarterly:** Major updates and system audits

**Emergency Procedures:**
1. **System Outage:** Immediate administrator notification
2. **Data Loss:** Restore from most recent backup
3. **Security Breach:** Isolate system and investigate
4. **Performance Issues:** Scale resources or optimize code

---

*This document last updated: October 2025*
*For internal company use only*
*Document Version: 2.0 - Comprehensive Edition*

## Table of Contents

### User-Facing Features
1. [Homepage Navigation](#homepage-navigation)
2. [Browsing Indoor Lighting Products](#browsing-indoor-lighting-products)
3. [Browsing Outdoor Lighting Products](#browsing-outdoor-lighting-products)
4. [Viewing Product Details](#viewing-product-details)
5. [Using Shopping Cart](#using-shopping-cart)
6. [Submitting Product Enquiries](#submitting-product-enquiries)
7. [User Authentication](#user-authentication)
8. [Profile Management](#profile-management)

### Admin-Facing Features
9. [Admin Dashboard Overview](#admin-dashboard-overview)
10. [Adding New Products (Data Entry)](#adding-new-products-data-entry)
11. [Managing Product Data](#managing-product-data)
12. [Setting Product Prices](#setting-product-prices)
13. [Managing Price Variations](#managing-price-variations)
14. [Managing Customer Enquiries](#managing-customer-enquiries)
15. [Managing Customer Accounts](#managing-customer-accounts)
16. [Creating and Managing Coupons](#creating-and-managing-coupons)

### Pending/Future Features
17. [Analytics Implementation](#analytics-implementation)
18. [Server Hosting Setup](#server-hosting-setup)
19. [Domain Configuration](#domain-configuration)
20. [Manual Testing Procedures](#manual-testing-procedures)
21. [Fresh Dataset Creation](#fresh-dataset-creation)
22. [Customer Pricing Display](#customer-pricing-display)

#### Accessing the Homepage
Open web browser
Go to application URL
Homepage loads automatically

#### Understanding Homepage Layout
See two main sections
Indoor Lighting card on left side
Outdoor Lighting card on right side
Each card shows category description
Click card to browse products

#### Using Homepage Features
Animated background with grid pattern
Main title shows Illuminate Your Space
Click Indoor Lighting to see indoor products
Click Outdoor Lighting to see outdoor products

---

### Browsing Indoor Lighting Products

#### Accessing Indoor Products
From homepage click Indoor Lighting card
Or go directly to /indoor URL
Page loads with all indoor categories

#### Using Category Navigation
Left sidebar shows all indoor categories
Click category name to jump to section
Categories include chandeliers, pendants, ceiling lights
Each category shows product types available

#### Viewing Products by Category
Scroll down to see all categories
Each category has header with icon
Shows category name and description
Grid of product types under each category
Click product type card to see specific products

#### Understanding Product Cards
Each product type shows sample image
Product name and brief description
Click card to view all products of that type

---

### Browsing Outdoor Lighting Products

#### Accessing Outdoor Products
From homepage click Outdoor Lighting card
Or go directly to /outdoor URL
Page loads with all outdoor categories

#### Using Category Navigation
Left sidebar shows all outdoor categories
Click category name to jump to section
Categories include landscape, security, wall lights
Each category shows product types available

#### Viewing Products by Category
Scroll down to see all categories
Each category has header with icon
Shows category name and description
Grid of product types under each category
Click product type card to see specific products

#### Understanding Product Cards
Each product type shows sample image
Product name and brief description
Click card to view all products of that type

---

### Viewing Product Details

#### Accessing Product Details
From category page click product type card
Page loads with all products of that type
Or use search to find specific products

#### Understanding Product Information
Each product shows detailed specifications
Technical details like power, voltage, CCT
Physical specifications like size, mounting
Additional features like dimming, sensors
Images and documentation links

#### Using Product Actions
Add to cart button for selection
View technical specifications
Download cut sheets if available
Compare similar products

---

### Using Shopping Cart

#### Accessing Shopping Cart
Click cart icon in top navigation
Or go to /cart URL directly
Shows all added products

#### Managing Cart Items
See list of selected products
Each item shows product details and image
Use quantity selector to change amounts
Remove button to delete items
Clear cart button to remove everything

#### Understanding Cart Summary
Shows total number of items
Displays product quantities and types
Ready to submit enquiry message
Submit enquiry button at bottom

#### Using Shipping Options
Choose between air shipping (15 days)
Or boat shipping (35 days)
Total delivery time calculated automatically
Manufacturing time (30 days) added to shipping

#### Submitting Cart Enquiry
Click Submit Enquiry button
Fill customer details form
System sends enquiry to admin team
Cart clears after successful submission

---

### Submitting Product Enquiries

#### When to Use Enquiry Form
After adding products to cart
For custom pricing requests
To get availability information
For technical questions

#### Filling Enquiry Form
Customer name and contact details
Company information if business
Project details and requirements
Specific questions or requests
Cart items included automatically

#### Understanding Enquiry Process
Form submits to admin dashboard
Admin reviews and responds
Customer receives confirmation
Admin follows up with pricing

---

### User Authentication

#### Creating New Account
Click Sign Up button in navigation
Fill registration form
Enter email and password
Confirm email address
Account created immediately

#### Signing In to Account
Click Sign In button in navigation
Enter email and password
Click login button
Access granted to protected features

#### Using Authentication Features
Profile dropdown shows user name
Access to admin features if admin user
Sign out option available
Password reset if forgotten

---

### Profile Management

#### Accessing Profile Page
Click profile link in user dropdown
Or go to /profile URL
Shows account information

#### Viewing Profile Information
Full name and email address
Account type (admin or customer)
Member since date
Account status information

#### Using Profile Features
View account details
Access admin dashboard if admin
Change password option
Update contact information

---

## Admin-Facing Features

### Admin Dashboard Overview

#### Accessing Admin Dashboard
Sign in with admin account
Go to /admin-dashboard URL
Or click Admin Dashboard in profile menu

#### Understanding Dashboard Layout
Header shows Welcome Administrator
System health indicator (99.9%)
Quick stats cards with key metrics
Navigation cards for different admin tools

#### Using Quick Stats
Active Products count across catalog
Pending Enquiries awaiting response
Unpriced Products needing pricing
Recent Updates in last 7 days

#### Accessing Admin Tools
Six main navigation cards available
Click any card to access that feature
Each card shows description and icon
Protected access for admin users only

---

### Adding New Products (Data Entry)

#### Accessing Data Entry
From admin dashboard click Data Entry card
Or go to /admin-dashboard/data-entry URL
Form loads with all product fields

#### Understanding Product Fields
Three main sections of fields
Basic Information (type, category, name)
Technical Specifications (power, voltage, etc.)
Business Details (pricing, lead time, etc.)

#### Filling Basic Information
Select indoor or outdoor type
Choose product category
Enter product name and description
Add model number for reference

#### Adding Technical Specifications
Enter power consumption in watts
Set voltage requirements
Choose color temperature (CCT)
Add CRI rating and lumen output
Specify beam angle and power factor

#### Adding Product Features
Select dimming type if applicable
Choose LED type and driver brand
Add material finish options
Include certifications and ratings

#### Setting Business Details
Enter lead time for manufacturing
Set warranty period
Minimum order quantity
Cost information for different regions

#### Adding Media Files
Upload product photo
Add cut sheet document
Include additional image URLs
Set IP and IK ratings if applicable

#### Using Variation System
Add comma-separated values in fields
System creates multiple product variants
Example: sizes "small, medium, large"
Creates three separate product entries

#### Submitting Product Data
Click submit button to save
System processes variations automatically
Success message shows products created
Check data management to verify

---

### Managing Product Data

#### Accessing Data Management
From admin dashboard click Data Management card
Or go to /admin-dashboard/data-management URL
Excel-like interface loads

#### Understanding Data Table
Rows show individual products
Columns show all product fields
Sort by any column header
Filter to find specific products

#### Editing Product Information
Click edit button on any product
Modal opens with current data
Make changes to any field
Save to update product

#### Using Bulk Operations
Select multiple products with checkboxes
Apply changes to all selected
Bulk update specific fields
Export data to Excel format

#### Searching Products
Use search bar to find products
Search by name, model, or category
Filter by indoor/outdoor type
Quick access to specific items

---

### Setting Product Prices

#### Accessing Price Entry
From admin dashboard click Price Entry card
Or go to /admin-dashboard/price-entry URL
Shows products without pricing

#### Understanding Price Interface
List of products needing prices
Each product shows current information
Price input field for each product
Save button to apply pricing

#### Setting Individual Prices
Click in price field
Enter price amount
Include currency if needed
Save to apply to product

#### Using Price Templates
Apply standard pricing rules
Set prices based on cost plus margin
Bulk price assignment available
Verify all products have pricing

---

### Managing Price Variations

#### Accessing Price Variations
From admin dashboard click Price Variation card
Or go to /admin-dashboard/price-variation URL
Bulk pricing interface loads

#### Understanding Variation System
Set different prices for product variants
Apply pricing rules across categories
Bulk update multiple products
Custom pricing strategies

#### Setting Variation Rules
Define price differences by size
Set regional pricing variations
Apply discount structures
Create pricing tiers

#### Applying Bulk Changes
Select product groups for pricing
Apply percentage increases or decreases
Set absolute price amounts
Review changes before applying

---

### Managing Customer Enquiries

#### Accessing Enquiry Management
From admin dashboard click Enquiry Management card
Or go to /admin-dashboard/enquiry-management URL
Shows all customer enquiries

#### Understanding Enquiry Dashboard
List of all submitted enquiries
Status tracking for each enquiry
Customer details and contact information
Cart items included in enquiry

#### Processing Enquiries
Review enquiry details
Check requested products
Update enquiry status
Assign to team members if needed

#### Enquiry Status Tracking
New - just received
Contacted - initial response sent
Quoted - pricing provided
Won - order confirmed
Lost - enquiry closed

#### Responding to Enquiries
Click details to see full enquiry
Contact customer with information
Provide pricing and availability
Update status as progress made

---

### Managing Customer Accounts

#### Accessing Customer Management
From admin dashboard click Manage Customers card
Or go to /admin-dashboard/manage-customers URL
Shows all registered customers

#### Understanding Customer Data
List of all user accounts
Contact information for each customer
Account type and registration date
Order history if available

#### Viewing Customer Details
Click on customer name for details
See full contact information
View account activity
Check any special pricing

#### Managing Customer Information
Update customer contact details
Assign special pricing tiers
Add notes for account management
Track customer preferences

---

### Creating and Managing Coupons

#### Current Status Note
**Important:** The coupon system is currently discontinued but can be revived if needed. The feature exists in the codebase but is disabled. Contact system administrator to reactivate the coupon system when required.

#### Accessing Coupon Management
From admin dashboard click Coupon Entry card
Or go to /admin-dashboard/coupon-entry URL
Coupon management interface loads

#### Understanding Coupon System
Create discount codes for customers
Set percentage-based discounts
Configure expiry dates
Track coupon usage

#### Creating New Coupons
Enter coupon code name
Set discount percentage
Choose positive for discount, negative for surcharge
Set expiry date for coupon

#### Managing Existing Coupons
View all active coupons
Edit coupon details if needed
Delete expired coupons
Track coupon performance

#### Setting Coupon Rules
Define usage restrictions
Set minimum order amounts
Limit to specific products or categories
Configure customer eligibility

---

## Support and Troubleshooting

### Common Issues and Solutions

**Page Loading Problems:**
- **Issue:** Page not loading or very slow
- **Causes:** Internet connection, browser cache, server issues
- **Solutions:**
  - Check internet connection
  - Clear browser cache and cookies
  - Try different browser
  - Contact administrator if persists

**Login Issues:**
- **Issue:** Cannot sign in to account
- **Causes:** Wrong credentials, account issues, browser problems
- **Solutions:**
  - Verify email and password
  - Reset password if forgotten
  - Clear browser data
  - Check account status with admin

**Cart Problems:**
- **Issue:** Items not adding to cart or cart not updating
- **Causes:** JavaScript disabled, browser cache, session issues
- **Solutions:**
  - Enable JavaScript in browser
  - Refresh page and try again
  - Clear browser cache
  - Check if signed in properly

**Enquiry Submission Failures:**
- **Issue:** Enquiry form not submitting
- **Causes:** Form validation, network issues, server problems
- **Solutions:**
  - Check all required fields completed
  - Verify internet connection
  - Try submitting again
  - Check browser console for errors

**Admin Dashboard Access:**
- **Issue:** Cannot access admin features
- **Causes:** Not signed in, insufficient permissions, account type
- **Solutions:**
  - Verify admin account credentials
  - Check if signed in as administrator
  - Contact system admin for access

### Getting Help

**Support Channels:**
1. **System Administrator:** Primary contact for technical issues
2. **Documentation:** Refer to this SOP document
3. **Browser Console:** Check for JavaScript errors
4. **Network Tools:** Use browser dev tools for debugging

**Reporting Issues:**
1. **Describe Problem:** Clear explanation of what's not working
2. **Steps to Reproduce:** How to trigger the issue
3. **Expected Behavior:** What should happen instead
4. **Environment Details:** Browser, device, error messages

### System Maintenance

**Regular Tasks:**
- **Data Backups:** Automated daily backups of all data
- **System Updates:** Regular application and security updates
- **Performance Monitoring:** Track site speed and uptime
- **Security Scans:** Regular vulnerability assessments

**Maintenance Schedule:**
- **Daily:** Automated backups and monitoring
- **Weekly:** Performance review and optimization
- **Monthly:** Security updates and feature reviews
- **Quarterly:** Major updates and system audits

**Emergency Procedures:**
1. **System Outage:** Immediate administrator notification
2. **Data Loss:** Restore from most recent backup
3. **Security Breach:** Isolate system and investigate
4. **Performance Issues:** Scale resources or optimize code

---

*This document last updated: October 2025*
*For internal company use only*
*Document Version: 2.0 - Comprehensive Edition*
