import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '0rem',
				sm: '0.5rem',
				lg: '1rem',
				xl: '1rem',
				'2xl': '2rem',
			},
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				playfair: ['Playfair Display', 'serif'],
				bubble: ['Fredoka One', 'cursive'],
				sans: ['Helvetica', 'Arial', 'sans-serif'],
				sidebar: ['Inter', 'sans-serif']
			},
			colors: {
				'logo-white': 'hsl(0, 0%, 98%)', // Adding custom logo-white color
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Vibrant pastel colors for assessment questions
				'pastel-lavender': {
					'50': 'hsl(270, 100%, 99%)',
					'100': 'hsl(269, 100%, 95%)',
					'200': 'hsl(269, 100%, 88%)',
				},
				'pastel-mint': {
					'50': 'hsl(151, 81%, 96%)',
					'100': 'hsl(149, 80%, 90%)',
					'200': 'hsl(148, 80%, 73%)',
				},
				'pastel-peach': {
					'50': 'hsl(47, 100%, 96%)',
					'100': 'hsl(45, 93%, 89%)',
					'200': 'hsl(43, 96%, 77%)',
				},
				'pastel-sky': {
					'50': 'hsl(204, 100%, 97%)',
					'100': 'hsl(204, 94%, 94%)',
					'200': 'hsl(204, 94%, 86%)',
				},
				'pastel-cream': {
					'50': 'hsl(54, 100%, 97%)',
					'100': 'hsl(52, 88%, 95%)',
				},
				'pastel-sage': {
					'50': 'hsl(145, 63%, 96%)',
					'100': 'hsl(146, 64%, 90%)',
				},
				'performance-low': 'hsl(var(--performance-low))',
        'performance-medium': 'hsl(var(--performance-medium))',
        'performance-high': 'hsl(var(--performance-high))',
        'background-alt': 'hsl(var(--background-alt))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
