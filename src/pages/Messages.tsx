import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  Search, UserPlus, Send, Paperclip, File, MessageCircle, 
  Check, Loader2, Trash2, Download, ArrowLeft, X, 
  User, CheckCheck, ShieldCheck, UserCheck, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  uid: string;
  username: string;
  class_level?: string;
  board?: string;
  createdAt?: string;
}

const isSafeAttachmentUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (
      parsed.hostname.endsWith('cloudinary.com') ||
      parsed.hostname.endsWith('firebasestorage.app')
    );
  } catch {
    return false;
  }
};

export default function Messages() {
  const { user, token } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'search'>('chats');
  
  // Real Usernames cache
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // Profile Modal State
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [loadingProfileDetail, setLoadingProfileDetail] = useState(false);

  // Search & Chat State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const clean = name.replace('@', '').trim();
    return clean.slice(0, 2).toUpperCase();
  };

  // 1. Fetch Friends and Pending Requests from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    
    // Fetch Accepted Friends
    const qFriends = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', user.uid),
      where('status', '==', 'accepted')
    );
    
    const unsubscribeFriends = onSnapshot(qFriends, (snapshot) => {
      const f = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const friendId = data.users.find((id: string) => id !== user.uid);
        return { id: docSnap.id, friendId, ...data };
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
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((req: any) => req.requester !== user.uid); // Only requests sent to me
      setPendingRequests(p);
    });
    
    return () => {
      unsubscribeFriends();
      unsubscribePending();
    };
  }, [user?.uid]);

  // 2. Resolve Actual Usernames by UIDs
  useEffect(() => {
    if (!token) return;
    
    // Gather all target UIDs from friendships and requests
    const uidsToFetch = new Set<string>();
    
    friends.forEach(f => {
      if (f.friendId && !userProfiles[f.friendId]) {
        uidsToFetch.add(f.friendId);
      }
    });
    
    pendingRequests.forEach(r => {
      if (r.requester && !userProfiles[r.requester]) {
        uidsToFetch.add(r.requester);
      }
    });

    if (uidsToFetch.size === 0) return;

    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const res = await fetch('/api/users/by-uids', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ uids: Array.from(uidsToFetch) })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            setUserProfiles(prev => ({ ...prev, ...data.users }));
          }
        }
      } catch (err) {
        console.error('Failed to resolve usernames:', err);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [friends, pendingRequests, token, userProfiles]);

  // 3. Fetch Messages for Active Friend
  useEffect(() => {
    if (!activeFriend || !user?.uid) return;
    
    const q = query(
      collection(db, 'messages'),
      where('friendshipId', '==', activeFriend.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      
      // Sort in memory to guarantee chronological order
      msgs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeA - timeB;
      });
      
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    return () => unsubscribe();
  }, [activeFriend, user?.uid]);

  // Helper to get friend's real display name
  const getFriendUsername = (friend: any): string => {
    if (!friend) return 'User';
    if (userProfiles[friend.friendId]?.username) {
      return userProfiles[friend.friendId].username;
    }
    if (friend.usernames && friend.usernames[friend.friendId]) {
      return friend.usernames[friend.friendId];
    }
    if (friend.targetUsername && friend.requester === user?.uid) {
      return friend.targetUsername;
    }
    if (friend.requesterUsername && friend.requester !== user?.uid) {
      return friend.requesterUsername;
    }
    return `user_${friend.friendId?.slice(0, 5) || 'friend'}`;
  };

  // Helper to get requester's real display name
  const getRequesterUsername = (req: any): string => {
    if (!req) return 'User';
    if (userProfiles[req.requester]?.username) {
      return userProfiles[req.requester].username;
    }
    if (req.requesterUsername) {
      return req.requesterUsername;
    }
    if (req.usernames && req.usernames[req.requester]) {
      return req.usernames[req.requester];
    }
    return `user_${req.requester?.slice(0, 5) || 'student'}`;
  };

  // Search Users
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim().replace('@', ''))}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Send Friend Request
  const sendFriendRequest = async (targetUsername: string) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUsername })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to send friend request');
        return;
      }
      setActionSuccess(`Friend request sent to @${targetUsername}!`);
      setTimeout(() => setActionSuccess(null), 3000);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      alert('Error sending friend request');
    }
  };

  // Accept Friend Request
  const acceptFriendRequest = async (friendshipId: string, username: string) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendshipId })
      });
      if (res.ok) {
        setActionSuccess(`You are now friends with @${username}!`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Decline Friend Request
  const declineFriendRequest = async (friendshipId: string) => {
    try {
      await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendshipId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Friend
  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendshipId })
      });
      if (activeFriend?.id === friendshipId) {
        setActiveFriend(null);
      }
      setViewingProfile(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Detailed Profile Page/Modal
  const openUserProfile = async (targetUsername: string, uid?: string) => {
    setLoadingProfileDetail(true);
    setViewingProfile({
      uid: uid || '',
      username: targetUsername,
      class_level: 'Loading...',
      board: 'Loading...'
    });

    try {
      const res = await fetch(`/api/users/profile/${encodeURIComponent(targetUsername)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewingProfile(data.user);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoadingProfileDetail(false);
    }
  };

  // Send Message
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
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Delete Message
  const deleteMessage = async (msg: any) => {
    if (!user?.uid || msg.senderId !== user.uid) return;
    try {
      if (msg.mediaUrl) {
        await fetch('/api/cloudinary/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mediaUrl: msg.mediaUrl, messageId: msg.id })
        });
      }
      await deleteDoc(doc(db, 'messages', msg.id));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Media File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend) return;
    
    setUploadProgress(0);
    let finalUrl = '';
    let finalType = 'file';

    try {
      if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        finalType = file.type.startsWith('video/') ? 'video' : 'image';
        
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
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Upload failed');
        finalUrl = uploadData.secure_url;
      } else {
        alert("Only images and videos are supported.");
        setUploadProgress(null);
        return;
      }

      await sendMessage('', finalUrl, finalType);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file.');
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex w-full h-[calc(100dvh-3.5rem-72px)] md:h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* =========================================================================
          LEFT PANE (Friends List, Dedicated Requests, Search)
          On Mobile: Takes 100% width when activeFriend is null; hidden when chat is open
          On Desktop: Fixed width (w-80 or w-96)
         ========================================================================= */}
      <div className={`
        ${activeFriend ? 'hidden md:flex' : 'flex'}
        w-full md:w-84 lg:w-96 border-r border-border/60 flex-col bg-card/60 backdrop-blur-2xl z-10 transition-all h-full
      `}>
        
        {/* Top Header & Segmented Tabs */}
        <div className="p-3.5 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span>StudyOS Chat</span>
            </h1>
            {user?.username && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                @{user.username}
              </span>
            )}
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-background/80 p-1 rounded-xl border border-border/70 text-xs font-medium">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'chats' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Chats</span>
              <span className="text-[10px] opacity-75">({friends.length})</span>
            </button>

            {/* DEDICATED FRIEND REQUESTS TAB WITH NOTIFICATION DOT */}
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 relative transition-all ${
                activeTab === 'requests' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Requests</span>
              {pendingRequests.length > 0 && (
                <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-primary-foreground animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
              {pendingRequests.length > 0 && activeTab !== 'requests' && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'search' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Find</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccess && (
          <div className="mx-3 mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCheck className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          
          {/* TAB 1: ACCEPTED CHATS */}
          {activeTab === 'chats' && (
            <div>
              {friends.length === 0 ? (
                <div className="text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm">No study friends yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Connect with study partners by searching their exact @username in the <strong>Find</strong> tab.
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Find Friends
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Direct Messages ({friends.length})
                  </p>
                  {friends.map(friend => {
                    const realUsername = getFriendUsername(friend);
                    const isSelected = activeFriend?.id === friend.id;
                    const initials = getInitials(realUsername);

                    return (
                      <div
                        key={friend.id}
                        className={`group w-full p-2.5 rounded-2xl transition-all flex items-center justify-between border ${
                          isSelected 
                            ? 'bg-primary/15 border-primary/30 shadow-sm' 
                            : 'bg-card/40 border-border/40 hover:bg-card hover:border-border'
                        }`}
                      >
                        <button
                          onClick={() => setActiveFriend(friend)}
                          className="flex items-center space-x-3 text-left flex-1 min-w-0"
                        >
                          <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-600/30 border border-primary/20 flex items-center justify-center text-foreground font-bold text-sm shrink-0">
                              {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                          </div>
                          
                          <div className="truncate flex-1">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-semibold text-sm text-foreground truncate">
                                @{realUsername}
                              </p>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              Tap to open chat
                            </p>
                          </div>
                        </button>

                        {/* View Profile Action */}
                        <button
                          onClick={() => openUserProfile(realUsername, friend.friendId)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors ml-1 shrink-0"
                          title={`View @${realUsername}'s Profile`}
                        >
                          <User className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEDICATED FRIEND REQUESTS AREA WITH ACTUAL USERNAMES */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Incoming Requests ({pendingRequests.length})</span>
                </p>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center p-8 space-y-2 border border-dashed border-border/60 rounded-2xl">
                  <CheckCheck className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground">
                    When someone sends you a friend request using your @username, you'll see them right here with their verified details.
                  </p>
                </div>
              ) : (
                pendingRequests.map(req => {
                  const reqUsername = getRequesterUsername(req);
                  const initials = getInitials(reqUsername);

                  return (
                    <div 
                      key={req.id} 
                      className="p-3.5 bg-gradient-to-br from-primary/10 via-card/80 to-card border border-primary/30 rounded-2xl space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            {/* ACTUAL USERNAME PROMINENTLY DISPLAYED */}
                            <p className="font-bold text-sm text-foreground">
                              @{reqUsername}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Wants to be your study partner
                            </p>
                          </div>
                        </div>

                        {/* View Profile Button */}
                        <button
                          onClick={() => openUserProfile(reqUsername, req.requester)}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-card border border-border hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                        >
                          <User className="w-3 h-3" />
                          <span>Profile</span>
                        </button>
                      </div>

                      {/* Action Buttons: Accept / Decline */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button 
                          onClick={() => acceptFriendRequest(req.id, reqUsername)} 
                          className="py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button 
                          onClick={() => declineFriendRequest(req.id)} 
                          className="py-2 bg-card hover:bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium rounded-xl transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: SEARCH & ADD FRIENDS BY @USERNAME */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="relative">
                <button type="submit" className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Search className="w-4 h-4" />
                </button>
                <input 
                  type="text" 
                  placeholder="Enter exact @username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl py-2.5 pl-9 pr-3 text-sm focus:border-primary outline-none transition-all placeholder:text-muted-foreground/60"
                  autoFocus
                />
              </form>

              {searchLoading && (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Searching users...</span>
                </div>
              )}

              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase px-1">
                    Found Students ({searchResults.length})
                  </p>
                  {searchResults.map(res => (
                    <div 
                      key={res.uid} 
                      className="flex items-center justify-between p-3 bg-card border border-border/70 rounded-2xl hover:border-primary/40 transition-colors"
                    >
                      <button 
                        onClick={() => openUserProfile(res.username, res.uid)}
                        className="flex items-center space-x-2.5 text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {getInitials(res.username)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">@{res.username}</p>
                          <p className="text-[10px] text-muted-foreground">Click to inspect profile</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => sendFriendRequest(res.username)} 
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center space-x-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searchLoading ? (
                <div className="text-center p-6 text-xs text-muted-foreground">
                  No users found matching "@{searchQuery}".
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>How it works</span>
                  </p>
                  <p>Type any classmate's exact StudyOS username to send a friend request. Once they accept, you can message instantly.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: ACTIVE CHAT WINDOW
          On Mobile: Takes 100% width when activeFriend is selected; hidden when friend is null
          On Desktop: Takes remaining flex-1 width
         ========================================================================= */}
      <div className={`
        ${activeFriend ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col h-full bg-background relative z-0 overflow-hidden
      `}>
        {activeFriend ? (
          <div className="flex flex-col h-full w-full min-h-0">
            
            {/* Top Chat Header */}
            <div className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:px-6 bg-card/70 backdrop-blur-xl shrink-0">
              <div className="flex items-center space-x-3">
                {/* Mobile Back Button to return to friends list */}
                <button 
                  onClick={() => setActiveFriend(null)} 
                  className="md:hidden p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Back to Friends"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar & Real Username Header */}
                <button
                  onClick={() => openUserProfile(getFriendUsername(activeFriend), activeFriend.friendId)}
                  className="flex items-center space-x-3 text-left group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/30 to-purple-600/30 border border-primary/30 flex items-center justify-center font-bold text-sm text-foreground">
                    {getInitials(getFriendUsername(activeFriend))}
                  </div>
                  <div>
                    {/* ACTUAL USERNAME CLICKABLE */}
                    <div className="flex items-center space-x-1.5">
                      <h2 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                        @{getFriendUsername(activeFriend)}
                      </h2>
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Encrypted direct chat</span>
                    </p>
                  </div>
                </button>
              </div>

              {/* View Profile Action */}
              <button
                onClick={() => openUserProfile(getFriendUsername(activeFriend), activeFriend.friendId)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card border border-border/50 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                title="View Student Profile"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
            
            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-3.5">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground my-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">Say hello to @{getFriendUsername(activeFriend)}!</p>
                  <p className="max-w-xs mx-auto">This conversation is private and end-to-end between the two of you.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center space-x-2 w-full max-w-full">
                        {isMine && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity ml-auto">
                            {msg.mediaUrl && isSafeAttachmentUrl(msg.mediaUrl) && (
                              <button 
                                onClick={() => window.open(msg.mediaUrl.replace('/upload/', '/upload/fl_attachment/'), '_blank', 'noopener,noreferrer')} 
                                className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                                title="Download Media"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteMessage(msg)} 
                              className="p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" 
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words ${
                          isMine 
                            ? 'bg-primary text-primary-foreground rounded-tr-xs' 
                            : 'bg-card border border-border/70 text-card-foreground rounded-tl-xs mr-auto'
                        }`}>
                          {msg.mediaUrl && (
                            <div className="mb-2">
                              {msg.mediaType === 'image' && (
                                <img src={msg.mediaUrl} alt="attachment" className="rounded-xl max-h-64 object-contain w-full" />
                              )}
                              {msg.mediaType === 'video' && (
                                <video src={msg.mediaUrl} controls className="rounded-xl max-h-64 w-full" />
                              )}
                              {msg.mediaType === 'file' && isSafeAttachmentUrl(msg.mediaUrl) && (
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs underline py-1">
                                  <File className="w-4 h-4" /> <span>Download Document</span>
                                </a>
                              )}
                            </div>
                          )}
                          {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                        </div>

                        {!isMine && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity mr-auto">
                            {msg.mediaUrl && isSafeAttachmentUrl(msg.mediaUrl) && (
                              <button 
                                onClick={() => window.open(msg.mediaUrl.replace('/upload/', '/upload/fl_attachment/'), '_blank', 'noopener,noreferrer')} 
                                className="p-1 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                                title="Download Media"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground/80 mt-1 px-1">
                        {(() => {
                          if (!msg.timestamp) return '';
                          const dateObj = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
                          return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        })()}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-xs text-primary">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading attachment...</span>
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            )}

            {/* Redesigned High-Visibility Chat Input Bar */}
            <div className="p-3 md:p-4 border-t border-border/70 bg-card/90 backdrop-blur-2xl shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} 
                className="flex items-center space-x-2"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,video/*,.pdf"
                />

                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-2xl transition-colors shrink-0"
                  title="Attach Image or Video"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-background border border-input rounded-2xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()} 
                  className="p-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-all shrink-0 disabled:opacity-40 disabled:hover:bg-primary shadow-md active:scale-95"
                  title="Send"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>

            {/* Subtle Auto-Deletion Disclaimer */}
            <div className="px-4 py-1.5 text-[10px] text-muted-foreground/70 text-center bg-card/50 border-t border-border/30 shrink-0">
              Attachments auto-delete after 30 days to protect storage and privacy.
            </div>
          </div>
        ) : (
          /* Empty State for Desktop when no friend is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Direct Messages</h2>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Select a friend from the list or accept incoming requests to start exchanging study notes and solutions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          DEDICATED USER PROFILE MODAL / SEPARATE PAGE
          Displays the actual username, class level, board, and relationship actions
         ========================================================================= */}
      <AnimatePresence>
        {viewingProfile && (
          <div 
            onClick={() => setViewingProfile(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden cursor-default"
            >
              {/* Background Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none -z-10" />

              {/* Close Button (z-30 ensures it sits above all elements) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingProfile(null);
                }}
                className="absolute top-4 right-4 z-30 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2 pb-2 space-y-4 relative z-10">
                {/* Large Avatar */}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-purple-600 text-white font-bold text-2xl mx-auto flex items-center justify-center shadow-lg border-2 border-primary/30">
                  {getInitials(viewingProfile.username)}
                </div>

                <div>
                  {/* ACTUAL USERNAME DISPLAY */}
                  <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center space-x-1.5">
                    <span>@{viewingProfile.username}</span>
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">StudyOS Verified Student</p>
                </div>

                {/* Academic Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-left bg-background/80 border border-border/60 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Class / Grade</span>
                    <p className="text-sm font-semibold text-foreground">
                      {viewingProfile.class_level || 'Grade 10'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Board / Curriculum</span>
                    <p className="text-sm font-semibold text-foreground">
                      {viewingProfile.board || 'ICSE'}
                    </p>
                  </div>
                </div>

                {/* Relationship & Actions */}
                <div className="pt-2 space-y-2">
                  {friends.some(f => f.friendId === viewingProfile.uid) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const friendObj = friends.find(f => f.friendId === viewingProfile.uid);
                          if (friendObj) setActiveFriend(friendObj);
                          setViewingProfile(null);
                        }}
                        className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat with @{viewingProfile.username}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const friendObj = friends.find(f => f.friendId === viewingProfile.uid);
                          if (friendObj) removeFriend(friendObj.id);
                        }}
                        className="w-full py-2.5 bg-card hover:bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium rounded-2xl transition-all"
                      >
                        Remove Friend
                      </button>
                    </>
                  ) : pendingRequests.some(r => r.requester === viewingProfile.uid) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const req = pendingRequests.find(r => r.requester === viewingProfile.uid);
                          if (req) acceptFriendRequest(req.id, viewingProfile.username);
                          setViewingProfile(null);
                        }}
                        className="py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const req = pendingRequests.find(r => r.requester === viewingProfile.uid);
                          if (req) declineFriendRequest(req.id);
                          setViewingProfile(null);
                        }}
                        className="py-3 bg-card hover:bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold rounded-2xl transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        sendFriendRequest(viewingProfile.username);
                        setViewingProfile(null);
                      }}
                      className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Send Friend Request</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewingProfile(null)}
                    className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium rounded-xl hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
