import React from 'react';
import { Input } from "@/components/ui/input";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EditableSection = ({ isEditing, content, onChange, type = 'text' }) => {
  if (!isEditing) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  if (type === 'title') {
    return <Input value={content} onChange={(e) => onChange(e.target.value)} className="text-3xl font-bold mb-4" />;
  }

  return <ReactQuill theme="snow" value={content} onChange={onChange} />;
};

export default EditableSection;