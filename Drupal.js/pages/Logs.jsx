import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      // In a real scenario, this would be an API call to /Drupal.js/api/logs
      const mockLogs = [
        { id: 1, type: 'info', message: 'User login successful', timestamp: '2023-03-15 10:30:00' },
        { id: 2, type: 'warning', message: 'Failed login attempt', timestamp: '2023-03-15 11:15:00' },
        { id: 3, type: 'error', message: 'Database connection failed', timestamp: '2023-03-15 12:00:00' },
        { id: 4, type: 'info', message: 'Content updated', timestamp: '2023-03-15 13:45:00' },
        { id: 5, type: 'warning', message: 'Low disk space', timestamp: '2023-03-15 14:30:00' },
      ];
      setLogs(mockLogs);
    };

    fetchLogs();
  }, []);

  const filteredLogs = logType === 'all' ? logs : logs.filter(log => log.type === logType);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recent Log Messages</h1>
        <Button asChild>
          <Link to="/reports">Back to Reports</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>Review recent system events and errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select log type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.type}</TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Logs;