require('dotenv').config();
const { client, initDb } = require('../db/db');
const slugify = require('../utils/slugify');

async function main() {
  await initDb();

  const existingR = await client.execute({
    sql: 'SELECT * FROM articles WHERE slug = ?',
    args: ['atomic-habits-summary']
  });
  if (existingR.rows[0]) {
    console.log('Sample article already exists — skipping seed.');
    process.exit(0);
  }

  const categoryR = await client.execute({
    sql: 'SELECT * FROM categories WHERE slug = ?',
    args: ['money-and-wealth']
  });
  const category = categoryR.rows[0];

  const lessons = [
    {
      title: 'Small habits compound',
      explanation: 'Tiny, consistent actions build up into major results over time, even when progress feels invisible day to day.',
      example: 'Someone who reads 10 pages a night barely notices a difference in week one — but by year one, that is over a dozen books finished.',
      application: 'Pick one habit you want to build and shrink it down until it takes less than two minutes to start.'
    },
    {
      title: 'Identity drives behavior',
      explanation: 'Lasting change happens when a habit becomes part of how you see yourself, not just something on a to-do list.',
      example: 'Someone who thinks "I am a runner" laces up on a rainy morning without debate; someone "trying to run more" talks themselves out of it.',
      application: 'After completing a habit, say the identity out loud: "I am someone who ___."'
    },
    {
      title: 'Make it obvious, easy, and satisfying',
      explanation: 'Habits stick when the cues are visible, the friction is low, and there is an immediate reward.',
      example: 'Setting out gym clothes the night before removes the morning excuse of "I could not find anything."',
      application: 'Redesign your environment so the habit you want is the easiest option in the room.'
    }
  ];

  const now = new Date().toISOString();

  await client.execute({
    sql: `
      INSERT INTO articles (
        title, slug, book_title, author, cover_image, category_id, excerpt,
        introduction, content, lessons, takeaway, who_should_read, affiliate_url,
        seo_title, seo_description, tags, reading_time, featured, published, publication_date
      ) VALUES (
        :title, :slug, :book_title, :author, :cover_image, :category_id, :excerpt,
        :introduction, :content, :lessons, :takeaway, :who_should_read, :affiliate_url,
        :seo_title, :seo_description, :tags, :reading_time, :featured, :published, :publication_date
      )
    `,
    args: {
      title: 'Atomic Habits — Summary',
      slug: slugify('atomic-habits-summary'),
      book_title: 'Atomic Habits',
      author: 'James Clear',
      cover_image: '',
      category_id: category ? category.id : null,
      excerpt: 'How tiny changes compound into remarkable results — and a practical system for building habits that actually stick.',
      introduction: 'Most people try to change their lives by setting big goals. James Clear argues the real lever is smaller and far less dramatic: your daily systems.',
      content: 'Atomic Habits reframes habit-building around identity rather than outcomes, and gives a practical framework — cue, craving, response, reward — for making good habits easier and bad ones harder.',
      lessons: JSON.stringify(lessons),
      takeaway: 'You do not rise to the level of your goals — you fall to the level of your systems. Build small, boring, repeatable habits instead of chasing motivation.',
      who_should_read: 'Anyone who has set a goal, felt motivated for a week, then quietly fallen off. This is a practical, non-preachy system for people who want change to actually last.',
      affiliate_url: '',
      seo_title: 'Atomic Habits Summary — Key Lessons from James Clear',
      seo_description: 'An original summary and interpretation of Atomic Habits by James Clear — key lessons, examples, and how to apply them.',
      tags: 'habits, productivity, self-improvement',
      reading_time: 6,
      featured: 1,
      published: 1,
      publication_date: now
    }
  });

  console.log('Sample article seeded: /books/atomic-habits-summary');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to seed sample article:', err);
  process.exit(1);
});
