export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] dark:bg-[#000000] text-[#000000] dark:text-[#ffffff] px-4 selection:bg-[#0070f3] selection:text-white">
            <div className="w-full max-w-[400px]">
                <div className="flex justify-center mb-8">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 76 65"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-black dark:text-white"
                    >
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor" />
                    </svg>
                </div>
                {children}
            </div>
            <footer className="mt-12 text-center text-sm text-[#666666] dark:text-[#888888]">
                <div className="flex items-center justify-center space-x-4">
                    <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">Terms of Service</a>
                    <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">Privacy Policy</a>
                </div>
            </footer>
        </div>
    );
}
