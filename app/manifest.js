export default function manifest() {
    return {
        name: "Man's Support Desk",
        short_name: "SupportLink",
        description: "Enterprise IT support ticketing system",
        start_url: "/",
        display: "standalone",
        background_color: "#0B0E14",
        theme_color: "#0B0E14",
        icons: [
            {
                src: "/favicon.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/favicon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    }
}
