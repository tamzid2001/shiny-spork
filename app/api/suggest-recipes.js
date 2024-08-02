import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful cooking assistant." },
          { role: "user", content: `Suggest 3 recipes using some or all of these ingredients: ${req.body.ingredients.join(', ')}` }
        ],
      });
      const recipes = response.data.choices[0].message.content.split('\n');
      res.status(200).json({ recipes });
    } catch (error) {
      res.status(500).json({ error: 'Error suggesting recipes' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}