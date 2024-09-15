import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DeploymentForm({ platforms, deploymentSettings, handlePlatformChange, handleSettingChange, handleSaveSettings }) {
  const renderPlatformSettings = () => {
    switch (deploymentSettings.platform) {
      case 'cloudflare':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="accountId">Cloudflare Account ID</Label>
              <Input
                id="accountId"
                value={deploymentSettings.settings.accountId || ''}
                onChange={(e) => handleSettingChange('accountId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={deploymentSettings.settings.projectName || ''}
                onChange={(e) => handleSettingChange('projectName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={deploymentSettings.settings.apiToken || ''}
                onChange={(e) => handleSettingChange('apiToken', e.target.value)}
              />
            </div>
          </>
        );
      case 'gcp':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="projectId">GCP Project ID</Label>
              <Input
                id="projectId"
                value={deploymentSettings.settings.projectId || ''}
                onChange={(e) => handleSettingChange('projectId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
              <Input
                id="serviceAccountKey"
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleSettingChange('serviceAccountKey', event.target.result);
                  };
                  reader.readAsText(file);
                }}
              />
            </div>
          </>
        );
      case 'aws':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
              <Input
                id="accessKeyId"
                value={deploymentSettings.settings.accessKeyId || ''}
                onChange={(e) => handleSettingChange('accessKeyId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={deploymentSettings.settings.secretAccessKey || ''}
                onChange={(e) => handleSettingChange('secretAccessKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">AWS Region</Label>
              <Input
                id="region"
                value={deploymentSettings.settings.region || ''}
                onChange={(e) => handleSettingChange('region', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3Bucket">S3 Bucket Name</Label>
              <Input
                id="s3Bucket"
                value={deploymentSettings.settings.s3Bucket || ''}
                onChange={(e) => handleSettingChange('s3Bucket', e.target.value)}
              />
            </div>
          </>
        );
      case 'azure':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="subscriptionId">Azure Subscription ID</Label>
              <Input
                id="subscriptionId"
                value={deploymentSettings.settings.subscriptionId || ''}
                onChange={(e) => handleSettingChange('subscriptionId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourceGroup">Resource Group</Label>
              <Input
                id="resourceGroup"
                value={deploymentSettings.settings.resourceGroup || ''}
                onChange={(e) => handleSettingChange('resourceGroup', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appName">App Service Name</Label>
              <Input
                id="appName"
                value={deploymentSettings.settings.appName || ''}
                onChange={(e) => handleSettingChange('appName', e.target.value)}
              />
            </div>
          </>
        );
      case 'github':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="repoName">Repository Name</Label>
              <Input
                id="repoName"
                value={deploymentSettings.settings.repoName || ''}
                onChange={(e) => handleSettingChange('repoName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                value={deploymentSettings.settings.branch || ''}
                onChange={(e) => handleSettingChange('branch', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalAccessToken">Personal Access Token</Label>
              <Input
                id="personalAccessToken"
                type="password"
                value={deploymentSettings.settings.personalAccessToken || ''}
                onChange={(e) => handleSettingChange('personalAccessToken', e.target.value)}
              />
            </div>
          </>
        );
      case 'vercel':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="vercelProjectId">Vercel Project ID</Label>
              <Input
                id="vercelProjectId"
                value={deploymentSettings.settings.vercelProjectId || ''}
                onChange={(e) => handleSettingChange('vercelProjectId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vercelToken">Vercel Token</Label>
              <Input
                id="vercelToken"
                type="password"
                value={deploymentSettings.settings.vercelToken || ''}
                onChange={(e) => handleSettingChange('vercelToken', e.target.value)}
              />
            </div>
          </>
        );
      case 'replit':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="replitUsername">Replit Username</Label>
              <Input
                id="replitUsername"
                value={deploymentSettings.settings.replitUsername || ''}
                onChange={(e) => handleSettingChange('replitUsername', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replitSlug">Repl Slug</Label>
              <Input
                id="replitSlug"
                value={deploymentSettings.settings.replitSlug || ''}
                onChange={(e) => handleSettingChange('replitSlug', e.target.value)}
              />
            </div>
          </>
        );
      case 'custom':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="dockerRegistry">Docker Registry</Label>
              <Input
                id="dockerRegistry"
                value={deploymentSettings.settings.dockerRegistry || ''}
                onChange={(e) => handleSettingChange('dockerRegistry', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageName">Image Name</Label>
              <Input
                id="imageName"
                value={deploymentSettings.settings.imageName || ''}
                onChange={(e) => handleSettingChange('imageName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dockerUsername">Docker Username</Label>
              <Input
                id="dockerUsername"
                value={deploymentSettings.settings.dockerUsername || ''}
                onChange={(e) => handleSettingChange('dockerUsername', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dockerPassword">Docker Password</Label>
              <Input
                id="dockerPassword"
                type="password"
                value={deploymentSettings.settings.dockerPassword || ''}
                onChange={(e) => handleSettingChange('dockerPassword', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="platform">Deployment Platform</Label>
        <Select
          value={deploymentSettings.platform}
          onValueChange={handlePlatformChange}
        >
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select a platform" />
          </SelectTrigger>
          <SelectContent>
            {platforms.map((platform) => (
              <SelectItem key={platform.id} value={platform.id}>
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {renderPlatformSettings()}
      <Button onClick={handleSaveSettings}>Save Settings</Button>
    </div>
  );
}