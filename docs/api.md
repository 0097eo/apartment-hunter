# API Documentation

This document provides detailed information about the Apartment Hunter API endpoints.

## Authentication

### Register a New User

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Description:** Creates a new user account.
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }
  ```
- **Response:**
  ```json
  {
    "id": "user-id",
    "email": "test@example.com",
    "name": "Test User",
    "token": "jwt-token"
  }
  ```

### Log In a User

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Description:** Authenticates a user and returns a JWT.
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "id": "user-id",
    "email": "test@example.com",
    "name": "Test User",
    "token": "jwt-token"
  }
  ```

### Get Current User

- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Description:** Retrieves the profile of the currently authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "id": "user-id",
    "email": "test@example.com",
    "name": "Test User",
    "profile_picture": null
  }
  ```

### Log Out

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Description:** Clears the authentication cookie.
- **Authentication:** Not required.
- **Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### Google OAuth

- **Method:** `GET`
- **Path:** `/api/auth/google`
- **Description:** Initiates the Google OAuth2 authentication flow.
- **Authentication:** Not required.

- **Method:** `GET`
- **Path:** `/api/auth/google/callback`
- **Description:** Handles the callback from Google after authentication. The server will set a JWT cookie and redirect to the frontend.
- **Authentication:** Not required.

---

## Listings

### Create a Listing

- **Method:** `POST`
- **Path:** `/api/listings`
- **Description:** Creates a new property listing.
- **Authentication:** Required.
- **Request Body:** `multipart/form-data` with the following fields:
  - `title` (string)
  - `address` (string)
  - `city` (string)
  - `county` (string)
  - `price` (number)
  - `bedrooms` (number)
  - `bathrooms` (number)
  - `property_type` (Enum: `apartment`, `house`, `maisonette`, `bungalow`, `other`)
  - `images` (file uploads)
- **Response:**
  ```json
  {
    "id": "listing-id",
    "title": "Beautiful Apartment",
    "address": "123 Main St",
    ...
  }
  ```

### Get Public Listings

- **Method:** `GET`
- **Path:** `/api/listings/public`
- **Description:** Retrieves all active listings.
- **Authentication:** Optional.
- **Query Parameters:**
  - `city` (string)
  - `minPrice` (number)
  - `maxPrice` (number)
  - `bedrooms` (number)
  - `propertyType` (string)
- **Response:**
  ```json
  [
    {
      "id": "listing-id",
      "title": "Spacious House",
      ...
    }
  ]
  ```

### Get My Listings

- **Method:** `GET`
- **Path:** `/api/listings/my`
- **Description:** Retrieves all listings created by the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "listing-id",
      "title": "My Listing",
      ...
    }
  ]
  ```

### Get Listing Details

- **Method:** `GET`
- **Path:** `/api/listings/:id`
- **Description:** Retrieves the details of a single listing.
- **Authentication:** Not required.
- **Response:**
  ```json
  {
    "id": "listing-id",
    "title": "Cozy Studio",
    "address": "456 Oak Ave",
    ...
  }
  ```

### Update a Listing

- **Method:** `PUT`
- **Path:** `/api/listings/:id`
- **Description:** Updates a listing.
- **Authentication:** Required (must be owner).
- **Request Body:** `multipart/form-data` with fields to update.
- **Response:**
  ```json
  {
    "id": "listing-id",
    "title": "Updated Title",
    ...
  }
  ```

### Delete a Listing

- **Method:** `DELETE`
- **Path:** `/api/listings/:id`
- **Description:** Deletes a listing (soft delete).
- **Authentication:** Required (must be owner).
- **Response:**
  ```json
  {
    "message": "Listing deleted successfully"
  }
  ```
---

## Saved Properties

### Save a Listing

- **Method:** `POST`
- **Path:** `/api/saved-properties`
- **Description:** Saves a listing to the authenticated user's list.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "listingId": "listing-id"
  }
  ```
- **Response:**
  ```json
  {
    "id": "saved-property-id",
    "listing_id": "listing-id",
    "user_id": "user-id",
    ...
  }
  ```

### Get Saved Properties

- **Method:** `GET`
- **Path:** `/api/saved-properties`
- **Description:** Retrieves all saved properties for the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "saved-property-id",
      "listing": {
        "id": "listing-id",
        "title": "Saved Apartment",
        ...
      },
      ...
    }
  ]
  ```

### Get Single Saved Property

- **Method:** `GET`
- **Path:** `/api/saved-properties/:id`
- **Description:** Retrieves a single saved property.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "id": "saved-property-id",
    "listing": {
      "id": "listing-id",
      "title": "Saved Apartment",
      ...
    },
    ...
  }
  ```

### Update a Saved Property

- **Method:** `PUT`
- **Path:** `/api/saved-properties/:id`
- **Description:** Updates a saved property (e.g., adds notes, pros, cons).
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "notes": "This is a great place!",
    "pros": ["- Great location"],
    "cons": ["- A bit small"]
  }
  ```
- **Response:**
  ```json
  {
    "id": "saved-property-id",
    "notes": "This is a great place!",
    ...
  }
  ```

### Delete a Saved Property

