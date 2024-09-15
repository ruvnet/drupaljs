-- Triggers for Drupal.js

-- Trigger to update 'updated_at' for users table
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for content_types table
CREATE TRIGGER update_content_types_timestamp
BEFORE UPDATE ON content_types
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for content table
CREATE TRIGGER update_content_timestamp
BEFORE UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for taxonomies table
CREATE TRIGGER update_taxonomies_timestamp
BEFORE UPDATE ON taxonomies
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for terms table
CREATE TRIGGER update_terms_timestamp
BEFORE UPDATE ON terms
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for comments table
CREATE TRIGGER update_comments_timestamp
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for menus table
CREATE TRIGGER update_menus_timestamp
BEFORE UPDATE ON menus
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to update 'updated_at' for menu_items table
CREATE TRIGGER update_menu_items_timestamp
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();