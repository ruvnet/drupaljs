import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PluginCard from '@/components/PluginCard';
import { FileText, Search, ShoppingCart, Shield, Zap, BarChart2, Image, Globe, Users, Bell, Calendar, Puzzle } from 'lucide-react';

const pluginCategories = {
  contentManagement: [
    { name: "Advanced Editor", description: "Enhanced content editing capabilities", icon: <FileText className="h-6 w-6" /> },
    { name: "Media Manager", description: "Organize and optimize your media files", icon: <FileText className="h-6 w-6" /> },
    { name: "Content Versioning", description: "Track and manage content revisions", icon: <FileText className="h-6 w-6" /> },
    { name: "Workflow Management", description: "Streamline content approval processes", icon: <FileText className="h-6 w-6" /> },
  ],
  seo: [
    { name: "XML Sitemap Generator", description: "Automatically generate XML sitemaps", icon: <Search className="h-6 w-6" /> },
    { name: "Meta Tag Manager", description: "Optimize meta tags for better SEO", icon: <Search className="h-6 w-6" /> },
    { name: "Schema.org Markup", description: "Add structured data to your content", icon: <Search className="h-6 w-6" /> },
    { name: "SEO Analyzer", description: "Analyze and improve your content's SEO", icon: <Search className="h-6 w-6" /> },
  ],
  ecommerce: [
    { name: "Shop System", description: "Set up an online store with ease", icon: <ShoppingCart className="h-6 w-6" /> },
    { name: "Payment Gateway", description: "Secure payment processing for your store", icon: <ShoppingCart className="h-6 w-6" /> },
    { name: "Product Catalog", description: "Manage and display your product inventory", icon: <ShoppingCart className="h-6 w-6" /> },
    { name: "Order Management", description: "Track and process customer orders", icon: <ShoppingCart className="h-6 w-6" /> },
  ],
  security: [
    { name: "Two-Factor Authentication", description: "Add an extra layer of security", icon: <Shield className="h-6 w-6" /> },
    { name: "Firewall", description: "Protect your site from malicious attacks", icon: <Shield className="h-6 w-6" /> },
    { name: "Security Audit Log", description: "Track all security-related events", icon: <Shield className="h-6 w-6" /> },
    { name: "Anti-Spam", description: "Prevent spam comments and form submissions", icon: <Shield className="h-6 w-6" /> },
  ],
  performance: [
    { name: "Caching System", description: "Improve site speed with advanced caching", icon: <Zap className="h-6 w-6" /> },
    { name: "Image Optimization", description: "Automatically optimize uploaded images", icon: <Zap className="h-6 w-6" /> },
    { name: "Lazy Loading", description: "Improve page load times with lazy loading", icon: <Zap className="h-6 w-6" /> },
    { name: "CDN Integration", description: "Integrate with content delivery networks", icon: <Zap className="h-6 w-6" /> },
  ],
  analytics: [
    { name: "Traffic Insights", description: "Detailed analytics for your website traffic", icon: <BarChart2 className="h-6 w-6" /> },
    { name: "User Behavior", description: "Track and analyze user interactions", icon: <BarChart2 className="h-6 w-6" /> },
    { name: "Custom Dashboard", description: "Create personalized analytics dashboards", icon: <BarChart2 className="h-6 w-6" /> },
    { name: "Conversion Tracking", description: "Monitor and optimize conversion rates", icon: <BarChart2 className="h-6 w-6" /> },
  ],
  mediaManagement: [
    { name: "Bulk Media Upload", description: "Upload multiple files at once", icon: <Image className="h-6 w-6" /> },
    { name: "Image Editor", description: "Edit images directly in the CMS", icon: <Image className="h-6 w-6" /> },
    { name: "Digital Asset Management", description: "Organize and tag media files", icon: <Image className="h-6 w-6" /> },
    { name: "Video Transcoding", description: "Automatically transcode video files", icon: <Image className="h-6 w-6" /> },
  ],
  multilingual: [
    { name: "Content Translation", description: "Translate content into multiple languages", icon: <Globe className="h-6 w-6" /> },
    { name: "Language Switcher", description: "Add a language switcher to your site", icon: <Globe className="h-6 w-6" /> },
    { name: "RTL Support", description: "Support for right-to-left languages", icon: <Globe className="h-6 w-6" /> },
    { name: "Localization Tools", description: "Manage and update translations easily", icon: <Globe className="h-6 w-6" /> },
  ],
  userManagement: [
    { name: "Social Login", description: "Allow users to log in with social accounts", icon: <Users className="h-6 w-6" /> },
    { name: "User Profile Customization", description: "Let users customize their profiles", icon: <Users className="h-6 w-6" /> },
    { name: "Role-based Access Control", description: "Manage user permissions with roles", icon: <Users className="h-6 w-6" /> },
    { name: "User Directory", description: "Create a searchable user directory", icon: <Users className="h-6 w-6" /> },
  ],
  notifications: [
    { name: "Email Notifications", description: "Send automated email notifications", icon: <Bell className="h-6 w-6" /> },
    { name: "Push Notifications", description: "Send browser push notifications", icon: <Bell className="h-6 w-6" /> },
    { name: "In-app Alerts", description: "Display notifications within your app", icon: <Bell className="h-6 w-6" /> },
    { name: "Notification Center", description: "Centralized hub for all notifications", icon: <Bell className="h-6 w-6" /> },
  ],
  eventsAndBooking: [
    { name: "Event Calendar", description: "Display and manage events", icon: <Calendar className="h-6 w-6" /> },
    { name: "Ticket Booking System", description: "Sell tickets for your events", icon: <Calendar className="h-6 w-6" /> },
    { name: "Appointment Scheduler", description: "Allow users to book appointments", icon: <Calendar className="h-6 w-6" /> },
    { name: "Event Registration", description: "Manage event registrations and RSVPs", icon: <Calendar className="h-6 w-6" /> },
  ],
  integrations: [
    { name: "CRM Integration", description: "Connect with popular CRM systems", icon: <Puzzle className="h-6 w-6" /> },
    { name: "Social Media Auto-posting", description: "Automatically post content to social media", icon: <Puzzle className="h-6 w-6" /> },
    { name: "Payment Gateway Connectors", description: "Integrate various payment gateways", icon: <Puzzle className="h-6 w-6" /> },
    { name: "API Toolkit", description: "Build custom integrations with external services", icon: <Puzzle className="h-6 w-6" /> },
  ],
};

function BrowsePlugins({ plugins, installedPlugins, onInstall, onUninstall, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterPlugins = (pluginsToFilter) => {
    return pluginsToFilter.filter(plugin => 
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const allPlugins = plugins || Object.values(pluginCategories).flat();

  return (
    <div>
      <Input 
        type="text" 
        placeholder="Search plugins..." 
        className="w-full max-w-md mb-6"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.keys(pluginCategories).map(category => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(pluginCategories).map(([category, categoryPlugins]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterPlugins(categoryPlugins).map((plugin, index) => (
                <PluginCard 
                  key={`${category}-${index}`}
                  plugin={plugin} 
                  isInstalled={installedPlugins.some(p => p.name === plugin.name)}
                  onInstall={onInstall}
                  onUninstall={onUninstall}
                  onViewDetails={() => onViewDetails(plugin)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterPlugins(allPlugins).map((plugin, index) => (
              <PluginCard 
                key={index}
                plugin={plugin} 
                isInstalled={installedPlugins.some(p => p.name === plugin.name)}
                onInstall={onInstall}
                onUninstall={onUninstall}
                onViewDetails={() => onViewDetails(plugin)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BrowsePlugins;
