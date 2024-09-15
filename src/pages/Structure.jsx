import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, List, Tag, Menu, Layout, Database, Layers, Workflow, Key, Globe, Code, Settings, FileSpreadsheet, FileStack, FileBarChart, FileCheck } from 'lucide-react';

function Structure() {
  const structureItems = [
    { title: "Content Types", description: "Manage content types and their fields", icon: <FileText className="h-6 w-6" />, link: "/Drupal.js/structure/content-types" },
    { title: "Taxonomy", description: "Organize content with vocabularies and terms", icon: <Tag className="h-6 w-6" />, link: "/Drupal.js/structure/taxonomy" },
    { title: "Menu", description: "Customize site navigation menus", icon: <Menu className="h-6 w-6" />, link: "/Drupal.js/structure/menus" },
    { title: "Block Layout", description: "Manage block types and placements", icon: <Layout className="h-6 w-6" />, link: "/Drupal.js/structure/block-layout" },
    { title: "Views", description: "Create custom lists and queries", icon: <List className="h-6 w-6" />, link: "/Drupal.js/structure/views" },
    { title: "Media Types", description: "Manage different types of media", icon: <Database className="h-6 w-6" />, link: "/Drupal.js/structure/media-types" },
    { title: "Entity Types", description: "Manage custom entity types", icon: <Layers className="h-6 w-6" />, link: "/Drupal.js/structure/entity-types" },
    { title: "Workflows", description: "Set up content moderation workflows", icon: <Workflow className="h-6 w-6" />, link: "/Drupal.js/structure/workflows" },
    { title: "Webforms", description: "Create and manage webforms", icon: <FileSpreadsheet className="h-6 w-6" />, link: "/Drupal.js/structure/webforms" },
    { title: "URL Aliases", description: "Manage URL path patterns", icon: <Key className="h-6 w-6" />, link: "/Drupal.js/structure/url-aliases" },
    { title: "Languages", description: "Configure multilingual settings", icon: <Globe className="h-6 w-6" />, link: "/Drupal.js/structure/languages" },
    { title: "Configuration Synchronization", description: "Manage configuration imports/exports", icon: <Settings className="h-6 w-6" />, link: "/Drupal.js/structure/config-sync" },
    { title: "REST Resources", description: "Manage RESTful web services", icon: <Code className="h-6 w-6" />, link: "/Drupal.js/structure/rest-resources" },
    { title: "Display Modes", description: "Manage entity view and form modes", icon: <FileStack className="h-6 w-6" />, link: "/Drupal.js/structure/display-modes" },
    { title: "Field Storage", description: "Manage field storage settings", icon: <Database className="h-6 w-6" />, link: "/Drupal.js/structure/field-storage" },
    { title: "Search", description: "Configure search functionality", icon: <FileBarChart className="h-6 w-6" />, link: "/Drupal.js/structure/search" },
    { title: "Taxonomies", description: "Manage content categorization", icon: <FileCheck className="h-6 w-6" />, link: "/Drupal.js/structure/taxonomies" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Structure</h1>
        <Button asChild>
          <Link to="/Drupal.js">Back to Dashboard</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structureItems.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to={item.link}>Manage {item.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Structure;
