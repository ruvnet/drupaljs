import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, ShoppingCart, Shield, Zap, BarChart2, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const pluginCategories = {
  content: [
    { name: "Advanced WYSIWYG Editor", description: "Rich text editing with advanced formatting options", icon: <FileText className="h-5 w-5" /> },
    { name: "Content Versioning", description: "Track and manage content revisions", icon: <FileText className="h-5 w-5" /> },
    { name: "Media Library", description: "Centralized media management system", icon: <FileText className="h-5 w-5" /> },
    { name: "Content Scheduler", description: "Schedule content publication and expiration", icon: <FileText className="h-5 w-5" /> },
    { name: "Multilingual Content", description: "Manage content in multiple languages", icon: <FileText className="h-5 w-5" /> },
    { name: "Content Workflow", description: "Define and manage content approval workflows", icon: <FileText className="h-5 w-5" /> }
  ],
  seo: [
    { name: "SEO Toolkit", description: "Comprehensive SEO optimization tools", icon: <Search className="h-5 w-5" /> },
    { name: "XML Sitemap Generator", description: "Automatically generate and update sitemaps", icon: <Search className="h-5 w-5" /> },
    { name: "Meta Tag Manager", description: "Customize meta tags for better SEO", icon: <Search className="h-5 w-5" /> },
    { name: "Redirect Manager", description: "Manage 301 redirects and avoid 404 errors", icon: <Search className="h-5 w-5" /> },
    { name: "Schema Markup", description: "Add structured data to improve search results", icon: <Search className="h-5 w-5" /> },
    { name: "SEO Analytics", description: "Track and analyze SEO performance", icon: <Search className="h-5 w-5" /> }
  ],
  ecommerce: [
    { name: "Product Catalog", description: "Manage and display product listings", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Shopping Cart", description: "Add shopping cart functionality to your site", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Payment Gateway Integration", description: "Connect with popular payment providers", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Order Management", description: "Track and manage customer orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Inventory Management", description: "Keep track of product stock levels", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Customer Reviews", description: "Allow customers to leave product reviews", icon: <ShoppingCart className="h-5 w-5" /> }
  ],
  security: [
    { name: "Two-Factor Authentication", description: "Add an extra layer of security to user accounts", icon: <Shield className="h-5 w-5" /> },
    { name: "Security Audit Log", description: "Track and log all security-related events", icon: <Shield className="h-5 w-5" /> },
    { name: "Firewall", description: "Protect your site from malicious attacks", icon: <Shield className="h-5 w-5" /> },
    { name: "CAPTCHA", description: "Prevent spam and bot submissions", icon: <Shield className="h-5 w-5" /> },
    { name: "SSL Manager", description: "Easily manage SSL certificates", icon: <Shield className="h-5 w-5" /> },
    { name: "Password Policy", description: "Enforce strong password requirements", icon: <Shield className="h-5 w-5" /> }
  ],
  performance: [
    { name: "Caching System", description: "Improve site speed with advanced caching", icon: <Zap className="h-5 w-5" /> },
    { name: "Image Optimization", description: "Automatically optimize uploaded images", icon: <Zap className="h-5 w-5" /> },
    { name: "Lazy Loading", description: "Improve page load times with lazy loading", icon: <Zap className="h-5 w-5" /> },
    { name: "CDN Integration", description: "Easily integrate with content delivery networks", icon: <Zap className="h-5 w-5" /> },
    { name: "Database Optimizer", description: "Optimize database queries for better performance", icon: <Zap className="h-5 w-5" /> },
    { name: "Minification", description: "Minify CSS, JavaScript, and HTML", icon: <Zap className="h-5 w-5" /> }
  ],
  analytics: [
    { name: "Google Analytics Integration", description: "Easy integration with Google Analytics", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Heatmap Tracking", description: "Visualize user behavior on your site", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "A/B Testing", description: "Run A/B tests to optimize your content", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Custom Reports", description: "Generate custom analytics reports", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "User Flow Visualization", description: "Track and visualize user journeys", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Conversion Tracking", description: "Monitor and optimize conversion rates", icon: <BarChart2 className="h-5 w-5" /> }
  ]
};

const installedPlugins = [
  { name: "Basic SEO Tools", category: "SEO", icon: <Search className="h-5 w-5" /> },
  { name: "Simple Cache", category: "Performance", icon: <Zap className="h-5 w-5" /> },
  { name: "Contact Form", category: "Content", icon: <FileText className="h-5 w-5" /> },
];

function PluginCard({ plugin, isInstalled }) {
  const handleInstall = () => {
    toast.success(`${plugin.name} has been installed successfully!`);
  };

  const handleUninstall = () => {
    toast.success(`${plugin.name} has been uninstalled successfully!`);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plugin.icon}
          {plugin.name}
        </CardTitle>
        <CardDescription>{plugin.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isInstalled ? (
          <Button variant="outline" className="w-full" onClick={handleUninstall}>
            <Trash2 className="mr-2 h-4 w-4" />
            Uninstall
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        )}
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
              <PluginCard key={index} plugin={plugin} isInstalled={true} />
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
                  <PluginCard key={index} plugin={plugin} isInstalled={false} />
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
