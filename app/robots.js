export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/'], // Protect API routes and admin areas if necessary
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
