# Tazkartak - Event Ticket Selling Platform

A comprehensive event ticket selling platform built with Node.js/Express backend and React frontend, designed for event organizers and venues in Egypt.

## 🚀 Features

- **Multi-Role System**: Admin, Event Organizer, Venue Owner, and Ticket Buyer
- **QR Code Tickets**: Generate and validate QR code tickets
- **Payment Integration**: Support for Egyptian payment gateways (PayMob, Fawry)
- **Subscription Packages**: Tiered packages (Basic, Pro, Enterprise) for organizers
- **Real-time Features**: Live updates using Socket.io
- **Analytics Dashboard**: Comprehensive reporting and analytics
- **Mobile Responsive**: Works seamlessly on all devices
- **Website Integration**: Embed ticket selling on organizer websites

## 🏗️ Architecture

### Monorepo Structure
```
tazkartak/
├── apps/
│   ├── backend/          # Express.js API server
│   ├── frontend/         # React dashboard application
│   ├── widget/           # Embeddable ticket widget
│   └── mobile/           # React Native mobile app
├── packages/
│   ├── shared/           # Shared utilities and types
│   ├── ui/               # Reusable UI components
│   └── utils/            # Common utility functions
├── infrastructure/       # Docker, Kubernetes, monitoring
├── docs/                 # API documentation and guides
└── tests/                # E2E and integration tests
```

### Technology Stack

**Backend:**
- Node.js with Express.js
- TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching and sessions
- Socket.io for real-time features
- JWT authentication
- PayMob & Fawry payment integration

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Redux Toolkit for state management
- React Router for navigation
- React Hook Form with Yup validation
- Axios for API calls

**Infrastructure:**
- Docker containerization
- Kubernetes orchestration
- GitHub Actions CI/CD
- Monitoring with Prometheus/Grafana

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tazkartak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   # Start backend (from root)
   npm run dev:backend
   
   # Start frontend (from root)
   npm run dev:frontend
   ```

6. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api
   - API Documentation: http://localhost:3000/api-docs

### Docker Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

The API documentation is available at `/api-docs` when the backend server is running.

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token

**Events:**
- `GET /api/events` - List events
- `POST /api/events` - Create event (Organizer)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Organizer)

**Tickets:**
- `POST /api/tickets` - Purchase ticket
- `GET /api/tickets` - List user tickets
- `POST /api/tickets/validate` - Validate QR ticket

**Payments:**
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/callback/:gateway` - Payment callback

## 🎯 User Roles & Permissions

### Admin
- Manage all users, events, and venues
- View platform analytics
- Manage subscription packages
- System configuration

### Event Organizer
- Create and manage events
- View event analytics
- Manage tickets and attendees
- Subscription management

### Venue Owner
- Manage venue information
- Scan and validate tickets
- View venue analytics

### Ticket Buyer
- Browse and purchase tickets
- View purchased tickets
- Download QR tickets

## 💳 Payment Integration

### Supported Gateways
- **PayMob**: Egyptian payment gateway
- **Fawry**: Egyptian payment gateway

### Payment Flow
1. User initiates payment
2. Redirected to payment gateway
3. Payment processed
4. Callback received and ticket generated
5. QR code sent via email/SMS

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers
- Password hashing with bcrypt

## 📊 Analytics & Reporting

- Event performance metrics
- Revenue tracking
- User engagement analytics
- Ticket sales trends
- Payment success rates
- Custom date range reports

## 🚀 Deployment

### Production Deployment

1. **Build the applications**
   ```bash
   npm run build
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Kubernetes deployment**
   ```bash
   kubectl apply -f infrastructure/kubernetes/
   ```

### Environment Variables

Key environment variables for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/tazkartak
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-jwt-key
PAYMOB_API_KEY=your-paymob-api-key
FAWRY_MERCHANT_CODE=your-fawry-merchant-code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@tazkartak.com

## 🔄 Changelog

### v1.0.0 (Initial Release)
- Basic event management
- QR code ticket generation
- Payment integration
- Multi-role user system
- Analytics dashboard

---

**Built with ❤️ for the Egyptian event industry**
