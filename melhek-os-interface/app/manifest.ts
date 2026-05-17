import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Melhek OS',
    short_name: 'Melhek',
    description: 'Elite Internal Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#010133',
    theme_color: '#010133',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
