import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  return (
    <div className="container-custom py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">
            About NaijaBizHub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Empowering Nigerian entrepreneurs to build, connect, and grow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed mb-6">
              NaijaBizHub was created to solve the unique challenges faced by Nigerian entrepreneurs. 
              We provide a comprehensive platform where business owners can access resources, 
              connect with suppliers and vendors, learn from experts, and grow their businesses 
              in a supportive community environment.
            </p>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 leading-relaxed">
              Whether you're a freelancer looking for gigs, a skincare vendor needing suppliers, 
              or a food business owner wanting to scale, NaijaBizHub is your one-stop platform 
              for business success in Nigeria.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { icon: '👥', title: '10,000+ Members', desc: 'Active entrepreneurs across Nigeria' },
              { icon: '💼', title: '3 Communities', desc: 'Freelancers, Skincare, Food Business' },
              { icon: '📚', title: '5,000+ Resources', desc: 'Templates, guides, and tools' },
              { icon: '🤝', title: '2,000+ Vendors', desc: 'Verified businesses in our directory' },
            ].map((stat) => (
              <div key={stat.title} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-dark-950 rounded-xl">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{stat.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
          <p className="text-xl text-primary-100 mb-8">Over 10,000+ entrepreneurs are already growing with us</p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🤝', title: 'Community First', desc: 'We believe in the power of collaboration and shared success.' },
              { icon: '💡', title: 'Innovation', desc: 'Constantly improving to serve Nigerian entrepreneurs better.' },
              { icon: '🔒', title: 'Trust & Security', desc: 'Your data and payments are always secure with us.' },
            ].map((value) => (
              <div key={value.title} className="p-6 bg-gray-50 dark:bg-dark-950 rounded-xl">
                <span className="text-4xl mb-4 block">{value.icon}</span>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}