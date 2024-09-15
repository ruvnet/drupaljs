import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Settings, Edit, Eye, Save } from 'lucide-react';

const ActionButtons = ({ isEditing, setIsEditing, handleSave, id }) => {
  return (
    <div className="fixed right-4 top-4 space-y-2">
      <Button asChild>
        <Link to={`/content/edit/${id}`}>
          <Settings className="mr-2 h-4 w-4" /> Advanced Edit
        </Link>
      </Button>
      <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
        {isEditing ? 'Preview' : 'Quick Edit'}
      </Button>
      {isEditing && (
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;