const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const result = await genAI.listModels();
  console.log("AVAILABLE MODELS:\n");

  result.models.forEach((m) => {
    console.log(m.name);
  });
}

listModels();