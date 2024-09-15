import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ColorPicker = ({ color, onChange, label }) => {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center mt-2">
        <Input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 p-1 mr-2"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-grow"
        />
      </div>
    </div>
  );
};

export default ColorPicker;