import React, { useState } from 'react';

interface SalesPerformanceProps {
  onClose: () => void;
}

export default function SalesPerformance({ onClose }: SalesPerformanceProps) {
  const [activeTab, setActiveTab] = useState('digest');
  const [dailyWins, setDailyWins] = useState('');
  const [dailyChallenges, setDailyChallenges] = useState('');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [tomorrowGoals, setTomorrowGoals] = useState('');

  const handleDailyDigest = () => {
    // This would integrate with Sally's knowledge base
    // Daily digest submitted
  };

  const getEnergyColor = (level: number) => {
    if (level <= 3) return 'text-red-500';
    if (level <= 6) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getEnergyLabel = (level: number) => {
    if (level <= 3) return 'Low Energy - Time to recharge!';
    if (level <= 6) return 'Moderate Energy - Let\'s optimize!';
    return 'High Energy - Let\'s crush it!';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-nojever max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-fire-gradient p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sally's Performance Center</h2>
                <p className="text-fire-100">Your sales performance coach extraordinaire</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'digest', label: 'Daily Digest', icon: '📊' },
              { id: 'energy', label: 'Energy Boost', icon: '⚡' },
              { id: 'goals', label: 'Goal Tracker', icon: '🎯' },
              { id: 'objections', label: 'Objection Practice', icon: '💬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-fire-500 text-fire-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'digest' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance Digest</h3>
                <p className="text-gray-600 mb-6">Let's analyze your day and plan for tomorrow's success!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏆 Today's Wins
                  </label>
                  <textarea
                    value={dailyWins}
                    onChange={(e) => setDailyWins(e.target.value)}
                    placeholder="What went right today? What deals did you close? What progress did you make?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-fire-500"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔥 Challenges & Learning
                  </label>
                  <textarea
                    value={dailyChallenges}
                    onChange={(e) => setDailyChallenges(e.target.value)}
                    placeholder="What didn't go as planned? What can we learn from today's challenges?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-fire-500"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚡ Energy Level (1-10)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>1</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                    <p className={`text-sm font-medium ${getEnergyColor(energyLevel)}`}>
                      {getEnergyLabel(energyLevel)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Tomorrow's Game Plan
                  </label>
                  <textarea
                    value={tomorrowGoals}
                    onChange={(e) => setTomorrowGoals(e.target.value)}
                    placeholder="What's your strategy for tomorrow? What are your top 3 priorities?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-fire-500"
                    rows={4}
                  />
                </div>
              </div>

              <button
                onClick={handleDailyDigest}
                className="w-full bg-fire-gradient text-white py-3 px-6 rounded-lg font-semibold hover:shadow-fire transition-all duration-300 transform hover:scale-105"
              >
                🚀 Complete Daily Digest
              </button>
            </div>
          )}

          {activeTab === 'energy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy & Motivation Boost</h3>
                <p className="text-gray-600 mb-6">Quick energy boosters to get you fired up!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-fire-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-fire-800 mb-3">⚡ Power Poses</h4>
                  <p className="text-sm text-fire-700 mb-4">2 minutes of confident body language</p>
                  <button className="bg-fire-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-fire-600 transition-colors">
                    Start Power Pose Session
                  </button>
                </div>

                <div className="bg-fire-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-fire-800 mb-3">🎵 Pump-Up Playlist</h4>
                  <p className="text-sm text-fire-700 mb-4">High-energy music for motivation</p>
                  <button className="bg-fire-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-fire-600 transition-colors">
                    Play Motivation Mix
                  </button>
                </div>

                <div className="bg-fire-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-fire-800 mb-3">💪 Success Visualization</h4>
                  <p className="text-sm text-fire-700 mb-4">Imagine your best sales day</p>
                  <button className="bg-fire-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-fire-600 transition-colors">
                    Start Visualization
                  </button>
                </div>

                <div className="bg-fire-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-fire-800 mb-3">🏆 Gratitude Practice</h4>
                  <p className="text-sm text-fire-700 mb-4">List 3 wins from today</p>
                  <button className="bg-fire-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-fire-600 transition-colors">
                    Practice Gratitude
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Tracker & Performance Metrics</h3>
                <p className="text-gray-600 mb-6">Track your progress and stay accountable to your goals!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">📞 Calls Made</h4>
                  <div className="text-3xl font-bold text-fire-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">Target: 50/week</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-fire-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">🤝 Meetings Set</h4>
                  <div className="text-3xl font-bold text-fire-600 mb-2">0</div>
                  <div className="text-sm text-gray-500">Target: 15/week</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-fire-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">💰 Revenue Closed</h4>
                  <div className="text-3xl font-bold text-fire-600 mb-2">$0</div>
                  <div className="text-sm text-gray-500">Target: $50K/month</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-fire-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'objections' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Objection Handling Practice</h3>
                <p className="text-gray-600 mb-6">Practice handling common objections like a pro!</p>
              </div>

              <div className="space-y-4">
                {[
                  { objection: "It's too expensive", response: "I understand price is a concern. Let me show you the ROI..." },
                  { objection: "I need to think about it", response: "What specific aspects would you like to consider?" },
                  { objection: "We're not ready to buy", response: "What would need to change for you to be ready?" },
                  { objection: "I need to check with my boss", response: "What information would help your boss make this decision?" }
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">Objection: "{item.objection}"</div>
                    <div className="text-sm text-gray-600">Response: {item.response}</div>
                  </div>
                ))}
              </div>

              <button className="w-full bg-fire-gradient text-white py-3 px-6 rounded-lg font-semibold hover:shadow-fire transition-all duration-300 transform hover:scale-105">
                🎯 Practice Objection Handling
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
