import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import ThemeCustomizer from '../components/ThemeCustomizer';

function Themes() {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
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

  const handleCreateNewTheme = (newTheme) => {
    const updatedThemes = [...themes, newTheme];
    setThemes(updatedThemes);
    localStorage.setItem('themes', JSON.stringify(updatedThemes));
    toast.success(`New theme "${newTheme.name}" has been created`);
    setIsNewThemeDialogOpen(false);
  };

  const handleRemoveTheme = (themeId) => {
    const updatedThemes = themes.filter(theme => theme.id !== themeId);
    setThemes(updatedThemes);
    localStorage.setItem('themes', JSON.stringify(updatedThemes));
    toast.success('Theme has been removed');
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Customize your new theme settings.
            </DialogDescription>
          </DialogHeader>
          <ThemeCustomizer
            theme={{ name: 'New Theme', customizations: {} }}
            onSave={handleCreateNewTheme}
            onClose={() => setIsNewThemeDialogOpen(false)}
            isNewTheme={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Themes;
