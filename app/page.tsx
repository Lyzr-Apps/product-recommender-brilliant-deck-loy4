'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent, type AIAgentResponse } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FiUser } from 'react-icons/fi'

import Sidebar from './sections/Sidebar'
import ChatSection from './sections/ChatSection'
import HistorySection from './sections/HistorySection'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11)
}

const AGENT_ID = '69a2771fcc44e0dcaf39e887'
const STORAGE_KEY = 'product-rec-sessions'

// --- Types ---
interface Recommendation {
  product_name?: string
  description?: string
  price?: string
  match_reason?: string
  promotion?: string
  industry_tags?: string[]
  use_case_tags?: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  recommendations?: Recommendation[]
  followUpSuggestions?: string[]
  timestamp: number
}

interface Session {
  id: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  firstMessagePreview: string
  recommendationCount: number
  status: 'active' | 'completed'
}

// --- Sample Data ---
const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: 'sample-1',
    role: 'user',
    content: 'I need a CRM solution for a mid-size retail company with about 50 employees. Budget is around $300/month.',
    timestamp: Date.now() - 120000,
  },
  {
    id: 'sample-2',
    role: 'assistant',
    content: 'Based on your requirements for a mid-size retail company with 50 employees and a $300/month budget, here are my top recommendations:',
    recommendations: [
      {
        product_name: 'RetailPro CRM',
        description: 'A comprehensive CRM designed specifically for retail businesses. Includes POS integration, customer loyalty tracking, and inventory management.',
        price: '$249/month',
        match_reason: 'Perfect fit for retail with built-in POS integration and under budget at $249/month for up to 75 users.',
        promotion: '20% off first 3 months',
        industry_tags: ['Retail', 'E-commerce'],
        use_case_tags: ['Customer Management', 'POS Integration', 'Loyalty Programs'],
      },
      {
        product_name: 'CloudConnect Suite',
        description: 'All-in-one business management platform with CRM, project management, and analytics. Scalable for growing teams.',
        price: '$199/month',
        match_reason: 'Cost-effective solution that covers CRM and more, well within the $300 budget with room for add-ons.',
        promotion: 'Free onboarding session',
        industry_tags: ['Retail', 'Services', 'General'],
        use_case_tags: ['CRM', 'Analytics', 'Team Collaboration'],
      },
      {
        product_name: 'SalesForward Enterprise',
        description: 'Advanced CRM with AI-powered customer insights, automated workflows, and multi-channel communication.',
        price: '$299/month',
        match_reason: 'At the top of the budget but offers the most advanced features including AI-driven insights for customer behavior.',
        promotion: '',
        industry_tags: ['Retail', 'Enterprise'],
        use_case_tags: ['AI Analytics', 'Automation', 'Multi-channel'],
      },
    ],
    followUpSuggestions: [
      'Tell me more about RetailPro CRM features',
      'Compare RetailPro and CloudConnect',
      'Any options with mobile app support?',
      'What about data migration services?',
    ],
    timestamp: Date.now() - 90000,
  },
]

