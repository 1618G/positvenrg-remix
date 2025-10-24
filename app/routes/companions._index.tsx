import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { db } from "~/lib/db.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return json({ companions });
}

const moods = ['All', 'Cheerful', 'Calm', 'Motivational', 'Night Owl', 'Empathetic'];

export default function CompanionsPage() {
  const { companions } = useLoaderData<typeof loader>();
  const [selectedMood, setSelectedMood] = useState('All');

  // Filter companions based on selected mood
  const filteredCompanions = companions.filter(companion => {
    if (selectedMood === 'All') return true;
    
    const personality = companion.personality?.toLowerCase() || '';
    const mood = selectedMood.toLowerCase();
    
    // Map moods to personality traits
    const moodMappings = {
      'cheerful': ['cheerful', 'positive', 'sunny', 'bright', 'energetic'],
      'calm': ['calm', 'peaceful', 'mindful', 'gentle', 'serene'],
      'motivational': ['motivated', 'goal-oriented', 'action-focused', 'productive', 'driven'],
      'night owl': ['night', 'evening', 'late', 'insomnia', 'sleep'],
      'empathetic': ['empathetic', 'listening', 'understanding', 'supportive', 'caring']
    };
    
    const traits = moodMappings[mood as keyof typeof moodMappings] || [];
    return traits.some(trait => personality.includes(trait));
  });

  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="heading-xl mb-6">
              Find your perfect companion
            </h1>
            <p className="text-body max-w-3xl mx-auto mb-8">
              Choose from a variety of personalities designed to match your mood, style, and goals. 
              Each companion has their own unique way of supporting you.
            </p>
            
            {/* Mood Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    selectedMood === mood
                      ? 'bg-sunrise-gradient text-charcoal-900 shadow-warm' 
                      : 'bg-white text-charcoal-700 hover:bg-sunrise-100 border border-sunrise-200'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Companions Grid */}
      <section className="py-16 bg-sunrise-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanions.map((companion) => (
              <div key={companion.id} className="card-character group">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="avatar-frame mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="text-4xl">{companion.avatar}</span>
                    </div>
                  </div>

                  {/* Name and Tagline */}
                  <h3 className="heading-md mb-2">{companion.name}</h3>
                  <p className="text-accent mb-4 font-medium">
                    {companion.description}
                  </p>

                  {/* Personality Traits */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {companion.personality?.split(',').slice(0, 3).map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-sunrise-100 text-sunrise-800 text-sm rounded-full font-medium"
                      >
                        {trait.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-body text-charcoal-600 mb-6">
                    {companion.personality}
                  </p>

                  {/* Premium Badge */}
                  {companion.name === 'Spark' || companion.name === 'Echo' ? (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-peach-100 text-peach-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        Premium
                      </span>
                    </div>
                  ) : null}

                  {/* Chat Button */}
                  <Link
                    to={`/chat/${companion.id}`}
                    className="btn-primary w-full"
                  >
                    Chat Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Choose Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-lg mb-6">Not sure which companion to choose?</h2>
          <p className="text-body mb-8">
            Each companion is designed for different moments and needs. You can always switch between them, 
            and they'll remember your conversations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="card">
              <h3 className="heading-md mb-4">For Daily Support</h3>
              <p className="text-body mb-4">
                <strong>PositiveNRG</strong> and <strong>Sunny</strong> are perfect for everyday encouragement and positive energy.
              </p>
              <p className="text-body">
                <strong>CalmFlow</strong> helps with mindfulness and stress relief.
              </p>
            </div>
            
            <div className="card">
              <h3 className="heading-md mb-4">For Specific Goals</h3>
              <p className="text-body mb-4">
                <strong>Spark</strong> is your motivation coach for productivity and goal-setting.
              </p>
              <p className="text-body">
                <strong>Echo</strong> provides deep listening and reflection for processing thoughts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
