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
# git init

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
print_message "Setting Up Backend Structure"

cd backend

# Create necessary folders and files for backend
mkdir -p config src/api/{article,page,category,menu} src/components/menu src/plugins
touch .env config/database.js config/plugins.js

# Add configuration for Supabase database connection
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

# Create content types (models)

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

cd ..

# 3. Frontend Setup with Vite.js, React, and Tailwind CSS
print_message "Setting Up Frontend Structure"

cd frontend

# Create necessary folders and files for frontend
mkdir -p src/{components,pages,services,contexts,utils}
touch tailwind.config.js src/index.css src/utils/supabaseClient.js

# Add basic Tailwind CSS configuration
cat <<EOL > tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOL

# Add Supabase client configuration
cat <<EOL > src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your_public_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
EOL

cd ..

# 4. Docker Setup
print_message "Creating Docker Setup Files"

# Create Dockerfile for backend
mkdir backend
cat <<EOL > backend/Dockerfile
# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 1337

# Start the application
CMD ["npm", "run", "develop"]
EOL

# Create Dockerfile for frontend
mkdir frontend
cat <<EOL > frontend/Dockerfile
# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

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

# 5. Documentation Setup
print_message "Setting Up Documentation"

cd docs

# Create README.md
cat <<EOL > README.md
# Drupal.js CMS

Drupal.js is a Drupal-like CMS clone built using Node.js (Strapi) for the backend, Vite.js with React and Tailwind CSS for the frontend, and Supabase as the database.

## Installation Instructions

Detailed instructions for setup will go here.
EOL

cd ..

# 6. Final Git Commit
print_message "Making Initial Git Commit"

git add .
git commit -m "Initial setup of Drupal.js CMS structure without installation steps"

print_message "Setup Complete! Navigate to the project directory and start developing."
