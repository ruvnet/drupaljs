import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';

function Permissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const storedRoles = JSON.parse(localStorage.getItem('roles')) || [];
    const storedPermissions = JSON.parse(localStorage.getItem('permissions')) || [];
    setRoles(storedRoles);
    setPermissions(storedPermissions);
  }, []);

  const savePermissions = (updatedPermissions) => {
    localStorage.setItem('permissions', JSON.stringify(updatedPermissions));
    setPermissions(updatedPermissions);
  };

  const handlePermissionChange = (roleId, permissionName, isChecked) => {
    const updatedPermissions = permissions.map(permission => {
      if (permission.roleId === roleId) {
        return {
          ...permission,
          permissions: {
            ...permission.permissions,
            [permissionName]: isChecked
          }
        };
      }
      return permission;
    });

    if (!updatedPermissions.some(p => p.roleId === roleId)) {
      updatedPermissions.push({
        roleId,
        permissions: { [permissionName]: isChecked }
      });
    }

    savePermissions(updatedPermissions);
    toast.success('Permissions updated successfully');
  };

  const getPermissionValue = (roleId, permissionName) => {
    const rolePermissions = permissions.find(p => p.roleId === roleId);
    return rolePermissions?.permissions[permissionName] || false;
  };

  const permissionList = [
    'Create Content',
    'Edit Content',
    'Delete Content',
    'Manage Users',
    'Manage Roles',
    'Manage Settings'
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permissions</h1>
        <Button asChild>
          <Link to="/people">Back to People</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            {roles.map(role => (
              <TableHead key={role.id}>{role.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissionList.map(permission => (
            <TableRow key={permission}>
              <TableCell>{permission}</TableCell>
              {roles.map(role => (
                <TableCell key={`${role.id}-${permission}`}>
                  <Checkbox
                    checked={getPermissionValue(role.id, permission)}
                    onCheckedChange={(checked) => handlePermissionChange(role.id, permission, checked)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Permissions;