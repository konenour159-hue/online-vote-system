# 🗳️ Genies Vote

A simple, secure voting platform by Genies. An organiser creates a vote, shares **one link with the audience**, and gives
each candidate **a private link** to follow their own score live. The interface is in French and installable as a PWA.

## How it works

1. The **administrator** signs in, creates a vote (a question and its candidates) and opens it.
2. The **audience** opens the shared link, enters a name and an e-mail address, types the 6-digit code received by
   e-mail, and votes once. No account is needed.
3. Each **candidate** has a private link showing only their own live percentage, never the others'.
4. The administrator follows participation and results live. The audience sees the results once the vote is closed.

## Key features

- **Secret ballot:** a ballot stores only the chosen candidate, with no date and no link to the voter. The voter list
  records only *that* someone voted, to prevent a second vote.
- **One vote per person:** e-mail verification code (hashed, valid 10 minutes, 5 attempts), atomic double-vote protection.
- **Admin space:** create, open and close votes, edit candidates before opening, copy links, QR code, live results,
  participant list, regenerate a candidate's link, delete a vote.
- **Audit log:** logins and every action on a vote.
- **PWA:** installable, opens offline; votes and results always go through the network and are never cached.
- **Security:** JWT with refresh cookie, bcrypt, rate limiting per step, strict Content-Security-Policy, self-hosted fonts.
- **Accessible:** WCAG-checked, keyboard and screen-reader friendly, responsive down to phones, reduced-motion support.

## Deploying

See [DEPLOY_VERCEL_RENDER.md](DEPLOY_VERCEL_RENDER.md) (website on Vercel, API and PostgreSQL on Render, e-mail via Brevo).

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Hook Form** - Form Management
- **Zod** - Validation
- **TanStack Query** - Data Fetching
- **Axios** - HTTP Client
- **Recharts** - Data Visualization
- **Zustand/Context API** - State Management

### Backend
- **Node.js & Express.js** - Server Framework
- **TypeScript** - Type Safety
- **PostgreSQL** - Database
- **Prisma ORM** - Database ORM
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Socket.IO** - Real-time Updates
- **Multer** - File Upload
- **Helmet** - Security Headers
- **Express Validator** - Input Validation

### DevOps
- **Docker & Docker Compose** - Containerization
- **Swagger/OpenAPI** - API Documentation
- **Jest & Supertest** - Testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Backend & Frontend)
- PostgreSQL 14+ (Database)
- Docker & Docker Compose (Optional)
- npm or yarn

### Installation

#### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/thesurya46/Online-voting-system.git
cd Online-voting-system

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# Seed sample data
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

#### Manual Setup

##### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Create database
creatdb voting_system

# Run migrations
npm run migrate

# Seed data (optional)
npm run seed

# Start development server
npm run dev
```

##### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 📁 Project Structure

```
Online-voting-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── types/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── voter/
│   │   │   └── shared/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🔑 User Roles

### 1. Super Admin
- Full system access
- User management
- System configuration
- View all elections and results

### 2. Election Admin
- Create and manage elections
- Manage positions and candidates
- Manage voters for their elections
- View election statistics
- Export results

### 3. Voter
- View active elections
- Cast votes
- View vote history
- Manage profile

## 🔐 Authentication Flow

```
1. User Registration
2. Email Verification
3. Login → JWT Access Token (15m) + Refresh Token (7d)
4. Access Token stored in memory
5. Refresh Token stored in HTTP-only Cookie
6. Automatic Token Refresh on Expiry
7. Logout → Clear Tokens
```

## 📊 Database Schema

Key entities:
- **Users** - User accounts with roles
- **Roles** - Role definitions (Super Admin, Admin, Voter)
- **Elections** - Election records
- **Positions** - Positions within elections
- **Candidates** - Candidates for positions
- **Votes** - Vote records (encrypted)
- **Audit Logs** - System activity tracking
- **Refresh Tokens** - Token management

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test

# With coverage
npm run test:coverage
```

## 📖 API Documentation

Swagger API documentation is available at: `http://localhost:5000/api/docs`

## 🚢 Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Push to registry
docker tag voting-system-backend your-registry/voting-backend:latest
docker push your-registry/voting-backend:latest

# Deploy
docker-compose -f docker-compose.yml up -d
```

### Production Checklist
- [ ] Update environment variables
- [ ] Configure HTTPS/SSL
- [ ] Setup email service
- [ ] Configure database backups
- [ ] Setup logging & monitoring
- [ ] Configure CDN for static assets
- [ ] Run security audit
- [ ] Setup CI/CD pipeline

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For support, email work.suryasnata@gmail.com or open an issue on GitHub.

## 👥 Team

- **Author**: Surya Snata Panigrahi
- **Repository**: [Online-voting-system](https://github.com/thesurya46/Online-voting-system)

---

**Built with ❤️ for secure and transparent elections**
