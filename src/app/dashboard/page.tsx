import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image' 
import { AgentForm } from './agent-form'

export default async function DashboardPage() {
  const cookieStore = await cookies()

  // 1. Setup Supabase on the server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
      },
    }
  )

  // 2. Check User Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // 3. Fetch current config
  const { data: config } = await supabase
    .from('agent_config')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  return (
    // DARK BACKGROUND WITH WHITE GRID PATTERN
    <div className="min-h-screen bg-black text-white relative selection:bg-indigo-500 selection:text-white">
      
      {/* The White Square Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
           
           {/* IMAGE LOGO:*/}
           <div className="relative w-8 h-8 overflow-hidden rounded-md">
             <Image 
               src="/Figmenta.jpg"  
               alt="Figmenta Logo" 
               fill 
               className="object-cover"
             />
           </div>

           <span className="font-bold text-lg tracking-wide uppercase">FIGMENTA</span>
         </div>
         
         <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-white uppercase hidden sm:inline-block border border-white/20 px-3 py-1 rounded-full bg-white/5">
              User: {user.email}
            </span>
         </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto p-6 space-y-10 mt-8">
        
        {/* Header Section */}
        <div className="space-y-2 border-l-4 border-indigo-500 pl-6">
          <h1 className="text-4xl font-black tracking-tighter lg:text-5xl text-white uppercase">
            Figmenta Control Panel
          </h1>
          <p className="text-zinc-400 text-lg">
            System Interface for Discord Agent 
          </p>
        </div>

        {/* The Form Component */}
        <AgentForm initialData={config} />

      </main>
    </div>
  )
}