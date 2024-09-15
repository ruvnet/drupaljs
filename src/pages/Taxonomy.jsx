import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Taxonomy() {
  const [vocabularies, setVocabularies] = useState([]);
  const [newVocabulary, setNewVocabulary] = useState('');

  useEffect(() => {
    const storedVocabularies = JSON.parse(localStorage.getItem('vocabularies')) || [];
    setVocabularies(storedVocabularies);
  }, []);

  const saveVocabularies = (updatedVocabularies) => {
    localStorage.setItem('vocabularies', JSON.stringify(updatedVocabularies));
    setVocabularies(updatedVocabularies);
  };

  const handleAddVocabulary = () => {
    if (newVocabulary.trim()) {
      const updatedVocabularies = [...vocabularies, { id: Date.now(), name: newVocabulary.trim(), terms: [] }];
      saveVocabularies(updatedVocabularies);
      setNewVocabulary('');
      toast.success('Vocabulary added successfully');
    }
  };

  const handleDeleteVocabulary = (id) => {
    const updatedVocabularies = vocabularies.filter(v => v.id !== id);
    saveVocabularies(updatedVocabularies);
    toast.success('Vocabulary deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Taxonomy</h1>
        <Button asChild>
          <Link to="/Drupal.js/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New vocabulary name"
          value={newVocabulary}
          onChange={(e) => setNewVocabulary(e.target.value)}
        />
        <Button onClick={handleAddVocabulary}>
          <Plus className="mr-2 h-4 w-4" /> Add Vocabulary
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Terms</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vocabularies.map((vocabulary) => (
            <TableRow key={vocabulary.id}>
              <TableCell>{vocabulary.name}</TableCell>
              <TableCell>{vocabulary.terms.length} terms</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/Drupal.js/structure/taxonomy/${vocabulary.id}`}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteVocabulary(vocabulary.id)}>
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

export default Taxonomy;
