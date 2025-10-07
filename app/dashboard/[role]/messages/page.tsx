"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Plus, MessageCircle } from "lucide-react"

interface Props {
  params: { role: string }
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  profile_picture_url?: string
}

interface Message {
  id: string
  from_user: string
  to_user: string
  content: string
  timestamp: string
  read: boolean
  sender: User
  recipient: User
}

interface Conversation {
  user: User
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage({ params }: Props) {
  const { role } = params
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setCurrentUser(profile)
    }
    fetchCurrentUser()
  }, [])

  // Fetch all users for new chat
  useEffect(() => {
    if (!currentUser) return
    const fetchUsers = async () => {
      try {
        const { data: usersData, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", currentUser.id)
          .order("first_name")
        if (error) throw error
        setUsers(usersData || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch users")
      }
    }
    fetchUsers()
  }, [currentUser])

  // Fetch conversations
  const fetchConversations = async () => {
    if (!currentUser) return
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`*, sender:profiles!messages_from_user_fkey(*), recipient:profiles!messages_to_user_fkey(*)`)
        .or(`from_user.eq.${currentUser.id},to_user.eq.${currentUser.id}`)
        .order("timestamp", { ascending: false })
      if (error) throw error

      const conversationMap = new Map<string, Conversation>()

      messagesData?.forEach((message) => {
        const partnerId = message.from_user === currentUser.id ? message.to_user : message.from_user
        const partner = message.from_user === currentUser.id ? message.recipient : message.sender

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user: partner,
            lastMessage: message,
            unreadCount: 0,
          })
        }

        const conv = conversationMap.get(partnerId)!
        if (message.timestamp > conv.lastMessage.timestamp) conv.lastMessage = message
        if (message.to_user === currentUser.id && !message.read) conv.unreadCount++
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations")
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [currentUser])

  // Fetch messages for a conversation
  const fetchMessages = async (userId: string) => {
    if (!currentUser) return
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`*, sender:profiles!messages_from_user_fkey(*), recipient:profiles!messages_to_user_fkey(*)`)
        .or(`and(from_user.eq.${currentUser.id},to_user.eq.${userId}),and(from_user.eq.${userId},to_user.eq.${currentUser.id})`)
        .order("timestamp", { ascending: true })
      if (error) throw error
      setMessages(messagesData || [])

      // Mark as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("from_user", userId)
        .eq("to_user", currentUser.id)
        .eq("read", false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages")
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: Message }) => {
          const msg = payload.new
          if (!currentUser) return

          // Update conversations
          setConversations((prev) => {
            const partnerId = msg.from_user === currentUser.id ? msg.to_user : msg.from_user
            const partner = msg.from_user === currentUser.id ? msg.recipient : msg.sender

            const existing = prev.find((c) => c.user.id === partnerId)
            if (existing) {
              existing.lastMessage = msg
              if (msg.to_user === currentUser.id && !msg.read) existing.unreadCount++
              return [...prev]
            } else {
              return [...prev, { user: partner, lastMessage: msg, unreadCount: msg.to_user === currentUser.id ? 1 : 0 }]
            }
          })

          // Update messages if it's the selected conversation
          if (selectedConversation === (msg.from_user === currentUser.id ? msg.to_user : msg.from_user)) {
            setMessages((prev) => [...prev, msg])
            scrollToBottom()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, selectedConversation])

  // Polling for live updates every second
  useEffect(() => {
    if (!selectedConversation) return
    const interval = setInterval(() => {
      fetchMessages(selectedConversation)
      fetchConversations()
    }, 1000)
    return () => clearInterval(interval)
  }, [selectedConversation, currentUser])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUser) return
    setIsLoading(true)

    try {
      await supabase.from("messages").insert({
        from_user: currentUser.id,
        to_user: selectedConversation,
        content: newMessage.trim(),
      })
      setNewMessage("")
      scrollToBottom()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = (userId: string) => {
    setSelectedConversation(userId)
    setShowNewChat(false)
    fetchMessages(userId)
  }

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = users.find((user) => user.id === selectedConversation)

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Messages</CardTitle>
            <Button size="sm" onClick={() => setShowNewChat(!showNewChat)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showNewChat && (
            <div className="space-y-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {showNewChat ? (
            <div className="space-y-1 p-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => startNewConversation(user.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_picture_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.first_name[0] + user.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{user.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 ${selectedConversation === conversation.user.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  onClick={() => {
                    setSelectedConversation(conversation.user.id)
                    fetchMessages(conversation.user.id)
                  }}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.user.profile_picture_url || "/placeholder.svg"} />
                    <AvatarFallback>{conversation.user.first_name[0] + conversation.user.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{conversation.user.first_name} {conversation.user.last_name}</div>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">{conversation.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{conversation.lastMessage.content}</div>
                    <div className="text-xs text-gray-400">{new Date(conversation.lastMessage.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <div className="text-sm">No conversations yet</div>
                  <div className="text-xs">Start a new chat to begin messaging</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation && selectedUser ? (
          <>
            <CardHeader className="pb-4 border-b flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback>{selectedUser.first_name[0] + selectedUser.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{selectedUser.first_name} {selectedUser.last_name}</CardTitle>
                <CardDescription>{selectedUser.email}</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">{selectedUser.role}</Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.from_user === currentUser?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.from_user === currentUser?.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.from_user === currentUser?.id ? "text-blue-100" : "text-gray-500"}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={1}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(e)
                    }
                  }}
                />
                <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <div className="text-lg font-medium">Select a conversation</div>
              <div className="text-sm">Choose a conversation from the sidebar to start messaging</div>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-96">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
