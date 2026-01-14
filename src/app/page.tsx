'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        // If user is logged in, refresh and go to dashboard
        router.refresh()
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    // DARK BACKGROUND WITH GRID PATTERN
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden px-4">
      
      {/* The White Square Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Login Card */}
      <Card className="w-full max-w-sm shadow-2xl bg-zinc-900 border-zinc-800 relative z-10 text-white">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black tracking-tighter uppercase text-white">
            FIGMENTA
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to access the Discord Interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1', // Indigo-500 (Matches Dashboard Accent)
                    brandAccent: '#4f46e5', // Indigo-600
                    inputText: '#ffffff', // White text in inputs
                    inputBackground: '#18181b', // Zinc-950 (Dark input bg)
                    inputBorder: '#27272a', // Zinc-800
                    inputLabelText: '#a1a1aa', // Zinc-400
                    messageText: '#ef4444', // Red for errors
                    anchorTextColor: '#6366f1', // Links
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                },
              },
              className: {
                 button: 'w-full font-bold',
                 input: 'bg-zinc-950 border-zinc-800 text-white',
              }
            }}
            providers={['discord']}
            socialLayout="horizontal"
            theme="dark" // SWITCHED TO DARK MODE
          />
        </CardContent>
      </Card>
    </div>
  )
}