import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.post("/feedback", async (req, res) => {
  const { answer } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a PA school interview coach. 
When given a student's answer, return a JSON object with EXACTLY the following keys:
- score: integer 0-10 evaluating the answer
- red_flags: array of red flags/issues in the answer
- pa_qualities: array of PA qualities demonstrated
- strengths: array of strengths in the answer
- top_student_response: example of an excellent answer
- overall_feedback: paragraph explaining feedback

Only respond in JSON format. Do not add any extra text.`
        },
        { role: "user", content: answer }
      ]
    });

    // Attempt to parse JSON output
    const aiText = response.choices[0].message.content;
    const feedbackJSON = JSON.parse(aiText);

    // Return structured JSON directly
    res.json(feedbackJSON);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
