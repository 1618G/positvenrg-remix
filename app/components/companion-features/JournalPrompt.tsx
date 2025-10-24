import { useState } from "react";

interface JournalPromptProps {
  onSave?: (entry: JournalEntry) => void;
}

interface JournalEntry {
  prompt: string;
  response: string;
  category: string;
  date: string;
  mood: number;
  insights: string[];
}

export default function JournalPrompt({ onSave }: JournalPromptProps) {
  const [entry, setEntry] = useState<JournalEntry>({
    prompt: '',
    response: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    mood: 5,
    insights: ['']
  });

  const promptCategories = {
    daily: [
      "What am I grateful for today?",
      "What challenged me today?",
      "What did I learn about myself?",
      "What brought me joy today?",
      "What would I tell my younger self about today?"
    ],
    emotional: [
      "What emotions am I feeling right now?",
      "What triggered these emotions?",
      "How can I process these feelings?",
      "What would help me feel more balanced?",
      "What am I avoiding feeling?"
    ],
    growth: [
      "What would I tell my younger self?",
      "What am I proud of accomplishing?",
      "What do I want to improve about myself?",
      "What patterns do I notice in my life?",
      "What am I ready to let go of?"
    ],
    relationships: [
      "How do I want to show up in my relationships?",
      "What boundaries do I need to set?",
      "Who do I need to forgive?",
      "What love do I want to give and receive?",
      "How can I be more present with others?"
    ],
    goals: [
      "What do I want to achieve this year?",
      "What's holding me back from my dreams?",
      "What small step can I take today?",
      "What would success look like to me?",
      "How can I align my actions with my values?"
    ]
  };

  const handleInputChange = (field: keyof JournalEntry, value: string | number) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...entry.insights];
    newInsights[index] = value;
    setEntry(prev => ({ ...prev, insights: newInsights }));
  };

  const addInsight = () => {
    setEntry(prev => ({ ...prev, insights: [...prev.insights, ''] }));
  };

  const removeInsight = (index: number) => {
    if (entry.insights.length > 1) {
      const newInsights = entry.insights.filter((_, i) => i !== index);
      setEntry(prev => ({ ...prev, insights: newInsights }));
    }
  };

  const generateRandomPrompt = (category: string) => {
    const prompts = promptCategories[category as keyof typeof promptCategories];
    if (prompts && prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setEntry(prev => ({ ...prev, prompt: randomPrompt, category }));
    }
  };

  const handleSave = () => {
    onSave?.(entry);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Journal Prompt</h3>
        <p className="text-gray-600">Reflect and explore your thoughts and feelings</p>
      </div>

      <div className="space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={entry.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reflection Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.keys(promptCategories).map(category => (
              <button
                key={category}
                onClick={() => generateRandomPrompt(category)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                  entry.category === category
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Prompt */}
        {entry.prompt && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Your Reflection Prompt:</h4>
            <p className="text-blue-800 italic">"{entry.prompt}"</p>
          </div>
        )}

        {/* Journal Response */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            value={entry.response}
            onChange={(e) => handleInputChange('response', e.target.value)}
            placeholder="Take your time to reflect deeply on the prompt. There are no right or wrong answers..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={8}
          />
        </div>

        {/* Mood Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling after writing? (1-10)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={entry.mood}
              onChange={(e) => handleInputChange('mood', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-2xl font-bold text-purple-600 w-12 text-center">
              {entry.mood}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Insights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Insights
          </label>
          <p className="text-sm text-gray-600 mb-3">
            What did you discover about yourself through this reflection?
          </p>
          {entry.insights.map((insight, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={insight}
                onChange={(e) => handleInsightChange(index, e.target.value)}
                placeholder={`Insight ${index + 1}`}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {entry.insights.length > 1 && (
                <button
                  onClick={() => removeInsight(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addInsight}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Add another insight
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Save Journal Entry
          </button>
        </div>

        {/* Journaling Tips */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <h5 className="font-semibold text-purple-900 mb-2">✍️ Journaling Tips:</h5>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Write without judgment - this is for you</li>
            <li>• Be honest about your feelings</li>
            <li>• Don't worry about grammar or structure</li>
            <li>• Set aside 10-15 minutes for reflection</li>
            <li>• Review your entries periodically to notice patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
