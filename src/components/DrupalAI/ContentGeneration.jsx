import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

function ContentGeneration() {
  const [contentGeneration, setContentGeneration] = useState({
    prompt: '',
    contentType: 'article',
    tone: 'neutral',
    length: 'medium',
  });

  const handleContentGenerationChange = (e) => {
    const { name, value } = e.target;
    setContentGeneration(prev => ({ ...prev, [name]: value }));
  };

  const generateContent = async () => {
    // This is where you'd integrate with your chosen AI API
    console.log('Generating content with:', contentGeneration);
    toast.success('Content generated successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate AI Content</CardTitle>
        <CardDescription>Use AI to generate content for your site</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              name="prompt"
              value={contentGeneration.prompt}
              onChange={handleContentGenerationChange}
              placeholder="Enter your content generation prompt here"
            />
          </div>
          <div className="flex space-x-4">
            <SelectField
              label="Content Type"
              name="contentType"
              value={contentGeneration.contentType}
              onChange={handleContentGenerationChange}
              options={[
                { value: 'article', label: 'Article' },
                { value: 'blogPost', label: 'Blog Post' },
                { value: 'productDescription', label: 'Product Description' },
              ]}
            />
            <SelectField
              label="Tone"
              name="tone"
              value={contentGeneration.tone}
              onChange={handleContentGenerationChange}
              options={[
                { value: 'neutral', label: 'Neutral' },
                { value: 'formal', label: 'Formal' },
                { value: 'casual', label: 'Casual' },
              ]}
            />
            <SelectField
              label="Length"
              name="length"
              value={contentGeneration.length}
              onChange={handleContentGenerationChange}
              options={[
                { value: 'short', label: 'Short' },
                { value: 'medium', label: 'Medium' },
                { value: 'long', label: 'Long' },
              ]}
            />
          </div>
          <Button onClick={generateContent}>Generate Content</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="flex-1">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} value={value} onValueChange={(value) => onChange({ target: { name, value } })}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default ContentGeneration;