import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function RestResources() {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ name: '', path: '' });

  useEffect(() => {
    const storedResources = JSON.parse(localStorage.getItem('restResources')) || [];
    setResources(storedResources);
  }, []);

  const saveResources = (updatedResources) => {
    localStorage.setItem('restResources', JSON.stringify(updatedResources));
    setResources(updatedResources);
  };

  const handleAddResource = () => {
    if (newResource.name.trim() && newResource.path.trim()) {
      const updatedResources = [...resources, { id: Date.now(), ...newResource }];
      saveResources(updatedResources);
      setNewResource({ name: '', path: '' });
      toast.success('REST resource added successfully');
    }
  };

  const handleDeleteResource = (id) => {
    const updatedResources = resources.filter(r => r.id !== id);
    saveResources(updatedResources);
    toast.success('REST resource deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">REST Resources</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Resource name"
          value={newResource.name}
          onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
        />
        <Input
          placeholder="Resource path"
          value={newResource.path}
          onChange={(e) => setNewResource({ ...newResource, path: e.target.value })}
        />
        <Button onClick={handleAddResource}>
          <Plus className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell>{resource.name}</TableCell>
              <TableCell>{resource.path}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteResource(resource.id)}>
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

export default RestResources;