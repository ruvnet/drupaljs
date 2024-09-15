import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';

function PublishedPage() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [article, setArticle] = useState(null);

  useEffect(() => {
    // Fetch article data from localStorage
    const storedArticle = JSON.parse(localStorage.getItem(`article_${id}`));
    if (storedArticle) {
      setArticle(storedArticle);
    } else {
      // Fallback to mock data if not found in localStorage
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
      };
      setArticle(mockArticle);
    }
  }, [id]);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
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
          <div className="py-4">
            <Button onClick={() => console.log('Edit Header')}>Edit Header</Button>
            <Button onClick={() => console.log('Edit Body')} className="mt-2">Edit Body</Button>
            <Button onClick={() => console.log('Edit Footer')} className="mt-2">Edit Footer</Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: article.body || article.content }} />
        </div>
      </div>

      <div className={`fixed right-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${isEditing ? 'translate-x-0' : 'translate-x-full'}`}>
        <Button
          onClick={toggleEditing}
          className="absolute -left-10 top-1/2 -translate-y-1/2 rotate-90"
          variant="outline"
        >
          {isEditing ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {isEditing ? 'Close' : 'Edit'}
        </Button>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Edit Content</h2>
          {/* Add your editing controls here */}
          <Button onClick={() => console.log('Save changes')}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

export default PublishedPage;
