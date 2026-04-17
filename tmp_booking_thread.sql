INSERT INTO forum_threads (category_id, author_id, title, slug, content, is_pinned, is_locked, tags)
VALUES (
  '98c52d96-97bb-4d9a-af3a-9f5569a654c0',
  '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82',
  'Book a Free Teams Meeting / Demo Session',
  'book-teams-meeting',
  'Want to see CareCallAI in action? Book a free 1-hour Microsoft Teams demo!

We offer free demo and onboarding sessions via Microsoft Teams. During your session, we will:

- Walk you through every feature of CareCallAI
- Show you how to set up your agency
- Answer any questions about CIW/CQC compliance features
- Help you get started with rotas, care logging, eMAR, and more
- Discuss your specific needs and how CareCallAI can help

**How to book:**

1. Use the booking calendar on the forum - click "View Calendar & Book" in the sidebar
2. Email us at hello@carecallai.co.uk with your preferred date and time
3. WhatsApp us on +44 7762 533406

Sessions are available Monday to Friday. We will send you a Teams meeting link once confirmed.

Looking forward to showing you what CareCallAI can do for your care agency!',
  true,
  false,
  ARRAY['demo', 'booking', 'teams', 'onboarding']
)
RETURNING id, title, slug;

UPDATE forum_categories SET thread_count = (SELECT COUNT(*) FROM forum_threads WHERE category_id = '98c52d96-97bb-4d9a-af3a-9f5569a654c0') WHERE id = '98c52d96-97bb-4d9a-af3a-9f5569a654c0';
