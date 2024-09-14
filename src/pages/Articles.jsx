import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Articles() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const filteredArticles = articles.filter(article => 
    (filter === 'all' || article.status === filter) &&
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content</h1>
        <Link to="/articles/new">
          <Button>Add content</Button>
        </Link>
      </div>
      <div className="mb-4 flex space-x-4">
        <Input 
          placeholder="Search content..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Content type</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Operations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredArticles.map(article => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.type}</TableCell>
              <TableCell>{article.author}</TableCell>
              <TableCell>{article.status}</TableCell>
              <TableCell>{article.updated}</TableCell>
              <TableCell>
                <Link to={`/articles/edit/${article.id}`} className="text-blue-600 hover:underline mr-2">Edit</Link>
                <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:underline">Delete</button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Articles;
