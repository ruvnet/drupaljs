import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function Documentation() {
  const [chatbotInput, setChatbotInput] = useState('');
  const [chatbotResponse, setChatbotResponse] = useState('');

  const handleChatbotSubmit = (e) => {
    e.preventDefault();
    // In a real application, this would call an AI service
    setChatbotResponse(`Here's some information about "${chatbotInput}": [AI-generated response would go here]`);
    setChatbotInput('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Drupal.js Documentation</h1>
        <Button asChild>
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="intro">
          <AccordionTrigger>Introduction to Drupal.js</AccordionTrigger>
          <AccordionContent>
            <p>Drupal.js is a modern, lightweight CMS inspired by Drupal, built with React and Node.js. It offers a flexible and scalable solution for content management, combining the power of React for the frontend and Node.js for the backend.</p>
            <h3 className="text-xl font-semibold mt-4">Key Features:</h3>
            <ul className="list-disc pl-6">
              <li>React-based frontend for optimal performance</li>
              <li>Node.js backend with Strapi CMS</li>
              <li>Tailwind CSS for responsive styling</li>
              <li>Plugin system for easy extensibility</li>
              <li>RESTful API and GraphQL support</li>
              <li>User authentication and role-based access control</li>
              <li>Content types: Articles, Pages, Categories, and Menus</li>
              <li>Media management</li>
              <li>Multilingual support</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="getting-started">
          <AccordionTrigger>Getting Started</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">Installation</h3>
            <ol className="list-decimal pl-6">
              <li>Clone the repository: <code>git clone https://github.com/yourusername/drupaljs.git</code></li>
              <li>Navigate to the project directory: <code>cd drupaljs</code></li>
              <li>Install dependencies: <code>npm install</code></li>
              <li>Set up environment variables: Copy <code>.env.example</code> to <code>.env</code> and update the values</li>
              <li>Start the development server: <code>npm run dev</code></li>
            </ol>
            <h3 className="text-xl font-semibold mt-4">First Steps</h3>
            <ul className="list-disc pl-6">
              <li>Access the admin panel at <code>http://localhost:3000/admin</code></li>
              <li>Create your first content type (e.g., Blog Post)</li>
              <li>Add some sample content</li>
              <li>Customize your site's appearance using the Theme Customizer</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="content-management">
          <AccordionTrigger>Content Management</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">Creating Content</h3>
            <p>To create new content:</p>
            <ol className="list-decimal pl-6">
              <li>Navigate to the Content section in the admin panel</li>
              <li>Click on "Add New" and select the content type</li>
              <li>Fill in the required fields</li>
              <li>Use the rich text editor for formatting</li>
              <li>Add media items as needed</li>
              <li>Set the publishing status and date</li>
              <li>Click "Save" to publish or save as a draft</li>
            </ol>
            <h3 className="text-xl font-semibold mt-4">Managing Content Types</h3>
            <p>Drupal.js allows you to create custom content types:</p>
            <ol className="list-decimal pl-6">
              <li>Go to Structure > Content Types</li>
              <li>Click "Add Content Type"</li>
              <li>Define fields, display settings, and permissions</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="theming">
          <AccordionTrigger>Theming and Customization</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">Using the Theme Customizer</h3>
            <p>Drupal.js includes a powerful Theme Customizer:</p>
            <ol className="list-decimal pl-6">
              <li>Navigate to Appearance > Theme Customizer</li>
              <li>Modify colors, typography, and layout settings</li>
              <li>Preview changes in real-time</li>
              <li>Save your custom theme</li>
            </ol>
            <h3 className="text-xl font-semibold mt-4">Creating Custom Themes</h3>
            <p>For advanced customization:</p>
            <ol className="list-decimal pl-6">
              <li>Create a new theme folder in <code>src/themes</code></li>
              <li>Define your theme's structure (CSS, templates, assets)</li>
              <li>Use Tailwind CSS utility classes for styling</li>
              <li>Implement theme hooks for dynamic content rendering</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plugins">
          <AccordionTrigger>Extending with Plugins</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">Installing Plugins</h3>
            <ol className="list-decimal pl-6">
              <li>Go to Extend > Add New Plugin</li>
              <li>Search for available plugins or upload a custom one</li>
              <li>Click "Install" and follow the prompts</li>
              <li>Configure plugin settings as needed</li>
            </ol>
            <h3 className="text-xl font-semibold mt-4">Developing Custom Plugins</h3>
            <p>To create your own plugins:</p>
            <ol className="list-decimal pl-6">
              <li>Use the Plugin Creator tool in the admin panel</li>
              <li>Define plugin metadata, hooks, and custom functionality</li>
              <li>Implement React components for the frontend</li>
              <li>Add backend logic using Node.js and Strapi's API</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="api">
          <AccordionTrigger>API and Headless Usage</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">RESTful API</h3>
            <p>Drupal.js provides a comprehensive RESTful API:</p>
            <ul className="list-disc pl-6">
              <li>Base URL: <code>http://your-domain.com/api</code></li>
              <li>Authentication: JWT tokens</li>
              <li>Endpoints for all content types and custom entities</li>
              <li>CRUD operations supported</li>
            </ul>
            <h3 className="text-xl font-semibold mt-4">GraphQL</h3>
            <p>For more flexible data querying, use the GraphQL API:</p>
            <ul className="list-disc pl-6">
              <li>GraphQL endpoint: <code>http://your-domain.com/graphql</code></li>
              <li>Interactive GraphQL Playground available in development</li>
              <li>Custom resolvers for complex data relationships</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="deployment">
          <AccordionTrigger>Deployment and Scaling</AccordionTrigger>
          <AccordionContent>
            <h3 className="text-xl font-semibold">Deployment Options</h3>
            <ul className="list-disc pl-6">
              <li>Traditional hosting with Node.js server</li>
              <li>Containerization using Docker</li>
              <li>Serverless deployment (e.g., Vercel, Netlify for frontend)</li>
            </ul>
            <h3 className="text-xl font-semibold mt-4">Scaling Strategies</h3>
            <ol className="list-decimal pl-6">
              <li>Use load balancers for distributed traffic</li>
              <li>Implement caching mechanisms (e.g., Redis)</li>
              <li>Optimize database queries and indexing</li>
              <li>Utilize CDNs for static asset delivery</li>
              <li>Consider microservices architecture for large-scale applications</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Ask the Drupal.js Chatbot</h2>
        <form onSubmit={handleChatbotSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Ask a question about Drupal.js"
            value={chatbotInput}
            onChange={(e) => setChatbotInput(e.target.value)}
          />
          <Button type="submit">Ask</Button>
        </form>
        {chatbotResponse && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">Chatbot Response:</h3>
            <p>{chatbotResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documentation;