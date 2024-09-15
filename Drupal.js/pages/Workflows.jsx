import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [newWorkflow, setNewWorkflow] = useState('');

  useEffect(() => {
    const storedWorkflows = JSON.parse(localStorage.getItem('workflows')) || [];
    setWorkflows(storedWorkflows);
  }, []);

  const saveWorkflows = (updatedWorkflows) => {
    localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
    setWorkflows(updatedWorkflows);
  };

  const handleAddWorkflow = () => {
    if (newWorkflow.trim()) {
      const updatedWorkflows = [...workflows, { id: Date.now(), name: newWorkflow.trim() }];
      saveWorkflows(updatedWorkflows);
      setNewWorkflow('');
      toast.success('Workflow added successfully');
    }
  };

  const handleDeleteWorkflow = (id) => {
    const updatedWorkflows = workflows.filter(w => w.id !== id);
    saveWorkflows(updatedWorkflows);
    toast.success('Workflow deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workflows</h1>
        <Button asChild>
          <Link to="/structure">Back to Structure</Link>
        </Button>
      </div>
      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="New workflow name"
          value={newWorkflow}
          onChange={(e) => setNewWorkflow(e.target.value)}
        />
        <Button onClick={handleAddWorkflow}>
          <Plus className="mr-2 h-4 w-4" /> Add Workflow
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
          {workflows.map((workflow) => (
            <TableRow key={workflow.id}>
              <TableCell>{workflow.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteWorkflow(workflow.id)}>
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

export default Workflows;