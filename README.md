# DevAtlas

**Crafting knowledge for engineers.**

A premium, Apple-inspired personal technical blogging platform built with Next.js 15, React 19, TypeScript, and Prisma. Single-author CMS with OTP authentication, email notifications, and a polished reading experience.

## Quick Start

```bash
git clone https://github.com/yourusername/devatlas.git
cd devatlas
pnpm install
cp .env-dev .env
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3001 | Blog |
| http://localhost:3001/admin | Admin login |

Default credentials: `da.madskull@gmail.com` / `deep123`

## Environment Files

| File | Purpose | Push to Git? |
|------|---------|-------------|
| `.env-dev` | Development config (Ethereal SMTP, local DB) | Yes |
| `.env-prod` | Production config template (Resend SMTP, Neon DB) | Yes |
| `.env` | Your local environment (generated from .env-dev) | No |

**Setup:**
- Development: `cp .env-dev .env`
- Production: Add values from `.env-prod` to Vercel environment variables

## Features

### Blog
- Featured & Latest articles from database
- Category pages with real-time article counts
- Search by title, content, category, tags
- Newsletter subscribe form (toggleable from admin)
- Dark/Light/System theme
- Responsive mobile-first design

### Admin
- **OTP Authentication** — two-step login with email verification
- **Session Security** — 15-min inactivity timeout, server restart invalidates tokens
- **Dashboard** — stats, recent articles, category breakdown
- **Articles** — create, edit, publish, feature, auto-save drafts every 5s
- **Categories** — CRUD with enable/disable toggle
- **Tags** — CRUD with inline editing
- **Subscribers** — view and manage newsletter subscribers
- **Newsletter** — compose and send emails to all subscribers with article attachment
- **Media Library** — upload and manage images
- **Site Settings** — toggle newsletter, emailing, analytics
- **Profile** — update name, email, bio, password (OTP-protected)

### Email
- OTP codes for login and sensitive actions
- Newsletter notifications when articles are published (toggleable)
- Unsubscribe link in every email
- **Dev:** Ethereal SMTP (view emails at ethereal.email)
- **Prod:** Resend SMTP (real delivery, free 100/day)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, CSS Modules |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL (Neon for production) |
| ORM | Prisma |
| Auth | JWT (jose), bcryptjs, OTP |
| Email | Nodemailer |
| Validation | Zod |
| Package Manager | pnpm |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Home (featured, latest, newsletter, about)
│   ├── layout.tsx                   # Root layout (nav/footer for blog, hidden for admin)
│   ├── middleware.ts                # Sets x-is-admin header for admin routes
│   ├── not-found.tsx                # Custom 404 page
│   ├── unsubscribe/page.tsx         # Newsletter unsubscribe page
│   ├── articles/                    # Article listing and detail pages
│   ├── categories/                  # Category listing and detail pages
│   ├── about/page.tsx               # About page
│   ├── search/page.tsx              # Search page
│   └── admin/
│       ├── layout.tsx               # Admin sidebar with auth guard
│       ├── login/page.tsx           # Two-step login (credentials + OTP)
│       └── dashboard/
│           ├── page.tsx             # Dashboard with stats
│           ├── articles/            # Article management
│           ├── categories/          # Category management
│           ├── tags/page.tsx        # Tag management
│           ├── subscribers/         # Subscriber list
│           ├── newsletter/          # Newsletter composer
│           ├── media/               # Media library
│           ├── settings/            # Site settings
│           └── profile/             # Profile editor
├── components/
│   ├── Navigation.tsx               # Blog navigation
│   ├── Footer.tsx                   # Blog footer
│   ├── ThemeProvider.tsx            # Theme context
│   ├── LoadingScreen.tsx            # Loading animation
│   ├── AnimatedSection.tsx          # Scroll animations
│   └── Newsletter.tsx               # Newsletter subscribe form
├── lib/
│   ├── prisma.ts                    # Prisma client
│   ├── auth.ts                      # JWT + session
│   ├── email.ts                     # SMTP transport (Ethereal dev / Resend prod)
│   ├── otp.ts                       # OTP utilities
│   ├── validators.ts                # Zod schemas
│   ├── utils.ts                     # Utilities
│   └── quotes.ts                    # Engineering quotes
└── middleware.ts                     # Admin route headers

public/
├── favicon.svg                      # Browser tab icon
└── icon.svg                         # App icon / PWA icon
```

## Database Models

| Model | Description |
|-------|-------------|
| User | Admin user with email, password, role |
| Category | Article categories with color, icon, enabled flag |
| Tag | Article tags |
| Article | Posts with HTML, SEO, featured/pinned flags |
| ArticleTag | Many-to-many join |
| Media | Uploaded files |
| SiteSettings | Config with newsletter/emailing toggles |
| Analytics | Page view tracking |
| Subscriber | Newsletter subscribers |
| Otp | Verification codes with expiry |

## SMTP Configuration

| Mode | Provider | Where to view emails |
|------|----------|---------------------|
| Development | Ethereal | https://ethereal.email (login with creds in .env-dev) |
| Production | Resend | Real inbox delivery |

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Copy values from `.env-prod` to Vercel environment variables
4. Deploy

### Docker
```bash
docker compose up -d
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Prisma Studio |

## License

MIT
