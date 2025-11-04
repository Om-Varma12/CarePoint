"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import type { Chat } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Menu, Settings, Send, User } from "lucide-react";
import { WelcomeScreen } from "@/components/welcome-screen";
import { MessageList } from "@/components/message-list";
import { DisclaimerNotice } from "@/components/disclaimer-notice";
import { SettingsModal } from "@/components/settings-model";
import { cn } from "@/lib/utils";
import { saveUserToCookie, getUserFromCookie, removeUserFromCookie } from "@/lib/auth-utils";

interface ChatInterfaceProps {
  chat?: Chat;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onUserIdChange: (userId: number | null) => void;
}

export function ChatInterface({
  chat,
  onSendMessage,
  onToggleSidebar,
  onNewChat,
  onUserIdChange,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Load user from cookie on component mount
  useEffect(() => {
    const savedUser = getUserFromCookie();
    if (savedUser) {
      setUserName(savedUser.userName);
      setUserId(savedUser.userId);
      onUserIdChange(savedUser.userId);
      console.log('🔄 User restored from cookie:', savedUser.userName, 'ID:', savedUser.userId);
    }
  }, [onUserIdChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!userId) {
      alert("Please login to send messages");
      setShowAuthModal(true);
      return;
    }

    // Check message limit (20 messages max per chat)
    if (chat && chat.messages.length >= 20) {
      alert("This conversation has reached the 20-message limit. Please start a new conversation to continue chatting.");
      return;
    }

    onSendMessage(input.trim());
    setInput("");
    setShowDisclaimer(true);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (!userId) {
      alert("Please login to start chatting");
      setShowAuthModal(true);
      return;
    }
    onSendMessage(question);
    setShowDisclaimer(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/loginUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok && data.name && data.user_id) {
        setUserName(data.name);
        setUserId(data.user_id);
        onUserIdChange(data.user_id);
        
        // Save user to cookie
        saveUserToCookie({
          userId: data.user_id,
          userName: data.name,
          email: email
        });
        
        console.log('✅ User logged in and saved to cookie:', data.name, 'ID:', data.user_id);
        
        setShowAuthModal(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please enter name, email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/signupUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok && data.name && data.user_id) {
        setUserName(data.name);
        setUserId(data.user_id);
        onUserIdChange(data.user_id);
        
        // Save user to cookie
        saveUserToCookie({
          userId: data.user_id,
          userName: data.name,
          email: email
        });
        
        console.log('✅ User signed up and saved to cookie:', data.name, 'ID:', data.user_id);
        
        setShowAuthModal(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUserName(null);
    setUserId(null);
    onUserIdChange(null);
    setName("");
    setEmail("");
    setPassword("");
    
    // Remove user from cookie
    removeUserFromCookie();
    console.log('✅ User logged out');
  };

  const handleAuthSubmit = () => {
    if (authMode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              CarePoint Assistant
            </h2>
            <p className="text-sm text-muted-foreground">
              Healthcare, College Support & Emergency Guidance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userName ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {userName}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSettingsModal(true)}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Login / Sign Up
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSettingsModal(true)}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-[90%] mx-auto">
          {!chat || chat.messages.length === 0 ? (
            <WelcomeScreen onSelectQuestion={handleSuggestedQuestion} />
          ) : (
            <MessageList messages={chat.messages} />
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="w-[90%] mx-auto px-6 py-5">
          {showDisclaimer && <DisclaimerNotice />}

          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-3 justify-center"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                !userId 
                  ? "Please login to start chatting..." 
                  : chat && chat.messages.length >= 20
                  ? "This conversation has reached the 20-message limit. Start a new chat to continue."
                  : "Ask about health, college wellbeing, or emergencies..."
              }
              className="flex-1 resize-none rounded-3xl border-2 border-input bg-background pl-8 pr-6 py-3 text-[15px] focus:border-primary focus:outline-none transition-colors scrollbar-hide max-w-4xl"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              rows={1}
              disabled={!userId || (chat && chat.messages.length >= 20)}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || !userId || (chat && chat.messages.length >= 20)}
              className={cn(
                "h-10 w-10 rounded-full transition-all flex-shrink-0",
                input.trim() && userId && (!chat || chat.messages.length < 20)
                  ? "bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-background rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {authMode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAuthModal(false)}
              >
                <span className="text-xl">×</span>
              </Button>
            </div>

            <div className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border-2 border-input rounded-lg focus:border-primary focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border-2 border-input rounded-lg focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAuthSubmit();
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-input rounded-lg focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAuthSubmit}
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : authMode === "login"
                  ? "Login"
                  : "Sign Up"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {authMode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setAuthMode("signup")}
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setAuthMode("login")}
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}