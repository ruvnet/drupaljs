# Drupal.js
Welcome to **Drupal.js**, a Drupal CMS clone using Node.js, Vite.js, Tailwind CSS, and Supabase as the database. The script includes all the required code, configurations, a sample plugin, environment variables, Dockerfile, API, folder structures, and files, with no placeholders. #rc1

## Demo
https://drupaljs.gptengineer.run/

## Drupal.js Structure 

Overview of the folder and file structure that your script will create for the Drupal.js project. It's structured to set up both the backend (Strapi with Supabase) and the frontend (Vite.js with React and Tailwind CSS), along with Docker for containerization and basic documentation.

### **Folder Structure Overview**
```bash
Drupal.js/
├── backend/                    # Backend project directory
│   ├── config/                 # Configuration files
│   │   ├── database.js         # Supabase PostgreSQL config for Strapi
│   │   └── plugins.js          # Plugins configuration for Strapi
│   ├── src/                    # Source files for backend API
│   │   ├── api/                # API content types
│   │   │   ├── article/        # Content type: Article
│   │   │   ├── category/       # Content type: Category
│   │   │   ├── page/           # Content type: Page
│   │   │   └── menu/           # Content type: Menu
│   │   └── components/         # Reusable components (e.g., Menu Item)
│   ├── plugins/                # Custom plugins for Strapi
│   │   └── hello-world/        # Sample custom plugin
│   ├── .env                    # Environment variables for Supabase
│   ├── Dockerfile              # Dockerfile for backend service
│   ├── package.json            # Backend dependencies
│   └── README.md               # Backend-specific README
├── frontend/                   # Frontend project directory
│   ├── src/                    # Source files for frontend
│   │   ├── components/         # React components
│   │   ├── pages/              # React page views
│   │   ├── services/           # Services (e.g., API calls)
│   │   ├── contexts/           # Context providers (e.g., authentication)
│   │   └── utils/              # Utility files (e.g., Supabase client)
│   ├── public/                 # Public assets (HTML, images, etc.)
│   ├── Dockerfile              # Dockerfile for frontend service
│   ├── package.json            # Frontend dependencies
│   └── README.md               # Frontend-specific README
├── docs/                       # Documentation
│   ├── README.md               # General project README with instructions
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Environment variables for both backend and frontend
└── .gitignore                  # Git ignore rules
```

### **Explanation of Key Files and Folders**

