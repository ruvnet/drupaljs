import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronLeft, ChevronRight, Edit, Eye, Save } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function PublishedPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState({
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    const storedArticle = JSON.parse(localStorage.getItem(`article_${id}`));
    if (storedArticle) {
      setArticle(storedArticle);
      setEditContent({
        title: storedArticle.title,
        content: storedArticle.body || storedArticle.content,
        metaTitle: storedArticle.metaTitle || '',
        metaDescription: storedArticle.metaDescription || '',
      });
    } else {
      const mockArticle = {
        id: 1,
        title: 'Introduction to Drupal.js',
        content: `
          <h1>Introduction to Drupal.js</h1>
          <p>Drupal.js is a modern content management system built with React and Node.js. It combines the flexibility of Drupal with the power of modern JavaScript frameworks.</p>
          <h2>Key Features</h2>
          <ul>
            <li>React-based frontend for smooth user experiences</li>
            <li>Node.js backend for efficient server-side operations</li>
            <li>Customizable plugin system</li>
            <li>Advanced content editing capabilities</li>
          </ul>
          <p>Whether you're building a simple blog or a complex web application, Drupal.js provides the tools and flexibility you need to create outstanding digital experiences.</p>
        `,
        metaTitle: 'Drupal.js: Modern CMS with React and Node.js',
        metaDescription: 'Discover Drupal.js, a powerful CMS combining Drupal flexibility with React and Node.js for creating outstanding digital experiences.',
      };
      setArticle(mockArticle);
      setEditContent({
        title: mockArticle.title,
        content: mockArticle.content,
        metaTitle: mockArticle.metaTitle,
        metaDescription: mockArticle.metaDescription,
      });
    }
  }, [id]);

  const handleEdit = (section) => {
    setIsEditing(true);
    setEditingSection(section);
  };

  const handleSave = () => {
    const updatedArticle = { ...article, ...editContent };
    setArticle(updatedArticle);
    localStorage.setItem(`article_${id}`, JSON.stringify(updatedArticle));
    setIsEditing(false);
    setEditingSection(null);
  };

  const handleCancel = () => {
    setEditContent({
      title: article.title,
      content: article.body || article.content,
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
    });
    setIsEditing(false);
    setEditingSection(null);
  };

  if (!article) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed top-4 left-4 z-50">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Page Sections</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <Button onClick={() => handleEdit('title')} className="w-full justify-start">
              <Edit className="mr-2 h-4 w-4" /> Edit Title
            </Button>
            <Button onClick={() => handleEdit('content')} className="w-full justify-start">
              <Edit className="mr-2 h-4 w-4" /> Edit Content
            </Button>
            <Button onClick={() => handleEdit('meta')} className="w-full justify-start">
              <Edit className="mr-2 h-4 w-4" /> Edit Meta Tags
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {isEditing ? (
            <div className="space-y-4">
              {editingSection === 'title' && (
                <Input
                  value={editContent.title}
                  onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                  className="text-3xl font-bold"
                />
              )}
              {editingSection === 'content' && (
                <Textarea
                  value={editContent.content}
                  onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                  rows={10}
                />
              )}
              {editingSection === 'meta' && (
                <div className="space-y-2">
                  <Input
                    value={editContent.metaTitle}
                    onChange={(e) => setEditContent({ ...editContent, metaTitle: e.target.value })}
                    placeholder="Meta Title"
                  />
                  <Textarea
                    value={editContent.metaDescription}
                    onChange={(e) => setEditContent({ ...editContent, metaDescription: e.target.value })}
                    placeholder="Meta Description"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: article.content || article.body }} />
            </>
          )}
        </div>
      </div>

      <div className="fixed right-4 top-4 space-y-2">
        <Button asChild>
          <Link to={`/content/edit/${id}`}>
            <Edit className="mr-2 h-4 w-4" /> Edit in Admin
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Eye className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
          {isEditing ? 'Preview' : 'Quick Edit'}
        </Button>
      </div>
    </div>
  );
}

export default PublishedPage;
