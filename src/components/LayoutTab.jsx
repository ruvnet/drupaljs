import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const LayoutTab = ({ pageData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="layout">Layout</Label>
        <Select
          id="layout"
          value={pageData.layout}
          onValueChange={(value) => handleChange('layout', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="sidebar">Sidebar</SelectItem>
            <SelectItem value="fullwidth">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LayoutTab;