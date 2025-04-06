require('dotenv').config();
const contentful = require('contentful');

module.exports = async () => {
  const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
  });

  const entries = await client.getEntries({ content_type: 'flashcardDeck' });
  return entries.items;
};