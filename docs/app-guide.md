# Lighting Catalogue App Guide

## Welcome

This guide helps you understand and use the app, it is written in simple language, it works for both non technical and technical readers

## What this app does

This app shows indoor and outdoor lighting products, it lets you browse products, add items to a cart, and send an enquiry to the team, it also has an admin dashboard to manage products, prices, and customer enquiries

## Who can use it

- Customers who want to explore lighting options and send enquiries
- Sales and admin team who need to manage products and respond to enquiries
- Developers who want to run and maintain the app

## Quick tour

### Home

- Clean home page with two cards, indoor lighting and outdoor lighting
- Click a card to start browsing products

### Product browsing

- Indoor and outdoor pages show product types and categories
- Product cards show a short description, click to view details

### Product details

- See key specifications like power, voltage, cct, lumen, mounting, warranty
- See sensor and control options when available
- Add to cart to collect items for your enquiry

### Sensor selector

- Sensor options load from the database
- Choose options like occupancy, bi level, pir, microwave, bluetooth
- The app filters products that match your sensor choices

### Cart

- See all items you selected
- Update quantity, remove items, or empty the cart
- Click submit enquiry to send your request

### Enquiry form

- Add your name, email, phone, and company
- Choose delivery method, air or boat
- The app includes your cart items automatically
- You get a success message when the enquiry is sent

### Account and profile

- You can register and sign in
- You can view your profile and see basic account information
- Admin users can open the admin dashboard

### Admin dashboard

- View quick stats for products and enquiries
- Open tools to add products, edit products, set prices, manage enquiries, and manage customers

## Common tasks

### Find a product

- Go to indoor or outdoor
- Use categories to narrow your search
- Open product details and review specifications

### Filter by sensors

- Open a product type that supports sensors
- Use the sensor selector to pick the options you need
- The list shows products that match your choices

### Add to cart and send enquiry

- Click add to cart on a product
- Open the cart from the top navigation
- Check quantities, then click submit enquiry
- Fill your contact details, choose delivery method, and submit

### Sign up and login

- Go to register to create an account
- Go to login to sign in
- Open your profile from the user menu

## Admin guide

### Add a new product

- Open admin dashboard
- Choose data entry or product management
- Fill basic info, technical specs, pricing, and warranty
- Save the product

### Edit existing products

- Open admin dashboard
- Choose product management
- Use search and filters to find products
- Edit fields and save changes

### Manage pricing

- Set price per piece on each product
- Use bulk update tools when available

### Process enquiries

- Open enquiry management in admin dashboard
- See all enquiries with status like new, contacted, quoted, won, lost
- Open an enquiry, review details, update status, add notes, and respond to the customer

## Data and storage

- Data lives in Supabase
- Tables include indoor products v2 and outdoor products v2, plus profiles and enquiries
- Products have fields like product name, sub category, power, voltage, cct, sensors and controls, price, lead time, and warranty
- Enquiries store customer details, cart items, status, and timestamps

## How it is built

- Built with Next.js and React
- Uses Supabase for database and authentication
- Uses modern UI components
- Has tests for features and flows

## Run the app locally

### Prerequisites

- Install Node.js and npm
- Have Supabase project credentials ready

### Environment variables

Create a file named .env.local in the project root, add these keys

```
NEXT_PUBLIC_SUPABASE_URL=your supabase url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon key
SUPABASE_SERVICE_ROLE_KEY=your service role key
```

### Install and run

- Open a terminal in the project folder
- Run npm install
- Run npm run dev
- Open the local url in your browser, the app should load

### Build and start

- Run npm run build
- Run npm start

## Import product data

- CSV files for indoor and outdoor products are included in the repo
- There are SQL files under scripts to insert v2 products
- You can use the insert sql files or the import scripts to load products into Supabase
- Keep backups before bulk imports, and test on a small set first

## Folder overview

- src app contains pages and routes, like indoor, outdoor, cart, login, register, profile, admin dashboard
- src components includes UI building blocks, like product card, product details, sensor selector, cart button
- src contexts includes auth, cart, and toast
- src lib includes database helpers, supabase clients, and utilities
- scripts includes data import and batch files

## Glossary

- Indoor products, lighting used inside spaces
- Outdoor products, lighting used outside spaces
- Sensor and controls, features like occupancy or remote control
- Cart, a collection of items you want to enquire about
- Enquiry, a request to the team for pricing or more details

## Tips for smooth use

- Use clear product names and categories, it helps search and browsing
- Keep product data complete, it improves customer confidence
- Respond to enquiries quickly, it improves conversion
- Update pricing regularly, it keeps information accurate

## Need help

- If you are a customer, use the enquiry form and the team will contact you
- If you are an admin, check the dashboard and the docs in the repo for more details
- If you are a developer, read the scripts and the src lib folder to understand data flows

## Final notes

This app aims to make lighting selection simple and clear, it helps customers explore, it helps the team respond, and it helps developers extend and maintain the system