- **Method:** `DELETE`
- **Path:** `/api/saved-properties/:id`
- **Description:** Removes a saved property from the user's list.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "message": "Saved property deleted successfully"
  }
  ```

### Add a Tag to a Saved Property

- **Method:** `POST`
- **Path:** `/api/saved-properties/:savedPropertyId/tags`
- **Description:** Associates a tag with a saved property.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "tagId": "tag-id"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Tag added successfully"
  }
  ```

### Remove a Tag from a Saved Property

- **Method:** `DELETE`
- **Path:** `/api/saved-properties/:savedPropertyId/tags/:tagId`
- **Description:** Removes a tag from a saved property.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "message": "Tag removed successfully"
  }
  ```
---
## Viewings

### Schedule a Viewing

- **Method:** `POST`
- **Path:** `/api/viewings/listings/:listingId/viewings`
- **Description:** Schedules a viewing for a specific listing.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "scheduled_date": "2025-12-01T14:00:00Z"
  }
  ```
- **Response:**
  ```json
  {
    "id": "viewing-id",
    "listing_id": "listing-id",
    "user_id": "user-id",
    ...
  }
  ```

### Get All Viewings

- **Method:** `GET`
- **Path:** `/api/viewings`
- **Description:** Retrieves all viewings for the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "viewing-id",
      "listing_id": "listing-id",
      ...
    }
  ]
  ```

### Get Upcoming Viewings

- **Method:** `GET`
- **Path:** `/api/viewings/upcoming`
- **Description:** Retrieves upcoming viewings for the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "viewing-id",
      "listing_id": "listing-id",
      ...
    }
  ]
  ```

### Update a Viewing

- **Method:** `PUT`
- **Path:** `/api/viewings/:id`
- **Description:** Updates a viewing.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "scheduled_date": "2025-12-02T15:00:00Z",
    "viewing_notes": "The viewing was great."
  }
  ```
- **Response:**
  ```json
  {
    "id": "viewing-id",
    "scheduled_date": "2025-12-02T15:00:00Z",
    ...
  }
  ```

### Delete a Viewing

- **Method:** `DELETE`
- **Path:** `/api/viewings/:id`
- **Description:** Deletes a viewing.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "message": "Viewing deleted successfully"
  }
  ```
---
## Comparisons

### Create a Comparison

- **Method:** `POST`
- **Path:** `/api/comparisons`
- **Description:** Creates a new comparison of listings.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "name": "My Comparison",
    "listing_ids": ["listing-id-1", "listing-id-2"]
  }
  ```
- **Response:**
  ```json
  {
    "id": "comparison-id",
    "name": "My Comparison",
    ...
  }
  ```

### Get All Comparisons

- **Method:** `GET`
- **Path:** `/api/comparisons`
- **Description:** Retrieves all comparisons for the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "comparison-id",
      "name": "My Comparison",
      ...
    }
  ]
  ```

### Get Detailed Comparison

- **Method:** `GET`
- **Path:** `/api/comparisons/:id`
- **Description:** Retrieves a single comparison with detailed listings.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "id": "comparison-id",
    "name": "My Comparison",
    "listings": [
      {
        "id": "listing-id-1",
        ...
      },
      {
        "id": "listing-id-2",
        ...
      }
    ]
  }
  ```

### Update a Comparison

- **Method:** `PUT`
- **Path:** `/api/comparisons/:id`
- **Description:** Updates a comparison.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "name": "Updated Comparison Name"
  }
  ```
- **Response:**
  ```json
  {
    "id": "comparison-id",
    "name": "Updated Comparison Name",
    ...
  }
  ```

### Delete a Comparison

- **Method:** `DELETE`
- **Path:** `/api/comparisons/:id`
- **Description:** Deletes a comparison.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "message": "Comparison deleted successfully"
  }
  ```
---
## Tags

### Create a Tag

- **Method:** `POST`
- **Path:** `/api/tags`
- **Description:** Creates a new tag.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "name": "Favorite",
    "color": "#FF0000"
  }
  ```
- **Response:**
  ```json
  {
    "id": "tag-id",
    "name": "Favorite",
    "color": "#FF0000"
  }
  ```

### Get All Tags

- **Method:** `GET`
- **Path:** `/api/tags`
- **Description:** Retrieves all tags for the authenticated user.
- **Authentication:** Required.
- **Response:**
  ```json
  [
    {
      "id": "tag-id",
      "name": "Favorite",
      "color": "#FF0000"
    }
  ]
  ```

### Update a Tag

- **Method:** `PUT`
- **Path:** `/api/tags/:id`
- **Description:** Updates a tag.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "name": "Updated Tag Name"
  }
  ```
- **Response:**
  ```json
  {
    "id": "tag-id",
    "name": "Updated Tag Name",
    ...
  }
  ```

### Delete a Tag

- **Method:** `DELETE`
- **Path:** `/api/tags/:id`
- **Description:** Deletes a tag.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "message": "Tag deleted successfully"
  }
  ```
---
## Dashboard

### Get Dashboard Stats

- **Method:** `GET`
- **Path:** `/api/dashboard/stats`
- **Description:** Retrieves statistics for the user's dashboard.
- **Authentication:** Required.
- **Response:**
  ```json
  {
    "savedProperties": 5,
    "upcomingViewings": 2,
    "comparisons": 1
  }
  ```