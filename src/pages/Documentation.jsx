import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Drupal.js Documentation</h1>
        <Button asChild>
          <Link to="/help">Back to Help</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="intro">
                <AccordionTrigger>Introduction to Drupal.js</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">What is Drupal.js?</h3>
                  <p>Drupal.js is a modern, lightweight Content Management System (CMS) inspired by Drupal but built with React and Node.js. It offers a flexible and scalable solution for content management, combining the power of React for the frontend and Node.js for the backend.</p>
                  
                  <h3 className="text-xl font-semibold mt-4 mb-2">Key Features</h3>
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
                  <h3 className="text-xl font-semibold mb-2">Installation</h3>
                  <ol className="list-decimal pl-6">
                    <li>Clone the repository:
                      <pre className="bg-gray-100 p-2 mt-2 rounded">
                        git clone https://github.com/ruvnet/drupaljs.git
                        cd drupaljs
                      </pre>
                    </li>
                    <li>Install dependencies:
                      <pre className="bg-gray-100 p-2 mt-2 rounded">
                        npm install
                      </pre>
                    </li>
                    <li>Set up environment variables:
                      <p>Copy `.env.example` to `.env` and update the values.</p>
                    </li>
                    <li>Start the development server:
                      <pre className="bg-gray-100 p-2 mt-2 rounded">
                        npm run dev
                      </pre>
                    </li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Project Structure</h3>
                  <p>Here's an overview of the main directories in the Drupal.js project:</p>
                  <ul className="list-disc pl-6">
                    <li><strong>config/</strong>: Configuration files for database, plugins, and server</li>
                    <li><strong>components/</strong>: React components</li>
                    <li><strong>pages/</strong>: React page views</li>
                    <li><strong>public/</strong>: Public assets (HTML, images, etc.)</li>
                    <li><strong>src/</strong>: Source files, including API content types and custom plugins</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="content-management">
                <AccordionTrigger>Content Management</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">Creating Content</h3>
                  <p>Drupal.js supports various content types, including Articles, Pages, and custom content types. To create new content:</p>
                  <ol className="list-decimal pl-6">
                    <li>Navigate to the Content section in the admin dashboard</li>
                    <li>Click on "Add New" and select the desired content type</li>
                    <li>Fill in the required fields (title, body, etc.)</li>
                    <li>Set the publishing status (draft, published, etc.)</li>
                    <li>Click "Save" to create the content</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Managing Content</h3>
                  <p>You can manage existing content through the Content section:</p>
                  <ul className="list-disc pl-6">
                    <li>Edit: Update the content's fields, status, or metadata</li>
                    <li>Delete: Remove content from the system</li>
                    <li>Publish/Unpublish: Change the visibility of content</li>
                    <li>Revisions: View and manage content versions (if enabled)</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Content Types</h3>
                  <p>Drupal.js allows you to create and manage custom content types. To do this:</p>
                  <ol className="list-decimal pl-6">
                    <li>Go to Structure > Content Types in the admin dashboard</li>
                    <li>Click "Add Content Type" to create a new type</li>
                    <li>Define fields, display settings, and other options</li>
                    <li>Save the new content type</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="themes">
                <AccordionTrigger>Themes and Customization</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">Working with Themes</h3>
                  <p>Drupal.js uses a theming system based on Tailwind CSS. To customize the appearance:</p>
                  <ol className="list-decimal pl-6">
                    <li>Navigate to the Appearance section in the admin dashboard</li>
                    <li>Select a base theme or create a new custom theme</li>
                    <li>Use the Theme Customizer to modify colors, typography, and layout</li>
                    <li>Apply custom CSS for more advanced styling</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Creating a Custom Theme</h3>
                  <p>To create a fully custom theme:</p>
                  <ol className="list-decimal pl-6">
                    <li>Create a new directory in the `themes` folder</li>
                    <li>Create a `theme.config.js` file to define theme settings</li>
                    <li>Create React components for various page elements</li>
                    <li>Use Tailwind CSS classes for styling</li>
                    <li>Register your theme in the Drupal.js configuration</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Responsive Design</h3>
                  <p>Drupal.js themes are built with responsiveness in mind. Use Tailwind CSS responsive classes to ensure your site looks great on all devices.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="plugins">
                <AccordionTrigger>Plugins and Extensibility</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">Understanding Plugins</h3>
                  <p>Plugins in Drupal.js allow you to extend functionality without modifying the core code. They can add new features, integrate with external services, or modify existing behavior.</p>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Installing Plugins</h3>
                  <ol className="list-decimal pl-6">
                    <li>Go to the Plugins section in the admin dashboard</li>
                    <li>Browse available plugins or upload a custom plugin</li>
                    <li>Click "Install" on the desired plugin</li>
                    <li>Configure the plugin settings if necessary</li>
                    <li>Activate the plugin to enable its functionality</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Creating Custom Plugins</h3>
                  <p>To create a custom plugin:</p>
                  <ol className="list-decimal pl-6">
                    <li>Create a new directory in the `src/plugins` folder</li>
                    <li>Create an `index.js` file to define the plugin's main functionality</li>
                    <li>Implement necessary hooks and components</li>
                    <li>Create a `config.json` file to define plugin metadata and settings</li>
                    <li>Register your plugin in the Drupal.js configuration</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Plugin API</h3>
                  <p>Drupal.js provides a robust Plugin API that allows you to hook into various parts of the system. Some key concepts include:</p>
                  <ul className="list-disc pl-6">
                    <li>Lifecycle hooks (e.g., `onInit`, `onActivate`, `onDeactivate`)</li>
                    <li>Content hooks for modifying or extending content types</li>
                    <li>UI hooks for adding elements to the admin interface</li>
                    <li>API hooks for extending the REST or GraphQL APIs</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="api">
                <AccordionTrigger>API and Headless Usage</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">RESTful API</h3>
                  <p>Drupal.js provides a comprehensive RESTful API for interacting with your content and site configuration. Key features include:</p>
                  <ul className="list-disc pl-6">
                    <li>CRUD operations for all content types</li>
                    <li>Authentication and authorization</li>
                    <li>Filtering, sorting, and pagination</li>
                    <li>Custom endpoints for plugin functionality</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">GraphQL Support</h3>
                  <p>In addition to the REST API, Drupal.js offers GraphQL support for more flexible and efficient data querying. To use GraphQL:</p>
                  <ol className="list-decimal pl-6">
                    <li>Enable the GraphQL module in the admin dashboard</li>
                    <li>Access the GraphQL playground at `/graphql`</li>
                    <li>Write queries to fetch exactly the data you need</li>
                    <li>Use mutations to create, update, or delete content</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Headless CMS Usage</h3>
                  <p>Drupal.js can be used as a headless CMS, providing content to external applications or websites. To set up headless usage:</p>
                  <ol className="list-decimal pl-6">
                    <li>Configure CORS settings in the Drupal.js backend</li>
                    <li>Generate API keys for external applications</li>
                    <li>Use the REST API or GraphQL to fetch content</li>
                    <li>Implement your own frontend using any technology (React, Vue, etc.)</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="performance">
                <AccordionTrigger>Performance and Optimization</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">Caching Strategies</h3>
                  <p>Drupal.js implements various caching mechanisms to improve performance:</p>
                  <ul className="list-disc pl-6">
                    <li>Page caching for anonymous users</li>
                    <li>Block caching for reusable components</li>
                    <li>API response caching</li>
                    <li>Database query caching</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Asset Optimization</h3>
                  <p>To optimize frontend assets:</p>
                  <ol className="list-decimal pl-6">
                    <li>Enable CSS and JavaScript aggregation in the performance settings</li>
                    <li>Use the built-in image optimization tools</li>
                    <li>Implement lazy loading for images and other media</li>
                    <li>Utilize the code splitting features of React for faster initial load times</li>
                  </ol>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Database Optimization</h3>
                  <p>Keep your Drupal.js site running smoothly with these database optimization tips:</p>
                  <ul className="list-disc pl-6">
                    <li>Regularly run database cleanup tasks</li>
                    <li>Optimize database indexes for frequently used queries</li>
                    <li>Use query monitoring tools to identify and fix slow queries</li>
                    <li>Consider using a database caching layer like Redis for high-traffic sites</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Scaling Drupal.js</h3>
                  <p>For high-traffic sites, consider these scaling strategies:</p>
                  <ul className="list-disc pl-6">
                    <li>Implement a load balancer for distributing traffic across multiple servers</li>
                    <li>Use a content delivery network (CDN) for static assets</li>
                    <li>Set up a reverse proxy cache like Varnish</li>
                    <li>Optimize your hosting environment for Node.js applications</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security">
                <AccordionTrigger>Security Best Practices</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">User Authentication and Authorization</h3>
                  <p>Drupal.js provides robust user management features:</p>
                  <ul className="list-disc pl-6">
                    <li>Role-based access control</li>
                    <li>Secure password hashing</li>
                    <li>Two-factor authentication support</li>
                    <li>Session management and secure cookie handling</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Input Validation and Sanitization</h3>
                  <p>To prevent security vulnerabilities:</p>
                  <ul className="list-disc pl-6">
                    <li>Always validate and sanitize user input</li>
                    <li>Use parameterized queries to prevent SQL injection</li>
                    <li>Implement CSRF protection for forms</li>
                    <li>Use content security policies to mitigate XSS attacks</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Regular Updates</h3>
                  <p>Keep your Drupal.js installation secure by:</p>
                  <ul className="list-disc pl-6">
                    <li>Regularly updating Drupal.js core</li>
                    <li>Keeping all plugins and themes up to date</li>
                    <li>Monitoring security advisories and applying patches promptly</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Server-side Security</h3>
                  <p>Ensure your hosting environment is secure:</p>
                  <ul className="list-disc pl-6">
                    <li>Use HTTPS for all connections</li>
                    <li>Implement proper firewall rules</li>
                    <li>Regularly update your server software and dependencies</li>
                    <li>Use secure file permissions</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="troubleshooting">
                <AccordionTrigger>Troubleshooting and Support</AccordionTrigger>
                <AccordionContent>
                  <h3 className="text-xl font-semibold mb-2">Common Issues and Solutions</h3>
                  <ul className="list-disc pl-6">
                    <li>
                      <strong>White screen of death:</strong> Check PHP error logs and increase memory limit if necessary.
                    </li>
                    <li>
                      <strong>Database connection errors:</strong> Verify database credentials in the configuration file.
                    </li>
                    <li>
                      <strong>Slow performance:</strong> Enable caching, optimize database queries, and check for problematic plugins.
                    </li>
                    <li>
                      <strong>Plugin conflicts:</strong> Disable plugins one by one to identify the source of the conflict.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Debugging Tools</h3>
                  <p>Drupal.js provides several tools to help with debugging:</p>
                  <ul className="list-disc pl-6">
                    <li>Built-in error logging and reporting</li>
                    <li>Development mode for detailed error messages</li>
                    <li>Database query log for identifying performance issues</li>
                    <li>React Developer Tools for frontend debugging</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-4 mb-2">Getting Support</h3>
                  <p>If you need additional help:</p>
                  <ul className="list-disc pl-6">
                    <li>Check the official Drupal.js documentation</li>
                    <li>Visit the Drupal.js community forums</li>
                    <li>Submit bug reports or feature requests on GitHub</li>
                    <li>Consider professional support options for enterprise users</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </div>

        <div className="md:col-span-1">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Documentation Chatbot</h2>
            <form onSubmit={handleChatbotSubmit}>
              <Input
                type="text"
                placeholder="Ask a question about Drupal.js"
                value={chatbotInput}
                onChange={(e) => setChatbotInput(e.target.value)}
                className="mb-2"
              />
              <Button type="submit">Ask</Button>
            </form>
            {chatbotResponse && (
              <div className="mt-4">
                <h3 className="font-semibold">Response:</h3>
                <p>{chatbotResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Documentation;