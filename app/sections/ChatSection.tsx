'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FiSend, FiTag, FiDollarSign, FiInfo, FiPercent, FiUser, FiCpu } from 'react-icons/fi'

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

interface ChatSectionProps {
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (val: string) => void
  onSend: () => void
  onFollowUp: (suggestion: string) => void
  loading: boolean
  error: string | null
  onRetry: () => void
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
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const industryTags = Array.isArray(rec?.industry_tags) ? rec.industry_tags : []
  const useCaseTags = Array.isArray(rec?.use_case_tags) ? rec.use_case_tags : []
  const hasPromotion = rec?.promotion && rec.promotion.trim().length > 0

  return (
    <Card className="bg-white/70 backdrop-blur-[16px] border border-white/30 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header: Name + Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground leading-snug">
              {rec?.product_name ?? 'Unknown Product'}
            </h4>
          </div>
          {rec?.price && (
            <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary border-0 font-semibold text-xs">
              <FiDollarSign className="w-3 h-3 mr-0.5" />
              {rec.price}
            </Badge>
          )}
        </div>

        {/* Description */}
        {rec?.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
        )}

        {/* Match Reason */}
        {rec?.match_reason && (
          <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2.5">
            <FiInfo className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/80 leading-relaxed">{rec.match_reason}</p>
          </div>
        )}

        {/* Promotion */}
        {hasPromotion && (
          <div className="flex items-center gap-2 bg-accent/10 rounded-lg p-2 border border-accent/20">
            <FiPercent className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
            <span className="text-xs font-medium text-accent-foreground">{rec.promotion}</span>
          </div>
        )}

        {/* Tags */}
        {(industryTags.length > 0 || useCaseTags.length > 0) && (
          <div className="space-y-1.5">
            {industryTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <FiTag className="w-3 h-3 text-muted-foreground shrink-0" />
                {industryTags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-secondary/50 border-border/60">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {useCaseTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <FiTag className="w-3 h-3 text-primary/60 shrink-0" />
                {useCaseTags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 border-primary/20 text-primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ChatSection({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onFollowUp,
  loading,
  error,
  onRetry,
}: ChatSectionProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
              <FiCpu className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Product Recommendation Agent</h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
              Describe your customer's needs, preferences, budget, or industry, and I will find the best matching products from the catalog.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                'Looking for CRM software for a mid-size retail company under $500/month',
                'Need project management tools for a 20-person engineering team',
                'Cloud storage solution with strong security for healthcare',
                'Marketing automation platform for e-commerce startups'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onFollowUp(suggestion)}
                  className="text-left text-xs text-muted-foreground bg-white/60 backdrop-blur-sm border border-border/60 rounded-xl p-3 hover:bg-white/80 hover:border-primary/30 hover:text-foreground transition-all duration-200 shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <FiCpu className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={cn('max-w-[85%] space-y-3', msg.role === 'user' ? 'items-end' : 'items-start')}>
              {/* Message Content */}
              <div className={cn(
                'rounded-2xl px-4 py-3 shadow-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-md'
                  : 'bg-white/70 backdrop-blur-[16px] border border-white/30 text-foreground rounded-tl-md'
              )}>
                {msg.role === 'assistant' ? renderMarkdown(msg.content) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>

              {/* Recommendations */}
              {msg.role === 'assistant' && Array.isArray(msg?.recommendations) && msg.recommendations.length > 0 && (
                <div className="space-y-2 w-full">
                  <p className="text-xs font-medium text-muted-foreground px-1">
                    {msg.recommendations.length} product{msg.recommendations.length !== 1 ? 's' : ''} recommended
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.recommendations.map((rec, idx) => (
                      <RecommendationCard key={idx} rec={rec} />
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Suggestions */}
              {msg.role === 'assistant' && Array.isArray(msg?.followUpSuggestions) && msg.followUpSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.followUpSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => onFollowUp(sug)}
                      disabled={loading}
                      className="text-xs bg-secondary/70 text-secondary-foreground px-3 py-1.5 rounded-full border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground/60 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-1">
                <FiUser className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <FiCpu className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-white/70 backdrop-blur-[16px] border border-white/30 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground ml-1">Searching products...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
              <FiInfo className="w-4 h-4 text-destructive" />
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl rounded-tl-md px-4 py-3">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={onRetry} className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="px-6 py-4 border-t border-border/60 bg-card/50 backdrop-blur-[16px]">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your customer's needs..."
            disabled={loading}
            className="flex-1 h-11 bg-white/60 backdrop-blur-sm border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
          />
          <Button
            onClick={onSend}
            disabled={loading || !inputValue.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 shrink-0 disabled:opacity-40"
          >
            <FiSend className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
