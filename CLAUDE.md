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

## Architecture

- **Vue 3 Composition API** with `<script setup>` syntax throughout
- **Vuetify 3** for UI components (Material Design); components are auto-imported via vite plugin
- **Vue Router** for client-side routing (no centralized state store — state is component-local)
- **Path alias**: `@/` maps to `./src/`
- **Package manager**: Yarn 4 (Berry)

### Routing

| Path | Page | Purpose |
|------|------|---------|
| `/` | redirect → `/dashboard` | |
| `/dashboard` | `dashboard-page.vue` | Main overview |
| `/classes` | `class-list-page.vue` | List all classes |
| `/classes/:classId` | `class-dashboard-page.vue` | Class detail with attendance |
| `/devices` | `device-config-page.vue` | IoT device management |

### Key Conventions

- Vue files: **kebab-case** (`attendance-table.vue`)
- Types use `T` prefix (`TAttendanceStatus`), interfaces use `I` prefix (`IStudentAttendance`)
- Domain types in `src/types/`, utility functions in `src/utils/`
- Layout managed by `src/components/layout/app-layout.vue` (nav drawer + app bar)

### Formatting (Prettier)

- No semicolons, single quotes, trailing commas, 90 char width, 2-space indent
