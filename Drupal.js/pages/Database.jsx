import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

function Database() {
  const [tables, setTables] = useState([]);
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    // Simulating fetching database tables from an API
    const fetchTables = async () => {
      // In a real scenario, this would be an API call to /Drupal.js/api/database/tables
      const mockTables = [
        { name: 'users', rows: 1000, size: '5 MB' },
        { name: 'content', rows: 5000, size: '20 MB' },
        { name: 'comments', rows: 10000, size: '15 MB' },
        { name: 'taxonomy', rows: 500, size: '2 MB' },
      ];
      setTables(mockTables);
    };

    fetchTables();
  }, []);

  const handleOptimizeTable = async (tableName) => {
    // Simulating API call to optimize a table
    // In a real scenario, this would be a POST request to /Drupal.js/api/database/optimize
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating API delay

    toast.success(`Table ${tableName} optimized successfully`);
  };

  const handleOptimizeAllTables = async () => {
    setIsOptimizeDialogOpen(true);
    // Simulating API call to optimize all tables
    // In a real scenario, this would be a POST request to /Drupal.js/api/database/optimize-all
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulating API delay

    setIsOptimizeDialogOpen(false);
    toast.success('All tables optimized successfully');
  };

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    // Simulating API call to execute SQL query
    // In a real scenario, this would be a POST request to /Drupal.js/api/database/query
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating API delay

    // Mock query result
    const mockResult = {
      columns: ['id', 'username', 'email'],
      rows: [
        [1, 'john_doe', 'john@example.com'],
        [2, 'jane_smith', 'jane@example.com'],
      ],
    };

    setQueryResult(mockResult);
    toast.success('Query executed successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Database Management</h1>
        <Button asChild>
          <Link to="/utilities">Back to Utilities</Link>
        </Button>
      </div>

      <div className="flex space-x-4 mb-6">
        <Button onClick={handleOptimizeAllTables}>Optimize All Tables</Button>
        <Button onClick={() => setIsQueryDialogOpen(true)}>Execute SQL Query</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>List of all database tables with actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.name}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.rows}</TableCell>
                  <TableCell>{table.size}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleOptimizeTable(table.name)}>
                      Optimize
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOptimizeDialogOpen} onOpenChange={setIsOptimizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Optimizing All Tables</DialogTitle>
            <DialogDescription>
              This process may take several minutes. Please do not close this window.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Execute SQL Query</DialogTitle>
            <DialogDescription>
              Enter your SQL query below. Be cautious with write operations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter your SQL query here"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleExecuteQuery}>Execute Query</Button>
          </div>
          {queryResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Query Result:</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryResult.columns.map((column, index) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsQueryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Database;