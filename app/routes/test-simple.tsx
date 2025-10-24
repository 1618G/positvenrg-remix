export default function TestSimple() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Remix App Working!
        </h1>
        <p className="text-gray-600">
          The app is running successfully on port 8780
        </p>
      </div>
    </div>
  );
}
