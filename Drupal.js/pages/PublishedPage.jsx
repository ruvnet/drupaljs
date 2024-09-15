import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EditorSidebar from '@/components/EditorSidebar';
import MainContent from '@/components/MainContent';
import ActionButtons from '@/components/ActionButtons';

function PublishedPage() {
  const { id } = useParams();
  const [pageData, setPageData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem(`page_${id}`)) || {
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: true,
      sections: [],
      templateColor: '#ffffff',
      customCSS: '',
      layout: 'default',
    };
    setPageData(storedData);
  }, [id]);

  const handleSave = () => {
    localStorage.setItem(`page_${id}`, JSON.stringify(pageData));
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSection = (type) => {
    const newSection = {
      id: Date.now(),
      type,
      content: type === 'text' ? 'New text section' : '/placeholder.svg',
    };
    setPageData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleUpdateSection = (id, content) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id ? { ...section, content } : section
      ),
    }));
  };

  const handleDeleteSection = (id) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id),
    }));
  };

  if (!pageData) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      <EditorSidebar
        pageData={pageData}
        handleChange={handleChange}
        handleAddSection={handleAddSection}
      />
      <MainContent
        pageData={pageData}
        isEditing={isEditing}
        handleChange={handleChange}
        handleUpdateSection={handleUpdateSection}
        handleDeleteSection={handleDeleteSection}
      />
      <ActionButtons
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handleSave={handleSave}
        id={id}
      />
    </div>
  );
}

export default PublishedPage;
