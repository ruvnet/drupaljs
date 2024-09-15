import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

function MediaTypes() {
  const [mediaTypes, setMediaTypes] = useState([]);
  const [newMediaType, setNewMediaType] = useState('');

  useEffect(() => {
    const storedMediaTypes = JSON.parse(localStorage.getItem('mediaTypes')) || [];
    setMediaTypes(storedMediaTypes);
  }, []);

  const handleAddMediaType = () => {
    if (newMediaType) {
      const newType = {
        id: Date.now(),
        name: newMediaType,
      };
      const updatedMediaTypes = [...mediaTypes, newType];
      setMediaTypes(updatedMediaTypes);
      localStorage.setItem('mediaTypes', JSON.stringify(updatedMediaTypes));
      setNewMediaType('');
      toast.success('New media type added successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Media Types</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Media Type</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="Media Type Name"
            value={newMediaType}
            onChange={(e) => setNewMediaType(e.target.value)}
          />
          <Button onClick={handleAddMediaType}>Add Media Type</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle>{type.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Edit Media Type</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MediaTypes;