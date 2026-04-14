import Groq from 'groq-sdk';

let groq = null;
const getGroqClient = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};

// Fallback medical advice when AI fails
const fallbackAdvice = {
  possibleConditions: ['General consultation recommended'],
  riskLevel: 'medium',
  suggestedTests: ['Complete Blood Count', 'Basic Metabolic Panel'],
  recommendations: 'Please consult with a healthcare professional for proper diagnosis and treatment.',
};

// AI-powered symptom analysis using Groq
export const analyzeSymptoms = async (symptoms, age, gender, medicalHistory) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('No GROQ_API_KEY configured, using fallback advice');
      return fallbackAdvice;
    }

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

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are a medical AI assistant. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiContent = completion.choices[0].message.content;

    try {
      let cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch {
      console.warn('Failed to parse Groq JSON response, extracting manually');
      return {
        possibleConditions: extractConditions(aiContent),
        riskLevel: extractRiskLevel(aiContent),
        suggestedTests: extractTests(aiContent),
        recommendations: aiContent.substring(0, 300),
      };
    }
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return fallbackAdvice;
  }
};

// Generate prescription explanation using Groq
export const generatePrescriptionExplanation = async (medicines, diagnosis) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return {
        explanation: 'Please follow the prescribed medication as directed by your doctor.',
        lifestyleAdvice: 'Maintain a healthy diet, exercise regularly, and get adequate rest.',
        preventiveTips: 'Follow up with your doctor as scheduled.',
      };
    }

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

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are a medical AI assistant. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiContent = completion.choices[0].message.content;

    try {
      let cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch {
      return {
        explanation: aiContent.substring(0, 200),
        lifestyleAdvice: 'Maintain a healthy lifestyle.',
        preventiveTips: "Follow your doctor's advice.",
      };
    }
  } catch (error) {
    console.error('AI Prescription Explanation Error:', error.message);
    return {
      explanation: 'Please follow the prescribed medication as directed by your doctor.',
      lifestyleAdvice: 'Maintain a healthy diet and exercise regularly.',
      preventiveTips: 'Schedule regular check-ups with your doctor.',
    };
  }
};

// Helper functions
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
