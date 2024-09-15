-- Indexes for Drupal.js

-- Indexes for users table
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);

-- Indexes for content table
CREATE INDEX idx_content_content_type_id ON content (content_type_id);
CREATE INDEX idx_content_author_id ON content (author_id);
CREATE INDEX idx_content_created_at ON content (created_at);
CREATE INDEX idx_content_published_at ON content (published_at);

-- Indexes for terms table
CREATE INDEX idx_terms_taxonomy_id ON terms (taxonomy_id);
CREATE INDEX idx_terms_parent_id ON terms (parent_id);

-- Indexes for content_terms table
CREATE INDEX idx_content_terms_content_id ON content_terms (content_id);
CREATE INDEX idx_content_terms_term_id ON content_terms (term_id);

-- Indexes for comments table
CREATE INDEX idx_comments_content_id ON comments (content_id);
CREATE INDEX idx_comments_author_id ON comments (author_id);
CREATE INDEX idx_comments_created_at ON comments (created_at);

-- Indexes for menu_items table
CREATE INDEX idx_menu_items_menu_id ON menu_items (menu_id);
CREATE INDEX idx_menu_items_parent_id ON menu_items (parent_id);