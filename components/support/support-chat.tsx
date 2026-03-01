'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Input } from '@/components/primitives/input'
import { Button } from '@/components/primitives/button'
import { PageContainer } from '@/components/layout/page-container'
import { SUPPORT_ASSISTANT_NAME, SUPPORT_QUICK_ACTIONS } from '@/lib/support/prompt'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }

export function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 401 || err?.code === 'SIGN_IN_REQUIRED') {
          window.location.href = '/login?redirect=/support'
          return
        }
        throw new Error(err.error || 'Failed to get response')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, content: assistantContent }
            }
            return next
          })
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, something went wrong. Please try again or email us for support.`,
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (action: (typeof SUPPORT_QUICK_ACTIONS)[number]) => {
    if (action.type === 'chat' && action.prompt) {
      sendMessage(action.prompt)
    }
  }

  return (
    <PageContainer maxWidth="md" padding="md">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      {/* AI Chat – liquid glass. Fixed height prevents page shift when AI streams. */}
      <div className="glass-liquid glass-liquid-soft flex flex-col h-[420px] mb-8 overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-white text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold italic mb-2">Hello</h2>
              <p className="text-sm md:text-base">
                I&apos;m {SUPPORT_ASSISTANT_NAME}, your support assistant. How can I help you today?
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl px-4 py-2.5 max-w-[90%]',
                  msg.role === 'user'
                    ? 'ml-auto glass-green'
                    : 'mr-auto bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/5 text-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
            <div className="mr-auto rounded-2xl px-4 py-2.5 bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/5 text-muted-foreground text-sm">
              Thinking...
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-white/10 dark:border-white/5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 rounded-2xl glass-input"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-2xl glass-button shrink-0">
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* Quick actions after chat */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_QUICK_ACTIONS.map((action) =>
            action.type === 'navigate' && action.href ? (
              <Link
                key={action.id}
                href={action.href}
                className={cn(
                  'inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-medium',
                  'glass-liquid glass-liquid-hover glass-liquid-soft',
                  'text-foreground'
                )}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action)}
                className={cn(
                  'inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-medium',
                  'glass-liquid glass-liquid-hover glass-liquid-soft',
                  'text-foreground'
                )}
              >
                {action.label}
              </button>
            )
          )}
        </div>
      </div>
    </PageContainer>
  )
}
