import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Zap } from 'lucide-react';

const AIContentGenerator = ({ contentGeneration, handleContentGenerationChange, generateContent }) => {
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
              value={contentGeneration.prompt}
              onChange={(e) => handleContentGenerationChange('prompt', e.target.value)}
              placeholder="Enter your content generation prompt here"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentGeneration.contentType} onValueChange={(value) => handleContentGenerationChange('contentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="blogPost">Blog Post</SelectItem>
                  <SelectItem value="productDescription">Product Description</SelectItem>
                  <SelectItem value="socialMedia">Social Media Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="tone">Tone</Label>
              <Select value={contentGeneration.tone} onValueChange={(value) => handleContentGenerationChange('tone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="length">Content Length (words)</Label>
            <Slider
              id="length"
              min={50}
              max={2000}
              step={50}
              value={[contentGeneration.length]}
              onValueChange={(value) => handleContentGenerationChange('length', value[0])}
            />
            <div className="text-center mt-2">{contentGeneration.length} words</div>
          </div>
          <Button onClick={generateContent}><Zap className="w-4 h-4 mr-2" />Generate Content</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIContentGenerator;
