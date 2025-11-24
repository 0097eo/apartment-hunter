# Apartment Hunter API

This is the backend API for Apartment Hunter, a web application for searching, saving, and comparing apartment listings.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Listings](#listings)
  - [Saved Properties](#saved-properties)
  - [Viewings](#viewings)
  - [Comparisons](#comparisons)
  - [Tags](#tags)
  - [Dashboard](#dashboard)
- [Authentication](#authentication-1)
- [Technologies Used](#technologies-used)

## Features

- User authentication with JWT (local and Google OAuth)
- Create, manage, and search for apartment listings
- Save and track properties
- Schedule and manage property viewings
- Compare properties side-by-side
- Tag and organize saved properties

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL
- A configured `.env` file (based on `.env.example`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/apartment-hunter-backend.git
   cd apartment-hunter-backend
   ```
2. **Install dependencies:**
    ```bash
    npm install
    ```
3. **Set up your database:**
   - Make sure your PostgreSQL server is running.
   - Create a new database.
   - Copy the `.env.example` file to `.env` and fill in the `DATABASE_URL` and other environment variables.
     ```bash
     cp .env.example .env
     ```
4. **Run database migrations:**
    ```bash
    npx prisma migrate dev
    ```
5. **Start the server:**
    ```bash
    npm run dev
    ```
The API will be running at `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

A detailed description of all endpoints is available in [`docs/api.md`](./docs/api.md).

### Authentication

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in a user.
- `GET /api/auth/google`: Initiate Google OAuth.
- `GET /api/auth/google/callback`: Google OAuth callback.
- `GET /api/auth/me`: Get the current user's profile.
- `POST /api/auth/logout`: Log out the current user.

### Listings

- `POST /api/listings`: Create a new listing.
- `GET /api/listings/my`: Get listings for the authenticated user.
- `GET /api/listings/public`: Get all public listings.
- `GET /api/listings/:id`: Get details for a single listing.
- `PUT /api/listings/:id`: Update a listing.
- `DELETE /api/listings/:id`: Delete a listing.

### Saved Properties

- `POST /api/saved-properties`: Save a listing.
- `GET /api/saved-properties`: Get all saved properties for the authenticated user.
- `GET /api/saved-properties/:id`: Get a single saved property.
- `PUT /api/saved-properties/:id`: Update a saved property.
- `DELETE /api/saved-properties/:id`: Delete a saved property.
- `POST /api/saved-properties/:savedPropertyId/tags`: Add a tag to a saved property.
- `DELETE /api/saved-properties/:savedPropertyId/tags/:tagId`: Remove a tag from a saved property.

### Viewings

- `POST /api/viewings/listings/:listingId/viewings`: Schedule a viewing.
- `GET /api/viewings`: Get all viewings for the authenticated user.
- `GET /api/viewings/upcoming`: Get upcoming viewings for the authenticated user.
- `PUT /api/viewings/:id`: Update a viewing.
- `DELETE /api/viewings/:id`: Delete a viewing.

### Comparisons

- `POST /api/comparisons`: Create a comparison.
- `GET /api/comparisons`: Get all comparisons for the authenticated user.
- `GET /api/comparisons/:id`: Get a single comparison.
- `PUT /api/comparisons/:id`: Update a comparison.
- `DELETE /api/comparisons/:id`: Delete a comparison.

### Tags

- `POST /api/tags`: Create a tag.
- `GET /api/tags`: Get all tags for the authenticated user.
- `PUT /api/tags/:id`: Update a tag.
- `DELETE /api/tags/:id`: Delete a tag.

### Dashboard

- `GET /api/dashboard/stats`: Get dashboard statistics.

## Authentication

This API uses JSON Web Tokens (JWT) for authentication. The token can be sent in two ways:

1.  **Authorization Header:**
    ```
    Authorization: Bearer <token>
    ```
2.  **Cookie:**
    A cookie named `jwt` containing the token.

## Technologies Used

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Passport.js](http://www.passportjs.org/) for Google OAuth
- [Cloudinary](https://cloudinary.com/) for image uploads