import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';

function Cache() {
  const [cacheStats, setCacheStats] = useState({
    pageCache: { size: '0 MB', items: 0 },
    dataCache: { size: '0 MB', items: 0 },
    menuCache: { size: '0 MB', items: 0 },
  });

  useEffect(() => {
    // Simulating fetching cache stats from an API
    const fetchCacheStats = async () => {
      // In a real scenario, this would be an API call
      // For now, we'll use mock data
      const mockStats = {
        pageCache: { size: '15 MB', items: 1000 },
        dataCache: { size: '5 MB', items: 500 },
        menuCache: { size: '1 MB', items: 50 },
      };
      setCacheStats(mockStats);
    };

    fetchCacheStats();
  }, []);

  const handleClearCache = async (cacheType) => {
    // Simulating an API call to clear cache
    // In a real scenario, this would be a POST request to /Drupal.js/api/cache/clear
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API delay

    // Update local state to reflect cleared cache
    setCacheStats(prevStats => ({
      ...prevStats,
      [cacheType]: { size: '0 MB', items: 0 },
    }));

    toast.success(`${cacheType} cache cleared successfully`);
  };

  const handleClearAllCache = async () => {
    // Simulating an API call to clear all cache
    // In a real scenario, this would be a POST request to /Drupal.js/api/cache/clear-all
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating API delay

    // Update local state to reflect all caches cleared
    setCacheStats({
      pageCache: { size: '0 MB', items: 0 },
      dataCache: { size: '0 MB', items: 0 },
      menuCache: { size: '0 MB', items: 0 },
    });

    toast.success('All caches cleared successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cache Management</h1>
        <Button asChild>
          <Link to="/utilities">Back to Utilities</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cache Overview</CardTitle>
          <CardDescription>Current status of various cache types</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cache Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(cacheStats).map(([cacheType, stats]) => (
                <TableRow key={cacheType}>
                  <TableCell className="font-medium">{cacheType}</TableCell>
                  <TableCell>{stats.size}</TableCell>
                  <TableCell>{stats.items}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleClearCache(cacheType)}>
                      Clear
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button onClick={handleClearAllCache}>Clear All Caches</Button>
    </div>
  );
}

export default Cache;