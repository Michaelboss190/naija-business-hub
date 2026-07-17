import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title: string
  description: string
  image?: string
  type?: string
}

export default function SEO({ title, description, image = '/og-image.png', type = 'website' }: SEOProps) {
  const location = useLocation()
  const url = window.location.origin + location.pathname
  const fullTitle = `${title} | NaijaBizHub`

  useEffect(() => {
    document.title = fullTitle
    
    const metaTags: Record<string, string> = {
      'description': description,
      'og:title': fullTitle,
      'og:description': description,
      'og:url': url,
      'og:image': image,
      'og:type': type,
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': description,
      'twitter:image': image,
    }

    Object.entries(metaTags).forEach(([name, content]) => {
      let element = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        if (name.startsWith('og:')) {
          element.setAttribute('property', name)
        } else {
          element.setAttribute('name', name)
        }
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    })
  }, [fullTitle, description, url, image, type])

  return null
}