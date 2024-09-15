import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MetaTab = ({ pageData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="metaTitle">Meta Title</Label>
        <Input
          id="metaTitle"
          value={pageData.metaTitle}
          onChange={(e) => handleChange('metaTitle', e.target.value)}
          placeholder="Enter meta title"
        />
      </div>
      <div>
        <Label htmlFor="metaDescription">Meta Description</Label>
        <Input
          id="metaDescription"
          value={pageData.metaDescription}
          onChange={(e) => handleChange('metaDescription', e.target.value)}
          placeholder="Enter meta description"
        />
      </div>
    </div>
  );
};

export default MetaTab;