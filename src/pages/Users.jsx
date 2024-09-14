import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', roleId: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [
      { id: 1, username: 'admin', email: 'admin@example.com', roleId: 1 },
      { id: 2, username: 'editor', email: 'editor@example.com', roleId: 2 },
      { id: 3, username: 'author', email: 'author@example.com', roleId: 3 },
      { id: 4, username: 'subscriber', email: 'subscriber@example.com', roleId: 4 }
    ];
    setUsers(storedUsers);

    const storedRoles = JSON.parse(localStorage.getItem('roles')) || [
      { id: 1, name: 'Administrator' },
      { id: 2, name: 'Editor' },
      { id: 3, name: 'Author' },
      { id: 4, name: 'Subscriber' }
    ];
    setRoles(storedRoles);
  }, []);

  const saveUsers = (updatedUsers) => {
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const handleAddUser = () => {
    if (newUser.username && newUser.email && newUser.roleId) {
      const updatedUsers = [...users, { ...newUser, id: Date.now() }];
      saveUsers(updatedUsers);
      setNewUser({ username: '', email: '', roleId: '' });
      setIsDialogOpen(false);
      toast.success('User added successfully');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({ username: user.username, email: user.email, roleId: user.roleId });
    setIsDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (newUser.username && newUser.email && newUser.roleId) {
      const updatedUsers = users.map(user => 
        user.id === editingUser.id ? { ...user, ...newUser } : user
      );
      saveUsers(updatedUsers);
      setNewUser({ username: '', email: '', roleId: '' });
      setIsDialogOpen(false);
      setEditingUser(null);
      toast.success('User updated successfully');
    }
  };

  const handleDeleteUser = (id) => {
    const updatedUsers = users.filter(user => user.id !== id);
    saveUsers(updatedUsers);
    toast.success('User deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button asChild>
          <Link to="/people">Back to People</Link>
        </Button>
      </div>
      <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> Add User
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{roles.find(role => role.id === user.roleId)?.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
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
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={newUser.roleId.toString()}
                onValueChange={(value) => setNewUser({ ...newUser, roleId: Number(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
              {editingUser ? 'Update' : 'Add'} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Users;
