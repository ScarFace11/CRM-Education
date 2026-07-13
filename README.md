# EduCRM

## Overview

EduCRM is a multi-tenant SaaS CRM designed for educational organizations such as tutoring centers, coding bootcamps, language schools, and homeschool programs.

The application helps manage the entire enrollment process, from the first inquiry to student admission, providing a centralized workspace for contacts, sales pipelines, tasks, and analytics.

### Core Features

- Contact management with notes and lead sources
- Customizable enrollment pipeline with drag-and-drop Kanban board
- Task management linked to contacts or deals
- Dashboard with key business metrics
- Multi-tenant architecture with isolated organization data
- Secure authentication using Clerk

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Wouter
- TanStack Query
- Tailwind CSS
- Radix UI
- React Hook Form
- Zod

### Backend

- Node.js
- Express 5
- TypeScript
- Clerk Authentication
- Pino Logger

### Database

- PostgreSQL
- Drizzle ORM

### Additional Tools

- OpenAPI
- Orval
- pnpm Workspaces

---

## Multi-tenancy

Each authenticated user belongs to an organization.

The backend automatically resolves the active organization from the authenticated user's membership. All business entities are scoped by `organizationId`, ensuring complete tenant isolation without exposing tenant identifiers to the client.

---

## Authentication

Authentication is provided by Clerk.

New users automatically receive:

- a personal organization
- an Owner role
- a default enrollment pipeline

---

## Design

The interface follows an academic-inspired visual style using warm colors, parchment textures, and serif typography to create a distinctive alternative to traditional blue enterprise CRM systems.

---

## Notes

This project follows an API-first architecture with generated client libraries and shared validation schemas to keep frontend and backend contracts synchronized.