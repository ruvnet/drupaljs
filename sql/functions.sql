-- Custom functions for Drupal.js

-- Function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get all child terms of a given term
CREATE OR REPLACE FUNCTION get_child_terms(parent_term_id UUID)
RETURNS TABLE (id UUID, name TEXT, depth INT) AS $$
WITH RECURSIVE term_tree AS (
    SELECT id, name, 0 AS depth
    FROM terms
    WHERE id = parent_term_id
    UNION ALL
    SELECT t.id, t.name, tt.depth + 1
    FROM terms t
    JOIN term_tree tt ON t.parent_id = tt.id
)
SELECT id, name, depth FROM term_tree WHERE depth > 0;
$$ LANGUAGE sql;

-- Function to get the full path of a menu item
CREATE OR REPLACE FUNCTION get_menu_item_path(item_id UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT := '';
    current_id UUID := item_id;
    current_title TEXT;
BEGIN
    WHILE current_id IS NOT NULL LOOP
        SELECT title, parent_id 
        INTO current_title, current_id
        FROM menu_items
        WHERE id = current_id;
        
        IF path = '' THEN
            path := current_title;
        ELSE
            path := current_title || ' > ' || path;
        END IF;
    END LOOP;
    
    RETURN path;
END;
$$ LANGUAGE plpgsql;