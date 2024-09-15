import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CSSEditor = ({ value, onChange }) => {
  return (
    <div>
      <Label>Custom CSS</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
        rows={10}
        placeholder="Enter custom CSS here"
      />
    </div>
  );
};

export default CSSEditor;