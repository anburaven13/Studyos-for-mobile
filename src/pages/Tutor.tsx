import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Settings, Paperclip, Loader2, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { simulateAiResponse, extractTextFromDocument } from '../lib/aiService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  attachmentUrl?: string;
};

export default function Tutor() {
  const { user } = useAuth();
  const userContext = user?.class_level && user?.board ? `${user.class_level} - ${user.board}` : undefined;

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('tutor_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', role: 'ai', content: "Hello! I'm your StudyOS AI Tutor. I can help explain difficult concepts, solve math problems, or test your knowledge. What would you like to study today?" }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{file: File, url: string} | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<'groq' | 'nvidia'>(
    (localStorage.getItem('ai_provider') as 'groq' | 'nvidia') || 'groq'
  );
  const [apiKey, setApiKey] = useState(localStorage.getItem('nvidia_key') || '');

  // Save settings on change
  useEffect(() => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('nvidia_key', apiKey);
  }, [provider, apiKey]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('tutor_messages', JSON.stringify(messages));
  }, [messages]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setAttachedFile({ file, url });
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    let userContent = input.trim() || 'Please analyze this document.';
    let currentAttachedFile = attachedFile;

    const userMessage: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: userContent,
        attachmentUrl: currentAttachedFile?.url
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedFile(null);
    setIsTyping(true);

    try {
        let aiMessages = [...newMessages];
        if (currentAttachedFile) {
            setIsParsing(true);
            const extractedText = await extractTextFromDocument(currentAttachedFile.file);
            aiMessages[aiMessages.length - 1] = {
                ...userMessage,
                content: `[Attached File Context from ${currentAttachedFile.file.name}: ${extractedText}]\n\nUser Question: ${userContent}`
            };
            setIsParsing(false);
        }

        const providerInfo = {
          provider,
          apiKey: provider === 'nvidia' ? apiKey : undefined,
          model: provider === 'nvidia' ? 'nvidia/nemotron-3-ultra-550b-a55b' : undefined
        };

        const aiResponseContent = await simulateAiResponse(aiMessages, undefined, userContext, providerInfo);
        const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: aiResponseContent };
        
        setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
        console.error('Send Error:', err);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Sorry, I encountered an error while processing that." }]);
        setIsParsing(false);
    }
    setIsTyping(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Tutor</h1>
          <p className="text-muted-foreground mt-1">Your personal 24/7 teaching assistant.</p>
        </div>
        <div className="flex-1" />
        <button 
          onClick={() => {
            if (confirm('Are you sure you want to clear this conversation?')) {
              setMessages([{ id: '1', role: 'ai', content: "Hello! I'm your StudyOS AI Tutor. I can help explain difficult concepts, solve math problems, or test your knowledge. What would you like to study today?" }]);
            }
          }}
          className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 border rounded-md hover:bg-muted text-muted-foreground transition-colors"
          title="AI Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-6 border rounded-2xl bg-card shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold mb-4">Model Settings</h3>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">AI Provider</label>
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:border-primary"
              >
                <option value="groq">Groq (GPT-OSS-120B)</option>
                <option value="nvidia">Nvidia Nemotron (NVIDIA NIM)</option>
              </select>
            </div>
            
            {provider === 'nvidia' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">NVIDIA API Key</label>
                <input 
                  type="password"
                  placeholder="nvapi-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Using model: <span className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">nvidia/nemotron-3-ultra-550b-a55b</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 border rounded-2xl bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex space-x-4", msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
              <div className={cn("w-8 h-8 flex-shrink-0 rounded flex items-center justify-center mt-1", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className={cn("max-w-[80%] rounded-xl p-4 text-sm leading-relaxed", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border')}>
                {msg.role === 'user' ? (
                  <div className="flex flex-col gap-2">
                    {msg.attachmentUrl && (
                        <img src={msg.attachmentUrl} alt="User attachment" className="max-w-[200px] rounded-lg border border-primary/20 object-contain" />
                    )}
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex space-x-4">
              <div className="w-8 h-8 flex-shrink-0 rounded bg-muted flex items-center justify-center mt-1">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="rounded-xl p-4 bg-muted/50 border flex space-x-2 items-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-150" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
        <div className="p-4 border-t bg-background flex flex-col gap-4">
          {attachedFile && (
            <div className="relative inline-block self-start">
                {attachedFile.file.type.startsWith('image/') ? (
                    <img src={attachedFile.url} alt="Attachment" className="h-20 w-20 object-cover rounded-lg border" />
                ) : (
                    <div className="h-20 w-20 flex items-center justify-center bg-muted rounded-lg border text-xs text-center p-2 break-all">
                        {attachedFile.file.name}
                    </div>
                )}
                <button 
                    onClick={() => setAttachedFile(null)}
                    className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow-sm transition-colors"
                    title="Remove Attachment"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
          )}
          <div className="flex flex-row items-stretch sm:items-center gap-4 w-full">
            <input 
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded-xl transition-colors flex-shrink-0 flex items-center justify-center"
              title="Upload Image or PDF"
              disabled={isParsing}
            >
              {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input 
              type="text"
              className="flex-1 bg-muted/50 border border-transparent focus:border-border rounded-xl px-4 py-3 outline-none text-sm transition-colors"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isTyping || isParsing}
              className="w-12 h-12 flex-shrink-0 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
