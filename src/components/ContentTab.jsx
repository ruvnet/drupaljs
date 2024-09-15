import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

const ContentTab = ({ handleAddSection }) => {
  return (
    <div className="space-y-4">
      <Button onClick={() => handleAddSection('text')}>
        <Plus className="mr-2 h-4 w-4" /> Add Text Section
      </Button>
      <Button onClick={() => handleAddSection('image')}>
        <Plus className="mr-2 h-4 w-4" /> Add Image Section
      </Button>
    </div>
  );
};

export default ContentTab;