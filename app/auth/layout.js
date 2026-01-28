import Image from 'next/image';

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] dark:bg-[#000000] text-[#000000] dark:text-[#ffffff] px-4 selection:bg-[#0070f3] selection:text-white">
            <div className="w-full max-w-[400px]">
                <div className="flex justify-center mb-8">
                    <div className="relative w-32 h-32">
                        <Image
                            src="/logo_my.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <p className="text-lg font-bold">Man's Support Desk</p>
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
