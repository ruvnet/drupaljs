# Drupal.js CMS

Drupal.js is a Drupal-like CMS clone built using Node.js (Strapi) for the backend, Vite.js with React and Tailwind CSS for the frontend, and Supabase as the database.

## Table of Contents

- [Installation](#installation)
- [Supabase Setup](#supabase-setup)
- [API Documentation](#api-documentation)
- [Scaling Information](#scaling-information)
- [Functional Specifications](#functional-specifications)
- [Technical Specifications](#technical-specifications)
- [UI Elements](#ui-elements)
- [License](#license)

## Installation

Follow the steps below to set up Drupal.js on your local machine.

### Prerequisites

- Node.js (v14 or higher)
- npm
- Docker and Docker Compose
- Git

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Drupal.js.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Drupal.js
   ```

3. Set up environment variables:

   - Open the `.env` file and replace the placeholders with your actual Supabase credentials.

4. Build and start the application using Docker Compose:

   ```bash
   docker-compose up --build
   ```

5. Access the application:

   - Backend (Strapi): [http://localhost:1337/admin](http://localhost:1337/admin)
   - Frontend: [http://localhost:3000](http://localhost:3000)

## Supabase Setup

Supabase is an open-source Firebase alternative. Follow these steps to set up Supabase:

1. Sign up for a free account at [Supabase](https://supabase.io/).

2. Create a new project.

3. Navigate to the **Settings** > **Database** to find your database credentials.

4. Update the `.env` file in the root directory with your Supabase credentials.

5. Get your API keys from **Settings** > **API** and update the `.env` file accordingly.

## API Documentation

The API is accessible via REST and GraphQL endpoints.

- REST API: [http://localhost:1337/api](http://localhost:1337/api)
- GraphQL Playground: [http://localhost:1337/graphql](http://localhost:1337/graphql)

### Sample Endpoints

- Get all articles: `GET /api/articles`
- Get a single article: `GET /api/articles/:id`
- Create an article: `POST /api/articles` (Requires authentication)
- User authentication: `POST /api/auth/local`

## Scaling Information

For scaling Drupal.js:

- **Backend Scaling:**
  - Use a load balancer to distribute traffic across multiple backend instances.
  - Deploy the backend on scalable platforms like AWS ECS, Kubernetes, or Heroku.

- **Frontend Scaling:**
  - Host the frontend on CDN-backed services like Vercel or Netlify.
  - Enable caching strategies to reduce server load.

- **Database Scaling:**
  - Supabase scales automatically, but for heavy workloads, consider upgrading your plan.
  - Implement database indexing and optimization techniques.

## Functional Specifications

- **Content Management:**
  - Create, read, update, and delete (CRUD) operations for articles, pages, and categories.
  - Support for hierarchical taxonomies (categories).

- **User Management:**
  - User registration and authentication.
  - Role-based access control (Admin, Editor, Author).

- **Media Management:**
  - Upload and manage media files.
  - Integrate with Supabase storage for file handling.

- **Multilingual Support:**
  - Internationalization with support for multiple languages.

- **Menu Management:**
  - Create and manage navigation menus.

- **Plugins:**
  - Support for custom plugins to extend functionality.

## Technical Specifications

- **Backend:**
  - Node.js with Strapi CMS.
  - Supabase (PostgreSQL) as the database.
  - GraphQL and REST API support.
  - Dockerized for containerization.

- **Frontend:**
  - Vite.js with React.
  - Tailwind CSS for styling.
  - Supabase client for interacting with the database.
  - React Router for navigation.

- **Plugins:**
  - Custom plugins developed using Strapi's plugin system.

## UI Elements

- **Header and Navigation:**
  - Responsive navigation bar with links to main sections.

- **Content Listing:**
  - Lists of articles and pages with pagination.

- **Content Detail View:**
  - Detailed view of individual articles and pages.

- **Authentication Forms:**
  - Login and registration forms with validation.

- **Admin Dashboard:**
  - Interface for managing content, users, and settings.

- **Menus:**
  - Dynamic menus generated from the backend.

## License

[MIT](LICENSE)
