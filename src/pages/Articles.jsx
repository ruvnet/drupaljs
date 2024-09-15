import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Articles() {
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content</h1>
        <Button>Add content</Button>
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
          {articles.map(article => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.type}</TableCell>
              <TableCell>{article.author}</TableCell>
              <TableCell>{article.status}</TableCell>
              <TableCell>{article.updated}</TableCell>
              <TableCell>
                <Link to={`/articles/edit/${article.id}`} className="text-blue-600 hover:underline">Edit</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Articles;
