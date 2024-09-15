import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

function ConfigSync() {
  const [configData, setConfigData] = useState('');

  const handleExport = () => {
    // In a real scenario, this would fetch the current configuration
    const mockExportedConfig = JSON.stringify({
      siteSettings: { name: "My Drupal.js Site", slogan: "A modern Drupal-inspired CMS" },
      theme: { name: "default", primaryColor: "#0077c0" },
      modules: ["core", "content", "user", "menu"]
    }, null, 2);
    
    setConfigData(mockExportedConfig);
    toast.success('Configuration exported successfully');
  };

  const handleImport = () => {
    try {
      JSON.parse(configData);
      // In a real scenario, this would apply the imported configuration
      toast.success('Configuration imported successfully');
    } catch (error) {
      toast.error('Invalid configuration format');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configuration Synchronization</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Button onClick={handleExport} className="mr-2">Export Configuration</Button>
          <Button onClick={handleImport}>Import Configuration</Button>
        </div>
        <Textarea
          value={configData}
          onChange={(e) => setConfigData(e.target.value)}
          placeholder="Paste configuration data here for import, or view exported configuration."
          rows={10}
        />
      </div>
    </div>
  );
}

export default ConfigSync;