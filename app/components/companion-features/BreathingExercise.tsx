import { useState, useEffect } from "react";

interface BreathingExerciseProps {
  technique: string;
  instructions: string[];
  duration: number;
  onComplete?: () => void;
}

export default function BreathingExercise({ 
  technique, 
  instructions, 
  duration, 
  onComplete 
}: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, onComplete]);

  const startExercise = () => {
    setIsActive(true);
    setTimeRemaining(duration);
    setCurrentStep(0);
  };

  const stopExercise = () => {
    setIsActive(false);
    setTimeRemaining(duration);
    setCurrentStep(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Breathing Exercise</h3>
        <p className="text-lg text-gray-600 mb-4">{technique} Technique</p>
        
        {!isActive && (
          <button
            onClick={startExercise}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-colors duration-200"
          >
            Start Exercise
          </button>
        )}
        
        {isActive && (
          <div className="space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {formatTime(timeRemaining)}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={stopExercise}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
              >
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visual Breathing Guide */}
      <div className="flex justify-center mb-6">
        <div className={`w-32 h-32 rounded-full border-4 border-blue-300 transition-all duration-1000 ${
          isActive ? 'bg-blue-100 scale-110' : 'bg-white scale-100'
        }`}>
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl">🫁</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
        {instructions.map((instruction, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${
              index === currentStep && isActive
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                index === currentStep && isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="text-sm">{instruction}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((duration - timeRemaining) / duration) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Progress: {Math.round(((duration - timeRemaining) / duration) * 100)}%
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Tips for Success:</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Find a comfortable position</li>
          <li>• Close your eyes if it helps you focus</li>
          <li>• Don't force the breath - let it flow naturally</li>
          <li>• If you feel dizzy, stop and breathe normally</li>
        </ul>
      </div>
    </div>
  );
}
