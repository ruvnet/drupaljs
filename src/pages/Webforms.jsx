import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Webforms() {
  const [webforms, setWebforms] = useState([]);
  const [newWebform, setNewWebform] = useState('');

  useEffect(() => {
    const storedWebforms = JSON.parse(localStorage.getItem('webforms')) || [];
    setWebforms(storedWebforms);
  }, []);

  const saveWebforms = (updatedWebforms) => {
    localStorage.setItem('webforms', JSON.stringify(updatedWebforms));
    setWebforms(updatedWebforms);
  };

  const handleAddWebform = () => {
    if (newWebform.trim()) {
      const updatedWebforms = [...webforms, { id: Date.now(), name: newWebform.trim() }];
      saveWebforms(updatedWebforms);
      setNewWebform('');
      toast.success('Webform added successfully');
    }
  };

  const handleDeleteWebform = (id) => {
    const updatedWebforms = webforms.filter(w => w.id !== id);
    saveWebforms(updatedWebforms);
    toast.success('Webform deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Webforms</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New webform name"
          value={newWebform}
          onChange={(e) => setNewWebform(e.target.value)}
        />
        <Button onClick={handleAddWebform}>
          <Plus className="mr-2 h-4 w-4" /> Add Webform
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
          {webforms.map((webform) => (
            <TableRow key={webform.id}>
              <TableCell>{webform.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteWebform(webform.id)}>
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

export default Webforms;