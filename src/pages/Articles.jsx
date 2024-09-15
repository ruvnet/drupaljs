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
      console.log(`Deleting article with id: ${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Content</h1>
        <Button onClick={() => navigate('/new-content')}>Add content</Button>
      </div>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Input 
          placeholder="Search content..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Content type</TableHead>
              <TableHead className="hidden sm:table-cell">Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead>Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentArticles.map(article => (
              <TableRow key={article.id}>
                <TableCell>{article.title}</TableCell>
                <TableCell className="hidden sm:table-cell">{article.type}</TableCell>
                <TableCell className="hidden sm:table-cell">{article.author}</TableCell>
                <TableCell>{article.status}</TableCell>
                <TableCell className="hidden sm:table-cell">{article.updated}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/articles/edit/${article.id}`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center mt-4 space-x-2">
        {pageNumbers.map(number => (
          <Button
            key={number}
            onClick={() => setCurrentPage(number)}
            variant={currentPage === number ? "default" : "outline"}
            size="sm"
          >
            {number}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default Articles;
