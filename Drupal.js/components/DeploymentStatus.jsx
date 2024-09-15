import React from 'react';
import { Button } from "@/components/ui/button";

export function DeploymentStatus({ deploymentSettings, platforms, handleDeploy }) {
  return (
    <div className="space-y-4 mt-4">
      <p>Current Platform: {platforms.find(p => p.id === deploymentSettings.platform)?.name || 'Not selected'}</p>
      <Button onClick={handleDeploy} disabled={!deploymentSettings.platform}>
        Deploy to {platforms.find(p => p.id === deploymentSettings.platform)?.name || 'Selected Platform'}
      </Button>
    </div>
  );
}