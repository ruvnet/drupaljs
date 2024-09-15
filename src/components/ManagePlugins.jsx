import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Minus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BasicInfo, Features, Technical, Advanced } from './PluginFormSections';

function ManagePlugins({ plugins, onUpdatePlugin, onDeletePlugin }) {
  const [editingPlugin, setEditingPlugin] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEditPlugin = (plugin) => {
    setEditingPlugin({ ...plugin });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlugin(prevPlugin => ({ ...prevPlugin, [name]: value }));
  };

  const handleArrayInputChange = (index, field, value, arrayName) => {
    setEditingPlugin(prevPlugin => {
      const updatedArray = [...prevPlugin[arrayName]];
      updatedArray[index] = { ...updatedArray[index], [field]: value };
      return { ...prevPlugin, [arrayName]: updatedArray };
    });
  };

  const addArrayItem = (arrayName) => {
    setEditingPlugin(prevPlugin => ({
      ...prevPlugin,
      [arrayName]: [...prevPlugin[arrayName], {}]
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setEditingPlugin(prevPlugin => ({
      ...prevPlugin,
      [arrayName]: prevPlugin[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleUpdatePlugin = () => {
    if (editingPlugin.name && editingPlugin.description) {
      onUpdatePlugin(editingPlugin);
      setIsDialogOpen(false);
      toast.success('Plugin updated successfully!');
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Custom Plugins</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map(plugin => (
          <Card key={plugin.id}>
            <CardHeader>
              <CardTitle>{plugin.name}</CardTitle>
              <CardDescription>{plugin.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => handleEditPlugin(plugin)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" onClick={() => onDeletePlugin(plugin.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Plugin: {editingPlugin?.name}</DialogTitle>
            <DialogDescription>Update the details of your custom plugin</DialogDescription>
          </DialogHeader>
          {editingPlugin && (
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <BasicInfo plugin={editingPlugin} handleInputChange={handleInputChange} />
              </TabsContent>
              
              <TabsContent value="features">
                <Features
                  features={editingPlugin.features}
                  handleArrayInputChange={handleArrayInputChange}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                />
              </TabsContent>
              
              <TabsContent value="technical">
                <Technical
                  plugin={editingPlugin}
                  handleArrayInputChange={handleArrayInputChange}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                />
              </TabsContent>
              
              <TabsContent value="advanced">
                <Advanced
                  plugin={editingPlugin}
                  handleInputChange={handleInputChange}
                  handleArrayInputChange={handleArrayInputChange}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button onClick={handleUpdatePlugin}>Update Plugin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ManagePlugins;
