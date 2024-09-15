import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

const SectionEditor = ({ section, isEditing, onUpdate, onDelete }) => {
  return (
    <div className="mb-4 p-4 border rounded">
      {section.type === 'text' ? (
        <Input
          value={section.content}
          onChange={(e) => onUpdate(section.id, e.target.value)}
          disabled={!isEditing}
          className="mb-2"
        />
      ) : (
        <img src={section.content} alt="Section content" className="mb-2 max-w-full h-auto" />
      )}
      {isEditing && (
        <Button variant="destructive" size="sm" onClick={() => onDelete(section.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete Section
        </Button>
      )}
    </div>
  );
};

export default SectionEditor;