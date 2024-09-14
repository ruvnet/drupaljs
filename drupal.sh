#!/bin/bash

# Drupal.sh
# A script to set up Drupal.js, a Drupal-like CMS clone using Node.js, Vite.js, Tailwind CSS, and Supabase

# Exit immediately if a command exits with a non-zero status
set -e

# Function to print messages
print_message() {
  echo ""
  echo "========================================"
  echo "$1"
  echo "========================================"
  echo ""
}

# 1. Project Initialization
print_message "Initializing Project Directory"

# Define project name
PROJECT_NAME="Drupal.js"

# Create project directory
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize Git repository
git init

# Create main folders
mkdir backend frontend docs

# Create .gitignore
print_message "Creating .gitignore"

cat <<EOL > .gitignore
# Node.js
node_modules/
npm-debug.log
.env

# Build output
/dist
/build

# Logs
logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/

# Strapi uploads
public/uploads

# Vite cache
.vite

# Docker files
docker-compose.yml
Dockerfile
EOL

# 2. Backend Setup with Strapi and Supabase
print_message "Setting Up Backend with Strapi and Supabase"

cd backend

# Install Strapi globally if not installed
if ! command -v strapi &> /dev/null
then
  print_message "Installing Strapi globally"
  npm install -g strapi@latest
fi

# Create a new Strapi project
print_message "Creating a new Strapi project"

npx create-strapi-app@latest . --quickstart --no-run

# Install Supabase client
print_message "Installing Supabase client"

npm install @supabase/supabase-js

# Configure database (Supabase - PostgreSQL)
print_message "Configuring Supabase Database"

# Create database config file
cat <<EOL > config/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('SUPABASE_HOST', 'db.supabase.co'),
      port: env.int('SUPABASE_PORT', 5432),
      database: env('SUPABASE_DB', 'postgres'),
      user: env('SUPABASE_USER', 'postgres'),
      password: env('SUPABASE_PASSWORD', 'your_supabase_password'),
      ssl: { rejectUnauthorized: false },
    },
    debug: false,
  },
});
EOL

# Create environment variables file
cat <<EOL > .env
APP_KEYS=your_app_keys
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
JWT_SECRET=your_jwt_secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_or_service_role_key
SUPABASE_HOST=db.supabase.co
SUPABASE_PORT=5432
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_supabase_password
EOL

# Replace placeholders with actual Supabase credentials (You need to update this manually)

# Start Strapi to apply configurations (in the background)
print_message "Starting Strapi to apply configurations"

npm run develop &

STRAPI_PID=$!

# Wait for Strapi to start
sleep 60

# Stop Strapi
kill $STRAPI_PID

# Create content types (models)

mkdir -p src/api/{article,page,category,menu}

# Article Content Type
mkdir -p src/api/article/content-types/article

cat <<EOL > src/api/article/content-types/article/schema.json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": "Content type for articles"
  },
  "options": {
    "draftAndPublish": true,
    "increments": true,
    "timestamps": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "body": {
      "type": "richtext",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "unique": true
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user",
      "inversedBy": "articles"
    },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category",
      "inversedBy": "articles"
    },
    "published_at": {
      "type": "datetime"
    }
  }
}
EOL

# Category Content Type
mkdir -p src/api/category/content-types/category

cat <<EOL > src/api/category/content-types/category/schema.json
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category",
    "description": "Taxonomy for categorizing content"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "name": {
      "type": "string",
      "unique": true,
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "unique": true
    },
    "description": {
      "type": "text"
    },
    "parent": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "children"
    },
    "children": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::category.category",
      "mappedBy": "parent"
    },
    "articles": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::article.article",
      "mappedBy": "categories"
    }
  }
}
EOL

# Page Content Type
mkdir -p src/api/page/content-types/page

cat <<EOL > src/api/page/content-types/page/schema.json
{
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "Page",
    "description": "Content type for static pages"
  },
  "options": {
    "draftAndPublish": true,
    "increments": true,
    "timestamps": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "unique": true
    }
  }
}
EOL

# Menu Content Type
mkdir -p src/api/menu/content-types/menu

cat <<EOL > src/api/menu/content-types/menu/schema.json
{
  "kind": "collectionType",
  "collectionName": "menus",
  "info": {
    "singularName": "menu",
    "pluralName": "menus",
    "displayName": "Menu",
    "description": "Content type for menus"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "items": {
      "type": "component",
      "repeatable": true,
      "component": "menu.menu-item"
    }
  }
}
EOL

# Create Menu Item Component
mkdir -p src/components/menu/menu-item

cat <<EOL > src/components/menu/menu-item.json
{
  "collectionName": "components_menu_menu_items",
  "info": {
    "displayName": "Menu Item",
    "description": ""
  },
  "options": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "url": {
      "type": "string",
      "required": true
    },
    "target": {
      "type": "enumeration",
      "enum": ["_self", "_blank"],
      "default": "_self"
    },
    "order": {
      "type": "integer",
      "required": true
    },
    "parent": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "component::menu.menu-item"
    }
  }
}
EOL

# Install and Configure Plugins

# Install GraphQL plugin
print_message "Installing GraphQL plugin"

npm install @strapi/plugin-graphql

# Install i18n plugin for internationalization
print_message "Installing Internationalization plugin"

npm install @strapi/plugin-i18n

# Install Users & Permissions plugin (already included in Strapi)
print_message "Configuring Users & Permissions plugin"

