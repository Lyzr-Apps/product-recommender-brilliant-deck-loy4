'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FiSearch, FiClock, FiMessageSquare, FiArrowLeft, FiTrash2, FiBox, FiUser, FiCpu } from 'react-icons/fi'

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

interface HistorySectionProps {
  sessions: Session[]
  onSelectSession: (session: Session) => void
  onDeleteSession: (sessionId: string) => void
}

function formatDate(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInlineHistory(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInlineHistory(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInlineHistory(line)}</p>
      })}
    </div>
  )
}

function formatInlineHistory(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

export default function HistorySection({
  sessions,
  onSelectSession,
  onDeleteSession,
}: HistorySectionProps) {
  const [search, setSearch] = React.useState('')
  const [viewingSession, setViewingSession] = React.useState<Session | null>(null)

  const filteredSessions = React.useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter(s =>
      s.firstMessagePreview.toLowerCase().includes(q) ||
      s.messages.some(m => m.content.toLowerCase().includes(q))
    )
  }, [sessions, search])

  if (viewingSession) {
    return (
      <div className="flex flex-col h-full">
        {/* Detail Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/50 backdrop-blur-[16px] flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewingSession(null)}
            className="h-9 w-9 rounded-xl"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {viewingSession.firstMessagePreview || 'Session Detail'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {new Date(viewingSession.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {viewingSession.recommendationCount} recommendation{viewingSession.recommendationCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Read-only conversation */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-5">
            {viewingSession.messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <FiCpu className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={cn('max-w-[80%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  <div className={cn(
                    'rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-md'
                      : 'bg-white/70 backdrop-blur-[16px] border border-white/30 text-foreground rounded-tl-md'
                  )}>
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'assistant' && Array.isArray(msg?.recommendations) && msg.recommendations.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.recommendations.map((rec, idx) => (
                        <Card key={idx} className="bg-white/60 border border-white/20 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">{rec?.product_name ?? 'Product'}</span>
                              {rec?.price && <Badge variant="secondary" className="text-[10px] h-5">{rec.price}</Badge>}
                            </div>
                            {rec?.description && <p className="text-[11px] text-muted-foreground">{rec.description}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground/50 px-1 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <FiUser className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/60 bg-card/50 backdrop-blur-[16px]">
        <h2 className="text-lg font-semibold text-foreground mb-3">Session History</h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="pl-9 h-10 bg-white/60 backdrop-blur-sm border-border/60 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1 px-6 py-4">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center mb-4">
              <FiClock className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              {search.trim() ? 'No matching sessions' : 'No sessions yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              {search.trim()
                ? 'Try a different search term.'
                : 'Start your first recommendation session to see it here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="bg-white/60 backdrop-blur-[16px] border border-white/30 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 cursor-pointer group"
                onClick={() => {
                  setViewingSession(session)
                  onSelectSession(session)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FiMessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.firstMessagePreview || 'New session'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDate(session.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiBox className="w-3 h-3" />
                          {session.recommendationCount} rec{session.recommendationCount !== 1 ? 's' : ''}
                        </span>
                        <span>{session.messages.length} msg{session.messages.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
