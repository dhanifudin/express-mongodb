# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Start with nodemon (auto-reload on changes)
npm start      # Start with node
```

No test runner or linter is configured.

## Environment Setup

Copy `.env.example` to `.env` and fill in values:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/board
JWT_SECRET=your_jwt_secret_here
```

## Architecture

This is a REST API built with Express 5 + Mongoose, using JWT authentication (session-based auth is commented out throughout the codebase but preserved as reference).

**Request flow for protected routes:**
1. Client sends `Authorization: Bearer <token>` header
2. `middleware/auth.js` → `requireAuth` delegates to `passport.authenticate("jwt", { session: false })`
3. `config/passport.js` validates the JWT, looks up `payload.sub` (user `_id`) in MongoDB, and attaches the user to `req.user`

**Auth flow:**
- `POST /users/register` — hashes password with bcrypt, creates user
- `POST /users/login` — verifies password, signs a JWT with `{ sub: user._id }`, expires in 7 days

**API routes:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users/register` | No | Register |
| POST | `/users/login` | No | Login, returns JWT |
| POST | `/posts` | Yes | Create post |
| GET | `/posts` | No | List all posts (newest first) |
| GET | `/posts/:id` | No | Get single post |
| PUT | `/posts/:id` | Yes | Update post |
| DELETE | `/posts/:id` | Yes | Delete post |

**Models:**
- `User` — `name`, `email`, `password` (select: false by default), timestamps
- `Post` — `title`, `body`, `author` (ObjectId ref to User), timestamps

**Key note:** Models are registered both via direct import in routes and via `models/index.js` (loaded after DB connects in `index.js`). Direct imports in route files take precedence and work fine.
