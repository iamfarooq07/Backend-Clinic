import axios from 'axios';

// Fallback medical advice when AI fails
const fallbackAdvice = {
  possibleConditions: ['General consultation recommended'],
  riskLevel: 'medium',
  suggestedTests: ['Complete Blood Count', 'Basic Metabolic Panel'],
  recommendations: 'Please consult with a healthcare professional for proper diagnosis and treatment.',
};

// AI-powered symptom analysis using Gemini or OpenAI
export const analyzeSymptoms = async (symptoms, age, gender, medicalHistory) => {
  try {
    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      return await analyzeWithGemini(symptoms, age, gender, medicalHistory);
    }
    
    // Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      return await analyzeWithOpenAI(symptoms, age, gender, medicalHistory);
    }

    console.warn('No AI API key configured, using fallback advice');
    return fallbackAdvice;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return fallbackAdvice;
  }
};

// Gemini AI Analysis
const analyzeWithGemini = async (symptoms, age, gender, medicalHistory) => {
  const prompt = `You are a medical AI assistant. Analyze the following patient information and provide a structured response in JSON format only:

Patient Information:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms}
- Medical History: ${medicalHistory || 'None provided'}

Respond ONLY with a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "riskLevel": "low|medium|high|critical",
  "suggestedTests": ["test1", "test2", "test3"],
  "recommendations": "Brief medical recommendations"
}

Important: This is for informational purposes only. Always recommend consulting a healthcare professional.`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const aiContent = response.data.candidates[0].content.parts[0].text;
  
  // Try to parse JSON response
  try {
    // Remove markdown code blocks if present
    let cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedResponse = JSON.parse(cleanContent);
    return parsedResponse;
  } catch (parseError) {
    console.warn('Failed to parse Gemini JSON response, extracting manually');
    return {
      possibleConditions: extractConditions(aiContent),
      riskLevel: extractRiskLevel(aiContent),
      suggestedTests: extractTests(aiContent),
      recommendations: aiContent.substring(0, 300),
    };
  }
};

// OpenAI Analysis (fallback)
const analyzeWithOpenAI = async (symptoms, age, gender, medicalHistory) => {
  const prompt = `You are a medical AI assistant. Analyze the following patient information and provide a structured response:

Patient Information:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms}
- Medical History: ${medicalHistory || 'None provided'}

Provide a JSON response with:
1. possibleConditions: Array of 2-4 possible medical conditions
2. riskLevel: One of "low", "medium", "high", "critical"
3. suggestedTests: Array of 2-4 recommended medical tests
4. recommendations: Brief medical recommendations and precautions

Important: This is for informational purposes only. Always recommend consulting a healthcare professional.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant. Provide structured medical analysis in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const aiContent = response.data.choices[0].message.content;
  
  try {
    const parsedResponse = JSON.parse(aiContent);
    return parsedResponse;
  } catch (parseError) {
    return {
      possibleConditions: extractConditions(aiContent),
      riskLevel: extractRiskLevel(aiContent),
      suggestedTests: extractTests(aiContent),
      recommendations: aiContent.substring(0, 300),
    };
  }
};

// Generate prescription explanation using AI
export const generatePrescriptionExplanation = async (medicines, diagnosis) => {
  try {
    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      return await explainWithGemini(medicines, diagnosis);
    }
    
    // Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      return await explainWithOpenAI(medicines, diagnosis);
    }

    return {
      explanation: 'Please follow the prescribed medication as directed by your doctor.',
      lifestyleAdvice: 'Maintain a healthy diet, exercise regularly, and get adequate rest.',
      preventiveTips: 'Follow up with your doctor as scheduled.',
    };
  } catch (error) {
    console.error('AI Prescription Explanation Error:', error.message);
    return {
      explanation: 'Please follow the prescribed medication as directed by your doctor.',
      lifestyleAdvice: 'Maintain a healthy diet and exercise regularly.',
      preventiveTips: 'Schedule regular check-ups with your doctor.',
    };
  }
};

// Gemini prescription explanation
const explainWithGemini = async (medicines, diagnosis) => {
  const medicineList = medicines.map(m => `${m.name} - ${m.dosage} - ${m.frequency}`).join(', ');
  
  const prompt = `Provide a simple explanation for a patient about their prescription in JSON format only:

Diagnosis: ${diagnosis}
Medicines: ${medicineList}

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "explanation": "Simple explanation of what the medicines do (2-3 sentences)",
  "lifestyleAdvice": "2-3 lifestyle recommendations",
  "preventiveTips": "2-3 preventive care tips"
}

Keep language simple and patient-friendly.`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const aiContent = response.data.candidates[0].content.parts[0].text;
  
  try {
    let cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  } catch {
    return {
      explanation: aiContent.substring(0, 200),
      lifestyleAdvice: 'Maintain a healthy lifestyle.',
      preventiveTips: 'Follow your doctor\'s advice.',
    };
  }
};

// OpenAI prescription explanation
const explainWithOpenAI = async (medicines, diagnosis) => {
  const medicineList = medicines.map(m => `${m.name} - ${m.dosage} - ${m.frequency}`).join(', ');
  
  const prompt = `Provide a simple explanation for a patient about their prescription:

Diagnosis: ${diagnosis}
Medicines: ${medicineList}

Provide a JSON response with:
1. explanation: Simple explanation of what the medicines do (2-3 sentences)
2. lifestyleAdvice: 2-3 lifestyle recommendations
3. preventiveTips: 2-3 preventive care tips

Keep language simple and patient-friendly.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const aiContent = response.data.choices[0].message.content;
  
  try {
    return JSON.parse(aiContent);
  } catch {
    return {
      explanation: aiContent.substring(0, 200),
      lifestyleAdvice: 'Maintain a healthy lifestyle.',
      preventiveTips: 'Follow your doctor\'s advice.',
    };
  }
};

// Helper functions for parsing AI responses
function extractConditions(text) {
  const conditions = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('condition') || line.match(/^\d+\./)) {
      conditions.push(line.replace(/^\d+\./, '').trim());
    }
  }
  return conditions.length > 0 ? conditions.slice(0, 4) : ['Consultation recommended'];
}

function extractRiskLevel(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('severe')) return 'critical';
  if (lowerText.includes('high risk')) return 'high';
  if (lowerText.includes('moderate') || lowerText.includes('medium')) return 'medium';
  return 'low';
}

function extractTests(text) {
  const tests = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('test') || line.toLowerCase().includes('examination')) {
      tests.push(line.replace(/^\d+\./, '').trim());
    }
  }
  return tests.length > 0 ? tests.slice(0, 4) : ['General health checkup'];
}
