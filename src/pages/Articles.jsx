import React from 'react';
import { useQuery } from '@tanstack/react-query';

function Articles() {
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Articles</h1>
      <ul>
        {articles.map(article => (
          <li key={article.id} className="mb-2">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p>{article.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Articles;