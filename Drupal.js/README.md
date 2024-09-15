# Drupal.js

Drupal.js is a modern, lightweight CMS inspired by Drupal, built with React and Node.js. Created by rUv, it offers a flexible and scalable solution for content management.

## Introduction

Drupal.js combines the power of React for the frontend and Node.js for the backend, providing a fast and efficient CMS solution. It's designed to be easily customizable and extendable, making it suitable for a wide range of web applications.

## Features

- React-based frontend for optimal performance
- Node.js backend with Strapi CMS
- Tailwind CSS for responsive styling
- Plugin system for easy extensibility
- RESTful API and GraphQL support
- User authentication and role-based access control
- Content types: Articles, Pages, Categories, and Menus
- Media management
- Multilingual support

## Focus

Drupal.js focuses on:
- Simplicity and ease of use
- Performance and scalability
- Developer-friendly architecture
- Flexible content modeling
- Modern web technologies

## Applications

Ideal for:
- Blogs and news sites
- Corporate websites
- E-commerce platforms
- Educational portals
- Community forums
- Portfolio sites

## Customization

Drupal.js can be easily customized through:
- Custom React components
- Tailwind CSS utility classes
- Plugin development
- Content type creation and modification
- API extensions

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/ruvnet/drupaljs.git
   cd drupaljs
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and update the values.

4. Start the development server:
   ```
   npm run dev
   ```

## Folder Structure

Here is an overview of the folder structure of the Drupal.js project:

```bash
Drupal.js/
├── config/                 # Configuration files
│   ├── database.js         # Database configuration
│   ├── plugins.js          # Plugins configuration
│   └── server.js           # Server configuration
├── components/             # React components
├── pages/                  # React page views
├── public/                 # Public assets (HTML, images, etc.)
├── src/                    # Source files
│   ├── api/                # API content types
│   │   ├── article/        # Content type: Article
│   │   ├── category/       # Content type: Category
│   │   ├── page/           # Content type: Page
│   │   └── menu/           # Content type: Menu
│   └── plugins/            # Custom plugins
├── .env                    # Environment variables
├── Dockerfile              # Dockerfile for containerization
├── package.json            # Project dependencies
└── README.md               # Project README
```

### Key Configuration Files

- **config/database.js**: Configures the connection to the database.
- **config/plugins.js**: Manages the plugins used in the project.
- **config/server.js**: Configures the server settings.

## Scaling

Drupal.js is designed for scalability:
- Use Docker for containerization
- Implement load balancing with Nginx or AWS ELB
- Utilize caching strategies (e.g., Redis)
- Optimize database queries and indexing
- Use CDNs for static asset delivery

## Deployment

1. Build the project:
   ```
   npm run build
   ```

2. Deploy using platforms like Vercel, Netlify, or your preferred hosting solution.

3. Set up a CI/CD pipeline for automated deployments.

For detailed documentation and contribution guidelines, visit our [GitHub repository](https://github.com/ruvnet/drupaljs).
