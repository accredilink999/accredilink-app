const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'db.edaifkkkqwgavxkgozwi.supabase.co',
    port: 5432,
    user: 'cli_login_postgres',
    password: 'FfEUfbzbUpqlZQCgdoJAdGtkAbZfytgr',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query('SET ROLE postgres');

  // Training courses table
  await client.query(`
    CREATE TABLE IF NOT EXISTS training_courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'mandatory',
      description TEXT,
      duration_minutes INT DEFAULT 15,
      youtube_url TEXT,
      thumbnail_url TEXT,
      pass_mark INT DEFAULT 80,
      status TEXT DEFAULT 'draft',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Created training_courses table');

  // Training questions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS training_questions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options JSONB NOT NULL DEFAULT '[]',
      correct_index INT NOT NULL DEFAULT 0,
      explanation TEXT,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Created training_questions table');

  // Free training users (public sign-ups, separate from app users)
  await client.query(`
    CREATE TABLE IF NOT EXISTS training_users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      employer TEXT,
      job_role TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Created training_users table');

  // Training completions / certificates
  await client.query(`
    CREATE TABLE IF NOT EXISTS training_completions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES training_users(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
      score INT NOT NULL,
      passed BOOLEAN NOT NULL DEFAULT false,
      answers JSONB DEFAULT '[]',
      certificate_number TEXT UNIQUE,
      completed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Created training_completions table');

  // Allow public access (no RLS needed for website tables)
  await client.query('ALTER TABLE training_courses DISABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE training_questions DISABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE training_users DISABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE training_completions DISABLE ROW LEVEL SECURITY');
  await client.query('GRANT ALL ON training_courses TO anon, authenticated');
  await client.query('GRANT ALL ON training_questions TO anon, authenticated');
  await client.query('GRANT ALL ON training_users TO anon, authenticated');
  await client.query('GRANT ALL ON training_completions TO anon, authenticated');
  console.log('Permissions set');

  // Seed the initial course list
  const courses = [
    { title: 'Safeguarding Adults', slug: 'safeguarding-adults', category: 'mandatory', description: 'Recognising abuse, reporting procedures, and protecting vulnerable adults in domiciliary care settings.', duration: 20, sort: 1 },
    { title: 'Mental Capacity Act & DoLS', slug: 'mental-capacity-act', category: 'mandatory', description: 'Understanding the Mental Capacity Act 2005, best interests decisions, and Deprivation of Liberty Safeguards.', duration: 20, sort: 2 },
    { title: 'Moving & Handling People', slug: 'moving-handling', category: 'mandatory', description: 'Safe techniques for assisting and moving people, including hoisting, slide sheets, and risk assessment.', duration: 15, sort: 3 },
    { title: 'Basic Life Support & CPR', slug: 'basic-life-support-cpr', category: 'mandatory', description: 'Emergency first aid, CPR technique, choking response, and when to call 999.', duration: 15, sort: 4 },
    { title: 'First Aid Awareness', slug: 'first-aid-awareness', category: 'mandatory', description: 'Treating common injuries, falls, burns, bleeding, and recognising medical emergencies.', duration: 15, sort: 5 },
    { title: 'Infection Prevention & Control', slug: 'infection-control', category: 'mandatory', description: 'Hand hygiene, PPE use, breaking the chain of infection, and managing outbreaks in care settings.', duration: 15, sort: 6 },
    { title: 'Medication Management', slug: 'medication-management', category: 'mandatory', description: 'Safe administration of medication, storage, recording, and handling errors in domiciliary care.', duration: 20, sort: 7 },
    { title: 'Food Hygiene & Nutrition', slug: 'food-hygiene-nutrition', category: 'mandatory', description: 'Food safety, safe preparation, storage temperatures, nutritional needs, and supporting hydration.', duration: 15, sort: 8 },
    { title: 'Fire Safety Awareness', slug: 'fire-safety', category: 'mandatory', description: 'Fire prevention in home care settings, evacuation procedures, and Personal Emergency Evacuation Plans.', duration: 10, sort: 9 },
    { title: 'Health & Safety at Work', slug: 'health-safety', category: 'mandatory', description: 'Risk assessment, COSHH, lone working, accident reporting (RIDDOR), and employer responsibilities.', duration: 15, sort: 10 },
    { title: 'Equality, Diversity & Inclusion', slug: 'equality-diversity', category: 'mandatory', description: 'Protected characteristics, anti-discrimination, cultural awareness, and inclusive care practices.', duration: 15, sort: 11 },
    { title: 'Communication in Care', slug: 'communication-care', category: 'awif', description: 'Effective communication with service users, families, and colleagues. Record keeping and confidentiality.', duration: 15, sort: 12 },
    { title: 'GDPR & Data Protection', slug: 'gdpr-data-protection', category: 'mandatory', description: 'Data protection principles, handling personal information, consent, and breach reporting in care.', duration: 10, sort: 13 },
    { title: 'Person-Centred Care', slug: 'person-centred-care', category: 'awif', description: 'Principles of person-centred care, care planning, individual preferences, and promoting independence.', duration: 15, sort: 14 },
    { title: 'End of Life Care', slug: 'end-of-life-care', category: 'specialist', description: 'Supporting people at end of life, advance care planning, pain management, and bereavement support.', duration: 20, sort: 15 },
  ];

  for (const c of courses) {
    await client.query(`
      INSERT INTO training_courses (title, slug, category, description, duration_minutes, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug) DO NOTHING
    `, [c.title, c.slug, c.category, c.description, c.duration, c.sort]);
  }
  console.log('Seeded', courses.length, 'courses');

  await client.end();
  console.log('Done');
})().catch(e => { console.error(e.message); process.exit(1); });
