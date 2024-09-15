-- Roles and permissions for Drupal.js

-- Create roles
CREATE ROLE drupaljs_admin;
CREATE ROLE drupaljs_editor;
CREATE ROLE drupaljs_author;
CREATE ROLE drupaljs_anonymous;

-- Grant permissions to drupaljs_admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drupaljs_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drupaljs_admin;

-- Grant permissions to drupaljs_editor
GRANT SELECT, INSERT, UPDATE, DELETE ON 
    content, content_types, taxonomies, terms, content_terms, comments, menus, menu_items 
TO drupaljs_editor;
GRANT SELECT ON users TO drupaljs_editor;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drupaljs_editor;

-- Grant permissions to drupaljs_author
GRANT SELECT, INSERT, UPDATE, DELETE ON content, comments TO drupaljs_author;
GRANT SELECT ON 
    content_types, taxonomies, terms, content_terms, menus, menu_items 
TO drupaljs_author;
GRANT USAGE, SELECT ON SEQUENCE content_id_seq, comments_id_seq TO drupaljs_author;

-- Grant permissions to drupaljs_anonymous
GRANT SELECT ON 
    content, content_types, taxonomies, terms, content_terms, menus, menu_items 
TO drupaljs_anonymous;