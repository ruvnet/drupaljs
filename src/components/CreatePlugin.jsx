import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

function CreatePlugin({ onAddPlugin }) {
  const [plugin, setPlugin] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    author: '',
    website: '',
    category: '',
    features: [],
    dependencies: [],
    installSteps: [],
    configOptions: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPlugin(prevPlugin => ({ ...prevPlugin, [name]: value }));
  };

  const handleArrayInputChange = (index, field, value, arrayName) => {
    setPlugin(prevPlugin => {
      const updatedArray = [...prevPlugin[arrayName]];
      updatedArray[index] = { ...updatedArray[index], [field]: value };
      return { ...prevPlugin, [arrayName]: updatedArray };
    });
  };

  const addArrayItem = (arrayName) => {
    setPlugin(prevPlugin => ({
      ...prevPlugin,
      [arrayName]: [...prevPlugin[arrayName], {}]
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setPlugin(prevPlugin => ({
      ...prevPlugin,
      [arrayName]: prevPlugin[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (plugin.name && plugin.description) {
      onAddPlugin({ ...plugin, id: Date.now() });
      toast.success('Custom plugin created successfully!');
      setPlugin({
        name: '',
        description: '',
        version: '1.0.0',
        author: '',
        website: '',
        category: '',
        features: [],
        dependencies: [],
        installSteps: [],
        configOptions: [],
      });
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Plugin</CardTitle>
        <CardDescription>Define the details of your custom plugin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
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
            </TabsContent>
            
            <TabsContent value="features">
              <div className="space-y-4">
                {plugin.features.map((feature, index) => (
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
                {plugin.dependencies.map((dependency, index) => (
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
                {plugin.installSteps.map((step, index) => (
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
                {plugin.configOptions.map((option, index) => (
                  <div key={index} className="space-y-2">
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
            </TabsContent>
          </Tabs>
          
          <Button type="submit" className="mt-6">Create Plugin</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreatePlugin;