import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { DeploymentForm } from '@/components/DeploymentForm';
import { DeploymentStatus } from '@/components/DeploymentStatus';

const platforms = [
  { id: 'cloudflare', name: 'Cloudflare Pages' },
  { id: 'gcp', name: 'Google Cloud Platform' },
  { id: 'aws', name: 'Amazon Web Services' },
  { id: 'azure', name: 'Microsoft Azure' },
  { id: 'github', name: 'GitHub Pages' },
  { id: 'vercel', name: 'Vercel' },
  { id: 'replit', name: 'Replit' },
  { id: 'custom', name: 'Custom (Docker)' },
];

function Deployment() {
  const [deploymentSettings, setDeploymentSettings] = useState({
    platform: '',
    settings: {},
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('deploymentSettings'));
    if (storedSettings) {
      setDeploymentSettings(storedSettings);
    }
  }, []);

  const handlePlatformChange = (platformId) => {
    setDeploymentSettings(prev => ({
      ...prev,
      platform: platformId,
      settings: {},
    }));
  };

  const handleSettingChange = (key, value) => {
    setDeploymentSettings(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('deploymentSettings', JSON.stringify(deploymentSettings));
    toast.success('Deployment settings saved successfully');
  };

  const handleDeploy = async () => {
    toast.success('Deployment started. This may take a few minutes.');
    // Simulating API call
    // await fetch('/Drupal.js/api/deploy', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(deploymentSettings),
    // });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Deployment Settings</h1>
        <Button asChild>
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configure Deployment</CardTitle>
          <CardDescription>Set up your deployment settings for various platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <DeploymentForm
                platforms={platforms}
                deploymentSettings={deploymentSettings}
                handlePlatformChange={handlePlatformChange}
                handleSettingChange={handleSettingChange}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>
            <TabsContent value="deploy">
              <DeploymentStatus
                deploymentSettings={deploymentSettings}
                platforms={platforms}
                handleDeploy={handleDeploy}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Deployment;
