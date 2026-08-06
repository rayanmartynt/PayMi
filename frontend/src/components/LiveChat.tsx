'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveChat } from '@/contexts/LiveChatContext'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export function LiveChat() {
  const { isOpen: contextIsOpen, closeChat } = useLiveChat()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Sync local state with context
  useEffect(() => {
    if (contextIsOpen) {
      setIsOpen(true)
      setIsMinimized(false)
    }
  }, [contextIsOpen])
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! Welcome to PayMi. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = getBotResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const getBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Hello! How can I assist you with PayMi today?'
    }
    if (lowerInput.includes('payment') || lowerInput.includes('pay')) {
      return 'PayMi supports mobile money payments through Orange Money, Afrimoney, and QMoney. Would you like to know more about our payment options?'
    }
    if (lowerInput.includes('account') || lowerInput.includes('sign up')) {
      return 'You can create a free account by clicking the "Get Started" button on our homepage. The process takes less than 2 minutes!'
    }
    if (lowerInput.includes('fee') || lowerInput.includes('cost') || lowerInput.includes('price')) {
      return 'Our transaction fees are very competitive - just 1.5% per transaction for mobile money payments. No hidden fees!'
    }
    if (lowerInput.includes('support') || lowerInput.includes('help')) {
      return 'Our support team is available Monday-Friday 9AM-6PM. You can also email us at support@PayMi.com for assistance.'
    }
    if (lowerInput.includes('api') || lowerInput.includes('integration')) {
      return 'We offer a well-documented REST API for easy integration. Check out our API documentation for more details!'
    }
    if (lowerInput.includes('security') || lowerInput.includes('safe')) {
      return 'PayMi uses bank-level security with 256-bit encryption and is PCI DSS compliant. Your transactions are completely secure.'
    }
    if (lowerInput.includes('withdraw') || lowerInput.includes('settlement')) {
      return 'Withdrawals are processed within 24 hours. You can withdraw to your mobile money wallet directly from your dashboard.'
    }

    return 'Thanks for your message! Our support team will get back to you shortly. Is there anything specific about payments or your account I can help with?'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:from-[#1A3D63] hover:to-[#4A7FA7]"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">PayMi Support</h3>
                    <p className="text-xs text-white/80">Online • Usually replies instantly</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => {
                      setIsOpen(false)
                      closeChat()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  <div className="h-80 overflow-y-auto p-4 space-y-4 bg-[#F6FAFD] dark:bg-gray-800">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'bot' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user' ? 'bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'}`}>
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} className="bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63]" size="icon">
                        <Send className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
