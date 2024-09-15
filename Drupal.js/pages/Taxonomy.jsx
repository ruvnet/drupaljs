import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Taxonomy() {
  const [taxonomies, setTaxonomies] = useState([]);
  const [newTaxonomy, setNewTaxonomy] = useState('');

  useEffect(() => {
    const storedTaxonomies = JSON.parse(localStorage.getItem('taxonomies')) || [];
    setTaxonomies(storedTaxonomies);
  }, []);

  const saveTaxonomies = (updatedTaxonomies) => {
    localStorage.setItem('taxonomies', JSON.stringify(updatedTaxonomies));
    setTaxonomies(updatedTaxonomies);
  };

  const handleAddTaxonomy = () => {
    if (newTaxonomy.trim()) {
      const updatedTaxonomies = [...taxonomies, { id: Date.now(), name: newTaxonomy.trim() }];
      saveTaxonomies(updatedTaxonomies);
      setNewTaxonomy('');
      toast.success('Taxonomy added successfully');
    }
  };

  const handleDeleteTaxonomy = (id) => {
    const updatedTaxonomies = taxonomies.filter(t => t.id !== id);
    saveTaxonomies(updatedTaxonomies);
    toast.success('Taxonomy deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Taxonomy</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New taxonomy name"
          value={newTaxonomy}
          onChange={(e) => setNewTaxonomy(e.target.value)}
        />
        <Button onClick={handleAddTaxonomy}>
          <Plus className="mr-2 h-4 w-4" /> Add Taxonomy
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
          {taxonomies.map((taxonomy) => (
            <TableRow key={taxonomy.id}>
              <TableCell>{taxonomy.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteTaxonomy(taxonomy.id)}>
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
