import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BasicInfo({ plugin, handleInputChange }) {
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

export function Features({ features, handleArrayInputChange, addArrayItem, removeArrayItem }) {
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

export function Technical({ plugin, handleArrayInputChange, addArrayItem, removeArrayItem }) {
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

export function Advanced({ plugin, handleInputChange, handleArrayInputChange, addArrayItem, removeArrayItem }) {
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