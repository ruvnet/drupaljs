import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

function CustomCSS() {
  const [customCSS, setCustomCSS] = useState('');

  useEffect(() => {
    const storedCSS = localStorage.getItem('customCSS') || '/* Add your custom CSS here */';
    setCustomCSS(storedCSS);
  }, []);

  const handleSaveCSS = () => {
    localStorage.setItem('customCSS', customCSS);
    toast.success('Custom CSS saved successfully');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Custom CSS</h1>
        <Button asChild>
          <Link to="/appearance">Back to Appearance</Link>
        </Button>
      </div>
      <Textarea
        value={customCSS}
        onChange={(e) => setCustomCSS(e.target.value)}
        className="min-h-[400px] font-mono"
        placeholder="Enter your custom CSS here"
      />
      <Button onClick={handleSaveCSS} className="mt-4">Save CSS</Button>
    </div>
  );
}

export default CustomCSS;