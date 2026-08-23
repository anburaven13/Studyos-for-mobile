import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Bot, User, Send, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { simulateAiResponse, extractTextFromDocument } from '../lib/aiService';
import { cn } from '../lib/utils';

type Message = { id: string; role: 'user' | 'ai'; content: string; };

export default function Workspace() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "Upload a PDF document to start chatting with it!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setPdfFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    
    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const extractedText = await extractTextFromDocument(base64, file.type);
        setPdfText(extractedText);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `I've finished reading "${file.name}". What would you like to know about it?` }]);
        setIsParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('Failed to parse PDF text.');
      setIsParsing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    const systemPrompt = `You are an AI assistant that answers questions based on a provided document. Use the document context below to answer accurately. If the answer is not in the document, say so.\n\nDOCUMENT CONTEXT:\n${pdfText}`;
    
    const aiResponseContent = await simulateAiResponse(newMessages, systemPrompt);
    const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: aiResponseContent };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">PDF Workspace</h1>
          <p className="text-muted-foreground mt-1">Chat directly with your lecture slides and textbooks.</p>
        </div>
        <input 
          type="file" 
          accept="application/pdf"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-4 lg:pb-0 overflow-y-auto lg:overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 border rounded-2xl bg-muted/20 flex flex-col items-center justify-center overflow-hidden relative min-h-[300px] lg:min-h-0 shrink-0 lg:shrink">
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              className="w-full h-full border-0" 
              title="PDF Viewer"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No document uploaded</p>
              <p className="text-sm mt-1">Upload a PDF to view it here.</p>
            </div>
          )}
          
          {isParsing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="font-medium">Parsing document context...</p>
              <p className="text-sm text-muted-foreground mt-1">Preparing AI...</p>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-[450px] border rounded-2xl bg-card shadow-sm flex flex-col overflow-hidden shrink-0 h-[500px] lg:h-auto">
          <div className="p-4 border-b bg-muted/10 font-semibold flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>Document AI</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex space-x-3", msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : '')}>
                <div className={cn("w-8 h-8 flex-shrink-0 rounded flex items-center justify-center mt-1", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className={cn("max-w-[85%] rounded-xl p-3 text-sm leading-relaxed", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border')}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex space-x-3">
                <div className="w-8 h-8 flex-shrink-0 rounded bg-muted flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="rounded-xl p-4 bg-muted/50 border flex space-x-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse delay-150" />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
          
          <div className="p-4 border-t bg-background">
            <div className="flex items-center space-x-2">
              <input 
                type="text"
                className="flex-1 bg-muted/50 border focus:border-primary rounded-lg px-3 py-2 outline-none text-sm transition-colors"
                placeholder="Ask about this document..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={!pdfText && !isParsing}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping || !pdfText}
                className="w-10 h-10 flex-shrink-0 bg-primary text-primary-foreground rounded-lg flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
