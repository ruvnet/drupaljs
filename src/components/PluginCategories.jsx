import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, ShoppingCart, Shield, Zap, BarChart2, Image, Globe, Users, Bell, Calendar, Puzzle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const categories = [
  { 
    name: "Content Management", 
    icon: <FileText className="h-8 w-8" />, 
    description: "Enhance your content creation and management capabilities",
    examples: ["Advanced Editor", "Content Versioning", "Workflow Management"]
  },
  { 
    name: "SEO", 
    icon: <Search className="h-8 w-8" />, 
    description: "Improve your site's search engine visibility",
    examples: ["XML Sitemap Generator", "Meta Tag Manager", "Schema.org Markup"]
  },
  { 
    name: "E-commerce", 
    icon: <ShoppingCart className="h-8 w-8" />, 
    description: "Add online store functionality to your CMS",
    examples: ["Product Catalog", "Shopping Cart", "Payment Gateway Integration"]
  },
  { 
    name: "Security", 
    icon: <Shield className="h-8 w-8" />, 
    description: "Protect your site from threats and vulnerabilities",
    examples: ["Two-Factor Authentication", "Firewall", "Security Audit Log"]
  },
  { 
    name: "Performance", 
    icon: <Zap className="h-8 w-8" />, 
    description: "Optimize your site for speed and efficiency",
    examples: ["Caching System", "Image Optimization", "Lazy Loading"]
  },
  { 
    name: "Analytics", 
    icon: <BarChart2 className="h-8 w-8" />, 
    description: "Gain insights into your site's traffic and user behavior",
    examples: ["Custom Dashboard", "User Flow Visualization", "Conversion Tracking"]
  },
  { 
    name: "Media Management", 
    icon: <Image className="h-8 w-8" />, 
    description: "Efficiently handle and organize media files",
    examples: ["Bulk Media Upload", "Image Editor", "Digital Asset Management"]
  },
  { 
    name: "Multilingual", 
    icon: <Globe className="h-8 w-8" />, 
    description: "Add support for multiple languages to your site",
    examples: ["Content Translation", "Language Switcher", "RTL Support"]
  },
  { 
    name: "User Management", 
    icon: <Users className="h-8 w-8" />, 
    description: "Enhance user registration, roles, and permissions",
    examples: ["Social Login", "User Profile Customization", "Role-based Access Control"]
  },
  { 
    name: "Notifications", 
    icon: <Bell className="h-8 w-8" />, 
    description: "Keep users informed with various notification systems",
    examples: ["Email Notifications", "Push Notifications", "In-app Alerts"]
  },
  { 
    name: "Events and Booking", 
    icon: <Calendar className="h-8 w-8" />, 
    description: "Manage events and reservations on your site",
    examples: ["Event Calendar", "Ticket Booking System", "Appointment Scheduler"]
  },
  { 
    name: "Integrations", 
    icon: <Puzzle className="h-8 w-8" />, 
    description: "Connect your CMS with external services and APIs",
    examples: ["CRM Integration", "Social Media Auto-posting", "Payment Gateway Connectors"]
  }
];

function PluginCategories({ onViewDetails }) {
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">Popular Plugin Categories</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{category.description}</CardDescription>
              <div className="mt-4">
                <strong className="text-sm">Popular plugins:</strong>
                <ul className="list-disc list-inside text-sm mt-2">
                  {category.examples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => onViewDetails(category)}
              >
                View Plugins
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PluginCategories;
