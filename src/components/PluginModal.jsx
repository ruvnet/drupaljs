import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2 } from 'lucide-react';

function PluginModal({ plugin, category, onClose, onInstall, onUninstall, isInstalled }) {
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
            {plugin?.icon}
            {plugin?.name || category?.name}
          </DialogTitle>
          <DialogDescription>
            {plugin?.description || category?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {plugin?.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {plugin.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          {/* Add more details about the plugin or category here */}
        </div>
        <DialogFooter>
          {plugin && (
            isInstalled ? (
              <Button variant="destructive" onClick={handleUninstall}>
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall
              </Button>
            ) : (
              <Button onClick={handleInstall}>
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
            )
          )}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PluginModal;