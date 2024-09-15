import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

function Views() {
  const [views, setViews] = useState([]);
  const [newViewName, setNewViewName] = useState('');

  useEffect(() => {
    const storedViews = JSON.parse(localStorage.getItem('views')) || [];
    setViews(storedViews);
  }, []);

  const handleAddView = () => {
    if (newViewName) {
      const newView = {
        id: Date.now(),
        name: newViewName,
      };
      const updatedViews = [...views, newView];
      setViews(updatedViews);
      localStorage.setItem('views', JSON.stringify(updatedViews));
      setNewViewName('');
      toast.success('New view added successfully');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Views</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New View</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="View Name"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
          />
          <Button onClick={handleAddView}>Add View</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {views.map((view) => (
          <Card key={view.id}>
            <CardHeader>
              <CardTitle>{view.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline">Edit View</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Views;