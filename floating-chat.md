import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingChatInput } from "./components/FloatingChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { TypingIndicator } from "./components/TypingIndicator";

export type MessageType = "user" | "system";
export type MessageStatus = "sending" | "sent" | "delivered";

export interface Message {
  id: number;
  text: string;
  timestamp: number;
  type: MessageType;
  status: MessageStatus;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageId, setMessageId] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Mock system responses
  const systemResponses = [
    "That's interesting! Tell me more.",
    "I understand what you mean.",
    "Thanks for sharing that with me.",
    "How does that make you feel?",
    "That's a great point!",
    "I see what you're getting at.",
    "Can you elaborate on that?",
    "That's really thoughtful.",
    "I appreciate you sharing that.",
    "What made you think of that?",
    "That's a fascinating perspective.",
    "Tell me more about your experience.",
  ];

  const playMessageSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime,
      );
      gainNode.gain.setValueAtTime(
        0.1,
        audioContext.currentTime,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Fallback for environments where Web Audio API is not available
      console.log("Audio feedback unavailable");
    }
  };

  const triggerHapticFeedback = (
    type: "light" | "medium" | "heavy" = "light",
  ) => {
    // Haptic feedback for mobile devices
    if ("vibrate" in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleSendMessage = (messageText: string) => {
    const newMessage: Message = {
      id: messageId,
      text: messageText,
      timestamp: Date.now(),
      type: "user",
      status: "sending",
    };

    // Play send sound and haptic feedback
    playMessageSound();
    triggerHapticFeedback("medium");

    setMessages((prev) => {
      const updated = [newMessage, ...prev];
      // Keep only the latest 3 messages
      return updated.slice(0, 3);
    });

    setMessageId((prev) => prev + 1);

    // Simulate message status updates
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, status: "sent" as MessageStatus }
            : msg,
        ),
      );
      triggerHapticFeedback("light");
    }, 300);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, status: "delivered" as MessageStatus }
            : msg,
        ),
      );
      triggerHapticFeedback("light");
    }, 600);

    // Simulate system response with quicker, more elegant timing
    setTimeout(() => {
      setIsTyping(true);
      triggerHapticFeedback("light");
    }, 800);

    setTimeout(() => {
      setIsTyping(false);
      const systemMessage: Message = {
        id: messageId + 1,
        text: systemResponses[
          Math.floor(Math.random() * systemResponses.length)
        ],
        timestamp: Date.now(),
        type: "system",
        status: "delivered",
      };

      setMessages((prev) => {
        const updated = [systemMessage, ...prev];
        // Keep only the latest 3 messages
        return updated.slice(0, 3);
      });

      setMessageId((prev) => prev + 2);
      triggerHapticFeedback("medium");
    }, 1800);
  };

  return (
    <div
      className="size-full relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            var(--warm-gray) 0%, 
            rgba(245, 245, 245, 0.9) 50%, 
            var(--warm-gray) 100%
          )
        `,
      }}
    >
      {/* Enhanced background decoration with muted calming colors on warm grey */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(123, 167, 217, 0.03) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 70%, rgba(156, 201, 154, 0.04) 0%, transparent 40%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(212, 165, 116, 0.03) 0%, transparent 40%)",
        }}
      />

      {/* Floating particles effect with muted mental health colors */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full animate-pulse"
          style={{ backgroundColor: "var(--trust-blue)" }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-1 h-1 rounded-full animate-pulse"
          style={{
            backgroundColor: "var(--growth-green)",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full animate-pulse"
          style={{
            backgroundColor: "var(--soft-orange)",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Messages container */}
      <div className="relative size-full">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              id={message.id}
              index={index}
              type={message.type}
              status={message.status}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state hint */}
      {messages.length === 0 && !isTyping && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-muted-foreground/80">
            <p className="mb-2">Welcome to your safe space</p>
            <p className="text-sm">Share what's on your mind</p>
          </div>
        </div>
      )}

      {/* Typing indicator - positioned near input */}
      <AnimatePresence>
        {isTyping && <TypingIndicator />}
      </AnimatePresence>

      {/* Enhanced floating chat input */}
      <FloatingChatInput
        onSendMessage={handleSendMessage}
        onHapticFeedback={triggerHapticFeedback}
      />
    </div>
  );
}


import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Clock } from "lucide-react";
import { MessageType, MessageStatus } from "../App";

interface ChatMessageProps {
  message: string;
  id: number;
  index: number;
  type: MessageType;
  status: MessageStatus;
}

export const ChatMessage = forwardRef<
  HTMLDivElement,
  ChatMessageProps
>(({ message, id, index, type, status }, ref) => {
  const isUser = type === "user";

  // Define blur and opacity levels for 3 messages with increased spacing
  const getMessageVisuals = (index: number) => {
    switch (index) {
      case 0: // Newest message - fully clear
        return {
          opacity: 1,
          blur: "blur(0px)",
          scale: 1,
          yOffset: 0,
        };
      case 1: // Second message - half blurred, more spaced out
        return {
          opacity: 0.6,
          blur: "blur(1px)",
          scale: 0.95,
          yOffset: -100,
        };
      case 2: // Third message - fully blurred, even more spaced out
        return {
          opacity: 0.3,
          blur: "blur(4px)",
          scale: 0.9,
          yOffset: -200,
        };
      default:
        return {
          opacity: 0,
          blur: "blur(8px)",
          scale: 0.8,
          yOffset: -300,
        };
    }
  };

  const visuals = getMessageVisuals(index);

  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return (
          <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
        );
      case "sent":
        return (
          <Check className="h-3 w-3 text-muted-foreground" />
        );
      case "delivered":
        return (
          <CheckCheck
            className="h-3 w-3"
            style={{ color: "var(--growth-green)" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={ref}
      key={id}
      initial={{
        opacity: 0,
        y: 60,
        scale: 0.7,
        filter: "blur(8px)",
        rotateX: 15,
      }}
      animate={{
        opacity: visuals.opacity,
        y: visuals.yOffset,
        scale: visuals.scale,
        filter: visuals.blur,
        rotateX: 0,
        transition: {
          duration: 0.8,
          ease: [0.23, 1, 0.32, 1],
          delay: 0.1,
          opacity: { duration: 0.6 },
          filter: { duration: 0.7 },
        },
      }}
      exit={{
        opacity: 0,
        y: -250,
        scale: 0.6,
        filter: "blur(12px)",
        rotateX: -15,
        transition: {
          duration: 0.6,
          ease: [0.7, 0, 0.84, 0],
          opacity: { duration: 0.4 },
          filter: { duration: 0.5 },
        },
      }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        zIndex: index === 0 ? 10 : index === 1 ? 8 : 6,
      }}
    >
      <motion.div
        className={`backdrop-blur-md border rounded-2xl px-8 py-6 shadow-2xl max-w-md relative ${
          isUser
            ? "text-white border-opacity-30"
            : "text-white border-opacity-30"
        }`}
        style={{
          backgroundColor: isUser
            ? "var(--growth-green)"
            : "var(--trust-blue)",
          borderColor: isUser
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(255, 255, 255, 0.3)",
          boxShadow: isUser
            ? "0 20px 25px -5px rgba(156, 201, 154, 0.2), 0 10px 10px -5px rgba(156, 201, 154, 0.15)"
            : "0 20px 25px -5px rgba(123, 167, 217, 0.2), 0 10px 10px -5px rgba(123, 167, 217, 0.15)",
        }}
        whileHover={
          index === 0
            ? {
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 },
              }
            : {}
        }
        initial={
          index === 0
            ? {
                boxShadow: isUser
                  ? "0 0 0 0 rgba(156, 201, 154, 0.3)"
                  : "0 0 0 0 rgba(123, 167, 217, 0.3)",
              }
            : {}
        }
        animate={
          index === 0
            ? {
                boxShadow: isUser
                  ? [
                      "0 0 0 0 rgba(156, 201, 154, 0.3)",
                      "0 0 0 10px rgba(156, 201, 154, 0)",
                      "0 0 0 0 rgba(156, 201, 154, 0)",
                    ]
                  : [
                      "0 0 0 0 rgba(123, 167, 217, 0.3)",
                      "0 0 0 10px rgba(123, 167, 217, 0)",
                      "0 0 0 0 rgba(123, 167, 217, 0)",
                    ],
              }
            : {}
        }
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <p className="text-left">{message}</p>

        {/* Status indicator for user messages - only show on newest message */}
        {isUser && index === 0 && (
          <motion.div
            className="absolute -bottom-1 -right-1 bg-white/90 backdrop-blur-sm rounded-full p-1.5 border border-white/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 500,
            }}
          >
            {getStatusIcon()}
          </motion.div>
        )}

        {/* System message indicator - only show on newest message */}
        {!isUser && index === 0 && (
          <motion.div
            className="absolute -top-2 -left-2 backdrop-blur-sm rounded-full w-4 h-4 border border-white/30"
            style={{ backgroundColor: "var(--trust-blue)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 500,
            }}
          >
            <motion.div
              className="w-2 h-2 bg-white rounded-full m-1"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}

        {/* Enhanced glowing effect for new messages */}
        {index === 0 && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundColor: isUser
                ? "rgba(156, 201, 154, 0.2)"
                : "rgba(123, 167, 217, 0.2)",
            }}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}

        {/* Subtle floating animation for focused message */}
        {index === 0 && (
          <motion.div
            className="absolute inset-0"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage"; 



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Mic } from 'lucide-react';

interface FloatingChatInputProps {
  onSendMessage: (message: string) => void;
  onHapticFeedback?: (type: 'light' | 'medium' | 'heavy') => void;
}

export function FloatingChatInput({ onSendMessage, onHapticFeedback }: FloatingChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Detect when user is typing
  useEffect(() => {
    if (message.length > 0) {
      setIsUserTyping(true);
      const timeout = setTimeout(() => setIsUserTyping(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      setIsUserTyping(false);
    }
  }, [message]);

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio feedback unavailable');
    }
  };

  const handleSend = async () => {
    if (message.trim()) {
      setIsSending(true);
      playClickSound();
      onHapticFeedback?.('medium');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onSendMessage(message.trim());
      setMessage('');
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onHapticFeedback?.('light');
  };

  return (
    <motion.div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div 
        className="backdrop-blur-md border border-opacity-20 rounded-full shadow-2xl px-6 py-3 flex items-center gap-3 min-w-[400px] relative overflow-hidden text-white"
        style={{
          backgroundColor: 'var(--soft-orange)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 25px -5px rgba(212, 165, 116, 0.2), 0 10px 10px -5px rgba(212, 165, 116, 0.15)'
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts..."
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-white/70"
          disabled={isSending}
        />
        
        {/* Voice input button wrapped in motion.div */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full h-8 w-8 p-0 transition-all duration-200 text-white hover:bg-white/20"
            onClick={() => {
              playClickSound();
              onHapticFeedback?.('light');
            }}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Send button wrapped in motion.div */}
        <motion.div
          whileHover={{ 
            scale: 1.1,
            filter: 'drop-shadow(0 6px 20px rgba(255, 255, 255, 0.3))'
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleSend}
            size="sm"
            className="rounded-full h-8 w-8 p-0 transition-all duration-200 bg-white text-black border-0 hover:bg-white/90"
            disabled={!message.trim() || isSending}
          >
            <motion.div
              animate={isSending ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Send className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced glow effect with muted soft orange */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-15 -z-10"
        style={{
          backgroundColor: 'var(--soft-orange)'
        }}
      />

      {/* User typing indicator below input */}
      <AnimatePresence>
        {isUserTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div 
              className="backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white"
              style={{
                backgroundColor: 'var(--soft-orange)'
              }}
            >
              You're typing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.8,
        y: 20
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
        transition: { 
          duration: 0.3, 
          ease: [0.23, 1, 0.32, 1]
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        y: 20,
        transition: { 
          duration: 0.2, 
          ease: [0.7, 0, 0.84, 0]
        }
      }}
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
    >
      <div 
        className="backdrop-blur-md border border-opacity-20 rounded-full shadow-xl px-4 py-2"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--growth-green)',
          boxShadow: '0 10px 15px -3px rgba(156, 201, 154, 0.15), 0 4px 6px -2px rgba(156, 201, 154, 0.1)'
        }}
      >
        <div className="flex items-center space-x-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--growth-green)' }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--growth-green)' }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0.2,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--growth-green)' }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: 0.4,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {/* Subtle glow effect with muted growth green */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-30 -z-10"
        style={{
          backgroundColor: 'var(--growth-green)'
        }}
      />
    </motion.div>
  );
}

