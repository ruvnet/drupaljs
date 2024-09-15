import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';

function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewArticle = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', id],
    queryFn: () => isNewArticle ? null : fetch(`/api/articles/${id}`).then(res => res.json()),
    enabled: !isNewArticle,
  });

  const saveMutation = useMutation({
    mutationFn: (articleData) => 
      fetch(`/api/articles${isNewArticle ? '' : `/${id}`}`, {
        method: isNewArticle ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      }).then(res => res.json()),
    onSuccess: () => navigate('/content'),
  });

  React.useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setStatus(article.status);
    }
  }, [article]);

  const handleSave = () => {
    saveMutation.mutate({ title, content, status });
  };

  const handleBack = () => {
    navigate('/content');
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Articles
      </Button>
      <h1 className="text-3xl font-bold mb-6">{isNewArticle ? 'Create New Article' : 'Edit Article'}</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <Input 
            id="title"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <Textarea 
            id="content"
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows={10}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleBack}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default ArticleEditor;
