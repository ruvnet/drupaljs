import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AIContentGenerator = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [field, setField] = useState('content');

  const handleGenerate = () => {
    // In a real application, this would call an AI service
    const generatedContent = `AI-generated content for ${field}: ${prompt}`;
    onGenerate(field, generatedContent);
  };

  return (
    <div className="space-y-4">
      <Select value={field} onValueChange={setField}>
        <SelectTrigger>
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="content">Content</SelectItem>
          <SelectItem value="metaTitle">Meta Title</SelectItem>
          <SelectItem value="metaDescription">Meta Description</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Enter your prompt for AI generation"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button onClick={handleGenerate}>Generate Content</Button>
    </div>
  );
};

export default AIContentGenerator;