const SAMPLE_SESSIONS: Session[] = [
  {
    id: 'sample-session-1',
    messages: SAMPLE_MESSAGES,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 90000,
    firstMessagePreview: 'CRM solution for mid-size retail company',
    recommendationCount: 3,
    status: 'completed',
  },
  {
    id: 'sample-session-2',
    messages: [
      {
        id: 'sample-3',
        role: 'user',
        content: 'Looking for project management tools for a 20-person engineering team',
        timestamp: Date.now() - 600000,
      },
      {
        id: 'sample-4',
        role: 'assistant',
        content: 'For a 20-person engineering team, I recommend tools with strong agile support, code integration, and sprint planning capabilities.',
        recommendations: [
          {
            product_name: 'DevTrack Pro',
            description: 'Engineering-focused project management with Git integration, CI/CD pipeline views, and sprint analytics.',
            price: '$12/user/month',
            match_reason: 'Built specifically for engineering teams with deep code repository integration.',
            promotion: '14-day free trial',
            industry_tags: ['Technology', 'Software'],
            use_case_tags: ['Agile', 'Sprint Planning', 'CI/CD'],
          },
        ],
        followUpSuggestions: ['Compare with alternatives', 'Does it support Jira import?'],
        timestamp: Date.now() - 580000,
      },
    ],
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 580000,
    firstMessagePreview: 'Project management tools for engineering team',
    recommendationCount: 1,
    status: 'completed',
  },
]

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Main Page ---
export default function Page() {
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)
  const [lastUserMessage, setLastUserMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  // Load sessions from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSessions(parsed)
        }
      }
    } catch {
      // ignore parse errors
    }
    // Start a new session
    setCurrentSessionId(generateId())
  }, [])

  // Persist sessions to localStorage
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch {
      // ignore storage errors
    }
  }, [sessions, mounted])

  const currentMessages = sampleMode ? SAMPLE_MESSAGES : messages

  const saveCurrentSession = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length === 0) return
    const recCount = msgs.reduce((sum, m) => sum + (Array.isArray(m?.recommendations) ? m.recommendations.length : 0), 0)
    const session: Session = {
      id: currentSessionId,
      messages: msgs,
      createdAt: msgs[0]?.timestamp ?? Date.now(),
      updatedAt: msgs[msgs.length - 1]?.timestamp ?? Date.now(),
      firstMessagePreview: msgs.find(m => m.role === 'user')?.content?.slice(0, 80) ?? '',
      recommendationCount: recCount,
      status: 'active',
    }
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = session
        return updated
      }
      return [session, ...prev]
    })
  }, [currentSessionId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    setError(null)
    setLastUserMessage(text)
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputValue('')
    setLoading(true)
    setActiveAgentId(AGENT_ID)

    const MAX_RETRIES = 2
    let lastErr = ''

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }

        const result: AIAgentResponse = await callAIAgent(text.trim(), AGENT_ID, { session_id: currentSessionId })

        const isTransient = !result.success && (
          result.error?.includes('starting up') ||
          result.error?.includes('503') ||
          result.error?.includes('Network error') ||
          result.error?.includes('Cannot connect') ||
          result.error?.includes('No response from server')
        )

        if (isTransient && attempt < MAX_RETRIES) {
          lastErr = result.error || 'Server is starting up...'
          continue
        }

        if (result.success) {
          const data = result?.response?.result
          let parsed: any = data
          if (typeof data === 'string') {
            parsed = parseLLMJson(data)
          }

          const agentMessage = parsed?.message || result?.response?.message || 'Here are my recommendations.'
          const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : []
          const followUpSuggestions = Array.isArray(parsed?.follow_up_suggestions) ? parsed.follow_up_suggestions : []

          const assistantMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: agentMessage,
            recommendations,
            followUpSuggestions,
            timestamp: Date.now(),
          }

          const updatedMessages = [...newMessages, assistantMsg]
          setMessages(updatedMessages)
          saveCurrentSession(updatedMessages)
          setLoading(false)
          setActiveAgentId(null)
          return
        } else {
          lastErr = result?.error ?? 'An error occurred while getting recommendations.'
        }
      } catch (err) {
        lastErr = err instanceof Error ? err.message : 'Network error. Please try again.'
        if (attempt < MAX_RETRIES) continue
      }
    }

    setError(lastErr)
    saveCurrentSession(newMessages)
    setLoading(false)
    setActiveAgentId(null)
  }, [loading, messages, currentSessionId, saveCurrentSession])

  const handleSend = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleFollowUp = useCallback((suggestion: string) => {
    sendMessage(suggestion)
  }, [sendMessage])

  const handleRetry = useCallback(() => {
    if (lastUserMessage) {
      setError(null)
      sendMessage(lastUserMessage)
    }
  }, [lastUserMessage, sendMessage])

  const handleNewSession = useCallback(() => {
    if (messages.length > 0) {
      saveCurrentSession(messages)
    }
    setMessages([])
    setCurrentSessionId(generateId())
    setInputValue('')
    setError(null)
    setActiveTab('chat')
    setSampleMode(false)
  }, [messages, saveCurrentSession])

  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }, [])

  const handleSelectSession = useCallback((_session: Session) => {
    // The history section handles viewing internally
  }, [])

  const displaySessions = sampleMode ? SAMPLE_SESSIONS : sessions

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen flex bg-background text-foreground overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)' }}>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewSession={handleNewSession}
          activeAgentId={activeAgentId}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar */}
          <header className="px-6 py-3 border-b border-border/60 bg-card/50 backdrop-blur-[16px] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {activeTab === 'chat' ? 'Recommendations' : 'History'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {activeTab === 'chat' ? 'AI-powered product matching' : 'Browse past sessions'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Sample Data
                </Label>
                <Switch
                  id="sample-toggle"
                  checked={sampleMode}
                  onCheckedChange={setSampleMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <FiUser className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatSection
                messages={currentMessages}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSend={handleSend}
                onFollowUp={handleFollowUp}
                loading={loading}
                error={error}
                onRetry={handleRetry}
              />
            ) : (
              <HistorySection
                sessions={displaySessions}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
              />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
