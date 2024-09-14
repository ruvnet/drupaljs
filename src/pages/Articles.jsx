import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockArticles = [
  { id: 1, title: 'Introduction to Drupal', type: 'Blog Post', author: 'John Doe', status: 'published', updated: '2023-03-15' },
  { id: 2, title: 'Creating Custom Modules', type: 'Tutorial', author: 'Jane Smith', status: 'draft', updated: '2023-03-20' },
  { id: 3, title: 'Drupal Security Best Practices', type: 'Article', author: 'Bob Johnson', status: 'published', updated: '2023-03-25' },
  // Add more mock articles here to test pagination
];

function Articles() {
  const [articles] = useState(mockArticles);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 5;
  const navigate = useNavigate();

  const filteredArticles = articles.filter(article => 
    (filter === 'all' || article.status === filter) &&
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredArticles.length / articlesPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      // In a real application, you would delete the article from the backend here
      console.log(`Deleting article with id: ${id}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content</h1>
        <Button onClick={() => navigate('/new-content')}>Add content</Button>
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
          {currentArticles.map(article => (
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
      <div className="mt-4 flex justify-center">
        {pageNumbers.map(number => (
          <Button
            key={number}
            onClick={() => setCurrentPage(number)}
            variant={currentPage === number ? "default" : "outline"}
            className="mx-1"
          >
            {number}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default Articles;
