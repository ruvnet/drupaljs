import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ThemeCustomizer = ({ theme, onSave }) => {
  const [customizations, setCustomizations] = useState({
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#f59e0b',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      lineHeight: 1.5,
      headingFontFamily: 'Inter, sans-serif',
      headingFontWeight: 'bold',
    },
    layout: {
      containerWidth: 1200,
      gridColumns: 12,
      gapSize: 16,
    },
    components: {
      buttonRadius: 4,
      inputRadius: 4,
      cardRadius: 8,
      shadowIntensity: 10,
    },
    advanced: {
      customCSS: '',
      darkMode: false,
      rtlSupport: false,
      animations: true,
    },
  });

  useEffect(() => {
    const storedCustomizations = localStorage.getItem(`theme_${theme.id}_customizations`);
    if (storedCustomizations) {
      setCustomizations(JSON.parse(storedCustomizations));
    }
  }, [theme.id]);

  const handleChange = (section, key, value) => {
    setCustomizations(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(`theme_${theme.id}_customizations`, JSON.stringify(customizations));
    onSave(customizations);
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="colors">
          <AccordionTrigger>Colors</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(customizations.colors).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`color-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                  <Input
                    id={`color-${key}`}
                    type="color"
                    value={value}
                    onChange={(e) => handleChange('colors', key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="typography">
          <AccordionTrigger>Typography</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={customizations.typography.fontFamily}
                  onChange={(e) => handleChange('typography', 'fontFamily', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fontSize">Font Size (px)</Label>
                <Slider
                  id="fontSize"
                  min={12}
                  max={24}
                  step={1}
                  value={[customizations.typography.fontSize]}
                  onValueChange={(value) => handleChange('typography', 'fontSize', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="lineHeight">Line Height</Label>
                <Slider
                  id="lineHeight"
                  min={1}
                  max={2}
                  step={0.1}
                  value={[customizations.typography.lineHeight]}
                  onValueChange={(value) => handleChange('typography', 'lineHeight', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="headingFontFamily">Heading Font Family</Label>
                <Input
                  id="headingFontFamily"
                  value={customizations.typography.headingFontFamily}
                  onChange={(e) => handleChange('typography', 'headingFontFamily', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="headingFontWeight">Heading Font Weight</Label>
                <Select
                  id="headingFontWeight"
                  value={customizations.typography.headingFontWeight}
                  onValueChange={(value) => handleChange('typography', 'headingFontWeight', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="bolder">Bolder</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="layout">
          <AccordionTrigger>Layout</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="containerWidth">Container Width (px)</Label>
                <Slider
                  id="containerWidth"
                  min={800}
                  max={1600}
                  step={50}
                  value={[customizations.layout.containerWidth]}
                  onValueChange={(value) => handleChange('layout', 'containerWidth', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="gridColumns">Grid Columns</Label>
                <Slider
                  id="gridColumns"
                  min={1}
                  max={24}
                  step={1}
                  value={[customizations.layout.gridColumns]}
                  onValueChange={(value) => handleChange('layout', 'gridColumns', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="gapSize">Gap Size (px)</Label>
                <Slider
                  id="gapSize"
                  min={0}
                  max={32}
                  step={1}
                  value={[customizations.layout.gapSize]}
                  onValueChange={(value) => handleChange('layout', 'gapSize', value[0])}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="components">
          <AccordionTrigger>Components</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="buttonRadius">Button Radius (px)</Label>
                <Slider
                  id="buttonRadius"
                  min={0}
                  max={20}
                  step={1}
                  value={[customizations.components.buttonRadius]}
                  onValueChange={(value) => handleChange('components', 'buttonRadius', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="inputRadius">Input Radius (px)</Label>
                <Slider
                  id="inputRadius"
                  min={0}
                  max={20}
                  step={1}
                  value={[customizations.components.inputRadius]}
                  onValueChange={(value) => handleChange('components', 'inputRadius', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="cardRadius">Card Radius (px)</Label>
                <Slider
                  id="cardRadius"
                  min={0}
                  max={20}
                  step={1}
                  value={[customizations.components.cardRadius]}
                  onValueChange={(value) => handleChange('components', 'cardRadius', value[0])}
                />
              </div>
              <div>
                <Label htmlFor="shadowIntensity">Shadow Intensity</Label>
                <Slider
                  id="shadowIntensity"
                  min={0}
                  max={20}
                  step={1}
                  value={[customizations.components.shadowIntensity]}
                  onValueChange={(value) => handleChange('components', 'shadowIntensity', value[0])}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customCSS">Custom CSS</Label>
                <textarea
                  id="customCSS"
                  className="w-full h-32 p-2 border rounded"
                  value={customizations.advanced.customCSS}
                  onChange={(e) => handleChange('advanced', 'customCSS', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={customizations.advanced.darkMode}
                  onCheckedChange={(checked) => handleChange('advanced', 'darkMode', checked)}
                />
                <Label htmlFor="darkMode">Dark Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="rtlSupport"
                  checked={customizations.advanced.rtlSupport}
                  onCheckedChange={(checked) => handleChange('advanced', 'rtlSupport', checked)}
                />
                <Label htmlFor="rtlSupport">RTL Support</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="animations"
                  checked={customizations.advanced.animations}
                  onCheckedChange={(checked) => handleChange('advanced', 'animations', checked)}
                />
                <Label htmlFor="animations">Animations</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button onClick={handleSave}>Save Customizations</Button>
    </div>
  );
};

export default ThemeCustomizer;