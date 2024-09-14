import React, { useState, useEffect } from 'react';
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

function PluginStore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [customPlugins, setCustomPlugins] = useState([]);

  useEffect(() => {
    const storedInstalledPlugins = JSON.parse(localStorage.getItem('installedPlugins')) || defaultInstalledPlugins;
    const storedCustomPlugins = JSON.parse(localStorage.getItem('customPlugins')) || [];
    setInstalledPlugins(storedInstalledPlugins);
    setCustomPlugins(storedCustomPlugins);
  }, []);

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
      <Tabs defaultValue="home">
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
              <PluginCard key={index} plugin={plugin} isInstalled={true} onUninstall={handleUninstall} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(pluginCategories).flatMap(([category, plugins]) => 
              plugins
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
                  />
                ))
            )}
          </div>
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
    </div>
  );
}

export default PluginStore;
