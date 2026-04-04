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
  const { question, answer } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a PA school interview coach. 
When given a student's answer to a question, return a JSON object with EXACTLY these keys:

- score: integer 0-10 evaluating the answer
- red_flags: array of issues or mistakes in the answer
- pa_qualities: array of PA qualities demonstrated
- strengths: array of strengths in the answer
- overall_feedback: a paragraph summarizing feedback, explaining what was good, what can be improved, and why

Always:
- Only respond in JSON format
- Include all keys, even if arrays are empty or strings are blank
- Do NOT return a transcript or top student/sample answer`
        },
        { role: "user", content: `Question: ${question}\nStudent Answer: ${answer}` }
      ]
    });

    const aiText = response.choices[0].message.content;

    let feedbackJSON;
    try {
      feedbackJSON = JSON.parse(aiText);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err);
      feedbackJSON = {
        score: 7,
        red_flags: [],
        pa_qualities: [],
        strengths: [],
        overall_feedback: aiText || ""
      };
    }

    // Ensure all keys exist
    const keys = ["score", "red_flags", "pa_qualities", "strengths", "overall_feedback"];
    for (let key of keys) {
      if (!(key in feedbackJSON)) {
        feedbackJSON[key] = Array.isArray(feedbackJSON[key]) ? [] : "";
      }
    }

    res.json(feedbackJSON);
  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
