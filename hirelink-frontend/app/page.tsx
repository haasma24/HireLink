// app/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      title: "AI-Powered Job Matching",
      description: "Our intelligent system analyzes your skills and experience to recommend the perfect jobs for you.",
      icon: "🤖"
    },
    {
      title: "Smart Application Tracking",
      description: "Track your applications, interviews, and offers all in one place with real-time updates.",
      icon: "📊"
    },
    {
      title: "Recruiter Dashboard",
      description: "Post jobs, review applications, and schedule interviews with our comprehensive tools.",
      icon: "🎯"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-50">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Ready to Transform Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Career</span> or <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Hiring Process</span>?
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
              Join thousands of professionals and companies already using HireLink to make better connections.
              Let our AI find the perfect fit for your skills and ambitions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="http://localhost:3000/login"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 transform"
              >
                🚀 Start Your Job Search
              </Link>
              <Link
                href="http://localhost:3000/login"
                className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl text-lg font-semibold hover:bg-slate-700 transition-all"
              >
                👔 Hire Top Talent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            How <span className="text-blue-400">HireLink</span> Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Candidates */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl mr-4">
                  👤
                </div>
                <h3 className="text-2xl font-bold">For Job Seekers</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">1</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Create Your Profile</h4>
                    <p className="text-slate-300">Sign up as a candidate and showcase your skills, experience, and career goals.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">2</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Get AI Recommendations</h4>
                    <p className="text-slate-300">Our intelligent system analyzes thousands of jobs and recommends the best matches for you.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">3</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Apply & Track</h4>
                    <p className="text-slate-300">Submit applications, track their status, and prepare for interviews with our tools.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">4</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Interview & Get Hired</h4>
                    <p className="text-slate-300">Schedule interviews directly through the platform and receive offers digitally.</p>
                  </div>
                </div>
              </div>
              
              <Link
                href="http://localhost:3000/register"
                className="mt-8 inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Start Your Journey →
              </Link>
            </div>

            {/* For Recruiters */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl mr-4">
                  👔
                </div>
                <h3 className="text-2xl font-bold">For Employers</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">1</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Post Jobs Instantly</h4>
                    <p className="text-slate-300">Create detailed job listings with required skills, salary range, and company info.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">2</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Smart Candidate Screening</h4>
                    <p className="text-slate-300">Our AI ranks applicants by skill match and helps identify top talent quickly.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">3</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Manage Interviews</h4>
                    <p className="text-slate-300">Schedule and conduct interviews with integrated video calling and feedback tools.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">4</div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Hire & Onboard</h4>
                    <p className="text-slate-300">Send offers, collect documents, and onboard new hires seamlessly.</p>
                  </div>
                </div>
              </div>
              
              <Link
                href="http://localhost:3000/register"
                className="mt-8 inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Start Hiring →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section id="ai-features" className="py-20 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powered by <span className="text-blue-400">Artificial Intelligence</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our intelligent features make hiring and job searching smarter, faster, and more effective.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-slate-800/50 rounded-2xl p-8 border transition-all duration-500 ${
                  currentFeature === index 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105' 
                    : 'border-slate-700'
                }`}
                onMouseEnter={() => setCurrentFeature(index)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Feature Progress */}
          <div className="flex justify-center mt-8 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentFeature === index ? 'bg-blue-500 w-8' : 'bg-slate-700'
                }`}
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Success Stories</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-slate-300 italic mb-6">
                "HireLink's AI matching found me a perfect job I wouldn't have discovered on my own. The interview scheduling feature made the process so smooth!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-slate-400">Senior Developer at TechCorp</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-slate-300 italic mb-6">
                "As a recruiter, the AI screening saves me hours every week. I can focus on interviewing the most qualified candidates instead of sorting through resumes."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold">Michael Rodriguez</div>
                  <div className="text-slate-400">HR Director at InnovateCo</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-slate-300 italic mb-6">
                "The skill matching algorithm is incredibly accurate. We hired three developers through HireLink and all were perfect fits for their roles."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold">David Kim</div>
                  <div className="text-slate-400">CTO at StartupXYZ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                HireLink
              </div>
              <p className="text-slate-400">
                Intelligent job matching powered by AI. Connecting talent with opportunity.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#hero" className="text-slate-400 hover:text-slate-300 transition-colors">Home</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-slate-300 transition-colors">How It Works</a></li>
                <li><a href="#ai-features" className="text-slate-400 hover:text-slate-300 transition-colors">AI Features</a></li>
                <li><a href="#testimonials" className="text-slate-400 hover:text-slate-300 transition-colors">Testimonials</a></li>
                <li><a href="#cta" className="text-slate-400 hover:text-slate-300 transition-colors">Get Started</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Get Started</h3>
              <ul className="space-y-2">
                <li><Link href="http://localhost:3000/register" className="text-slate-400 hover:text-slate-300 transition-colors">Sign Up as Candidate</Link></li>
                <li><Link href="http://localhost:3000/register" className="text-slate-400 hover:text-slate-300 transition-colors">Sign Up as Recruiter</Link></li>
                <li><Link href="http://localhost:3000/login" className="text-slate-400 hover:text-slate-300 transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} HireLink. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}