'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Brain, Hash, Terminal, Trash2, Cpu, RefreshCw } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateConfig, resetMemory } from './actions'

interface AgentFormProps {
  initialData: {
    id: string
    system_prompt: string
    allowed_channel_ids: string
    conversation_summary: string
  } | null
}

export function AgentForm({ initialData }: AgentFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 1. POLLING LOGIC
  // Every 5 seconds, ask the server for the latest data (Refreshes props)
  useEffect(() => {
    const interval = setInterval(() => {
      // This refreshes the page data silently without a full reload
      router.refresh() 
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  // 2. VISUAL FLASH EFFECT
  // When the summary prop changes, flash the terminal background
  // This is safe because we are NOT setting state here, just animating DOM
  useEffect(() => {
    const terminal = document.getElementById('terminal-view')
    if(terminal && initialData?.conversation_summary) {
       terminal.classList.add('bg-zinc-800')
       setTimeout(() => terminal.classList.remove('bg-zinc-800'), 200)
    }
  }, [initialData?.conversation_summary])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setStatus(null)

    const formData = new FormData(event.currentTarget)
    const result = await updateConfig(formData)

    if (result.error) {
      setStatus({ message: result.error, type: 'error' })
    } else if (result.success) {
      setStatus({ message: result.success, type: 'success' })
    }
    
    setIsLoading(false)
  }

  async function executeReset() {
    setIsLoading(true)
    const result = await resetMemory()
    
    if (result.success) {
      setStatus({ message: 'Memory wiped clean.', type: 'success' })
      router.refresh() // Instantly update UI
    } else if (result.error) {
      setStatus({ message: result.error, type: 'error' })
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Configuration Card */}
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="border-b border-zinc-800 pb-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Cpu className="w-5 h-5 text-indigo-400" /> 
            Core Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Define the personality and operational parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <Label htmlFor="systemPrompt" className="flex items-center gap-2 text-zinc-300">
                 <Brain className="w-4 h-4 text-indigo-400" /> System Instructions
              </Label>
              <Textarea 
                id="systemPrompt" 
                name="systemPrompt" 
                placeholder="You are a helpful assistant..." 
                className="min-h-[150px] font-mono bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-indigo-500 placeholder:text-zinc-700"
                defaultValue={initialData?.system_prompt || ''}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="allowedChannelIds" className="flex items-center gap-2 text-zinc-300">
                 <Hash className="w-4 h-4 text-indigo-400" /> Frequency (Allowed Channel ID)
              </Label>
              <Input 
                id="allowedChannelIds" 
                name="allowedChannelIds" 
                placeholder="123456789012345678" 
                className="bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-indigo-500 placeholder:text-zinc-700 h-12"
                defaultValue={initialData?.allowed_channel_ids || ''}
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="bg-white text-black hover:bg-zinc-200 font-bold px-8 cursor-pointer"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              {status && (
                <span className={`text-sm font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {status.message}
                </span>
              )}
            </div>

          </form>
        </CardContent>
      </Card>

      {/* Memory Control Card */}
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-zinc-800 pb-6 bg-zinc-900/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-red-400">
              <Terminal className="w-5 h-5" /> 
              Live Memory Stream
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Auto-refreshes every 5 seconds.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono bg-black/50 px-3 py-1 rounded-full border border-white/10 text-zinc-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            AUTO-SYNC
          </div>
        </CardHeader>

        <CardContent className="pt-0 p-0">
           {/* Terminal Look */}
           <div id="terminal-view" className="bg-black p-6 font-mono text-sm border-b border-zinc-800 min-h-[160px] max-h-[300px] overflow-y-auto transition-colors duration-300">
             <div className="flex gap-2 mb-4 opacity-50">
               <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
             </div>
             <div className="text-green-500/90 whitespace-pre-wrap">
                <span className="text-zinc-600 select-none mr-2">$ tail -f memory.log</span>
                <br/><br/>
                {/* DIRECTLY USE THE PROP HERE - NO STATE */}
                {initialData?.conversation_summary || "Waiting for data stream..."}
                <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-green-500 align-middle"></span>
             </div>
           </div>
           
           <div className="p-6 bg-zinc-900">
             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button 
                   variant="destructive" 
                   disabled={isLoading}
                   className="bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50 cursor-pointer w-full sm:w-auto"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Format Memory Drive
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                 <AlertDialogHeader>
                   <AlertDialogTitle>Execute Memory Wipe?</AlertDialogTitle>
                   <AlertDialogDescription className="text-zinc-400">
                     This will permanently delete the bot&apos;s context. It will forget all previous interactions. This cannot be undone.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-900 cursor-pointer">Cancel</AlertDialogCancel>
                   <AlertDialogAction 
                     onClick={executeReset} 
                     className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                   >
                     Confirm Wipe
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
           </div>
           
        </CardContent>
      </Card>
    </div>
  )
}