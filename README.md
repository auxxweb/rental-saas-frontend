# Rental Store Billing SaaS Platform

A comprehensive cloud-based Rental Store Billing SaaS Platform built with MERN stack (MongoDB, Express, React, Next.js, Node.js).

## Features

### Super Admin Features
- Dashboard with shop and revenue overview
- Shop creation with automatic credential distribution (Email & WhatsApp)
- Shop management (approve/reject, status updates)
- Subscription management
- System monitoring and reports

### Rental Shop Features
- Dashboard with overview statistics
- Product management (add, edit, delete products with hourly/daily/monthly rates)
- Customer management
- Job/Bill creation with automatic rent calculation
- Invoice generation with PDF download
- Product return tracking with extra-time calculation
- Reports (jobs, payments, returns)
- Password change with email verification (Link or OTP)

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **PDF Generation**: jsPDF
- **Email Service**: Nodemailer
- **WhatsApp Integration**: Twilio (optional)

## Project Structure

```
rental-saas/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   └── lib/             # Utilities and API client
└── package.json         # Root package.json
```

## Installation

1. **Install dependencies for root, backend, and frontend:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**

   Backend (create `backend/.env`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rental-saas
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   
   # Email Configuration (for shop credentials and password changes)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # WhatsApp Configuration (Optional - Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

   Frontend (create `frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
   
   **Note**: See `SETUP_GUIDE.md` for detailed email and WhatsApp setup instructions.

3. **Start MongoDB** (make sure MongoDB is running on your system)

4. **Run the application:**

   Development mode (runs both backend and frontend):
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Login

You'll need to create a super admin user first. You can do this by:

1. Using the registration endpoint (if implemented) or
2. Creating a user directly in MongoDB

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user (Super Admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-password-change` - Request password change (sends verification email)
- `POST /api/auth/verify-password-change` - Verify and change password (with link)
- `POST /api/auth/verify-otp` - Verify OTP and change password

### Shops
- `GET /api/shops` - Get all shops (Super Admin) or own shop (Shop Admin)
- `POST /api/shops` - Create shop (Super Admin) - Sends credentials via email & WhatsApp
- `PUT /api/shops/:id` - Update shop
- `GET /api/shops/stats/overview` - Get shop statistics

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `GET /api/jobs/stats/overview` - Get job statistics

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice from job
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice

### Returns
- `GET /api/returns` - Get all returns
- `POST /api/returns/:jobId` - Process return

### Reports
- `GET /api/reports/jobs` - Get jobs report
- `GET /api/reports/payments` - Get payments report
- `GET /api/reports/returns` - Get returns report

## Features Implementation

### Automatic Rent Calculation
The system automatically calculates rental charges based on:
- Pricing mode (hourly, daily, monthly)
- Duration
- Quantity

### Return Tracking
- Tracks actual return dates
- Calculates extra charges for late returns
- Automatically updates product stock

### Invoice Generation
- Creates invoices from jobs
- Supports PDF download
- Includes all item details, taxes, and totals

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Deployment

### Backend
- Set up MongoDB (MongoDB Atlas recommended for production)
- Configure environment variables
- Deploy to DigitalOcean, AWS, or similar

### Frontend
- Build the Next.js application: `npm run build`
- Deploy to Vercel, Netlify, or similar

## Shop Creation & Password Change

### Shop Creation Workflow
1. Super Admin creates shop with all mandatory information
2. System automatically sends credentials via:
   - Email (with login instructions)
   - WhatsApp (if configured)
3. Shop owner receives credentials and can login immediately

### Password Change Workflow
1. Shop owner requests password change from Settings
2. Chooses verification method (Email Link or OTP)
3. Receives verification email
4. Verifies and changes password
5. Receives confirmation email

See `SETUP_GUIDE.md` for detailed setup instructions.

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
