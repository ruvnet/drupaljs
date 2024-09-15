import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockRegion, setNewBlockRegion] = useState('');

  useEffect(() => {
    const storedBlocks = JSON.parse(localStorage.getItem('blocks')) || [
      { id: 1, title: 'Navigation Menu', region: 'header' },
      { id: 2, title: 'Footer Links', region: 'footer' },
      { id: 3, title: 'Sidebar Content', region: 'sidebar' },
    ];
    setBlocks(storedBlocks);
  }, []);

  const handleAddBlock = () => {
    if (newBlockTitle && newBlockRegion) {
      const newBlock = {
        id: Date.now(),
        title: newBlockTitle,
        region: newBlockRegion,
      };
      const updatedBlocks = [...blocks, newBlock];
      setBlocks(updatedBlocks);
      localStorage.setItem('blocks', JSON.stringify(updatedBlocks));
      setNewBlockTitle('');
      setNewBlockRegion('');
      toast.success('New block added successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blocks</h1>
        <Button asChild>
          <Link to="/appearance">Back to Appearance</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Block</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="Block Title"
            value={newBlockTitle}
            onChange={(e) => setNewBlockTitle(e.target.value)}
          />
          <Select value={newBlockRegion} onValueChange={setNewBlockRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddBlock}>Add Block</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => (
          <Card key={block.id}>
            <CardHeader>
              <CardTitle>{block.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Region: {block.region}</p>
              <Button variant="outline" className="mt-2">Edit Block</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Blocks;