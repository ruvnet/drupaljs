import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

function Permissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newPermission, setNewPermission] = useState('');

  useEffect(() => {
    // Load roles and permissions from local storage
    const storedRoles = JSON.parse(localStorage.getItem('roles')) || [
      { id: 1, name: 'Administrator', description: 'Full access to all features' },
      { id: 2, name: 'Editor', description: 'Can create and edit content' },
      { id: 3, name: 'Author', description: 'Can create content' },
      { id: 4, name: 'Subscriber', description: 'Can view content' }
    ];
    setRoles(storedRoles);

    const storedPermissions = JSON.parse(localStorage.getItem('permissions')) || [
      { id: 1, name: 'Create Content', description: 'Ability to create new content' },
      { id: 2, name: 'Edit Content', description: 'Ability to edit existing content' },
      { id: 3, name: 'Delete Content', description: 'Ability to delete content' },
      { id: 4, name: 'Manage Users', description: 'Ability to manage user accounts' },
      { id: 5, name: 'Manage Roles', description: 'Ability to manage user roles' },
      { id: 6, name: 'Manage Settings', description: 'Ability to manage site settings' },
      { id: 7, name: 'View Analytics', description: 'Ability to view site analytics' },
      { id: 8, name: 'Moderate Comments', description: 'Ability to moderate user comments' }
    ];
    setPermissions(storedPermissions);

    // Initialize role permissions if not already set
    const rolePermissions = JSON.parse(localStorage.getItem('rolePermissions')) || {};
    if (Object.keys(rolePermissions).length === 0) {
      const initialRolePermissions = {
        1: [1, 2, 3, 4, 5, 6, 7, 8], // Administrator has all permissions
        2: [1, 2, 3, 7, 8], // Editor
        3: [1, 2], // Author
        4: [] // Subscriber
      };
      localStorage.setItem('rolePermissions', JSON.stringify(initialRolePermissions));
    }
  }, []);

  const savePermissions = (updatedPermissions) => {
    localStorage.setItem('permissions', JSON.stringify(updatedPermissions));
    setPermissions(updatedPermissions);
  };

  const handlePermissionChange = (permissionId, isChecked) => {
    if (!selectedRole) return;

    const rolePermissions = JSON.parse(localStorage.getItem('rolePermissions')) || {};
    if (!rolePermissions[selectedRole]) {
      rolePermissions[selectedRole] = [];
    }

    if (isChecked) {
      rolePermissions[selectedRole] = [...new Set([...rolePermissions[selectedRole], permissionId])];
    } else {
      rolePermissions[selectedRole] = rolePermissions[selectedRole].filter(id => id !== permissionId);
    }

    localStorage.setItem('rolePermissions', JSON.stringify(rolePermissions));
    toast.success('Permissions updated successfully');
  };

  const getPermissionValue = (permissionId) => {
    if (!selectedRole) return false;
    const rolePermissions = JSON.parse(localStorage.getItem('rolePermissions')) || {};
    return rolePermissions[selectedRole]?.includes(permissionId) || false;
  };

  const handleAddPermission = () => {
    if (newPermission.trim()) {
      const updatedPermissions = [
        ...permissions,
        { id: permissions.length + 1, name: newPermission.trim(), description: '' }
      ];
      savePermissions(updatedPermissions);
      setNewPermission('');
      toast.success('New permission added successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permissions</h1>
        <Button asChild>
          <Link to="/people">Back to People</Link>
        </Button>
      </div>

      <div className="mb-6">
        <Select onValueChange={(value) => setSelectedRole(Number(value))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Granted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map(permission => (
              <TableRow key={permission.id}>
                <TableCell>{permission.name}</TableCell>
                <TableCell>{permission.description}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={getPermissionValue(permission.id)}
                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Add New Permission</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="New permission name"
            value={newPermission}
            onChange={(e) => setNewPermission(e.target.value)}
          />
          <Button onClick={handleAddPermission}>Add Permission</Button>
        </div>
      </div>
    </div>
  );
}

export default Permissions;
