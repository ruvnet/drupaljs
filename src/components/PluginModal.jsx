import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2 } from 'lucide-react';

function PluginModal({ plugin, onClose, onInstall, onUninstall, isInstalled }) {
  const handleInstall = () => {
    onInstall(plugin);
    onClose();
  };

  const handleUninstall = () => {
    onUninstall(plugin);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {plugin.icon}
            {plugin.name}
          </DialogTitle>
          <DialogDescription>
            {plugin.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {plugin.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {plugin.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          {plugin.version && (
            <p className="text-sm text-gray-500 mb-2">Version: {plugin.version}</p>
          )}
          {plugin.author && (
            <p className="text-sm text-gray-500 mb-2">Author: {plugin.author}</p>
          )}
          {plugin.features && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="list-disc list-inside">
                {plugin.features.map((feature, index) => (
                  <li key={index} className="text-sm">{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          {isInstalled ? (
            <Button variant="destructive" onClick={handleUninstall}>
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall
            </Button>
          ) : (
            <Button onClick={handleInstall}>
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PluginModal;
