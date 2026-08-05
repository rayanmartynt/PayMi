# SalonePay

Sierra Leone's premier payment gateway - accept payments via Orange Money, Afrimoney, QMoney, Visa, and Mastercard.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/salonepay.git
   cd salonepay
   ```

2. **Install dependencies**

   Frontend:
   ```bash
   cd frontend
   npm install
   ```

   Backend:
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Frontend (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Backend (`.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=7d
   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=your-email@domain.com
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start the servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## 📁 Project Structure

```
salonepay/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── lib/       # Utilities and API client
│   │   └── contexts/  # React contexts (Auth)
│   ├── .env.local     # Frontend environment variables
│   └── package.json
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── prisma/       # Database schema and migrations
│   ├── .env          # Backend environment variables
│   └── package.json
└── DEPLOYMENT.md     # Deployment guide
```

## 🎯 Features

### Frontend
- Modern Next.js 14 with App Router
- Beautiful UI with Tailwind CSS and shadcn/ui
- Responsive design for all devices
- Dark mode support
- Authentication pages (login, register, password reset)
- Dashboard with analytics
- Transaction management
- Merchant profile management
- KYC document upload
- Admin panel

### Backend
- RESTful API with Express.js
- JWT authentication
- Role-based access control (Merchant, Admin, Customer)
- Payment processing (Orange Money, Afrimoney, QMoney, Visa, Mastercard)
- Transaction management
- Webhook support
- Email notifications via Resend
- KYC verification workflow
- Admin dashboard endpoints
- Rate limiting and security headers

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Register**: Create a new merchant account
2. **Login**: Receive JWT token
3. **Protected Routes**: Token required for API calls
4. **Token Storage**: Stored in localStorage

## 💳 Payment Methods Supported

- **Orange Money** - Mobile money
- **Afrimoney** - Mobile money
- **QMoney** - Mobile money
- **Visa** - Card payments via Stripe
- **Mastercard** - Card payments via Stripe
- **Bank Transfer** - Direct bank transfers

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/links` - Create payment link
- `GET /api/payments/links/:id` - Get payment link
- `POST /api/payments/refund/:id` - Refund payment

### Transactions
- `GET /api/transactions` - Get transactions
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/analytics` - Get analytics

### Merchants
- `GET /api/merchants/profile` - Get merchant profile
- `PUT /api/merchants/profile` - Update merchant profile
- `POST /api/merchants/api-key` - Regenerate API key
- `GET /api/merchants/balance` - Get balance
- `GET /api/merchants/settlements` - Get settlements
- `POST /api/merchants/withdrawals` - Create withdrawal
- `GET /api/merchants/withdrawals` - Get withdrawals

### KYC
- `POST /api/kyc/upload` - Upload KYC document
- `GET /api/kyc/documents` - Get KYC documents
- `POST /api/kyc/:id/approve` - Approve KYC (Admin)
- `POST /api/kyc/:id/reject` - Reject KYC (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/merchants` - Get all merchants
- `POST /api/admin/merchants/:id/approve` - Approve merchant
- `POST /api/admin/merchants/:id/reject` - Reject merchant
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/users` - Get all users
- `GET /api/admin/withdrawals` - Get all withdrawals
- `POST /api/admin/withdrawals/:id/process` - Process withdrawal

## 🚢 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Quick Deployment Options

**Frontend (Vercel)**
```bash
cd frontend
vercel
```

**Backend (Render)**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository and configure

**Backend (Railway)**
```bash
cd backend
railway up
```

## 🔧 Development

### Running Tests
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Database Management
```bash
cd backend

# Create migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npm run prisma:generate

# View database
npx prisma studio
```

## 🛡️ Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- JWT authentication
- Password hashing with bcrypt
- Input validation
- SQL injection prevention (Prisma ORM)

## 📧 Email Service

Emails are sent using [Resend](https://resend.com):

- Email verification
- Password reset
- KYC approval/rejection
- Payment confirmations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@salonepay.com or open an issue on GitHub.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Resend](https://resend.com/)
