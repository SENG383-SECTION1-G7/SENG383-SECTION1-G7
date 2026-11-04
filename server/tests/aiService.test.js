const { generateRoleSummary } = require('../src/services/aiService');
const { getConfig } = require('../src/config');

afterEach(() => { jest.restoreAllMocks(); });

test('test execution forces mock mode even when inherited environment requests Gemini', async () => {
  const previous = process.env.AI_MODE;
  process.env.AI_MODE = 'gemini';
  const network = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network forbidden in tests'));
  try {
    expect(getConfig().aiMode).toBe('mock');
    const result = await generateRoleSummary({role:'parent',childName:'Synthetic child'});
    expect(result.mode).toBe('mock');
    expect(network).not.toHaveBeenCalled();
  } finally {
    if (previous === undefined) delete process.env.AI_MODE;
    else process.env.AI_MODE = previous;
  }
});

test('mock summaries distinguish roles and preserve source references without network access', async () => {
  const network = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network forbidden in tests'));
  const records = [{id:7,type:'entry',title:'Observation',date:'2026-11-03',content:'Synthetic observation'}];
  const parent = await generateRoleSummary({role:'parent',childName:'Demo',records});
  const specialist = await generateRoleSummary({role:'specialist',childName:'Demo',records});
  expect(parent.summary).not.toBe(specialist.summary);
  expect(parent.sourceRecords).toEqual([{id:7,type:'entry',title:'Observation',date:'2026-11-03'}]);
  expect(parent.label).toBe('AI-generated');
  expect(network).not.toHaveBeenCalled();
  await expect(generateRoleSummary({role:'child',childName:'Demo'})).rejects.toThrow('Unsupported summary role');
});
