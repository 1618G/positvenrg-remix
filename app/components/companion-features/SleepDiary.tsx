import { useState } from "react";

interface SleepDiaryProps {
  onSave?: (entry: SleepEntry) => void;
}

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  sleepQuality: number;
  dreams: string;
  factors: string[];
  energyLevel: number;
  notes: string;
}

export default function SleepDiary({ onSave }: SleepDiaryProps) {
  const [entry, setEntry] = useState<SleepEntry>({
    date: new Date().toISOString().split('T')[0],
    bedtime: '',
    wakeTime: '',
    sleepQuality: 5,
    dreams: '',
    factors: [''],
    energyLevel: 5,
    notes: ''
  });

  const sleepFactors = [
    'Stress',
    'Caffeine',
    'Alcohol',
    'Exercise',
    'Screen time',
    'Noise',
    'Light',
    'Temperature',
    'Medication',
    'Anxiety',
    'Pain',
    'Other'
  ];

  const handleInputChange = (field: keyof SleepEntry, value: string | number) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleFactorChange = (index: number, value: string) => {
    const newFactors = [...entry.factors];
    newFactors[index] = value;
    setEntry(prev => ({ ...prev, factors: newFactors }));
  };

  const addFactor = () => {
    setEntry(prev => ({ ...prev, factors: [...prev.factors, ''] }));
  };

  const removeFactor = (index: number) => {
    if (entry.factors.length > 1) {
      const newFactors = entry.factors.filter((_, i) => i !== index);
      setEntry(prev => ({ ...prev, factors: newFactors }));
    }
  };

  const handleSave = () => {
    onSave?.(entry);
  };

  const calculateSleepDuration = () => {
    if (!entry.bedtime || !entry.wakeTime) return '0h 0m';
    
    const bedtime = new Date(`2000-01-01T${entry.bedtime}`);
    const wakeTime = new Date(`2000-01-01T${entry.wakeTime}`);
    
    if (wakeTime <= bedtime) {
      wakeTime.setDate(wakeTime.getDate() + 1);
    }
    
    const diff = wakeTime.getTime() - bedtime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Sleep Diary</h3>
        <p className="text-gray-600">Track your sleep patterns and quality</p>
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

        {/* Sleep Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedtime
            </label>
            <input
              type="time"
              value={entry.bedtime}
              onChange={(e) => handleInputChange('bedtime', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wake Time
            </label>
            <input
              type="time"
              value={entry.wakeTime}
              onChange={(e) => handleInputChange('wakeTime', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sleep Duration */}
        {entry.bedtime && entry.wakeTime && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Sleep Duration</h4>
            <p className="text-2xl font-bold text-blue-600">{calculateSleepDuration()}</p>
          </div>
        )}

        {/* Sleep Quality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Quality (1-10)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={entry.sleepQuality}
              onChange={(e) => handleInputChange('sleepQuality', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-2xl font-bold text-blue-600 w-12 text-center">
              {entry.sleepQuality}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Morning Energy Level (1-10)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              value={entry.energyLevel}
              onChange={(e) => handleInputChange('energyLevel', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-2xl font-bold text-green-600 w-12 text-center">
              {entry.energyLevel}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Dreams */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dreams or Nightmares
          </label>
          <textarea
            value={entry.dreams}
            onChange={(e) => handleInputChange('dreams', e.target.value)}
            placeholder="Describe any dreams, nightmares, or sleep experiences..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Factors Affecting Sleep */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Factors Affecting Sleep
          </label>
          {entry.factors.map((factor, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                value={factor}
                onChange={(e) => handleFactorChange(index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a factor...</option>
                {sleepFactors.map((sleepFactor, idx) => (
                  <option key={idx} value={sleepFactor}>{sleepFactor}</option>
                ))}
              </select>
              {entry.factors.length > 1 && (
                <button
                  onClick={() => removeFactor(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addFactor}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Add another factor
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={entry.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any other observations about your sleep..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Save Entry
          </button>
        </div>

        {/* Sleep Tips */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-2">💤 Sleep Tips:</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Aim for 7-9 hours of sleep per night</li>
            <li>• Keep a consistent sleep schedule</li>
            <li>• Avoid screens 1 hour before bed</li>
            <li>• Create a cool, dark, quiet sleep environment</li>
            <li>• Limit caffeine after 2 PM</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
