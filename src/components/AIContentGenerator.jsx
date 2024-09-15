import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AIContentGenerator({ settings }) {
  const [contentType, setContentType] = useState('article');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  const handleGenerate = async () => {
    // Simulated API call
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, prompt, settings }),
    });
    const data = await response.json();
    setGeneratedContent(data.content);
  };

  return (
    <div className="space-y-4">
      <Select value={contentType} onValueChange={setContentType}>
        <SelectTrigger>
          <SelectValue placeholder="Select content type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="article">Article</SelectItem>
          <SelectItem value="page">Page</SelectItem>
          <SelectItem value="product">Product Description</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Enter your prompt here"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button onClick={handleGenerate}>Generate Content</Button>
      {generatedContent && (
        <Textarea
          value={generatedContent}
          readOnly
          rows={10}
          className="mt-4"
        />
      )}
    </div>
  );
}

export default AIContentGenerator;
