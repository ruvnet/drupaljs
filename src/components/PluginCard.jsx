import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';

function PluginCard({ plugin, isInstalled, onInstall, onUninstall, onViewDetails }) {
  const handleInstall = () => {
    onInstall(plugin);
    toast.success(`${plugin.name} has been installed successfully!`);
  };

  const handleUninstall = () => {
    onUninstall(plugin);
    toast.success(`${plugin.name} has been uninstalled successfully!`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {plugin.icon}
          {plugin.name}
        </CardTitle>
        <CardDescription>{plugin.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="flex flex-wrap gap-2 mb-4">
          {plugin.tags && plugin.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {isInstalled ? (
            <Button variant="outline" className="flex-grow" onClick={handleUninstall}>
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall
            </Button>
          ) : (
            <Button variant="outline" className="flex-grow" onClick={handleInstall}>
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          )}
          <Button variant="secondary" onClick={onViewDetails}>
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PluginCard;
