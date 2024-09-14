import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const pluginCategories = {
  content: [
    { name: "Advanced WYSIWYG Editor", description: "Rich text editing with advanced formatting options" },
    { name: "Content Versioning", description: "Track and manage content revisions" },
    { name: "Media Library", description: "Centralized media management system" },
    { name: "Content Scheduler", description: "Schedule content publication and expiration" },
    { name: "Multilingual Content", description: "Manage content in multiple languages" },
    { name: "Content Workflow", description: "Define and manage content approval workflows" }
  ],
  seo: [
    { name: "SEO Toolkit", description: "Comprehensive SEO optimization tools" },
    { name: "XML Sitemap Generator", description: "Automatically generate and update sitemaps" },
    { name: "Meta Tag Manager", description: "Customize meta tags for better SEO" },
    { name: "Redirect Manager", description: "Manage 301 redirects and avoid 404 errors" },
    { name: "Schema Markup", description: "Add structured data to improve search results" },
    { name: "SEO Analytics", description: "Track and analyze SEO performance" }
  ],
  ecommerce: [
    { name: "Product Catalog", description: "Manage and display product listings" },
    { name: "Shopping Cart", description: "Add shopping cart functionality to your site" },
    { name: "Payment Gateway Integration", description: "Connect with popular payment providers" },
    { name: "Order Management", description: "Track and manage customer orders" },
    { name: "Inventory Management", description: "Keep track of product stock levels" },
    { name: "Customer Reviews", description: "Allow customers to leave product reviews" }
  ],
  security: [
    { name: "Two-Factor Authentication", description: "Add an extra layer of security to user accounts" },
    { name: "Security Audit Log", description: "Track and log all security-related events" },
    { name: "Firewall", description: "Protect your site from malicious attacks" },
    { name: "CAPTCHA", description: "Prevent spam and bot submissions" },
    { name: "SSL Manager", description: "Easily manage SSL certificates" },
    { name: "Password Policy", description: "Enforce strong password requirements" }
  ],
  performance: [
    { name: "Caching System", description: "Improve site speed with advanced caching" },
    { name: "Image Optimization", description: "Automatically optimize uploaded images" },
    { name: "Lazy Loading", description: "Improve page load times with lazy loading" },
    { name: "CDN Integration", description: "Easily integrate with content delivery networks" },
    { name: "Database Optimizer", description: "Optimize database queries for better performance" },
    { name: "Minification", description: "Minify CSS, JavaScript, and HTML" }
  ],
  analytics: [
    { name: "Google Analytics Integration", description: "Easy integration with Google Analytics" },
    { name: "Heatmap Tracking", description: "Visualize user behavior on your site" },
    { name: "A/B Testing", description: "Run A/B tests to optimize your content" },
    { name: "Custom Reports", description: "Generate custom analytics reports" },
    { name: "User Flow Visualization", description: "Track and visualize user journeys" },
    { name: "Conversion Tracking", description: "Monitor and optimize conversion rates" }
  ]
};

const installedPlugins = [
  { name: "Basic SEO Tools", category: "SEO" },
  { name: "Simple Cache", category: "Performance" },
  { name: "Contact Form", category: "Content" },
];

function PluginCard({ plugin }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{plugin.name}</CardTitle>
        <CardDescription>{plugin.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">Install</Button>
      </CardContent>
    </Card>
  );
}

function PluginStore() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Plugin Store</h1>
      <div className="mb-6">
        <Input 
          type="text" 
          placeholder="Search plugins..." 
          className="w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Tabs defaultValue="installed">
        <TabsList className="mb-4">
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="installed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installedPlugins.map((plugin, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle>{plugin.name}</CardTitle>
                  <Badge>{plugin.category}</Badge>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Uninstall</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {Object.entries(pluginCategories).map(([category, plugins]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins
                .filter(plugin => 
                  plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((plugin, index) => (
                  <PluginCard key={index} plugin={plugin} />
                ))
              }
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default PluginStore;
