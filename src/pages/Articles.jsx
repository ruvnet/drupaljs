import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Edit, Trash2, Eye } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

const mockArticles = [
  { id: 1, title: 'Introduction to Drupal.js', type: 'Blog Post', author: 'John Doe', status: 'published', updated: '2023-03-15' },
  { id: 2, title: 'Creating Custom Components', type: 'Tutorial', author: 'Jane Smith', status: 'draft', updated: '2023-03-20' },
  { id: 3, title: 'Drupal.js Security Best Practices', type: 'Article', author: 'Bob Johnson', status: 'published', updated: '2023-03-25' },
  { id: 4, title: 'Optimizing Drupal.js Performance', type: 'Guide', author: 'Alice Brown', status: 'published', updated: '2023-03-30' },
  { id: 5, title: 'Integrating Third-party APIs', type: 'Tutorial', author: 'Charlie Wilson', status: 'draft', updated: '2023-04-05' },
];

function Articles() {
  const [articles, setArticles] = useState(mockArticles);
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
      setArticles(articles.filter(article => article.id !== id));
      toast.success('Article deleted successfully');
    }
  };

  const handleTogglePublish = (id) => {
    setArticles(articles.map(article => 
      article.id === id 
        ? { ...article, status: article.status === 'published' ? 'draft' : 'published' }
        : article
    ));
    toast.success(`Article ${articles.find(a => a.id === id).status === 'published' ? 'unpublished' : 'published'} successfully`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Content</h1>
        <Button onClick={() => navigate('/content/new')}>Add content</Button>
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
                <TableCell className="font-medium text-sm">{article.title}</TableCell>
                <TableCell className="hidden sm:table-cell">{article.type}</TableCell>
                <TableCell className="hidden sm:table-cell">{article.author}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={article.status === 'published'}
                      onCheckedChange={() => handleTogglePublish(article.id)}
                    />
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{article.updated}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/view/${article.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/content/edit/${article.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
