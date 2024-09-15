import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import ThemeCustomizer from '../components/ThemeCustomizer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

function Themes() {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [isNewThemeDialogOpen, setIsNewThemeDialogOpen] = useState(false);

  useEffect(() => {
    const storedThemes = JSON.parse(localStorage.getItem('themes')) || [
      { id: 1, name: 'Default Theme', description: 'The default theme for your site', isCustom: false },
      { id: 2, name: 'Dark Mode', description: 'A dark theme for your site', isCustom: false },
      { id: 3, name: 'Colorful', description: 'A vibrant and colorful theme', isCustom: false },
    ];
    setThemes(storedThemes);

    const storedActiveTheme = localStorage.getItem('activeTheme') || 'Default Theme';
    setActiveTheme(storedActiveTheme);
  }, []);

  const handleActivateTheme = (themeName) => {
    setActiveTheme(themeName);
    localStorage.setItem('activeTheme', themeName);
    toast.success(`${themeName} has been activated`);
  };

  const handleCustomizeTheme = (theme) => {
    setSelectedTheme(theme);
    setIsCustomizerOpen(true);
  };

  const handleSaveCustomizations = (customizations) => {
    const updatedThemes = themes.map(theme => 
      theme.id === selectedTheme.id ? { ...theme, customizations } : theme
    );
    setThemes(updatedThemes);
    localStorage.setItem('themes', JSON.stringify(updatedThemes));
    toast.success(`Customizations for ${selectedTheme.name} have been saved`);
    setIsCustomizerOpen(false);
  };

  const handleCreateNewTheme = () => {
    if (newThemeName.trim()) {
      const newTheme = {
        id: Date.now(),
        name: newThemeName.trim(),
        description: 'Custom theme',
        isCustom: true,
        customizations: {}
      };
      const updatedThemes = [...themes, newTheme];
      setThemes(updatedThemes);
      localStorage.setItem('themes', JSON.stringify(updatedThemes));
      setNewThemeName('');
      setIsNewThemeDialogOpen(false);
      toast.success(`New theme "${newTheme.name}" has been created`);
    }
  };

  const handleRemoveTheme = (themeId) => {
    const updatedThemes = themes.filter(theme => theme.id !== themeId);
    setThemes(updatedThemes);
    localStorage.setItem('themes', JSON.stringify(updatedThemes));
    toast.success('Theme has been removed');
  };

  const getThemeCSS = (theme) => {
    if (theme.customizations) {
      return `
/* ${theme.name} */
:root {
  --primary-color: ${theme.customizations.colors?.primary || '#3b82f6'};
  --secondary-color: ${theme.customizations.colors?.secondary || '#10b981'};
  --background-color: ${theme.customizations.colors?.background || '#ffffff'};
  --text-color: ${theme.customizations.colors?.text || '#1f2937'};
  --font-family: ${theme.customizations.typography?.fontFamily || 'Inter, sans-serif'};
  --font-size: ${theme.customizations.typography?.fontSize || '16'}px;
  --line-height: ${theme.customizations.typography?.lineHeight || '1.5'};
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: var(--line-height);
  color: var(--text-color);
  background-color: var(--background-color);
}

.button {
  background-color: var(--primary-color);
  color: white;
  border-radius: ${theme.customizations.components?.buttonRadius || '4'}px;
}

.input {
  border-radius: ${theme.customizations.components?.inputRadius || '4'}px;
}

.card {
  border-radius: ${theme.customizations.components?.cardRadius || '8'}px;
  box-shadow: 0 ${theme.customizations.components?.shadowIntensity || '10'}px 15px -3px rgba(0, 0, 0, 0.1);
}
      `;
    }
    return '/* No custom CSS for this theme */';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Themes</h1>
        <div>
          <Button asChild className="mr-2">
            <Link to="/appearance">Back to Appearance</Link>
          </Button>
          <Button onClick={() => setIsNewThemeDialogOpen(true)}>Create New Theme</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <CardHeader>
              <CardTitle>{theme.name}</CardTitle>
              <CardDescription>{theme.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={activeTheme === theme.name ? "default" : "outline"} 
                className="w-full"
                onClick={() => handleActivateTheme(theme.name)}
              >
                {activeTheme === theme.name ? 'Active' : 'Activate'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleCustomizeTheme(theme)}>
                Customize
              </Button>
              {theme.isCustom && (
                <Button variant="destructive" className="w-full" onClick={() => handleRemoveTheme(theme.id)}>
                  Remove Theme
                </Button>
              )}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Sample CSS:</h4>
                <SyntaxHighlighter language="css" style={tomorrow} customStyle={{fontSize: '0.8rem'}}>
                  {getThemeCSS(theme)}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isCustomizerOpen} onOpenChange={setIsCustomizerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customize {selectedTheme?.name}</DialogTitle>
            <DialogDescription>
              Adjust the settings below to customize your theme.
            </DialogDescription>
          </DialogHeader>
          {selectedTheme && (
            <ThemeCustomizer
              theme={selectedTheme}
              onSave={handleSaveCustomizations}
              onClose={() => setIsCustomizerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isNewThemeDialogOpen} onOpenChange={setIsNewThemeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Enter a name for your new custom theme.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            placeholder="New Theme Name"
          />
          <Button onClick={handleCreateNewTheme}>Create Theme</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Themes;
