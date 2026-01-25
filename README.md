# 🎟️ Man's Support Desk

A high-performance, enterprise-grade support infrastructure built with **Next.js 15**, **Prisma**, and **PostgreSQL**. Designed with the sleek **Vercel Aesthetic**, this system streamlines hardware support and asset management for modern teams.

## ✨ Core Features

### 🔐 Advanced Onboarding
- **Invite-Only System**: Secure user registration via one-time encrypted tokens.
- **Bulk Invitations**: Onboard entire teams simultaneously by uploading email lists.
- **Role-Based Provisioning**: Assign roles (Admin, Agent, User) during the invitation phase.

### 💻 Smart Inventory Management
- **Hardware Tracking**: Comprehensive database for Laptops, Monitors, and auxiliary hardware.
- **PID Linking**: Users can claim company assets or self-register personal devices using Unique Product IDs (PID).
- **Component Tracking**: Granular tracking for device components (e.g., keyboards, specific internal parts).

### 🛠️ Professional Ticketing Workflow
- **Issue Reporting**: Users can report problems against specific inventory items or general custom issues.
- **Dynamic Statuses**: Track lifecycle through `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`, `REOPENED`, and `CLOSED`.
- **Priority Triage**: High-contrast labels for `URGENT`, `MEDIUM`, and `LOW` priority issues.

### 📧 Real-time Communications
- **Agent Notifications**: Automated Zoho Mail alerts sent to all staff whenever a new ticket is reported.
- **Threaded Activity**: Clean comment system for back-and-forth collaboration between users and support staff.

### 🚀 Optimized Infrastructure
- **Premium UI**: Dark-mode optimized interface using Geist typography and Framer Motion-style transitions.
- **SEO & Metadata**: Dynamic browser titles and OpenGraph support for professional internal sharing.
- **Secure Auth**: Robust session management and encrypted password hashing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Email**: [Zoho Mail SMTP](https://www.zoho.com/mail/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: Lucide & Custom SVGs

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <repository-url>
cd ticket_system
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"

# Email Configuration (Zoho)
ZOHO_EMAIL="your-email@zohomail.in"
ZOHO_PASSWORD="your-app-password"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development
```bash
npm run dev
```

---

## ☁️ Deployment (Netlify)

This project is pre-configured for **Netlify**. Follow these steps:

1. **Push your code** to GitHub/GitLab/Bitbucket.
2. **Connect your repo** to Netlify.
3. **Environment Variables**: In Netlify UI, go to *Site Settings > Build & deploy > Environment variables* and add:
   - `DATABASE_URL` (From Neon or your DB provider)
   - `ZOHO_EMAIL` & `ZOHO_PASSWORD`
   - `NEXT_PUBLIC_APP_URL` (Set this to `https://man-support-desk.netlify.app`)
   - `NEXTAUTH_SECRET` (A random secure string)
4. **Build Settings**: Netlify will automatically use the `netlify.toml` settings:
   - Build Command: `npm run build`
   - Publish Directory: `.next`

The `postinstall` script in `package.json` ensures that Prisma is correctly generated in the cloud environment.

---

## 👥 Role Definitions

| Role | Access Level | Description |
|:---:|:---:|:---|
| **USER** | Basic | Create tickets, manage personal inventory, comment on own tickets. |
| **AGENT** | Intermediate | Manage assigned tickets, update statuses, view all inventory items. |
| **ADMIN** | Full | System configuration, invite/remove users, delete tickets, full asset control. |

---

## 🎨 Design Philosophy
The system follows a **Minimalist Dark Aesthetic**:
- **Background**: Pure Black (`#000000`)
- **Borders**: Subtle Gray (`#333333`)
- **Accents**: Glowing Blue (`#0070f3`) and Amber (`#f5a623`)
- **Typography**: Inter / Geist Sans for maximum readability.

---

## 📄 License
Custom internal use only. Designed and Developed by **Man**.
