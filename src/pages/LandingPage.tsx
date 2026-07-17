import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/config/supabase'
import SEO from '@/components/ui/SEO'
import toast from 'react-hot-toast'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubscribing(true)
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email })
      if (error) {
        if (error.code === '23505') {
          toast.success('You\'re already subscribed!')
        } else {
          throw error
        }
      } else {
        toast.success('Successfully subscribed to newsletter!')
      }
      setEmail('')
    } catch (error: any) {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="overflow-hidden">
      <SEO 
        title="Build Your Business Empire in Nigeria"
        description="The #1 platform connecting Nigerian freelancers, skincare vendors, and food business owners with the tools, resources, and community they need to succeed. Join 10,000+ entrepreneurs today."
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-green-50 via-white to-yellow-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <motion.div animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 text-6xl opacity-10 dark:opacity-20">💼</motion.div>
        <motion.div animate={{ y: [20, -20, 20], rotate: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 right-20 text-5xl opacity-10 dark:opacity-20">🚀</motion.div>
        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-40 left-1/4 text-4xl opacity-10 dark:opacity-20">💡</motion.div>

        <div className="container-custom relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span>Now serving 10,000+ Nigerian entrepreneurs</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                Build Your{' '}
                <span className="bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent">
                  Business Empire
                </span>
                <br />in Nigeria
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                The #1 platform connecting Nigerian freelancers, skincare vendors, 
                and food business owners with the tools, resources, and community 
                they need to succeed. <span className="font-semibold text-gray-900 dark:text-gray-100">No dulling!</span>
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                    Start Free Today
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link to="/forum">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                    Explore Community
                  </Button>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center space-x-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-800 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Trusted by hustlers nationwide</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative">
              <div className="relative">
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-dark-700">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Active Members', value: '10,000+', icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Resources', value: '5,000+', icon: '📚', color: 'bg-green-50 dark:bg-green-900/20' },
                      { label: 'Vendors', value: '2,000+', icon: '🏪', color: 'bg-purple-50 dark:bg-purple-900/20' },
                      { label: 'Success Stories', value: '500+', icon: '🏆', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
                    ].map((stat) => (
                      <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
                        <span className="text-2xl">{stat.icon}</span>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Live Community Activity</h3>
                    <div className="space-y-3">
                      {[
                        { user: 'Amara O.', action: 'joined Freelancers community', time: '2 min ago', color: 'bg-blue-500' },
                        { user: 'Tunde B.', action: 'posted in Food Business', time: '5 min ago', color: 'bg-green-500' },
                        { user: 'Chioma E.', action: 'got verified as vendor', time: '10 min ago', color: 'bg-purple-500' },
                      ].map((activity, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{activity.user}</span>
                            <span className="text-gray-600 dark:text-gray-400 text-sm"> {activity.action}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-6 -right-6 bg-white dark:bg-dark-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xl">🇳🇬</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Made in Naija</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">For Naija</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 bg-white dark:bg-dark-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-dark-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">Premium</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">₦1,000/month</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Communities Section */}
      <section className="py-24 bg-white dark:bg-dark-900">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Built for Nigerian <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">Hustlers</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Three powerful communities, one platform. Whatever your hustle, we've got you covered.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '💻', title: 'Freelancers', color: 'from-blue-500 to-blue-600', description: 'Connect with fellow freelancers, find high-paying gigs, share tips, and build your freelance empire.', stats: '5,000+ freelancers', link: '/forum/category/freelancing' },
              { icon: '✨', title: 'Skincare Vendors', color: 'from-pink-500 to-pink-600', description: 'Network with skincare business owners, find reliable suppliers, and learn industry secrets.', stats: '2,000+ vendors', link: '/forum/category/skincare' },
              { icon: '🍳', title: 'Food Business Owners', color: 'from-orange-500 to-orange-600', description: 'Join food entrepreneurs, share recipes, find commercial kitchens, and scale your food business.', stats: '3,000+ food businesses', link: '/forum/category/food-business' },
            ].map((community, index) => (
              <motion.div key={community.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }} className="group relative bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-8 hover:shadow-xl dark:hover:shadow-black/20 transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${community.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>{community.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{community.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{community.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{community.stats}</span>
                  <Link to={community.link} className="text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300 flex items-center space-x-1">
                    <span>Join</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50 dark:bg-dark-950">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Everything You Need to <span className="text-green-600 dark:text-green-400">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive tools and resources designed specifically for Nigerian entrepreneurs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💬', title: 'Community Forum', desc: 'Connect with thousands of business owners' },
              { icon: '📚', title: 'Resource Library', desc: 'Access templates, guides & tools' },
              { icon: '🏪', title: 'Vendor Directory', desc: 'Find verified suppliers & vendors' },
              { icon: '🎓', title: 'Masterclasses', desc: 'Learn from industry experts' },
              { icon: '🤝', title: 'Networking', desc: 'Build valuable business connections' },
              { icon: '💼', title: 'Job Board', desc: 'Find opportunities & contracts' },
              { icon: '📊', title: 'Market Reports', desc: 'Stay ahead with insights' },
              { icon: '⭐', title: 'Premium Access', desc: 'Exclusive content for ₦1,000/mo' },
            ].map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300">
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white dark:bg-dark-900">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Success <span className="text-green-600 dark:text-green-400">Stories</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Hear from entrepreneurs growing with us</p>
          </motion.div>

          <div className="relative max-w-3xl mx-auto h-64">
            <AnimatePresence mode="wait">
              <motion.div key={currentTestimonial} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex items-center">
                <div className="bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/20 dark:to-yellow-900/20 rounded-2xl p-8 md:p-12 text-center w-full border border-gray-100 dark:border-dark-700">
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonials[currentTestimonial].content}"</p>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{testimonials[currentTestimonial].name}</p>
                    <p className="text-green-600 dark:text-green-400">{testimonials[currentTestimonial].business}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-3 h-3 rounded-full transition-all ${i === currentTestimonial ? 'bg-green-600 w-8' : 'bg-gray-300 dark:bg-gray-600'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-green-800">
        <div className="container-custom text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Ready to Level Up?</h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Get premium access to exclusive resources, masterclasses, vendor directories, and more for just ₦1,000/month
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/pricing"><Button size="lg" variant="secondary" className="text-lg px-8 py-4">View Premium Plans</Button></Link>
              <Link to="/register"><Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white/10">Start Free</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-gray-50 dark:bg-dark-950">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Stay in the Loop</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Get weekly business tips, resources, and community updates delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
              <Button type="submit" isLoading={isSubscribing}>Subscribe</Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

const testimonials = [
  { name: 'Amara Okafor', business: 'Skincare Brand Owner, Lagos', content: 'NaijaBizHub helped me connect with reliable suppliers for my skincare business. The vendor directory is a game-changer! I\'ve grown my business 3x since joining the platform.' },
  { name: 'Tunde Bakare', business: 'Freelance Developer, Abuja', content: 'The freelancer community here is amazing. I\'ve found consistent clients through the networking events and job board. Best investment for my career growth.' },
  { name: 'Chioma Eze', business: 'Food Business Owner, Port Harcourt', content: 'The masterclasses on food business management transformed how I run my restaurant. The templates and resources saved me months of trial and error.' },
  { name: 'Ibrahim Musa', business: 'Digital Marketer, Kano', content: 'I landed my biggest client through a connection made on NaijaBizHub. The premium networking rooms are worth every kobo. This platform is a must for any serious entrepreneur.' },
]