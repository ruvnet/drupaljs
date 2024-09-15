import React from 'react';
import { Input } from "@/components/ui/input";
import TinyMCEEditor from './TinyMCEEditor';
import SectionEditor from './SectionEditor';

const MainContent = ({ pageData, isEditing, handleChange, handleUpdateSection, handleDeleteSection }) => {
  return (
    <div className={`flex-1 overflow-auto p-8 ${pageData.layout}`} style={{ backgroundColor: pageData.templateColor }}>
      <style>{pageData.customCSS}</style>
      <Input
        value={pageData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        className="text-3xl font-bold mb-4"
        disabled={!isEditing}
      />
      <TinyMCEEditor
        content={pageData.content}
        onChange={(content) => handleChange('content', content)}
      />
      {pageData.sections.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          isEditing={isEditing}
          onUpdate={handleUpdateSection}
          onDelete={handleDeleteSection}
        />
      ))}
    </div>
  );
};

export default MainContent;
