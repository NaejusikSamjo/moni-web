import { MetadataRoute } from 'next'
import { APP_ICON, APP_ICON_192 } from '@/shared/config/assets'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '모니 - 모의 투자',
        short_name: '모니',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3d7a4f',
        icons: [
            {
                src: APP_ICON_192,
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: APP_ICON,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    }
}