- **backend/**
  - **config/database.js**: Configures the connection to the Supabase PostgreSQL database.
  - **src/api/**: Contains the content types (models) for articles, pages, categories, and menus.
  - **src/components/**: Includes reusable components, like a `menu-item` for navigation menus.
  - **plugins/**: Custom Strapi plugins, such as the `hello-world` plugin.
  - **.env**: Stores environment variables for database and API credentials.
  - **Dockerfile**: Defines how to containerize the backend application.

- **frontend/**
  - **src/components/**: React components for the frontend UI.
  - **src/utils/supabaseClient.js**: Configures the Supabase client for API interaction.
  - **Dockerfile**: Defines how to containerize the frontend application.

- **docs/**
  - **README.md**: Contains installation instructions, API documentation, scaling info, and more.

- **docker-compose.yml**: Defines how Docker will build and run both the backend and frontend, as well as the Supabase PostgreSQL database.

- **.gitignore**: Specifies files and directories that Git should ignore (e.g., `node_modules`, `.env`).

This setup provides a structured approach to building a full-stack CMS project using modern web development tools and best practices for containerization, version control, and configuration management.

Following the script, you'll find separate detailed instructions, documentation, API documentation, Supabase setup, scaling information, functional and technical specifications, and UI elements.

---

## **1. The `Drupal.sh` Script**

Create a file named `Drupal.sh` and add the following content:

---

## **2. Detailed Instructions**

### **Prerequisites**

- **Node.js**: Version 14 or higher.
- **npm**: Comes with Node.js.
- **Docker and Docker Compose**: For containerization.
- **Git**: For version control.
- **Supabase Account**: Sign up at [Supabase](https://supabase.io/).

### **Installation Steps**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/Drupal.js.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd Drupal.js
   ```

3. **Set Up Environment Variables**

   - Open the `.env` file in the root directory.
   - Replace placeholders with your actual Supabase credentials:
     - `SUPABASE_URL`: Your Supabase project URL.
     - `SUPABASE_KEY`: Your Supabase public anon key.
     - `SUPABASE_PASSWORD`: Your Supabase database password.

4. **Build and Start the Application**

   ```bash
   docker-compose up --build
   ```

   - This command builds the Docker images and starts the containers.

5. **Access the Application**

   - **Backend (Strapi Admin Panel)**: [http://localhost:1337/admin](http://localhost:1337/admin)
     - Create an admin user when prompted.
   - **Frontend**: [http://localhost:3000](http://localhost:3000)

---

## **3. Supabase Setup**

1. **Sign Up and Create a Project**

   - Sign up at [Supabase](https://supabase.io/).
   - Create a new project and note the project URL and API keys.

2. **Configure Database**

   - In your Supabase project dashboard, go to **Settings > Database**.
   - Retrieve your database credentials:
     - Host
     - Port
     - User
     - Password

3. **Update Environment Variables**

   - Open the `.env` file and update the Supabase credentials.

4. **Set Up Supabase Tables**

   - Supabase uses PostgreSQL, so the tables will be created automatically by Strapi.

---

## **4. API Documentation**

The API is accessible via REST and GraphQL.

- **REST API Base URL**: `http://localhost:1337/api`
- **GraphQL Endpoint**: `http://localhost:1337/graphql`

### **Authentication**

- **Register User**: `POST /api/auth/local/register`
  - Body: `{ "username": "", "email": "", "password": "" }`
- **Login User**: `POST /api/auth/local`
  - Body: `{ "identifier": "", "password": "" }`

### **Content Endpoints**

- **Articles**
  - Get All: `GET /api/articles`
  - Get One: `GET /api/articles/:id`
  - Create: `POST /api/articles` (Requires Authentication)
  - Update: `PUT /api/articles/:id` (Requires Authentication)
  - Delete: `DELETE /api/articles/:id` (Requires Authentication)

- **Categories**
  - Get All: `GET /api/categories`
  - Get One: `GET /api/categories/:id`

- **Pages**
  - Similar to Articles.

### **GraphQL Usage**

Access the GraphQL playground at `http://localhost:1337/graphql` to explore and test queries.

---

## **5. Scaling Information**

### **Backend Scaling**

- **Containerization**: Use Docker to create scalable backend instances.
- **Load Balancing**: Implement load balancers like NGINX or AWS ELB.
- **Horizontal Scaling**: Deploy multiple instances of the backend service.

### **Frontend Scaling**

- **Static Hosting**: Host the built frontend on platforms like Netlify or Vercel.
- **CDN**: Use a Content Delivery Network to serve static assets globally.

### **Database Scaling**

- **Supabase Plans**: Upgrade your Supabase plan for higher performance.
- **Read Replicas**: Utilize read replicas for read-heavy workloads.
- **Caching**: Implement caching strategies to reduce database load.

---

## **6. Functional Specifications**

### **Core Features**

- **Content Types**: Articles, Pages, Categories, Menus.
- **User Roles**: Admin, Editor, Author, and Public.
- **Authentication**: Secure user authentication and session management.
- **Content Management**: CRUD operations for content types.
- **Media Handling**: Upload and manage media files.
- **Taxonomy**: Hierarchical categorization of content.
- **Internationalization**: Support for multiple languages.
- **Plugin Support**: Extend functionality with plugins.

### **User Interactions**

- **Public Users**: View content, navigate menus, search articles.
- **Authenticated Users**: Create and manage own content.
- **Administrators**: Manage all content, users, and settings.

---

## **7. Technical Specifications**

### **Backend**

- **Language**: JavaScript (Node.js)
- **Framework**: Strapi CMS
- **Database**: Supabase (PostgreSQL)
- **APIs**: REST and GraphQL
- **Authentication**: JWT-based authentication
- **Containerization**: Docker

### **Frontend**

- **Language**: JavaScript
- **Framework**: React with Vite.js
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: Context API or Redux (optional)
- **API Communication**: Axios

### **Plugins**

- **Custom Plugins**: Ability to create custom Strapi plugins.
- **Sample Plugin**: 'Hello World' plugin included for reference.

---

## **8. UI Elements**

- **Navigation Bar**

  - Logo and site title.
  - Links to main sections: Home, Articles, Categories, About.
  - User authentication links: Login/Register or Profile/Logout.

- **Footer**

  - Site information.
  - Social media links.
  - Contact information.

- **Home Page**

  - Featured articles.
  - Latest content.

- **Article Listing**

  - List of articles with title, excerpt, and read more link.
  - Pagination controls.

- **Article Detail**

  - Title, author, publication date.
  - Content body.
  - Category tags.
  - Comments section (optional).

- **Authentication Forms**

  - **Login Form**: Email/Username and Password fields.
  - **Registration Form**: Username, Email, Password, Confirm Password fields.

- **Admin Dashboard**

  - Overview of site statistics.
  - Links to manage content types.
  - User management interface.

- **Content Management**

  - Forms for creating and editing content.
  - WYSIWYG editor for rich text fields.
  - Media uploader for images and files.

---

## **9. Supabase Setup Instructions**

1. **Sign Up for Supabase**

   - Visit [Supabase](https://supabase.io/) and sign up for an account.

2. **Create a New Project**

   - Click on **New Project** and enter the project details.

3. **Retrieve Credentials**

   - Go to **Settings > API** to get your API URL and public anon key.
   - Go to **Settings > Database** for database credentials.

4. **Configure Environment Variables**

   - Update the `.env` file with the Supabase URL, keys, and database credentials.

5. **Set Up Database Tables**

   - The tables will be automatically created by Strapi when it starts.

---

## **10. Additional Notes**

- **Security**

  - Ensure environment variables are kept secure and not committed to version control.
  - Use HTTPS in production environments.
  - Regularly update dependencies to patch security vulnerabilities.

- **Testing**

  - Implement unit and integration tests using Jest or similar frameworks.
  - Use Cypress or Selenium for end-to-end testing.

- **Deployment**

  - Use CI/CD pipelines to automate testing and deployment.
  - Consider platforms like AWS, DigitalOcean, or Heroku for hosting.

---

## **11. License**

This project is licensed under the MIT License.

---

**Feel free to customize and extend Drupal.js to suit your specific needs. If you have any questions or need further assistance, don't hesitate to ask!**
