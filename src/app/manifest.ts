import { MetadataRoute } from 'next'
import {
    APP_ICON_192, APP_ICON_512, APP_ICON_1024,
} from '@/shared/config/assets'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '모니',
        short_name: '모니',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3d7a4f',
        icons: [
            { src: APP_ICON_192,  sizes: "192x192",   type: "image/png", purpose: "any" },
            { src: APP_ICON_512,  sizes: "512x512",   type: "image/png", purpose: "any" },
            { src: APP_ICON_1024, sizes: "1024x1024", type: "image/png", purpose: "any" },
        ],
    }
}
