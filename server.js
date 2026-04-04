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
You are a PA school interview coach and an expert in what makes an outstanding PA school interview answer. 
When given a student's answer, return a JSON object with EXACTLY these keys:

- score: integer 0-10 evaluating how strong the answer is
- red_flags: array of issues or mistakes in the answer
- pa_qualities: array of PA qualities demonstrated in the answer (empathy, teamwork, etc.)
- strengths: array of specific strengths in the answer
- top_student_response: write an ideal, highly compelling answer that a top PA school applicant would give. Make it clear, detailed, and impressive — as if a real top student wrote it.
- overall_feedback: paragraph summarizing feedback, explaining what was good, what to improve, and why

Always:
- Make the top_student_response detailed, realistic, and inspiring
- Only respond in JSON format
- Include all keys, even if arrays are empty or strings are blank
- Do not add extra commentary or text outside JSON`
        },
        { role: "user", content: answer }
      ]
    });

    const aiText = response.choices[0].message.content;

    // Try to parse AI output as JSON
    let feedbackJSON;
    try {
      feedbackJSON = JSON.parse(aiText);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err);
      // Provide all keys even if AI fails
      feedbackJSON = {
        score: 7,
        red_flags: [],
        pa_qualities: [],
        strengths: [],
        top_student_response: "",
        overall_feedback: aiText || ""
      };
    }

    // Ensure all keys exist
    const keys = ["score","red_flags","pa_qualities","strengths","top_student_response","overall_feedback"];
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
