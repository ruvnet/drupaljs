import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PluginCard from '@/components/PluginCard';
import { FileText, ShoppingCart, BarChart2 } from 'lucide-react';

const pluginCategories = {
  contentManagement: [
    { name: "Advanced Editor", description: "Enhanced content editing capabilities", icon: <FileText className="h-6 w-6" /> },
    { name: "Media Manager", description: "Organize and optimize your media files", icon: <FileText className="h-6 w-6" /> },
  ],
  ecommerce: [
    { name: "Shop System", description: "Set up an online store with ease", icon: <ShoppingCart className="h-6 w-6" /> },
    { name: "Payment Gateway", description: "Secure payment processing for your store", icon: <ShoppingCart className="h-6 w-6" /> },
  ],
  analytics: [
    { name: "Traffic Insights", description: "Detailed analytics for your website traffic", icon: <BarChart2 className="h-6 w-6" /> },
    { name: "User Behavior", description: "Track and analyze user interactions", icon: <BarChart2 className="h-6 w-6" /> },
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
