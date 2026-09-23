import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, query, where, onSnapshot, orderBy, doc, addDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Search, UserPlus, Send, Paperclip, Video, File, Mic, MessageCircle, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Messages() {
  const { user, token } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 1. Fetch Friends and Pending Requests
  useEffect(() => {
    if (!user?.uid) return;
    
    // Fetch Accepted Friends
    const qFriends = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', user.uid),
      where('status', '==', 'accepted')
    );
    
    const unsubscribeFriends = onSnapshot(qFriends, (snapshot) => {
      const f = snapshot.docs.map(doc => {
        const data = doc.data();
        const friendId = data.users.find((id: string) => id !== user.uid);
        return { id: doc.id, friendId, ...data };
      });
      setFriends(f);
    });

    // Fetch Pending Requests sent TO the user
    const qPending = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      const p = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((req: any) => req.requester !== user.uid); // Only show requests from others
      setPendingRequests(p);
    });
    
    return () => {
      unsubscribeFriends();
      unsubscribePending();
    };
  }, [user?.uid]);

  // 2. Fetch Messages for Active Friend
  useEffect(() => {
    if (!activeFriend || !user?.uid) return;
    
    const q = query(
      collection(db, 'messages'),
      where('friendshipId', '==', activeFriend.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Auto-scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    return () => unsubscribe();
  }, [activeFriend, user?.uid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(`/api/users/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const sendFriendRequest = async (targetUsername: string) => {
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUsername })
      });
      alert('Friend request sent!');
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendshipId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (text: string, mediaUrl: string | null = null, mediaType: string | null = null) => {
    if (!activeFriend || !user?.uid) return;
    if (!text.trim() && !mediaUrl) return;

    try {
      await addDoc(collection(db, 'messages'), {
        friendshipId: activeFriend.id,
        senderId: user.uid,
        text,
        mediaUrl,
        mediaType,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend) return;
    
    setUploadProgress(0);
    let finalUrl = '';
    let finalType = 'file';

    try {
      if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        finalType = file.type.startsWith('video/') ? 'video' : 'image';
        
        // 1. SMART ROUTER: Attempt Cloudinary Upload first
        try {
          // Get signature from backend
          const signRes = await fetch('/api/cloudinary/sign', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { signature, timestamp, cloudName, apiKey } = await signRes.json();
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp);
          formData.append('signature', signature);
          formData.append('folder', 'studyos_chat');

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${finalType}/upload`, {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary rate limit hit');
          
          finalUrl = uploadData.secure_url;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload failed:", cloudinaryError);
          alert("Media upload failed. Storage quota might be full.");
          setUploadProgress(null);
          return;
        }
      } else {
        // We only support images and videos through Cloudinary right now
        // PDFs/Audio are disabled without Firebase Storage
        alert("Only images and videos are supported at this time.");
        setUploadProgress(null);
        return;
      }

      // Send the message with the URL
      await sendMessage('', finalUrl, finalType);
    } catch (err) {
      console.error('Upload completely failed:', err);
      alert('Failed to upload file.');
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-black/20 overflow-hidden">
      {/* Sidebar for Friends List */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-md z-10">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <form onSubmit={handleSearch} className="relative">
            <button type="submit" className="absolute left-3 top-2.5 z-10 text-muted-foreground hover:text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <input 
              type="text" 
              placeholder="Find friends by @username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-primary outline-none"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searchResults.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Search Results</p>
              {searchResults.map(res => (
                <div key={res.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span>@{res.username}</span>
                  <button onClick={() => sendFriendRequest(res.username)} className="p-2 hover:bg-primary/20 hover:text-primary rounded-full transition-colors">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {pendingRequests.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-primary uppercase mb-2">Friend Requests ({pendingRequests.length})</p>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-2 border border-primary/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {req.requester.substring(0,2)}
                        </div>
                        <span className="text-sm font-medium">User {req.requester.substring(0,4)}</span>
                      </div>
                      <button 
                        onClick={() => acceptFriendRequest(req.id)} 
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary/90 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Friends</p>
              {friends.length === 0 ? (
                <div className="text-center p-8 text-sm text-muted-foreground">
                  <p>No friends yet.</p>
                  <p className="mt-2 text-xs">Search for a username above to start chatting!</p>
                </div>
              ) : (
                friends.map(friend => (
                  <button 
                    key={friend.id}
                    onClick={() => setActiveFriend(friend)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${activeFriend?.id === friend.id ? 'bg-primary/20' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {friend.id.substring(0,2)}
                    </div>
                    <div>
                      <p className="font-medium">Friend {friend.friendId.substring(0,4)}</p>
                      <p className="text-xs text-muted-foreground">Tap to chat</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col relative z-0">
        {activeFriend ? (
          <div className="flex flex-col h-full">
            <div className="h-16 border-b border-white/10 flex items-center px-6 bg-black/20 backdrop-blur-md">
              <h3 className="font-bold">Encrypted Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground my-8">
                  This is the start of your encrypted conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="attachment" className="rounded-lg max-h-60 object-contain" />}
                            {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-h-60" />}
                            {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="w-full max-w-[200px]" />}
                            {msg.mediaType === 'pdf' && (
                              <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-sm underline">
                                <File className="w-4 h-4" /> <span>View Document</span>
                              </a>
                            )}
                          </div>
                        )}
                        {msg.text && <p className="text-sm">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {uploadProgress !== null && (
              <div className="px-6 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2"><Loader2 className="w-3 h-3 animate-spin" /> <span>Uploading Media...</span></span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            )}

            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="flex items-end space-x-2 relative">
                
                {/* File Upload Hidden Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,video/*,audio/*,.pdf"
                />

                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-black/50 border border-white/10 rounded-2xl relative min-h-[44px]">
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none outline-none py-3 px-4 text-sm"
                  />
                </div>
                
                <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-all shrink-0 disabled:opacity-50">
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl -z-10"></div>
            <MessageCircle className="w-16 h-16 mb-6 opacity-20" />
            <h2 className="text-2xl font-bold mb-2 text-white">Your Messages</h2>
            <p className="max-w-md">Send private photos, videos, and study notes securely. Select a friend to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
