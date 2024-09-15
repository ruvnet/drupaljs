import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

function Backup() {
  const [backups, setBackups] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');

  useEffect(() => {
    // Simulating fetching backups from an API
    const fetchBackups = async () => {
      // In a real scenario, this would be an API call to /Drupal.js/api/backups
      const mockBackups = [
        { id: 1, name: 'Daily Backup', date: '2023-03-15 00:00:00', size: '250 MB' },
        { id: 2, name: 'Weekly Backup', date: '2023-03-12 00:00:00', size: '1.2 GB' },
        { id: 3, name: 'Monthly Backup', date: '2023-03-01 00:00:00', size: '5.5 GB' },
      ];
      setBackups(mockBackups);
    };

    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    // Simulating API call to create a new backup
    // In a real scenario, this would be a POST request to /Drupal.js/api/backups
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating API delay

    const newBackup = {
      id: backups.length + 1,
      name: newBackupName,
      date: new Date().toISOString().replace('T', ' ').substr(0, 19),
      size: '0 MB', // Size would be determined by the server
    };

    setBackups([newBackup, ...backups]);
    setIsCreateDialogOpen(false);
    setNewBackupName('');
    toast.success('Backup created successfully');
  };

  const handleRestoreBackup = async (backupId) => {
    // Simulating API call to restore a backup
    // In a real scenario, this would be a POST request to /Drupal.js/api/backups/{backupId}/restore
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulating API delay

    toast.success('Backup restored successfully');
  };

  const handleDeleteBackup = async (backupId) => {
    // Simulating API call to delete a backup
    // In a real scenario, this would be a DELETE request to /Drupal.js/api/backups/{backupId}
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API delay

    setBackups(backups.filter(backup => backup.id !== backupId));
    toast.success('Backup deleted successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Backup Management</h1>
        <Button asChild>
          <Link to="/utilities">Back to Utilities</Link>
        </Button>
      </div>

      <Button onClick={() => setIsCreateDialogOpen(true)} className="mb-4">Create New Backup</Button>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>List of all backups with actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>{backup.date}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleRestoreBackup(backup.id)}>
                        Restore
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteBackup(backup.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Backup</DialogTitle>
            <DialogDescription>
              Enter a name for your new backup. This process may take several minutes depending on your site's size.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="backup-name" className="text-right">
                Backup Name
              </Label>
              <Input
                id="backup-name"
                value={newBackupName}
                onChange={(e) => setNewBackupName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateBackup}>Create Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Backup;