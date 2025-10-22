# Elite Golf Sim - Premium Golf Simulator Booking System

A high-converting, mobile-first booking website for golf simulator businesses with dynamic pricing, strategic upsells, and payment processing.

## Features

### Customer-Facing
- **Real-time Booking System**: Live availability calendar with instant confirmation
- **Dynamic Pricing**: Peak/off-peak pricing based on time and day type
- **User Type Discounts**: Special rates for students (20%), juniors (30%), and seniors (25%)
- **Strategic Upsells**: Conditional offers based on booking details (time extensions, food bundles, equipment)
- **Competition Entry**: Monthly longest drive and closest to pin challenges
- **Payment Processing**: Secure payments via Paystack (South African payment gateway)
- **Email Notifications**: Automated booking confirmations and reminders

### Admin Dashboard
- **Booking Management**: View, search, filter, and cancel bookings
- **Availability Control**: Manage time slots and set holidays
- **Revenue Reports**: Daily, weekly, and monthly revenue breakdowns
- **Competition Management**: Track entries and view leaderboards
- **Export Functionality**: Download booking and revenue data

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Payment**: Paystack (South African payment gateway)
- **Styling**: Tailwind CSS v4 with custom golf club theme
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth (for admin access)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Paystack account (for payment processing)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`bash
# Supabase (automatically provided by v0 integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# App URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
\`\`\`

### Installation

1. **Install dependencies**:
\`\`\`bash
npm install
\`\`\`

2. **Run database migrations**:
The SQL scripts in the `scripts/` folder need to be executed in order:
- `001_create_tables.sql` - Creates all database tables
- `002_enable_rls.sql` - Enables Row Level Security
- `003_seed_data.sql` - Seeds initial data (pricing, availability, upsells)
- `004_create_functions.sql` - Creates database functions and triggers

You can run these directly in v0 or in your Supabase SQL editor.

3. **Start the development server**:
\`\`\`bash
npm run dev
\`\`\`

4. **Open your browser**:
Navigate to `http://localhost:3000`

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx                    # Landing page
│   ├── booking/
│   │   ├── page.tsx               # Booking flow
│   │   ├── confirm/page.tsx       # Booking confirmation & upsells
│   │   └── success/page.tsx       # Payment success
│   ├── admin/
│   │   └── page.tsx               # Admin dashboard
│   ├── auth/
│   │   └── login/page.tsx         # Admin login
│   └── api/
│       └── payment/
│           ├── initialize/route.ts # Initialize Paystack payment
│           └── verify/route.ts     # Verify payment & confirm booking
├── components/
│   ├── booking-flow.tsx           # Multi-step booking component
│   ├── booking-confirmation.tsx   # Confirmation with upsells
│   ├── admin-dashboard.tsx        # Admin dashboard layout
│   └── admin/
│       ├── bookings-table.tsx     # Bookings management
│       ├── availability-manager.tsx # Availability control
│       ├── revenue-reports.tsx    # Revenue analytics
│       └── competitions-manager.tsx # Competition management
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   └── middleware.ts          # Auth middleware
│   ├── email.ts                   # Email notification utilities
│   └── types.ts                   # TypeScript types
└── scripts/
    ├── 001_create_tables.sql      # Database schema
    ├── 002_enable_rls.sql         # Security policies
    ├── 003_seed_data.sql          # Initial data
    └── 004_create_functions.sql   # Database functions
\`\`\`

## Configuration

### Pricing Rules

Pricing is configured in the database (`pricing_rules` table). Default rates:

- **Adult**: R350-R600/hour (depending on peak times)
- **Student**: 20% discount (R280-R480/hour)
- **Junior**: 30% discount (R245-R420/hour)
- **Senior**: 25% discount (R262-R450/hour)

Peak times:
- Weekdays: 16:00-21:00
- Weekends: 10:00-21:00
- Holidays: All day

### Upsells

Strategic upsells are configured in the `upsells` table with trigger conditions:
- Time extensions for bookings < 2 hours
- Social upgrades for solo bookings
- Food bundles for group bookings (2+ players)
- Equipment rentals, lessons, and memberships

### Booking Rules

- Minimum advance notice: 15 minutes
- Maximum session length: 4 hours
- Maximum future booking: 30 days
- Free cancellation: Up to 2 hours before session

## Paystack Integration

This system uses Paystack for payment processing, which is ideal for South African businesses.

### Setup Paystack

1. Create a Paystack account at [paystack.com](https://paystack.com)
2. Get your API keys from the Paystack dashboard
3. Add keys to your `.env.local` file
4. Test with Paystack test cards before going live

### Test Cards

Use these test cards in development:
- **Success**: 4084 0840 8408 4081 (any CVV, any future date)
- **Insufficient Funds**: 5060 6666 6666 6666 4963

## Email Notifications

Email notifications are prepared but require integration with an email service provider.

### Recommended Email Services

- **Resend** (recommended for Next.js)
- **SendGrid**
- **Postmark**
- **AWS SES**

Update `lib/email.ts` with your chosen provider's API.

## Admin Access

To create an admin user:

1. Sign up via Supabase Auth (or use Supabase dashboard)
2. Navigate to `/auth/login`
3. Use your credentials to access `/admin`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` to your production URL
2. Update Paystack webhook URL in Paystack dashboard
3. Test the complete booking flow
4. Set up email service integration

## Support

For issues or questions:
- Check the documentation in each component
- Review the database schema in `scripts/`
- Consult Supabase and Paystack documentation

## License

© 2025 Elite Golf Sim. All rights reserved.
