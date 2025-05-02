'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const generateCodeBlocks = async () => {
    const key = localStorage.getItem('OPENAI_API_KEY');
    if (!key) {
      setShowApiKeyModal(true);
      return;
    }
    await makeGenerateRequest(key);
  };

  const handleApiKeySubmit = () => {
    if (!apiKeyInput.trim()) return;
    localStorage.setItem('OPENAI_API_KEY', apiKeyInput);
    setShowApiKeyModal(false);
    makeGenerateRequest(apiKeyInput);
    setApiKeyInput('');
  };

  const makeGenerateRequest = async (apiKey: string) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        apiKey
      })
    });

    const data = await res.json();
    if (data.puzzle) {
      // store puzzle and navigate to the puzzle page
      localStorage.setItem('NEW_PUZZLE', JSON.stringify(data.puzzle));
      console.log('puzzle', data.puzzle);
      router.push('/puzzle');
    } else {
      console.error(data.error || 'Failed to generate puzzle');
    }
  };

  return (
    <main className="p-8 max-w-xl mx-auto">
      <textarea
        className="w-full p-2 border rounded"
        rows={5}
        placeholder="describe the programming task that you want to be solved..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="mt-4 flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={generateCodeBlocks}
        >
          generate
        </button>
      </div>

      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enter OpenAI API Key</h2>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              placeholder="sk-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowApiKeyModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleApiKeySubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
