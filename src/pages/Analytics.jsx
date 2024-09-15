import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [pageViews, setPageViews] = useState([]);
  const [topPages, setTopPages] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // In a real scenario, this would be an API call to /Drupal.js/api/analytics
      const mockPageViews = [
        { date: '2023-03-09', views: 1200 },
        { date: '2023-03-10', views: 1500 },
        { date: '2023-03-11', views: 1800 },
        { date: '2023-03-12', views: 1600 },
        { date: '2023-03-13', views: 2000 },
        { date: '2023-03-14', views: 2200 },
        { date: '2023-03-15', views: 1900 },
      ];
      setPageViews(mockPageViews);

      const mockTopPages = [
        { page: '/home', views: 5000 },
        { page: '/about', views: 3000 },
        { page: '/products', views: 2500 },
        { page: '/blog', views: 2000 },
        { page: '/contact', views: 1500 },
      ];
      setTopPages(mockTopPages);
    };

    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Traffic Analytics</h1>
        <Button asChild>
          <Link to="/reports">Back to Reports</Link>
        </Button>
      </div>
      <div className="mb-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Views Over Time</CardTitle>
            <CardDescription>Daily page views for the selected time range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pageViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most viewed pages for the selected time range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;