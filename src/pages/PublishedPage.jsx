import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PublishedPage() {
  const { id } = useParams();
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

  if (!article) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content || article.body }} />
    </div>
  );
}

export default PublishedPage;
