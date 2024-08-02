import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await openai.createImageClassification({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What item is in this image?" },
              { type: "image_url", image_url: { url: req.body.image } }
            ],
          },
        ],
      });
      res.status(200).json({ classification: response.data.choices[0].message.content });
    } catch (error) {
      res.status(500).json({ error: 'Error classifying image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}