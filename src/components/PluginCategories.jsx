import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, ShoppingCart, Shield, Zap, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

const categories = [
  { name: "Content Management", icon: <FileText className="h-8 w-8" />, description: "Enhance your content creation and management capabilities" },
  { name: "SEO", icon: <Search className="h-8 w-8" />, description: "Improve your site's search engine visibility" },
  { name: "E-commerce", icon: <ShoppingCart className="h-8 w-8" />, description: "Add online store functionality to your CMS" },
  { name: "Security", icon: <Shield className="h-8 w-8" />, description: "Protect your site from threats and vulnerabilities" },
  { name: "Performance", icon: <Zap className="h-8 w-8" />, description: "Optimize your site for speed and efficiency" },
  { name: "Analytics", icon: <BarChart2 className="h-8 w-8" />, description: "Gain insights into your site's traffic and user behavior" },
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
