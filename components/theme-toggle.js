"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-zinc-700 shadow-sm transition-colors duration-300">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-zinc-700 ${theme === "light"
                        ? "bg-white text-yellow-500 shadow-sm scale-110"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                aria-label="Light Mode"
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-zinc-700 ${theme === "system"
                        ? "bg-white dark:bg-zinc-600 text-blue-500 shadow-sm scale-110"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                aria-label="System Mode"
            >
                <Laptop className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-zinc-700 ${theme === "dark"
                        ? "bg-zinc-700 text-purple-400 shadow-sm scale-110"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                aria-label="Dark Mode"
            >
                <Moon className="h-4 w-4" />
            </button>
        </div>
    )
}
