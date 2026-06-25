let memoryStorage: Record<string, string> = {};

export const storage = {
  getItem: async (key: string) => memoryStorage[key] || null,
  setItem: async (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: async (key: string) => { delete memoryStorage[key]; }
};
