import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";

const DesignTab = ({ pageData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="templateColor">Template Color</Label>
        <ColorPicker
          id="templateColor"
          color={pageData.templateColor}
          onChange={(color) => handleChange('templateColor', color)}
        />
      </div>
      <div>
        <Label htmlFor="customCSS">Custom CSS</Label>
        <Input
          id="customCSS"
          value={pageData.customCSS}
          onChange={(e) => handleChange('customCSS', e.target.value)}
          placeholder="Enter custom CSS"
        />
      </div>
    </div>
  );
};

export default DesignTab;