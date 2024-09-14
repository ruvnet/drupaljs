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
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="installation">Installation</TabsTrigger>
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Plugin Name</Label>
                    <Input id="name" name="name" value={editingPlugin.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={editingPlugin.description} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input id="version" name="version" value={editingPlugin.version} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" name="author" value={editingPlugin.author} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" value={editingPlugin.website} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" value={editingPlugin.category} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="features">
                <div className="space-y-4">
                  {editingPlugin.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={feature.name || ''}
                        onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'features')}
                        placeholder="Feature name"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(index, 'features')}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addArrayItem('features')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Feature
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="dependencies">
                <div className="space-y-4">
                  {editingPlugin.dependencies.map((dependency, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={dependency.name || ''}
                        onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'dependencies')}
                        placeholder="Dependency name"
                      />
                      <Input
                        value={dependency.version || ''}
                        onChange={(e) => handleArrayInputChange(index, 'version', e.target.value, 'dependencies')}
                        placeholder="Version"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(index, 'dependencies')}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addArrayItem('dependencies')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Dependency
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="installation">
                <div className="space-y-4">
                  {editingPlugin.installSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={step.description || ''}
                        onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'installSteps')}
                        placeholder="Installation step"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(index, 'installSteps')}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addArrayItem('installSteps')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Installation Step
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="configuration">
                <div className="space-y-4">
                  {editingPlugin.configOptions.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <Input
                        value={option.name || ''}
                        onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'configOptions')}
                        placeholder="Option name"
                      />
                      <Input
                        value={option.description || ''}
                        onChange={(e) => handleArrayInputChange(index,
                        'description', e.target.value, 'configOptions')}
                        placeholder="Option description"
                      />
                      <Input
                        value={option.defaultValue || ''}
                        onChange={(e) => handleArrayInputChange(index, 'defaultValue', e.target.value, 'configOptions')}
                        placeholder="Default value"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeArrayItem(index, 'configOptions')}>
                        <Minus className="mr-2 h-4 w-4" /> Remove Option
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addArrayItem('configOptions')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Configuration Option
                  </Button>
                </div>
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