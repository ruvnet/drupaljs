import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Edit, Save, X } from 'lucide-react';

const EditableSection = ({ content, onSave, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onSave(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="mb-4">
          {type === 'text' ? (
            <ReactQuill theme="snow" value={editedContent} onChange={setEditedContent} />
          ) : (
            <Input
              type={type}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full"
            />
          )}
          <div className="mt-2">
            <Button onClick={handleSave} size="sm" className="mr-2">
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {type === 'text' ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <h1 className="text-3xl font-bold mb-4">{content}</h1>
          )}
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </>
      )}
    </div>
  );
};

export default EditableSection;