# E-Commerce API

A simple Express.js + MongoDB REST API for an e-commerce backend, with JWT auth, bcrypt password hashing, product catalog, and order management.

## Stack
- Express.js
- MongoDB + Mongoose
- bcryptjs (password hashing)
- jsonwebtoken (auth)
- nodemon (dev auto-reload)
- morgan (request logging)
- cors

## Setup

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # starts with nodemon
# or
npm start                # production
```

Make sure MongoDB is running locally, or set `MONGO_URI` in `.env` to an Atlas connection string.

## Project structure

```
config/db.js            MongoDB connection
models/                 User, Product, Order (Mongoose schemas)
controllers/             Route logic (auth, products, orders)
routes/                  Express routers
middleware/auth.js       JWT protect + role-based authorize
middleware/errorHandler.js  Central error + 404 handler
utils/generateToken.js   JWT signing helper
app.js                   Express app + middleware wiring
server.js                Entry point, connects DB then listens
```

## Auth

Register/login return a JWT. Send it on protected routes as:

```
Authorization: Bearer <token>
```

Roles: `customer` (default) and `admin`. Admin-only actions: creating/editing/deleting products, viewing all orders, updating order status.

## API Endpoints

### Auth
| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ name, email, password }` |
| POST | `/api/auth/login` | Public | `{ email, password }` |
| GET | `/api/auth/me` | Private | — |

### Products
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/api/products` | Public | Query: `keyword, category, minPrice, maxPrice, page, limit` |
| GET | `/api/products/:id` | Public | |
| POST | `/api/products` | Admin | `{ name, description, price, category, imageUrl, stock }` |
| PUT | `/api/products/:id` | Admin | partial update |
| DELETE | `/api/products/:id` | Admin | |

### Orders
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | `/api/orders` | Private | `{ items: [{ product, quantity }], shippingAddress }` — checks & decrements stock in a transaction |
| GET | `/api/orders/my-orders` | Private | current user's orders |
| GET | `/api/orders/:id` | Private | owner or admin |
| GET | `/api/orders` | Admin | all orders |
| PUT | `/api/orders/:id/status` | Admin | `{ status }` — pending/processing/shipped/delivered/cancelled |

### Health
`GET /api/health` — quick uptime check.

## Notes / next steps you may want to add
- Rate limiting (`express-rate-limit`) on auth routes
- Input validation with `express-validator` (already installed, not wired up to keep this minimal — add per-route checks as needed)
- Refresh tokens / logout blacklist
- Image upload (e.g. Cloudinary/S3) instead of plain `imageUrl` string
- Payment integration (Paystack/Flutterwave for a Nigerian-market app)
- Cart persistence in the DB rather than a client-managed items array at checkout
