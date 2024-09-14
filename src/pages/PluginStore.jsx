import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import CreatePlugin from '@/components/CreatePlugin';
import ManagePlugins from '@/components/ManagePlugins';
import PluginHero from '@/components/PluginHero';
import PluginCategories from '@/components/PluginCategories';
import PluginModal from '@/components/PluginModal';
import BrowsePlugins from '@/components/BrowsePlugins';

const defaultInstalledPlugins = [
  { name: "SEO Optimizer", description: "Improve your site's search engine rankings", icon: "Search" },
  { name: "Security Shield", description: "Enhance your site's security measures", icon: "Shield" },
  { name: "Performance Booster", description: "Optimize your site's loading speed", icon: "Zap" },
];

function PluginStore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
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
    toast.success(`${plugin.name} has been installed successfully!`);
  };

  const handleUninstall = (plugin) => {
    const updatedInstalledPlugins = installedPlugins.filter(p => p.name !== plugin.name);
    setInstalledPlugins(updatedInstalledPlugins);
    localStorage.setItem('installedPlugins', JSON.stringify(updatedInstalledPlugins));
    toast.success(`${plugin.name} has been uninstalled successfully!`);
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
          <PluginHero setActiveTab={setActiveTab} />
          <PluginCategories onViewDetails={setSelectedPlugin} />
        </TabsContent>
        <TabsContent value="installed">
          <BrowsePlugins
            plugins={installedPlugins}
            installedPlugins={installedPlugins}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onViewDetails={setSelectedPlugin}
          />
        </TabsContent>
        <TabsContent value="browse">
          <BrowsePlugins
            plugins={defaultInstalledPlugins.concat(customPlugins)}
            installedPlugins={installedPlugins}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onViewDetails={setSelectedPlugin}
          />
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
