import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, ShoppingCart, Shield, Zap, BarChart2, Download, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import CreatePlugin from '@/components/CreatePlugin';
import ManagePlugins from '@/components/ManagePlugins';
import PluginCard from '@/components/PluginCard';
import PluginHero from '@/components/PluginHero';
import PluginCategories from '@/components/PluginCategories';
import PluginModal from '@/components/PluginModal';

const defaultInstalledPlugins = [
  { name: "SEO Optimizer", description: "Improve your site's search engine rankings", icon: <Search className="h-6 w-6" /> },
  { name: "Security Shield", description: "Enhance your site's security measures", icon: <Shield className="h-6 w-6" /> },
  { name: "Performance Booster", description: "Optimize your site's loading speed", icon: <Zap className="h-6 w-6" /> },
];

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

function PluginStore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  const [searchTerm, setSearchTerm] = useState('');
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [customPlugins, setCustomPlugins] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState(null);

  useEffect(() => {
    const storedInstalledPlugins = JSON.parse(localStorage.getItem('installedPlugins')) || defaultInstalledPlugins;
    const storedCustomPlugins = JSON.parse(localStorage.getItem('customPlugins')) || [];
    setInstalledPlugins(storedInstalledPlugins);
    setCustomPlugins(storedCustomPlugins);
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleInstall = (plugin) => {
    const updatedInstalledPlugins = [...installedPlugins, plugin];
    setInstalledPlugins(updatedInstalledPlugins);
    localStorage.setItem('installedPlugins', JSON.stringify(updatedInstalledPlugins));
  };

  const handleUninstall = (plugin) => {
    const updatedInstalledPlugins = installedPlugins.filter(p => p.name !== plugin.name);
    setInstalledPlugins(updatedInstalledPlugins);
    localStorage.setItem('installedPlugins', JSON.stringify(updatedInstalledPlugins));
  };

  const handleAddCustomPlugin = (newPlugin) => {
    const updatedCustomPlugins = [...customPlugins, newPlugin];
    setCustomPlugins(updatedCustomPlugins);
    localStorage.setItem('customPlugins', JSON.stringify(updatedCustomPlugins));
  };

  const handleUpdateCustomPlugin = (updatedPlugin) => {
    const updatedCustomPlugins = customPlugins.map(plugin => 
      plugin.id === updatedPlugin.id ? updatedPlugin : plugin
    );
    setCustomPlugins(updatedCustomPlugins);
    localStorage.setItem('customPlugins', JSON.stringify(updatedCustomPlugins));
  };

  const handleDeleteCustomPlugin = (pluginId) => {
    const updatedCustomPlugins = customPlugins.filter(plugin => plugin.id !== pluginId);
    setCustomPlugins(updatedCustomPlugins);
    localStorage.setItem('customPlugins', JSON.stringify(updatedCustomPlugins));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Plugin Store</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="installed">Installed</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="create">Create Plugin</TabsTrigger>
          <TabsTrigger value="manage">Manage Custom Plugins</TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <PluginHero />
          <PluginCategories />
        </TabsContent>
        <TabsContent value="installed">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installedPlugins.map((plugin, index) => (
              <PluginCard 
                key={index} 
                plugin={plugin} 
                isInstalled={true} 
                onUninstall={handleUninstall}
                onViewDetails={() => setSelectedPlugin(plugin)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="browse">
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
            {Object.entries(pluginCategories).map(([category, plugins]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plugins
                    .filter(plugin => 
                      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((plugin, index) => (
                      <PluginCard 
                        key={`${category}-${index}`}
                        plugin={plugin} 
                        isInstalled={installedPlugins.some(p => p.name === plugin.name)}
                        onInstall={handleInstall}
                        onUninstall={handleUninstall}
                        onViewDetails={() => setSelectedPlugin(plugin)}
                      />
                    ))
                  }
                </div>
              </TabsContent>
            ))}
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(pluginCategories).flat()
                  .filter(plugin => 
                    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((plugin, index) => (
                    <PluginCard 
                      key={index}
                      plugin={plugin} 
                      isInstalled={installedPlugins.some(p => p.name === plugin.name)}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onViewDetails={() => setSelectedPlugin(plugin)}
                    />
                  ))
                }
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="create">
          <CreatePlugin onAddPlugin={handleAddCustomPlugin} />
        </TabsContent>
        <TabsContent value="manage">
          <ManagePlugins 
            plugins={customPlugins} 
            onUpdatePlugin={handleUpdateCustomPlugin}
            onDeletePlugin={handleDeleteCustomPlugin}
          />
        </TabsContent>
      </Tabs>
      {selectedPlugin && (
        <PluginModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
          isInstalled={installedPlugins.some(p => p.name === selectedPlugin.name)}
        />
      )}
    </div>
  );
}

export default PluginStore;
