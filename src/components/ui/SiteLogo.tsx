import { Link } from 'react-router-dom'

interface SiteLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function SiteLogo({ size = 'md', showText = true }: SiteLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const logoLight = '/images/logo-light.png'
  const logoDark = '/images/logo-dark.png'

  return (
    <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
      <img src={logoLight} alt="NaijaBizHub" className={sizeClasses[size] + ' dark:hidden object-contain'} />
      <img src={logoDark} alt="NaijaBizHub" className={sizeClasses[size] + ' hidden dark:block object-contain'} />
      {showText && (
        <span className={'font-display font-bold ' + textSizeClasses[size] + ' text-gray-900 dark:text-white hidden sm:block'}>
          NaijaBizHub
        </span>
      )}
    </Link>
  )
}