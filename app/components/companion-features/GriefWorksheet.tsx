import { useState } from "react";

interface GriefWorksheetProps {
  onSave?: (data: GriefData) => void;
}

interface GriefData {
  lovedOneName: string;
  relationship: string;
  dateOfLoss: string;
  currentStage: string;
  feelings: string[];
  memories: string[];
  copingStrategies: string[];
  supportSystems: string[];
  challenges: string[];
  hopes: string[];
}

export default function GriefWorksheet({ onSave }: GriefWorksheetProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [data, setData] = useState<GriefData>({
    lovedOneName: '',
    relationship: '',
    dateOfLoss: '',
    currentStage: '',
    feelings: [''],
    memories: [''],
    copingStrategies: [''],
    supportSystems: [''],
    challenges: [''],
    hopes: ['']
  });

  const sections = [
    { title: 'About Your Loved One', fields: ['lovedOneName', 'relationship', 'dateOfLoss'] },
    { title: 'Your Grief Journey', fields: ['currentStage'] },
    { title: 'Your Feelings', fields: ['feelings'] },
    { title: 'Precious Memories', fields: ['memories'] },
    { title: 'Coping Strategies', fields: ['copingStrategies'] },
    { title: 'Support Systems', fields: ['supportSystems'] },
    { title: 'Current Challenges', fields: ['challenges'] },
    { title: 'Hopes for the Future', fields: ['hopes'] }
  ];

  const griefStages = [
    'Denial - Initial shock and disbelief',
    'Anger - Frustration and rage',
    'Bargaining - "What if" scenarios',
    'Depression - Deep sadness and withdrawal',
    'Acceptance - Coming to terms with loss'
  ];

  const handleInputChange = (field: keyof GriefData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof GriefData, index: number, value: string) => {
    const arrayField = field as keyof Pick<GriefData, 'feelings' | 'memories' | 'copingStrategies' | 'supportSystems' | 'challenges' | 'hopes'>;
    const newArray = [...(data[arrayField] as string[])];
    newArray[index] = value;
    setData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: keyof GriefData) => {
    const arrayField = field as keyof Pick<GriefData, 'feelings' | 'memories' | 'copingStrategies' | 'supportSystems' | 'challenges' | 'hopes'>;
    const newArray = [...(data[arrayField] as string[]), ''];
    setData(prev => ({ ...prev, [field]: newArray }));
  };

  const removeArrayItem = (field: keyof GriefData, index: number) => {
    const arrayField = field as keyof Pick<GriefData, 'feelings' | 'memories' | 'copingStrategies' | 'supportSystems' | 'challenges' | 'hopes'>;
    const newArray = (data[arrayField] as string[]).filter((_, i) => i !== index);
    setData(prev => ({ ...prev, [field]: newArray }));
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSave = () => {
    onSave?.(data);
  };

  const renderSection = () => {
    const section = sections[currentSection];
    
    return (
      <div className="space-y-4">
        {section.fields.map(field => {
          if (field === 'currentStage') {
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which stage of grief best describes where you are right now?
                </label>
                <select
                  value={data.currentStage}
                  onChange={(e) => handleInputChange('currentStage', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a stage...</option>
                  {griefStages.map((stage, index) => (
                    <option key={index} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            );
          }
          
          if (['feelings', 'memories', 'copingStrategies', 'supportSystems', 'challenges', 'hopes'].includes(field)) {
            const arrayData = data[field as keyof Pick<GriefData, 'feelings' | 'memories' | 'copingStrategies' | 'supportSystems' | 'challenges' | 'hopes'>] as string[];
            
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field === 'feelings' && 'What feelings are you experiencing? (e.g., sadness, anger, guilt, relief)'}
                  {field === 'memories' && 'What are some precious memories you have?'}
                  {field === 'copingStrategies' && 'What helps you cope? (e.g., talking to friends, journaling, exercise)'}
                  {field === 'supportSystems' && 'Who or what supports you during this time?'}
                  {field === 'challenges' && 'What are the biggest challenges you\'re facing?'}
                  {field === 'hopes' && 'What hopes do you have for the future?'}
                </label>
                {arrayData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange(field as keyof GriefData, index, e.target.value)}
                      placeholder={`${field.slice(0, -1)} ${index + 1}`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {arrayData.length > 1 && (
                      <button
                        onClick={() => removeArrayItem(field as keyof GriefData, index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem(field as keyof GriefData)}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  + Add another
                </button>
              </div>
            );
          }
          
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field === 'lovedOneName' && 'Name of your loved one'}
                {field === 'relationship' && 'Your relationship to them'}
                {field === 'dateOfLoss' && 'Date of their passing'}
              </label>
              {field === 'dateOfLoss' ? (
                <input
                  type="date"
                  value={data[field as keyof GriefData] as string}
                  onChange={(e) => handleInputChange(field as keyof GriefData, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type="text"
                  value={data[field as keyof GriefData] as string}
                  onChange={(e) => handleInputChange(field as keyof GriefData, e.target.value)}
                  placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Grief Processing Worksheet</h3>
        <p className="text-gray-600">A gentle space to explore your grief journey</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Section {currentSection + 1} of {sections.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentSection + 1) / sections.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {sections[currentSection].title}
        </h4>
        {renderSection()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevSection}
          disabled={currentSection === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        {currentSection < sections.length - 1 ? (
          <button
            onClick={nextSection}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Save Worksheet
          </button>
        )}
      </div>

      {/* Support Resources */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h5 className="font-semibold text-purple-900 mb-2">💜 Support Resources:</h5>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Cruse Bereavement Care: 0808 808 1677</li>
          <li>• Samaritans: 116 123 (24/7)</li>
          <li>• GriefShare: griefshare.org</li>
          <li>• Remember: Your grief is valid and you're not alone</li>
        </ul>
      </div>
    </div>
  );
}
