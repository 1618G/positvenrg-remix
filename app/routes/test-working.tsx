export default function TestWorking() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Remix App Working!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Server is running successfully on port 8780
        </p>
        <div className="space-x-4">
          <a href="/" className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
            Go to Homepage
          </a>
          <a href="/login" className="bg-green-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
