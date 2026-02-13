## 📦 Project Structure

```bash
├── apps/
│   ├── api/                 # NestJS backend (DDD architecture)
│   └── web/                 # Next.js 16 frontend
├── packages/
│   ├── database/            # Drizzle ORM schemas & migrations
│   ├── eslint-config/       # Shared ESLint configuration
│   ├── icons/               # SVG icon library with React components
│   ├── typescript-config/   # Shared TypeScript configurations
│   └── ui/                  # Shared React component library (shadcn/ui)
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── turbo.json               # Turborepo configuration
└── README.md
```

---

## 🚀 Features

- 📦 **Full-Stack Monorepo**: Managed with Turborepo and pnpm workspaces for unified configuration and blazing-fast builds.
- 🛡️ **Enterprise-Grade Backend**: NestJS 11 with DDD architecture, Drizzle ORM, JWT/RBAC authentication, Swagger docs, and Pino structured logging.
- ✨ **Modern Frontend Stack**: Next.js 16, React 19, TailwindCSS 4, and TanStack Query.
- 🎨 **Component-Driven UI Development**: Shared UI library built with shadcn/ui and Storybook.
- 🔧 **Robust Developer Tooling**: ESLint, Prettier, Vitest, Playwright, and automated code checks.

---

## 📖 Getting Started

### Install Dependencies

```bash
pnpm install
```

### Configure Environment Variables

```bash
# Backend API
cp apps/api/.env.example apps/api/.env

# Frontend Web
cp apps/web/.env.example apps/web/.env

# Database
cp packages/database/.env.example packages/database/.env
```

Update the `.env` files with your local configuration, including `DATABASE_URL`, email service credentials, and other necessary values.

### Start Database Services

```bash
docker-compose -f docker-compose.yml up -d
```

### Run Database Migrations and Seed Data

```bash
# Run database migrations
cd packages/database
pnpm db:generate && pnpm db:migrate

# (Optional) Seed initial data
pnpm db:seed
```

> Note: After changing the schema, run `pnpm db:generate`, then `pnpm db:migrate`.

### Start the Development Servers

```bash
pnpm start
```
