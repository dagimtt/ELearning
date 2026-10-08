# ELearning Platform — Project Documentation

**Version:** 1.0 (MVP)
**Stack:** ASP.NET Core 10 · React 18 · Vite 8 · PostgreSQL 16 · Tailwind CSS v4
**Last updated:** 2026-10-08

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Backend — Project Layout](#4-backend--project-layout)
5. [Frontend — Project Layout](#5-frontend--project-layout)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Frontend Routes](#9-frontend-routes)
10. [Running Locally](#10-running-locally)
11. [Seeded Data](#11-seeded-data)
12. [Environment & Configuration](#12-environment--configuration)
13. [Known Limitations & Future Work](#13-known-limitations--future-work)

---

## 1. Overview

A simple web-based e-learning platform where instructors create and publish courses, and learners browse, enroll, and track progress through lessons.

### Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Manage users, roles, categories |
| **Instructor** | Create courses, add lessons, publish |
| **Learner** | Browse catalog, enroll, complete lessons |

### MVP Features

- User registration, login, JWT auth
- Role-based access (Admin / Instructor / Learner)
- Course CRUD with draft/publish lifecycle
- Lesson CRUD with content types: Text, Video, Attachment
- Lesson reordering
- Public course catalog with search, category filter, pagination
- Course detail page (public, hides drafts from non-owners)
- Learner enrollment in published courses
- Lesson-level progress tracking with computed percent
- Learner "My Courses" dashboard with progress bars
- Instructor dashboard with drafts/published stats
- Course editor with metadata, lessons, publish, delete
- Lesson editor with content-type-aware fields
- Admin user management (backend only; UI is placeholder)

---

## 2. System Architecture
# ELearning