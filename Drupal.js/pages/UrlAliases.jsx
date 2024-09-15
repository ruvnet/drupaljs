import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function UrlAliases() {
  const [urlAliases, setUrlAliases] = useState([]);
  const [newAlias, setNewAlias] = useState({ source: '', alias: '' });

  useEffect(() => {
    const storedUrlAliases = JSON.parse(localStorage.getItem('urlAliases')) || [];
    setUrlAliases(storedUrlAliases);
  }, []);

  const saveUrlAliases = (updatedUrlAliases) => {
    localStorage.setItem('urlAliases', JSON.stringify(updatedUrlAliases));
    setUrlAliases(updatedUrlAliases);
  };

  const handleAddAlias = () => {
    if (newAlias.source.trim() && newAlias.alias.trim()) {
      const updatedUrlAliases = [...urlAliases, { id: Date.now(), ...newAlias }];
      saveUrlAliases(updatedUrlAliases);
      setNewAlias({ source: '', alias: '' });
      toast.success('URL alias added successfully');
    }
  };

  const handleDeleteAlias = (id) => {
    const updatedUrlAliases = urlAliases.filter(a => a.id !== id);
    saveUrlAliases(updatedUrlAliases);
    toast.success('URL alias deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">URL Aliases</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Source path"
          value={newAlias.source}
          onChange={(e) => setNewAlias({ ...newAlias, source: e.target.value })}
        />
        <Input
          placeholder="Alias"
          value={newAlias.alias}
          onChange={(e) => setNewAlias({ ...newAlias, alias: e.target.value })}
        />
        <Button onClick={handleAddAlias}>
          <Plus className="mr-2 h-4 w-4" /> Add Alias
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Path</TableHead>
            <TableHead>Alias</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {urlAliases.map((alias) => (
            <TableRow key={alias.id}>
              <TableCell>{alias.source}</TableCell>
              <TableCell>{alias.alias}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteAlias(alias.id)}>
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

export default UrlAliases;