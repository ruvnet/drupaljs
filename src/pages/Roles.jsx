import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    const storedRoles = JSON.parse(localStorage.getItem('roles')) || [
      { id: 1, name: 'Administrator', description: 'Full access to all features' },
      { id: 2, name: 'Editor', description: 'Can create and edit content' },
      { id: 3, name: 'Author', description: 'Can create content' },
      { id: 4, name: 'Subscriber', description: 'Can view content' }
    ];
    setRoles(storedRoles);
  }, []);

  const saveRoles = (updatedRoles) => {
    localStorage.setItem('roles', JSON.stringify(updatedRoles));
    setRoles(updatedRoles);
  };

  const handleAddRole = () => {
    if (newRole.name.trim()) {
      const updatedRoles = [...roles, { ...newRole, id: Date.now() }];
      saveRoles(updatedRoles);
      setNewRole({ name: '', description: '' });
      setIsDialogOpen(false);
      toast.success('Role added successfully');
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRole({ name: role.name, description: role.description });
    setIsDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (newRole.name.trim()) {
      const updatedRoles = roles.map(role => 
        role.id === editingRole.id ? { ...role, ...newRole } : role
      );
      saveRoles(updatedRoles);
      setNewRole({ name: '', description: '' });
      setIsDialogOpen(false);
      setEditingRole(null);
      toast.success('Role updated successfully');
    }
  };

  const handleDeleteRole = (id) => {
    const updatedRoles = roles.filter(role => role.id !== id);
    saveRoles(updatedRoles);
    toast.success('Role deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Roles</h1>
        <Button asChild>
          <Link to="/people">Back to People</Link>
        </Button>
      </div>
      <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> Add Role
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.description}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingRole ? handleUpdateRole : handleAddRole}>
              {editingRole ? 'Update' : 'Add'} Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Roles;
