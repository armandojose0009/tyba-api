# Tyba Backend API

This is a REST API developed for the Tyba Backend Engineer test. It provides user authentication and restaurant search functionality.

## Features

- **User Authentication:**
  - User registration
  - User login
  - User logout
- **Restaurant Search:**
  - Search for restaurants by city or coordinates.
- **Transaction History:**
  - Retrieve a list of historical transactions.

## Technologies Used

- Node.js
- Express
- MongoDB
- Mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- axios / `@googlemaps/google-maps-services-js` (for Google Places API)
- Jest, Supertest (for testing)
- Docker, docker-compose (for containerization - _Bonus_)

## Prerequisites

- Node.js installed
- npm or yarn installed
- MongoDB installed or a MongoDB Atlas connection string
- Google Maps API Key (if using the Google Places API)
- Docker installed (if using Docker)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd tyba-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**

    - Create a `.env` file in the root directory.
    - Add the following variables:

      ```
      PORT=3000 # Or your desired port
      JWT_SECRET=your_super_secret_key
      GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY # If using Google Places API
      ```

      - Replace the placeholder values with your actual configuration.
      - **Important:** Never commit your `.env` file to a public repository. Add it to your `.gitignore`.

## Running the Application

- **Development:**

  ```bash
  npm run dev # Uses nodemon for automatic restarts
  # or
  yarn dev
  ```

- **Production:**

  ```bash
  npm start
  # or
  yarn start
  ```

- **Running Tests:**

  ```bash
  npm test
  # or
  yarn test
  ```

## API Endpoints

### Authentication

- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Authenticate a user and receive a JWT.
- `POST /auth/logout`: (Client-side: Invalidate the JWT)

### Restaurants

- `GET /restaurants`: Get a list of restaurants by city or coordinates (Requires JWT authentication).

### Transactions

- `GET /transactions`: Get the transaction history for the authenticated user (Requires JWT authentication).

## Docker (Optional)

### Prerequisites

- Docker installed
- docker-compose installed

### Running with Docker Compose

1.  **Build the Docker image:**

    ```bash
    docker-compose build
    ```

2.  **Run the application and MongoDB using Docker Compose:**

    ```bash
    docker-compose up -d
    ```

    - This will start the application and a MongoDB container.
    - Make sure to set the necessary environment variables in the `docker-compose.yml` file or in a separate `.env` file used by Docker Compose.

3.  **Stop the containers:**

    ```bash
    docker-compose down
    ```

## Important Considerations

- **Security:**
  - JWTs are used for authentication. Keep the `JWT_SECRET` secure.
  - API keys (e.g., Google Maps API key) are handled using environment variables.
  - Password hashing is implemented using bcryptjs.
- **Error Handling:** The API includes error handling to provide informative responses.
- **Validation:** Input validation should be implemented to ensure data integrity.
- **Testing:** Jest and Supertest are used for automated testing.
- **Code Structure:** The codebase is organized into controllers, models, routes, and services for better maintainability.

## Notes

- This project fulfills the requirements of the Tyba Backend Engineer test.
- The Google Places API is used to fetch restaurant data. Ensure you have a valid API key and understand the usage costs and terms of service.
- Docker configuration is included for easy local development and deployment.

---

**Good Luck!**
