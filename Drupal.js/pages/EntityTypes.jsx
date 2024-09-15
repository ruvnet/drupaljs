import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function EntityTypes() {
  const [entityTypes, setEntityTypes] = useState([]);
  const [newEntityType, setNewEntityType] = useState('');

  useEffect(() => {
    const storedEntityTypes = JSON.parse(localStorage.getItem('entityTypes')) || [];
    setEntityTypes(storedEntityTypes);
  }, []);

  const saveEntityTypes = (updatedEntityTypes) => {
    localStorage.setItem('entityTypes', JSON.stringify(updatedEntityTypes));
    setEntityTypes(updatedEntityTypes);
  };

  const handleAddEntityType = () => {
    if (newEntityType.trim()) {
      const updatedEntityTypes = [...entityTypes, { id: Date.now(), name: newEntityType.trim() }];
      saveEntityTypes(updatedEntityTypes);
      setNewEntityType('');
      toast.success('Entity type added successfully');
    }
  };

  const handleDeleteEntityType = (id) => {
    const updatedEntityTypes = entityTypes.filter(et => et.id !== id);
    saveEntityTypes(updatedEntityTypes);
    toast.success('Entity type deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Entity Types</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New entity type name"
          value={newEntityType}
          onChange={(e) => setNewEntityType(e.target.value)}
        />
        <Button onClick={handleAddEntityType}>
          <Plus className="mr-2 h-4 w-4" /> Add Entity Type
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entityTypes.map((entityType) => (
            <TableRow key={entityType.id}>
              <TableCell>{entityType.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteEntityType(entityType.id)}>
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

export default EntityTypes;