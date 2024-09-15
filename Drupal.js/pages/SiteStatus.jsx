import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function SiteStatus() {
  const [statusItems, setStatusItems] = useState([]);

  useEffect(() => {
    const fetchStatusItems = async () => {
      // In a real scenario, this would be an API call to /Drupal.js/api/site-status
      const mockStatusItems = [
        { id: 1, name: 'Drupal.js Core', status: 'ok', message: 'Up to date' },
        { id: 2, name: 'Database', status: 'warning', message: 'Running low on disk space' },
        { id: 3, name: 'File System', status: 'ok', message: 'Writable and accessible' },
        { id: 4, name: 'Cron', status: 'error', message: 'Last run: 3 days ago' },
        { id: 5, name: 'Updates', status: 'warning', message: '2 modules have available updates' },
      ];
      setStatusItems(mockStatusItems);
    };

    fetchStatusItems();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Site Status</h1>
        <Button asChild>
          <Link to="/reports">Back to Reports</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Overview of your site's health and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{getStatusIcon(item.status)}</TableCell>
                  <TableCell>{item.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SiteStatus;