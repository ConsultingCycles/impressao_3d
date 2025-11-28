# YOUWARE - Custo3D Development Guide

Custo3D is a React application for calculating 3D printing costs, managing filaments, marketplaces, and prints.

## Project Overview

- **Project Name**: Custo3D
- **Type**: React + TypeScript Modern Web Application
- **Entry Point**: `src/main.tsx`
- **Build System**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)

## Architecture

### Core Components

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand (`src/store/`)
  - `authStore.ts`: Handles authentication (including mock admin)
  - `dataStore.ts`: Handles data fetching and CRUD operations
- **Routing**: React Router DOM (`src/App.tsx`)
- **API**: Supabase Client (`src/api/supabase.ts`)

### Database Schema (Supabase)

- **filaments**: Stores filament data (brand, material, price, weight, etc.)
- **marketplaces**: Stores marketplace fees and commissions
- **prints**: Stores print jobs and calculations
- **user_configs**: Stores user preferences (energy cost, profit margin, etc.)
- **profiles**: Stores user profile information

### Authentication & Security

- **Auth**: Supabase Auth (Email/Password, OTP)
- **Mock Admin**: A frontend-only "admin" mode is implemented for demo/testing purposes.
  - Credentials: `admin` / `adimin` (Hardcoded in `src/pages/Login.tsx`)
  - Uses a fixed UUID: `00000000-0000-0000-0000-000000000000`
- **RLS Policies**: Row Level Security is enabled on all tables.
  - Policies allow access if `auth.uid() = user_id` OR `user_id = '00000000-0000-0000-0000-000000000000'`.
  - This allows the mock admin (unauthenticated) to read/write data associated with the zero UUID.

## Development Commands

- **Install dependencies**: `npm install`
- **Build project**: `npm run build`
- **Preview build**: `npm run preview`
- **Lint**: `npm run lint`

## Libraries & Tools

- **PDF Generation**: `jspdf` + `jspdf-autotable`
  - Note: Use `import autoTable from 'jspdf-autotable'` and call `autoTable(doc, options)` instead of relying on `doc.autoTable()`.

## Key Features

- **Dashboard**: Overview of costs and profits
- **Filament Management**: CRUD for filaments
- **Marketplace Management**: CRUD for marketplaces
- **New Print Calculator**: Calculate costs for a new print
- **History**: View past prints
- **Settings**: Configure global parameters (energy, profit)

## Directory Structure

```
src/
  api/          # Supabase client configuration
  assets/       # Static assets (images, etc.)
  components/   # Reusable UI components (Layout, etc.)
  layouts/      # Page layouts
  pages/        # Application pages (Dashboard, Login, etc.)
  store/        # Zustand stores
  styles/       # Global styles
  types/        # TypeScript definitions
```

## Important Notes

- **Mock Admin**: The "Login as Admin" feature uses a client-side mock session. It does not authenticate with Supabase. Database access relies on the specific RLS policy exception for the zero UUID.
- **Asset Paths**: Always use absolute paths (e.g., `/assets/logo.png`) for static assets.
