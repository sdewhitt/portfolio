'use client'

import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { useChat } from "ai/react"
import { useRef, useEffect } from 'react'
import { BotMessageSquare } from "lucide-react"

export function Chat() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } =
        useChat({
            api: '../api/chat',
            onError: (e) => {
                console.error("Chat API error:", e)
            }
        });

    const chatParent = useRef<HTMLUListElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const domNode = chatParent.current
        if (domNode) domNode.scrollTop = domNode.scrollHeight
    }, [messages.length])

    return (
        <main className="flex min-h-screen w-full bg-background">
            <div className="flex flex-col w-full mx-auto max-w-3xl">
                {/* Header */}
                {/*<header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                            MyPort
                        </h1>
                    </div>
                </header>*/}

                {/* Messages */}
                <section className="flex-1 min-h-0">
                    <ul
                        ref={chatParent}
                        className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 py-4 overflow-y-auto"
                    >
                        {/* Empty state */}
                        {messages.length === 0 && (
                            <li className="mx-auto mt-16 text-center text-sm text-muted-foreground">
                                Ask about Seth's experience, projects, or skills.
                            </li>
                        )}

                        {messages.map((m, index) => {
                            const isUser = m.role === 'user'
                            const isSystem = m.role === 'system'
                            return (
                                <li key={index} className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {/* Avatar */}
                                    {!isUser && (
                                        <div className="mr-2 hidden sm:block">
                                            <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-medium">
                                                <BotMessageSquare />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div
                                        className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                                            isSystem
                                                ? 'bg-accent text-accent-foreground'
                                                : isUser
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-foreground'
                                        }`}
                                    >
                                        {!isUser && !isSystem && (
                                            <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground/80">MyPort</span>
                                        )}
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {m.content}
                                        </p>
                                    </div>

                                    {/* Avatar for user on the right (small screens skip) */}
                                    {isUser && (
                                        <div className="ml-2 hidden sm:block">
                                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                                You
                                            </div>
                                        </div>
                                    )}
                                </li>
                            )
                        })}

                        {/* Typing indicator */}
                        {isLoading && (
                            <li className="flex items-end justify-start">
                                <div className="h-8 w-8 mr-2 hidden sm:flex rounded-full bg-primary/15 text-primary items-center justify-center text-xs font-medium">
                                    <BotMessageSquare />
                                </div>
                                <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 bg-muted text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse" />
                                        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:120ms]" />
                                        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:240ms]" />
                                    </span>
                                </div>
                            </li>
                        )}
                    </ul>
                </section>

                {/* Composer */}
                <footer className="sticky bottom-0 z-10 w-full border-t bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <form onSubmit={handleSubmit} className="px-3 sm:px-4 py-3 flex items-center gap-2">
                        <div className="flex-1">
                            <Input
                                className="h-11 w-full rounded-xl bg-background border-border placeholder:text-muted-foreground/70"
                                placeholder="Ask about projects, skills, or experience…"
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                            />
                        </div>
                        <Button type="submit" className="h-11 rounded-xl px-4 sm:px-5" disabled={!input.trim() || isLoading}>
                            <span className="sr-only">Send</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-5 w-5"
                            >
                                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </Button>
                    </form>
                </footer>
            </div>
        </main>
    )
}
