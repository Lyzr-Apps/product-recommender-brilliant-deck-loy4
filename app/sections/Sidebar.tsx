'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload'
import { cn } from '@/lib/utils'
import { FiMessageSquare, FiClock, FiPlus, FiChevronDown, FiDatabase, FiBox } from 'react-icons/fi'

const RAG_ID = '69a2770a00c2d274880f6c6f'

interface SidebarProps {
  activeTab: 'chat' | 'history'
  onTabChange: (tab: 'chat' | 'history') => void
  onNewSession: () => void
  activeAgentId: string | null
}

export default function Sidebar({ activeTab, onTabChange, onNewSession, activeAgentId }: SidebarProps) {
  const [kbOpen, setKbOpen] = React.useState(false)

  return (
    <div className="w-72 h-full flex flex-col border-r border-border bg-card/80 backdrop-blur-[16px]">
      {/* Logo / App Name */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
          <FiBox className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight leading-tight text-foreground">Product</h1>
          <h1 className="text-sm font-semibold tracking-tight leading-tight text-foreground">Recommendation</h1>
        </div>
      </div>

      <Separator className="mx-4 w-auto" />

      {/* New Session */}
      <div className="px-4 py-4">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          size="sm"
        >
          <FiPlus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        <button
          onClick={() => onTabChange('chat')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'chat'
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <FiMessageSquare className="w-4 h-4" />
          Recommendations
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'history'
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <FiClock className="w-4 h-4" />
          History
        </button>
      </nav>

      <Separator className="mx-4 my-3 w-auto" />

      {/* Knowledge Base */}
      <div className="px-3 flex-1 overflow-hidden flex flex-col">
        <Collapsible open={kbOpen} onOpenChange={setKbOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200">
            <span className="flex items-center gap-3">
              <FiDatabase className="w-4 h-4" />
              Knowledge Base
            </span>
            <FiChevronDown className={cn('w-4 h-4 transition-transform duration-200', kbOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="max-h-[280px] mt-2">
              <div className="px-1 pb-2">
                <KnowledgeBaseUpload ragId={RAG_ID} className="[&>div:first-child]:p-4 [&>div:first-child]:border-dashed [&>div:first-child]:border-primary/30" />
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Agent Status */}
      <div className="px-4 py-4 mt-auto border-t border-border">
        <div className="rounded-xl bg-secondary/60 backdrop-blur-sm p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={cn('w-2 h-2 rounded-full', activeAgentId ? 'bg-amber-400 animate-pulse' : 'bg-primary')} />
            <span className="text-xs font-medium text-foreground">Product Recommendation Agent</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Searches product catalog to recommend best matches for customer needs.
          </p>
          <Badge variant="secondary" className="mt-2 text-[10px] px-2 py-0.5">
            {activeAgentId ? 'Processing...' : 'Ready'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
