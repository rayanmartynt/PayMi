# PayMi - Sierra Leone Payment Gateway

A modern, production-ready payment gateway web application designed for Sierra Leone, similar to Stripe or Flutterwave. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

### For Merchants
- **Dashboard**: Real-time analytics, revenue tracking, and transaction monitoring
- **Payment Management**: Create payment links, generate QR codes, and manage transactions
- **Customer Management**: Track customer lifetime value and payment history
- **API Keys**: Generate and manage API keys for seamless integration
- **KYC Verification**: Upload and manage identity verification documents
- **Settlements**: Monitor balances and request withdrawals
- **Analytics**: Comprehensive charts and reports for business insights

### For Customers
- **Multiple Payment Methods**: Orange Money, Afrimoney, QMoney
- **Secure Checkout**: Professional checkout experience with real-time status updates
- **Payment Confirmation**: Email and SMS notifications

### Payment Methods Supported
- **Mobile Money**: Orange Money, Afrimoney, QMoney
- **Bank Payments**: Rokel Commercial Bank, Sierra Leone Commercial Bank, Union Trust Bank, Guaranty Trust Bank

## Technology Stack

- **Frontend**: Next.js 15 (App Router)
- **React**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: React Icons
- **QR Codes**: qrcode.react

## Project Structure

```
PayMi/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/         # Merchant dashboard pages
│   │   ├── checkout/          # Customer checkout page
│   │   ├── login/             # Authentication pages
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   ├── about/             # Additional pages
│   │   ├── contact/
│   │   ├── terms/
│   │   ├── privacy/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── landing/          # Landing page components
│   │   ├── dashboard/       # Dashboard components
│   │   └── auth/             # Authentication components
│   ├── features/             # Feature-based modules
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   ├── services/             # API services and mock data
│   ├── store/                # Zustand state management
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Helper functions
│   └── styles/               # Additional styles
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── postcss.config.js
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd PayMi
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Key Features Implementation

### Landing Page
- Modern hero section with animated statistics
- Features showcase
- Payment methods display
- Pricing plans
- Testimonials
- FAQ section
- Responsive footer

### Authentication
- Login and registration pages
- Forgot password flow
- Password reset
- Email verification
- Two-factor authentication (UI placeholder)

### Merchant Dashboard
- **Sidebar Navigation**: Collapsible sidebar with all sections
- **Dashboard Home**: Revenue cards, charts, recent transactions
- **Payments**: Create payment links, generate QR codes
- **Transactions**: Filterable table with export options
- **Customers**: Search and view customer details
- **API Keys**: Generate, copy, revoke, and rotate keys
- **Documentation**: API docs with code examples
- **KYC**: Document upload and verification status
- **Settlements**: Balance overview and withdrawal requests
- **Analytics**: Revenue trends, payment methods, customer growth
- **Notifications**: Real-time notification center
- **Settings**: Profile, security, and preferences

### Checkout Flow
- Multi-step checkout process
- Payment method selection
- Real-time payment processing
- Success/failure states
- Order summary

### UI Components
- Button (multiple variants)
- Card (header, content, footer)
- Input
- Badge (status indicators)
- Modal
- Toast notifications
- Skeleton loaders
- Copy button
- Empty states
- Tabs
- Error boundary

### State Management
- Zustand store for global state
- Persisted storage for user preferences
- Dark mode toggle
- Sidebar state management

### Mock Data
- Realistic sample data for all features
- Sierra Leone-specific payment methods
- Local bank information
- SLE currency formatting

## Design Features

- **Glassmorphism**: Modern glass-like effects
- **Soft Gradients**: Beautiful color transitions
- **Smooth Animations**: Framer Motion animations
- **Modern Cards**: Clean card designs
- **Rounded Corners**: Consistent border radius
- **Dark Mode**: Full dark mode support
- **Light Mode**: Optimized light theme
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Keyboard Navigation**: Full keyboard support

## Future Backend Integration

The frontend is designed to integrate seamlessly with a backend API that will provide:

- Merchant authentication (JWT/OAuth)
- Mobile money payment processing
- Bank transfer processing
- Card payment processing
- Webhook events
- Transaction verification
- Refund processing
- KYC management
- Settlement processing
- API key management
- Real-time notifications (WebSockets/SSE)

## Security Features

- PCI DSS Ready
- 256-bit Encryption
- Fraud Detection
- Webhook Verification
- Tokenized Payments
- Secure API

## Pages

- Home (Landing)
- About
- Pricing
- Contact
- Login
- Register
- Forgot Password
- Reset Password
- Verify Email
- Merchant Dashboard
- Transactions
- Customers
- Analytics
- API Keys
- Documentation
- Payment Links
- Checkout
- Settlements
- Refunds
- Notifications
- Settings
- KYC
- Support
- FAQ
- Terms
- Privacy Policy

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@PayMi.com or call +232 76 123 456.
