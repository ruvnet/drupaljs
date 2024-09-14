import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    const storedRoles = JSON.parse(localStorage.getItem('roles')) || [];
    setRoles(storedRoles);
  }, []);

  const saveRoles = (updatedRoles) => {
    localStorage.setItem('roles', JSON.stringify(updatedRoles));
    setRoles(updatedRoles);
  };

  const handleAddRole = async () => {
    if (newRole.trim()) {
      try {
        // Simulating API call
        // const response = await fetch('/Drupal.js/api/roles', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ name: newRole }),
        // });
        // const data = await response.json();
        const data = { id: Date.now(), name: newRole.trim() };
        
        const updatedRoles = [...roles, data];
        saveRoles(updatedRoles);
        setNewRole('');
        toast.success('Role added successfully');
      } catch (error) {
        toast.error('Failed to add role');
      }
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      // Simulating API call
      // await fetch(`/Drupal.js/api/roles/${id}`, { method: 'DELETE' });
      const updatedRoles = roles.filter(role => role.id !== id);
      saveRoles(updatedRoles);
      toast.success('Role deleted successfully');
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Roles</h1>
        <Button asChild>
          <Link to="/people">Back to People</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New role name"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        />
        <Button onClick={handleAddRole}>
          <Plus className="mr-2 h-4 w-4" /> Add Role
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
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role.id)}>
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

export default Roles;