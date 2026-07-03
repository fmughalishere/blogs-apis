# Blog Platform — Backend (Node.js + Express + TypeScript + MongoDB)

Standalone REST API, separate from the Next.js frontend/admin panel. Auth uses JWT (stored in an httpOnly cookie, also returned in the response body so it can be used as a Bearer token from a separate frontend like Next.js).

## Multi-site setup (`siteType`)

This single backend now serves **two separate frontends** off the same database: a medical-articles site and a love/relationship-blogs site. Every `Blog` document carries a `siteType` field (`"medical"` | `"love"`) so each frontend only ever sees its own content.

- Public & admin blog listing/detail routes accept a `siteType` query param and filter by it.
- `POST /api/admin/blogs` **requires** `siteType` in the body — the frontend sends this automatically (hardcoded per deployment), so admins never have to pick it manually.
- Set `CLIENT_URL` to a **comma-separated list** of both frontend origins so CORS allows both, e.g.:
  ```
  CLIENT_URL=https://loveblogs.vercel.app,https://medicalblogs.vercel.app,http://localhost:3000,http://localhost:3001
  ```

## Setup

```bash
npm install
cp .env.example .env
# fill in MONGODB_URI, JWT_SECRET, CLIENT_URL, ADMIN_REGISTER_SECRET
npm run dev
```

Server runs at `http://localhost:5000`. Health check: `GET /health`.

## Folder structure

```
src/
  config/db.ts          MongoDB connection
  models/                User, Blog (siteType, category, ...), Comment (Mongoose schemas)
  middleware/auth.ts      protect (require login), adminOnly (require admin), optionalAuth
  middleware/errorHandler.ts
  controllers/            business logic
  routes/                 public routes (auth, blogs, comments)
  routes/admin/            admin-only routes (blogs CRUD, comment moderation)
  app.ts                  Express app + middleware wiring (multi-origin CORS)
  server.ts               entrypoint
```

## Auth

JWT-based. On register/login, a token is set as an httpOnly cookie (`token`) **and** returned in the JSON response, so any frontend (Next.js, React, mobile) can use either cookie-based auth or `Authorization: Bearer <token>`.

- `role` is `"admin"` or `"user"` on the same `User` model.
- To register as admin, you must pass the correct `adminSecret` (matches `ADMIN_REGISTER_SECRET` in `.env`); otherwise the account is created as a normal `user`.

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/register` | Public | `{ name, email, password, role?, adminSecret? }` |
| POST | `/login` | Public | `{ email, password }` |
| POST | `/logout` | Public | clears cookie |
| GET | `/me` | Logged-in | returns current user |

### Blogs (public) — `/api/blogs`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/?page=&limit=&category=&search=&siteType=` | Public | Only `published`; `siteType` filters to `medical` or `love` |
| GET | `/:id?siteType=` | Public | `_id` or slug; increments views |

### Comments (public) — `/api/comments`
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/?blogId=` | Public | Only `approved` comments |
| POST | `/` | Logged-in user | `{ blogId, content }` → created as `pending` |
| DELETE | `/:id` | Admin or comment owner | — |

### Admin Blogs — `/api/admin/blogs`  (all routes require admin JWT)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/?page=&limit=&status=&search=&siteType=` | Any status (draft + published); scope to one site with `siteType` |
| POST | `/` | `{ title, excerpt, content, coverImage?, category?, siteType, tags?, status? }` — `siteType` is required |
| GET | `/:id` | Fetch for editing |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Admin Comments — `/api/admin/comments`  (all routes require admin JWT)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/?status=pending` | Moderation queue |
| PATCH | `/:id` | `{ status: "approved" \| "rejected" }` |

## Connecting this to a Next.js frontend

Set `CLIENT_URL` in `.env` to your Next.js app's URL(s) (comma-separated, for CORS). From the frontend, call this API with `credentials: "include"` so the JWT cookie is sent, e.g.:

```ts
fetch("http://localhost:5000/api/blogs?siteType=medical", { credentials: "include" });
```

Or store the returned `token` and send it as `Authorization: Bearer <token>` instead.
