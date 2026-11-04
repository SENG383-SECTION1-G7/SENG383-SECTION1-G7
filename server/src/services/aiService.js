const { getConfig } = require('../config');

const ROLE_PROMPTS = {
  parent:
    'You are an assistant summarizing weekly child development records for a parent. ' +
    'Use clear, supportive everyday language. Never make decisions, diagnoses, or treatment suggestions. ' +
    'Present everything strictly as an informational summary based on the provided records.',
  specialist:
    'You are an assistant summarizing weekly child development records for a linked specialist. ' +
    'Use concise, structured observational points across domains. Never make clinical diagnoses or treatment decisions. ' +
    'Reference only the provided authorized records.',
};

async function generateRoleSummary({ role, childName, records = [] }) {
  if (!ROLE_PROMPTS[role]) {
    throw new Error(`Unsupported summary role: ${role}`);
  }

  const { aiMode, geminiApiKey, geminiModel } = getConfig();
  const sourceRecords = records.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    date: r.date,
  }));

  if (aiMode !== 'gemini') {
    const summary =
      role === 'parent'
        ? `[Mock Summary for Parent] ${childName} has ${sourceRecords.length} recorded item(s) this week. Review the linked source records below; all decisions remain with you.`
        : `[Mock Summary for Specialist] Cross-record context for ${childName} based on ${sourceRecords.length} authorized record(s). This summary is informational only and does not replace professional judgment.`;

    return {
      label: 'AI-generated',
      mode: 'mock',
      role,
      summary,
      sourceRecords,
    };
  }

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required when AI_MODE=gemini');
  }

  const promptText = [
    ROLE_PROMPTS[role],
    `Child: ${childName}`,
    `Authorized records JSON: ${JSON.stringify(records)}`,
  ].join('\n\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const summary =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    'No summary text returned.';

  return {
    label: 'AI-generated',
    mode: 'gemini',
    role,
    summary,
    sourceRecords,
  };
}

module.exports = { generateRoleSummary, ROLE_PROMPTS };
