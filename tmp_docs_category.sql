-- Create the User Documentation category (sort_order 0 = first in list)
INSERT INTO forum_categories (name, slug, description, sort_order)
VALUES (
  'User Documentation',
  'user-documentation',
  'Complete user guides, how-to articles and documentation for every CareCallAI feature.',
  0
)
RETURNING id, name, slug;
