import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Languages() {
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState({ name: '', code: '' });

  useEffect(() => {
    const storedLanguages = JSON.parse(localStorage.getItem('languages')) || [];
    setLanguages(storedLanguages);
  }, []);

  const saveLanguages = (updatedLanguages) => {
    localStorage.setItem('languages', JSON.stringify(updatedLanguages));
    setLanguages(updatedLanguages);
  };

  const handleAddLanguage = () => {
    if (newLanguage.name.trim() && newLanguage.code.trim()) {
      const updatedLanguages = [...languages, { id: Date.now(), ...newLanguage }];
      saveLanguages(updatedLanguages);
      setNewLanguage({ name: '', code: '' });
      toast.success('Language added successfully');
    }
  };

  const handleDeleteLanguage = (id) => {
    const updatedLanguages = languages.filter(l => l.id !== id);
    saveLanguages(updatedLanguages);
    toast.success('Language deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Languages</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Language name"
          value={newLanguage.name}
          onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
        />
        <Input
          placeholder="Language code"
          value={newLanguage.code}
          onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
        />
        <Button onClick={handleAddLanguage}>
          <Plus className="mr-2 h-4 w-4" /> Add Language
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {languages.map((language) => (
            <TableRow key={language.id}>
              <TableCell>{language.name}</TableCell>
              <TableCell>{language.code}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteLanguage(language.id)}>
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

export default Languages;