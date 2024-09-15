import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Menus() {
  const [menus, setMenus] = useState([]);
  const [newMenu, setNewMenu] = useState('');

  useEffect(() => {
    const storedMenus = JSON.parse(localStorage.getItem('menus')) || [];
    setMenus(storedMenus);
  }, []);

  const saveMenus = (updatedMenus) => {
    localStorage.setItem('menus', JSON.stringify(updatedMenus));
    setMenus(updatedMenus);
  };

  const handleAddMenu = () => {
    if (newMenu.trim()) {
      const updatedMenus = [...menus, { id: Date.now(), name: newMenu.trim() }];
      saveMenus(updatedMenus);
      setNewMenu('');
      toast.success('Menu added successfully');
    }
  };

  const handleDeleteMenu = (id) => {
    const updatedMenus = menus.filter(m => m.id !== id);
    saveMenus(updatedMenus);
    toast.success('Menu deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menus</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New menu name"
          value={newMenu}
          onChange={(e) => setNewMenu(e.target.value)}
        />
        <Button onClick={handleAddMenu}>
          <Plus className="mr-2 h-4 w-4" /> Add Menu
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
          {menus.map((menu) => (
            <TableRow key={menu.id}>
              <TableCell>{menu.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteMenu(menu.id)}>
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

export default Menus;
