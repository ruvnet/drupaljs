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
    if (editingPlugin.name && editing
Plugin.description) {
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

function BasicInfo({ plugin, handleInputChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Plugin Name</Label>
        <Input id="name" name="name" value={plugin.name} onChange={handleInputChange} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={plugin.description} onChange={handleInputChange} required />
      </div>
      <div>
        <Label htmlFor="version">Version</Label>
        <Input id="version" name="version" value={plugin.version} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="author">Author</Label>
        <Input id="author" name="author" value={plugin.author} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" value={plugin.website} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" value={plugin.category} onChange={handleInputChange} />
      </div>
    </div>
  );
}

function Features({ features, handleArrayInputChange, addArrayItem, removeArrayItem }) {
  return (
    <div className="space-y-4">
      {features.map((feature, index) => (
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
  );
}

function Technical({ plugin, handleArrayInputChange, addArrayItem, removeArrayItem }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-2">Dependencies</h4>
        {plugin.dependencies.map((dependency, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
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
      
      <div>
        <h4 className="text-lg font-semibold mb-2">Installation Steps</h4>
        {plugin.installSteps.map((step, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
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
      
      <div>
        <h4 className="text-lg font-semibold mb-2">Configuration Options</h4>
        {plugin.configOptions.map((option, index) => (
          <div key={index} className="space-y-2 mb-4">
            <Input
              value={option.name || ''}
              onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'configOptions')}
              placeholder="Option name"
            />
            <Input
              value={option.description || ''}
              onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'configOptions')}
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
    </div>
  );
}

function Advanced({ plugin, handleInputChange, handleArrayInputChange, addArrayItem, removeArrayItem }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-2">Hooks</h4>
        {plugin.hooks.map((hook, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={hook.name || ''}
              onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'hooks')}
              placeholder="Hook name"
            />
            <Input
              value={hook.description || ''}
              onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'hooks')}
              placeholder="Hook description"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(index, 'hooks')}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addArrayItem('hooks')}>
          <Plus className="mr-2 h-4 w-4" /> Add Hook
        </Button>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-2">Permissions</h4>
        {plugin.permissions.map((permission, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <Input
              value={permission.name || ''}
              onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'permissions')}
              placeholder="Permission name"
            />
            <Input
              value={permission.description || ''}
              onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'permissions')}
              placeholder="Permission description"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem(index, 'permissions')}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addArrayItem('permissions')}>
          <Plus className="mr-2 h-4 w-4" /> Add Permission
        </Button>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-2">Custom Fields</h4>
        {plugin.customFields.map((field, index) => (
          <div key={index} className="space-y-2 mb-4">
            <Input
              value={field.name || ''}
              onChange={(e) => handleArrayInputChange(index, 'name', e.target.value, 'customFields')}
              placeholder="Field name"
            />
            <Select
              value={field.type || ''}
              onValueChange={(value) => handleArrayInputChange(index, 'type', value, 'customFields')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="select">Select</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={field.description || ''}
              onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'customFields')}
              placeholder="Field description"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeArrayItem(index, 'customFields')}>
              <Minus className="mr-2 h-4 w-4" /> Remove Field
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addArrayItem('customFields')}>
          <Plus className="mr-2 h-4 w-4" /> Add Custom Field
        </Button>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold mb-2">API Endpoints</h4>
        {plugin.apiEndpoints.map((endpoint, index) => (
          <div key={index} className="space-y-2 mb-4">
            <Input
              value={endpoint.path || ''}
              onChange={(e) => handleArrayInputChange(index, 'path', e.target.value, 'apiEndpoints')}
              placeholder="API path"
            />
            <Select
              value={endpoint.method || ''}
              onValueChange={(value) => handleArrayInputChange(index, 'method', value, 'apiEndpoints')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select HTTP method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={endpoint.description || ''}
              onChange={(e) => handleArrayInputChange(index, 'description', e.target.value, 'apiEndpoints')}
              placeholder="Endpoint description"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeArrayItem(index, 'apiEndpoints')}>
              <Minus className="mr-2 h-4 w-4" /> Remove Endpoint
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addArrayItem('apiEndpoints')}>
          <Plus className="mr-2 h-4 w-4" /> Add API Endpoint
        </Button>
      </div>
      
      <div>
        <Label htmlFor="documentation">Documentation</Label>
        <Textarea
          id="documentation"
          name="documentation"
          value={plugin.documentation}
          onChange={handleInputChange}
          placeholder="Provide detailed documentation for your plugin"
          rows={5}
        />
      </div>
      
      <div>
        <Label htmlFor="changelog">Changelog</Label>
        <Textarea
          id="changelog"
          name="changelog"
          value={plugin.changelog}
          onChange={handleInputChange}
          placeholder="List changes and updates for each version"
          rows={5}
        />
      </div>
      
      <div>
        <Label htmlFor="license">License</Label>
        <Select
          id="license"
          name="license"
          value={plugin.license}
          onValueChange={(value) => handleInputChange({ target: { name: 'license', value } })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a license" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MIT">MIT License</SelectItem>
            <SelectItem value="Apache-2.0">Apache License 2.0</SelectItem>
            <SelectItem value="GPL-3.0">GNU General Public License v3.0</SelectItem>
            <SelectItem value="BSD-3-Clause">BSD 3-Clause License</SelectItem>
            <SelectItem value="Custom">Custom License</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default ManagePlugins;
