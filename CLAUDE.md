# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Class Presence is a teacher dashboard for managing classroom attendance, built with Vue 3 + Vuetify 3 + TypeScript + Vite. It tracks student check-ins, displays attendance statistics, and supports IoT device configuration for automated presence detection.

## Commands

```bash
yarn dev          # Start dev server
yarn build        # Type-check (vue-tsc) + production build
yarn preview      # Preview production build
yarn lint         # ESLint check
yarn format       # Prettier format
```

## Environment Setup

Copy `.env.example` to `.env` and fill in Supabase credentials:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public key

## Architecture

- **Vue 3 Composition API** with `<script setup>` syntax throughout
- **Vuetify 3** for UI components (Material Design); components are auto-imported via vite plugin
- **Supabase** as backend (auth via Google OAuth, database)
- **Chart.js** via `vue-chartjs` for attendance visualizations
- **Vue Router** for client-side routing (no centralized state store — state is component-local)
- **Path alias**: `@/` maps to `./src/`
- **Package manager**: Yarn 4 (Berry)

### Routing

| Path                | Page                       | Purpose                      |
| ------------------- | -------------------------- | ---------------------------- |
| `/login`            | `login-page.vue`           | Google OAuth login (public)  |
| `/`                 | redirect → `/dashboard`    |                              |
| `/dashboard`        | `dashboard-page.vue`       | Main overview                |
| `/classes`          | `class-list-page.vue`      | List all classes             |
| `/classes/:classId` | `class-dashboard-page.vue` | Class detail with attendance |
| `/schedule`         | `schedule-page.vue`        | Class schedule               |
| `/devices`          | `device-config-page.vue`   | IoT device management        |

### Database (Supabase — project "Checkin system", ap-northeast-1)

All tables use `cp_` prefix. RLS enabled on all tables. UUIDs as primary keys.

```
cp_rooms
  id, name (unique), capacity, created_at

cp_classes
  id, class_code, subject_name, start_time, end_time, room_id → cp_rooms, created_at

cp_students
  id, mssv (unique), full_name, seat_number, class_id → cp_classes, created_at

cp_devices
  id, device_code (unique), description, room_id → cp_rooms (unique),
  status (default 'OFFLINE'), last_seen, firmware_version, created_at

cp_attendance_logs
  id, student_id → cp_students, class_id → cp_classes, device_id → cp_devices,
  checkin_time, status ('ON_TIME'|'LATE'|'ABSENT'), seat_number

cp_attendance_sessions
  id, student_id → cp_students, class_id → cp_classes, device_id → cp_devices,
  checkin_time, checkout_time, status, created_at
```

**RLS policies**: authenticated users can SELECT all tables; only service_role can INSERT/UPDATE attendance_logs and attendance_sessions.

### Auth & State

- Auth is a **module-level singleton** in `src/composables/use-auth.ts` — refs are declared outside the function, so all components share the same auth state without a store
- Supabase client initialized in `src/lib/supabase.ts`
- Route guard in `src/router/index.ts` redirects unauthenticated users to `/login`; routes are protected by default (opt-out via `meta: { isPublic: true }`)

### Key Conventions

- Vue files: **kebab-case** (`attendance-table.vue`)
- Types use `T` prefix (`TAttendanceStatus`), interfaces use `I` prefix (`IStudentAttendance`)
- Domain types in `src/types/`, utility functions in `src/utils/`
- Layout managed by `src/components/layout/app-layout.vue` (nav drawer + app bar)

### Project Structure

```
src/              # Vue frontend
device/           # IoT hardware (Proteus .pdsprj, firmware)
docs/             # Project documentation (đề cương, design docs)
```

### Formatting (Prettier)

- No semicolons, single quotes, trailing commas, 90 char width, 2-space indent