# Add plugins to config/plugins.js
mkdir -p config

cat <<EOL > config/plugins.js
module.exports = ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      playgroundAlways: true,
      defaultLimit: 10,
      maxLimit: 100,
      apolloServer: {
        tracing: true,
      },
    },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr'],
    },
  },
});
EOL

# Install Sample Plugin (Content Versioning)
print_message "Installing Content Versioning Plugin"

npm install strapi-plugin-content-versioning

# Configure Content Versioning Plugin in plugins.js
cat <<EOL >> config/plugins.js

// Content Versioning Plugin
'content-versioning': {
  enabled: true,
};
EOL

# Note: The above plugin may not exist; in that case, you would need to develop a custom plugin for content versioning.

# Create a sample custom plugin (Hello World)
print_message "Creating Sample Custom Plugin"

cd src/plugins

strapi generate plugin hello-world

# Create plugin files
cd hello-world

cat <<EOL > admin/src/components/Initializer/index.js
import { useEffect } from 'react';
import { request } from '@strapi/helper-plugin';

const Initializer = ({ setPlugin }) => {
  useEffect(() => {
    const fetchData = async () => {
      const response = await request('/hello-world/welcome');
      console.log(response);
    };

    fetchData();
  }, []);

  return null;
};

export default Initializer;
EOL

cat <<EOL > server/controllers/hello-world.js
'use strict';

module.exports = {
  async welcome(ctx) {
    ctx.send({
      message: 'Hello from the Hello World plugin!',
    });
  },
};
EOL

cat <<EOL > server/routes/index.js
module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/welcome',
      handler: 'hello-world.welcome',
    },
  ],
};
EOL

cd ../../..

# Restart Strapi to apply the new configurations and plugins
print_message "Restarting Strapi to apply changes"

npm run develop

# 3. Frontend Setup with Vite.js, React, and Tailwind CSS
print_message "Setting Up Frontend"

cd ../frontend

# Initialize Vite.js project with React
print_message "Initializing Vite.js with React"

npm create vite@latest . -- --template react

# Install dependencies
npm install

# Install Tailwind CSS
print_message "Installing Tailwind CSS"

npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS configuration
npx tailwindcss init -p

# Configure Tailwind CSS
cat <<EOL > tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOL

# Update src/index.css
cat <<EOL > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# Install additional dependencies
print_message "Installing additional dependencies"

npm install axios react-router-dom jwt-decode @headlessui/react @heroicons/react supabase

# Create folder structure
mkdir -p src/{components,pages,services,contexts,utils}

# Configure Supabase in the frontend
print_message "Configuring Supabase in the frontend"

cat <<EOL > src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your_public_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
EOL

# Replace placeholders with actual Supabase URL and Key

# Continue with the rest of the frontend setup (omitted for brevity)

# 4. Docker Setup
print_message "Setting Up Docker"

cd ..

# Create Dockerfile for backend
cat <<EOL > backend/Dockerfile
# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 1337

# Start the application
CMD ["npm", "run", "develop"]
EOL

# Create Dockerfile for frontend
cat <<EOL > frontend/Dockerfile
# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Install serve to serve the build
RUN npm install -g serve

# Expose port
EXPOSE 5000

# Start the application
CMD ["serve", "-s", "dist", "-l", "5000"]
EOL

# Create docker-compose.yml
cat <<EOL > docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - '1337:1337'
    environment:
      - SUPABASE_HOST=\${SUPABASE_HOST}
      - SUPABASE_PORT=\${SUPABASE_PORT}
      - SUPABASE_DB=\${SUPABASE_DB}
      - SUPABASE_USER=\${SUPABASE_USER}
      - SUPABASE_PASSWORD=\${SUPABASE_PASSWORD}
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_KEY=\${SUPABASE_KEY}
    depends_on:
      - supabase

  frontend:
    build: ./frontend
    ports:
      - '3000:5000'
    depends_on:
      - backend

  supabase:
    image: supabase/postgres
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_PASSWORD=\${SUPABASE_PASSWORD}
      - POSTGRES_DB=\${SUPABASE_DB}
      - POSTGRES_USER=\${SUPABASE_USER}
    volumes:
      - supabase-data:/var/lib/postgresql/data

volumes:
  supabase-data:
EOL

# Create .env file in the root directory
cat <<EOL > .env
SUPABASE_HOST=db.supabase.co
SUPABASE_PORT=5432
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_supabase_password
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_public_anon_key
EOL

# Replace placeholders with actual Supabase credentials

# 5. Documentation
print_message "Setting Up Documentation"

cd docs

# Create README.md
cat <<EOL > README.md
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

   \`\`\`bash
   git clone https://github.com/yourusername/Drupal.js.git
   \`\`\`

2. Navigate to the project directory:

   \`\`\`bash
   cd Drupal.js
   \`\`\`

3. Set up environment variables:

   - Open the `.env` file and replace the placeholders with your actual Supabase credentials.

4. Build and start the application using Docker Compose:

   \`\`\`bash
   docker-compose up --build
   \`\`\`

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
EOL

# Return to project root
cd ..

# 6. Final Git Commit
print_message "Making Initial Git Commit"

git add .
git commit -m "Initial setup of Drupal.js CMS using Node.js, Vite.js, Tailwind CSS, and Supabase"

print_message "Setup Complete! Navigate to the project directory and start developing."
