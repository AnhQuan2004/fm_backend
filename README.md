# OTP Mail Auth Backend

This is a Next.js application that provides a backend for OTP-based email authentication.

## Prerequisites

- Node.js (v18 or later)
- npm
- A MongoDB database

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fm_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```
DATABASE_URL="your-mongodb-connection-string"

# JWT
JWT_SECRET="your-jwt-secret"

# OTP
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5

# SMTP – for sending emails
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="your-smtp-from-email"
```

### 4. Generate Prisma Client

This step is usually handled automatically by the `postinstall` script, but you can run it manually if needed:

```bash
npx prisma generate
```

### 5. Run the Application with PM2

First, build the application:
```bash
npm run build
```

Then, start it with PM2:
```bash
pm2 start npm --name "fm_backend" -- run start
```

The application will be available at `https://legalvn.online`.

## API Documentation

All API endpoints are available under the `/api/auth` prefix.

### `POST /api/auth/request-otp`

Requests a one-time password (OTP) to be sent to the specified email address.

**Request Body:**

```json
{
  "email": "your-email@example.com"
}
```

**Example `curl`:**

```bash
curl -X POST https://legalvn.online/api/auth/request-otp \
-H "Content-Type: application/json" \
-d '{
  "email": "your-email@example.com"
}'
```

### `POST /api/auth/verify-otp`

Verifies the OTP you received.

**Request Body:**

```json
{
  "email": "your-email@example.com",
  "otp": "your-otp",
  "tokenId": "your-token-id"
}
```

**Example `curl`:**

```bash
curl -X POST https://legalvn.online/api/auth/verify-otp \
-H "Content-Type: application/json" \
-d '{
  "email": "your-email@example.com",
  "otp": "your-otp",
  "tokenId": "your-token-id"
}'
```

### `GET /api/auth/profile`

Retrieves a user's profile.

**Query Parameters:**

- `email` (optional): The email of the profile to retrieve.

**Headers:**

- `Cookie` (optional): A `session` cookie for an authenticated user.

**Example `curl` (by email):**

```bash
curl "https://legalvn.online/api/auth/profile?email=your-email@example.com"
```

**Example `curl` (with session cookie):**

```bash
curl https://legalvn.online/api/auth/profile \
-H "Cookie: session=your-session-token"
```

### `POST /api/auth/profile`

Creates a new user profile or updates an existing one.

**Request Body:**

```json
{
  "email": "your-email@example.com",
  "username": "your-username",
  "firstName": "Your",
  "lastName": "Name",
  "location": "Your City",
  "skills": ["skill1", "skill2"],
  "socials": "your-social-media-link",
  "github": "your-github-username",
  "displayName": "Your Display Name",
  "bio": "A short bio about yourself."
}
```

**Example `curl`:**

```bash
curl -X POST https://legalvn.online/api/auth/profile \
-H "Content-Type: application/json" \
-d '{
  "email": "your-email@example.com",
  "username": "your-username",
  "firstName": "Your",
  "lastName": "Name",
  "location": "Your City",
  "skills": ["skill1", "skill2"],
  "socials": "your-social-media-link",
  "github": "your-github-username",
  "displayName": "Your Display Name",
  "bio": "A short bio about yourself."
}'
```

### `GET /api/auth/me`

Retrieves information about the current session.

**Headers:**

- `Cookie`: A `session` cookie for an authenticated user.

**Example `curl`:**

```bash
curl https://legalvn.online/api/auth/me \
-H "Cookie: session=your-session-token"
