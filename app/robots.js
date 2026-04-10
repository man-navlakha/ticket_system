export default function robots() {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://it.mechanicsetu.tech').replace(/\/$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/', '/dashboard/', '/auth/', '/setup'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
