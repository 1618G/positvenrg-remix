import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { verifyUserSession, getUserById } from "~/lib/auth.server";
import Navigation from "~/components/Navigation";
import Footer from "~/components/Footer";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return redirect("/login");
  }

  const session = verifyUserSession(token);
  if (!session) {
    return redirect("/login");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return redirect("/login");
  }

  const companions = await db.companion.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const recentChats = await db.chat.findMany({
    where: { userId: user.id },
    include: {
      companion: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return json({ user, companions, recentChats });
}

export default function Dashboard() {
  const { user, companions, recentChats } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-sunrise-50">
      <Navigation />

      {/* Welcome Header */}
      <section className="py-12 bg-sunrise-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-6 sm:mb-0">
              <h1 className="heading-xl mb-4 text-charcoal-900">
                Welcome back, {user.name || user.email.split('@')[0]}!
              </h1>
              <p className="text-body text-charcoal-700 max-w-2xl">
                Choose a companion to start your positive energy journey. Each AI friend is here to listen, 
                support, and help you feel your best.
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/companions" className="btn-secondary">
                Browse All
              </Link>
              <Link to="/logout" className="btn-ghost bg-white/20 text-charcoal-900 hover:bg-white/30">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Companions Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Your AI Companions</h2>
            <p className="text-body max-w-3xl mx-auto">
              Each companion has their own unique personality and approach to support. 
              Find the one that feels right for you today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companions.map((companion) => (
              <div key={companion.id} className="card-character group">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="avatar-frame mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="text-4xl">{companion.avatar}</span>
                    </div>
                  </div>

                  {/* Name and Description */}
                  <h3 className="heading-md mb-3">{companion.name}</h3>
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

                  {/* Premium Badge */}
                  {(companion.name === 'Spark' || companion.name === 'Echo') && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-peach-100 text-peach-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        Premium
                      </span>
                    </div>
                  )}

                  {/* Chat Button */}
                  <Link
                    to={`/chat/${companion.id}`}
                    className="btn-primary w-full"
                  >
                    Start Chatting
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Conversations */}
      {recentChats.length > 0 && (
        <section className="py-16 bg-sunrise-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="heading-lg mb-6">Recent Conversations</h2>
              <p className="text-body">
                Continue where you left off with your AI companions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentChats.map((chat) => (
                <div key={chat.id} className="card hover:shadow-warm transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-sunrise-gradient rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl">{chat.companion.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal-900">{chat.companion.name}</h3>
                      <p className="text-sm text-charcoal-600">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {chat.messages.length > 0 && (
                    <p className="text-body text-charcoal-700 mb-4 line-clamp-2">
                      {chat.messages[0].content}
                    </p>
                  )}
                  
                  <Link
                    to={`/chat/${chat.companion.id}`}
                    className="btn-secondary w-full"
                  >
                    Continue Chat
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-6">Quick Actions</h2>
            <p className="text-body">
              Get started quickly with these helpful options
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/companions" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-16 h-16 bg-sunrise-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-3">Browse Companions</h3>
              <p className="text-body">Discover all available AI companions and their unique personalities</p>
            </Link>

            <Link to="/pricing" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-16 h-16 bg-pastel-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="heading-md mb-3">View Plans</h3>
              <p className="text-body">Explore our subscription plans and find the perfect fit for you</p>
            </Link>

            <Link to="/help" className="card text-center hover:shadow-warm transition-all duration-300">
              <div className="w-16 h-16 bg-warm-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="heading-md mb-3">Get Help</h3>
              <p className="text-body">Find answers to common questions and get support</p>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
