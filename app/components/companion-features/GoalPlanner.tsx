import { useState } from "react";

interface GoalPlannerProps {
  onSave?: (goal: GoalData) => void;
}

interface GoalData {
  title: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  actionSteps: string[];
  deadline: string;
}

export default function GoalPlanner({ onSave }: GoalPlannerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [goal, setGoal] = useState<GoalData>({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    actionSteps: [''],
    deadline: ''
  });

  const steps = [
    { title: 'Goal Title', field: 'title', placeholder: 'What do you want to achieve?' },
    { title: 'Description', field: 'description', placeholder: 'Describe your goal in detail' },
    { title: 'Specific', field: 'specific', placeholder: 'What exactly do you want to achieve?' },
    { title: 'Measurable', field: 'measurable', placeholder: 'How will you know when you\'ve achieved it?' },
    { title: 'Achievable', field: 'achievable', placeholder: 'Is this goal realistic for you?' },
    { title: 'Relevant', field: 'relevant', placeholder: 'Why is this goal important to you?' },
    { title: 'Time-bound', field: 'timeBound', placeholder: 'When do you want to achieve this by?' }
  ];

  const handleInputChange = (field: keyof GoalData, value: string) => {
    setGoal(prev => ({ ...prev, [field]: value }));
  };

  const handleActionStepChange = (index: number, value: string) => {
    const newSteps = [...goal.actionSteps];
    newSteps[index] = value;
    setGoal(prev => ({ ...prev, actionSteps: newSteps }));
  };

  const addActionStep = () => {
    setGoal(prev => ({ ...prev, actionSteps: [...prev.actionSteps, ''] }));
  };

  const removeActionStep = (index: number) => {
    if (goal.actionSteps.length > 1) {
      const newSteps = goal.actionSteps.filter((_, i) => i !== index);
      setGoal(prev => ({ ...prev, actionSteps: newSteps }));
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    onSave?.(goal);
  };

  const isCurrentStepValid = () => {
    const currentField = steps[currentStep].field as keyof GoalData;
    return goal[currentField] && goal[currentField].trim().length > 0;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">SMART Goal Planner</h3>
        <p className="text-gray-600">Let's create a well-defined, achievable goal together</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          {steps[currentStep].title}
        </h4>
        
        {currentStep < 7 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {steps[currentStep].placeholder}
            </label>
            <textarea
              value={goal[steps[currentStep].field as keyof GoalData] as string}
              onChange={(e) => handleInputChange(steps[currentStep].field as keyof GoalData, e.target.value)}
              placeholder={steps[currentStep].placeholder}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={goal.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Steps
              </label>
              {goal.actionSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleActionStepChange(index, e.target.value)}
                    placeholder={`Action step ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {goal.actionSteps.length > 1 && (
                    <button
                      onClick={() => removeActionStep(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addActionStep}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                + Add another step
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={nextStep}
            disabled={!isCurrentStepValid()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Save Goal
          </button>
        )}
      </div>

      {/* Goal Preview */}
      {currentStep > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-semibold text-gray-900 mb-2">Goal Preview:</h5>
          <div className="text-sm text-gray-700 space-y-1">
            {goal.title && <p><strong>Title:</strong> {goal.title}</p>}
            {goal.specific && <p><strong>Specific:</strong> {goal.specific}</p>}
            {goal.measurable && <p><strong>Measurable:</strong> {goal.measurable}</p>}
            {goal.deadline && <p><strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
