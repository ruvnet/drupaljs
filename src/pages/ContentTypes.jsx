import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function ContentTypes() {
  const [contentTypes, setContentTypes] = useState([]);
  const [newContentType, setNewContentType] = useState('');

  useEffect(() => {
    const storedContentTypes = JSON.parse(localStorage.getItem('contentTypes')) || [];
    setContentTypes(storedContentTypes);
  }, []);

  const saveContentTypes = (updatedContentTypes) => {
    localStorage.setItem('contentTypes', JSON.stringify(updatedContentTypes));
    setContentTypes(updatedContentTypes);
  };

  const handleAddContentType = () => {
    if (newContentType.trim()) {
      const updatedContentTypes = [...contentTypes, { id: Date.now(), name: newContentType.trim(), fields: [] }];
      saveContentTypes(updatedContentTypes);
      setNewContentType('');
      toast.success('Content type added successfully');
    }
  };

  const handleDeleteContentType = (id) => {
    const updatedContentTypes = contentTypes.filter(ct => ct.id !== id);
    saveContentTypes(updatedContentTypes);
    toast.success('Content type deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Types</h1>
        <Button asChild>
          <Link to="/Drupal.js/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New content type name"
          value={newContentType}
          onChange={(e) => setNewContentType(e.target.value)}
        />
        <Button onClick={handleAddContentType}>
          <Plus className="mr-2 h-4 w-4" /> Add Content Type
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentTypes.map((ct) => (
            <TableRow key={ct.id}>
              <TableCell>{ct.name}</TableCell>
              <TableCell>{ct.fields.length} fields</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/Drupal.js/structure/content-types/${ct.id}`}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteContentType(ct.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ContentTypes;
