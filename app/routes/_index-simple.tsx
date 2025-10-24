import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              No Judgement Ever —<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Find a Friend, Find Your PositiveNRG
              </span>
            </h1>
            <p className="text-lg text-gray-700 mb-12 max-w-4xl mx-auto">
              Interactive AI companions that listen, support, and uplift — anytime you need them. 
              Whether it's sharing your thoughts, calming your mind, or just chatting, we're here — without judgement.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/login" className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:shadow-lg text-gray-900 font-medium py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg px-8 py-4">
                Meet PositiveNRG
              </Link>
              <Link to="/register" className="bg-green-200 hover:bg-green-300 text-gray-900 font-medium py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg px-8 py-4">
                Browse Companions
              </Link>
            </div>

            {/* Character Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-lg border border-yellow-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 p-1 shadow-lg mx-auto mb-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">😊</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">PositiveNRG</h3>
                <p className="text-sm text-gray-600">Your bright companion</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg border border-yellow-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 p-1 shadow-lg mx-auto mb-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">🧘‍♀️</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">CalmFlow</h3>
                <p className="text-sm text-gray-600">Mindfulness guide</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg border border-yellow-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 p-1 shadow-lg mx-auto mb-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Spark</h3>
                <p className="text-sm text-gray-600">Goal motivator</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg border border-yellow-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 p-1 shadow-lg mx-auto mb-4">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌙</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Luna</h3>
                <p className="text-sm text-gray-600">Night companion</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-orange-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">Your safe space is waiting</h2>
          <p className="text-lg text-gray-700 mb-8">
            Join thousands of people who have found comfort, support, and companionship with their AI friends.
          </p>
          <Link to="/register" className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:shadow-lg text-gray-900 font-medium py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg px-8 py-4">
            Subscribe Now — No Judgement Ever
          </Link>
        </div>
      </section>
    </div>
  );
}
