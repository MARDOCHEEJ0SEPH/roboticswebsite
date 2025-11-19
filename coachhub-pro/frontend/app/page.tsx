'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Coach {
  _id: string;
  userId: { _id: string; name: string; email: string; avatar?: string };
  tagline: string;
  expertise: string[];
  rating: number;
  totalStudents: number;
  totalSessions: number;
  subscriptionTiers: Array<{
    name: string;
    price: number;
    sessionsPerMonth: number;
    features: string[];
  }>;
}

export default function MarketplacePage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpertise, setSelectedExpertise] = useState('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchCoaches();
  }, [selectedExpertise]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const params = selectedExpertise !== 'all' ? { expertise: selectedExpertise } : {};
      const response = await axios.get(`${API_URL}/api/coaches`, { params });
      setCoaches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const expertiseOptions = ['all', 'Career', 'Business', 'Life', 'Health', 'Fitness', 'Leadership'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-indigo-600">CoachHub Pro</h1>
              <p className="text-gray-600 mt-1">Find your perfect coach</p>
            </div>
            <div className="flex gap-4">
              <button className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium">
                Sign In
              </button>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Life with Expert Coaching
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with world-class coaches in career, business, life, and wellness.
            Subscribe monthly and get personalized 1-on-1 sessions.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-gray-700">Filter by expertise:</span>
            {expertiseOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedExpertise(option)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedExpertise === option
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option === 'all' ? 'All Coaches' : option}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600">Expert Coaches</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">10,000+</div>
            <div className="text-gray-600">Active Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">4.8/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Coaches Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading coaches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map((coach) => (
              <div key={coach._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Coach Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                      {coach.userId?.name?.[0] || 'C'}
                    </div>
                    <div className="text-white">
                      <h3 className="text-xl font-bold">{coach.userId?.name || 'Coach'}</h3>
                      <p className="text-indigo-100 text-sm">{coach.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Coach Body */}
                <div className="p-6">
                  {/* Rating and Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="font-bold">{coach.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({coach.totalStudents} students)</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {coach.totalSessions} sessions
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {coach.expertise.slice(0, 3).map((exp, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm rounded-full">
                        {exp}
                      </span>
                    ))}
                  </div>

                  {/* Subscription Tiers */}
                  <div className="space-y-2 mb-4">
                    {coach.subscriptionTiers.slice(0, 3).map((tier, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{tier.name}</div>
                          <div className="text-sm text-gray-600">{tier.sessionsPerMonth} sessions/month</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-indigo-600">${tier.price}</div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    View Profile & Subscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {coaches.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No coaches found in this category.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">CoachHub Pro</h3>
              <p className="text-gray-400">Your platform for expert coaching and personal growth.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Students</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Find Coaches</li>
                <li>How It Works</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Coaches</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Become a Coach</li>
                <li>Resources</li>
                <li>Earnings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Terms & Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CoachHub Pro. Built with Autonomous Robotics Frameworks.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
