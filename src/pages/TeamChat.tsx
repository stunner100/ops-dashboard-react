import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Header } from '../components/layout';
import { Send, Hash, Lock, Smile, Paperclip, Search, Users, Plus, Loader2, MessageSquare, X, Image, FileText, User, ChevronLeft } from 'lucide-react';
import { useTeamChat, type ChannelMember } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { EmojiPicker } from '../components/EmojiPicker';
import { MentionDropdown } from '../components/MentionDropdown';

export function TeamChat() {
  const {
    channels,
    currentChannel,
    messages,
    channelMembers,
    dmConversations,
    currentDM,
    dmMessages,
    chatMode,
    allProfiles,
    loading,
    error,
    switchChannel,
    sendMessage,
    uploadFile,
    createChannel,
    switchToDM,
    startDMConversation,
    sendDirectMessage,
    loadAllProfiles,
  } = useTeamChat();

  const { user } = useAuth();

  const [messageInput, setMessageInput] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setUploading] = useState(false);
  const [dmSearchQuery, setDMSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current messages based on chat mode
  const currentMessages = chatMode === 'channel' ? messages : dmMessages;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for @ mention (only in channel mode)
    if (chatMode === 'channel') {
      const cursorPos = e.target.selectionStart || 0;
      const textBeforeCursor = value.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);

      if (atMatch) {
        setMentionQuery(atMatch[1]);
        setShowMentionDropdown(true);
        const inputRect = inputRef.current?.getBoundingClientRect();
        if (inputRect) {
          setMentionPosition({ top: inputRect.top, left: 16 });
        }
      } else {
        setShowMentionDropdown(false);
      }
    }
  };

  const handleMentionSelect = (member: ChannelMember) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = messageInput.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const newText = messageInput.slice(0, atIndex) + `@${member.full_name} ` + messageInput.slice(cursorPos);
      setMessageInput(newText);
    }

    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploading(!!selectedFile);

    let attachment = undefined;

    if (selectedFile) {
      const uploaded = await uploadFile(selectedFile);
      if (uploaded) {
        attachment = uploaded;
      }
      setSelectedFile(null);
    }

    if (chatMode === 'channel') {
      await sendMessage(messageInput, attachment);
    } else {
      await sendDirectMessage(messageInput, attachment);
    }

    setMessageInput('');
    setSending(false);
    setUploading(false);
  };

  const handleCreateChannel = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    await createChannel(newChannelName, newChannelTopic || 'New channel');
    setNewChannelName('');
    setNewChannelTopic('');
    setShowNewChannelModal(false);
  };

  const handleStartDM = async (member: ChannelMember) => {
    await startDMConversation(member.user_id);
    setShowNewDMModal(false);
    setDMSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isImageFile = (type?: string) => type?.startsWith('image/');

  // Render message content with highlighted @mentions
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-1 rounded font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Filter members for DM search (exclude current user) - use allProfiles
  const filteredMembers = allProfiles.filter(member =>
    member.user_id !== user?.id && (
      member.full_name.toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(dmSearchQuery.toLowerCase())
    )
  );

  // Get sender name for DM messages
  const getDMSenderName = (msg: typeof dmMessages[0]) => {
    return msg.sender?.full_name || 'Unknown';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header title="Team Chat" />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Channel List - Hidden on mobile when in chat view */}
        <aside className={`
          w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col absolute inset-0 z-20 md:relative transition-transform duration-300
          ${mobileView === 'chat' ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}>
          <div className="p-3">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Find conversation..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
            {/* Channels Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-2 py-2 mb-1 group">
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  Channels
                </h3>
                <button
                  onClick={() => setShowNewChannelModal(true)}
                  className="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
                  title="Create channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading && channels.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                </div>
              ) : channels.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No channels yet.</p>
              ) : (
                <div className="space-y-0.5">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        switchChannel(channel);
                        setMobileView('chat');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2.5 md:py-1.5 rounded-md text-sm transition-all group ${chatMode === 'channel' && currentChannel?.id === channel.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      {channel.is_private ? (
                        <Lock className={`w-3.5 h-3.5 ${chatMode === 'channel' && currentChannel?.id === channel.id ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                      ) : (
                        <Hash className={`w-3.5 h-3.5 ${chatMode === 'channel' && currentChannel?.id === channel.id ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                      )}
                      <span className="truncate">{channel.name}</span>
                      {channel.unreadCount > 0 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 py-2 mb-1">
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Direct Messages
                </h3>
                <button
                  onClick={() => {
                    loadAllProfiles();
                    setShowNewDMModal(true);
                  }}
                  className="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all"
                  title="New direct message"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {dmConversations.length === 0 ? (
                <p className="px-2 text-xs text-slate-400 italic">No recent DMs</p>
              ) : (
                <div className="space-y-0.5">
                  {dmConversations.map((dm) => (
                    <button
                      key={dm.id}
                      onClick={() => {
                        switchToDM(dm);
                        setMobileView('chat');
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 md:py-1.5 rounded-md text-sm transition-all group ${chatMode === 'dm' && currentDM?.id === dm.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {dm.other_user?.avatar_url ? (
                            <img src={dm.other_user.avatar_url} alt={dm.other_user.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(dm.other_user?.full_name || 'U')
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-2 md:h-2 bg-emerald-500 border-2 border-slate-50 dark:border-slate-900 rounded-full"></div>
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="truncate font-medium md:font-normal">{dm.other_user?.full_name || 'Unknown'}</span>
                      </div>
                      {dm.unread_count !== undefined && dm.unread_count > 0 && (
                        <span className="ml-auto w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-primary-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Chat Area - Full screen on mobile when active */}
        <div className={`
          flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 absolute inset-0 md:relative z-10 transition-transform duration-300
          ${mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Chat Header */}
          {(chatMode === 'channel' && currentChannel) || (chatMode === 'dm' && currentDM) ? (
            <>
              <div className="h-14 px-4 md:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 sticky top-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {chatMode === 'channel' ? (
                        <>
                          <Hash className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {currentChannel?.name}
                          </h2>
                          {currentChannel?.topic && (
                            <span className="hidden md:inline text-sm text-slate-400 dark:text-slate-500 truncate border-l border-slate-200 dark:border-slate-700 pl-3 ml-1">
                              {currentChannel.topic}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                            {currentDM?.other_user?.avatar_url ? (
                              <img src={currentDM.other_user.avatar_url} alt={currentDM.other_user.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(currentDM?.other_user?.full_name || 'U')
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                              {currentDM?.other_user?.full_name}
                            </h2>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 leading-tight">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Online
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 pl-2">
                  {chatMode === 'channel' && (
                    <button
                      onClick={() => setShowMembers(!showMembers)}
                      className={`p-1.5 rounded-md transition-all ${showMembers
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <Users className="w-4.5 h-4.5" />
                    </button>
                  )}
                  <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <button className="hidden md:block p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors">
                    <Search className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6 scrollbar-thin">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </div>
                )}

                {loading && currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center pb-20 opacity-0 animate-fade-in delay-100" style={{ animationFillMode: 'forwards' }}>
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-100 dark:ring-slate-700 shadow-sm">
                      {chatMode === 'channel' ? (
                        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                      ) : (
                        <User className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                      {chatMode === 'channel' ? `Welcome to #${currentChannel?.name}!` : `Start a conversation with ${currentDM?.other_user?.full_name}`}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                      {chatMode === 'channel'
                        ? <>This is the start of the <span className="font-semibold text-slate-700 dark:text-slate-300">#{currentChannel?.name}</span> channel. Be the first to say hello!</>
                        : 'Send a message to start the conversation.'}
                    </p>
                  </div>
                ) : chatMode === 'channel' ? (
                  // Channel messages
                  messages.map((message, i) => {
                    const prevMsg = messages[i - 1];
                    const isSequence = prevMsg && prevMsg.sender_name === message.sender_name && (new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);

                    return (
                      <div key={message.id} className={`flex gap-3 md:gap-4 group ${isSequence ? 'mt-1' : 'mt-6'}`}>
                        {!isSequence ? (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs md:text-sm font-bold flex-shrink-0 shadow-sm ring-1 ring-white dark:ring-slate-600 select-none">
                            {getInitials(message.sender_name)}
                          </div>
                        ) : (
                          <div className="w-8 md:w-10 flex-shrink-0 text-right text-[10px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 relative top-1 font-mono hidden md:block">
                            {formatTime(message.created_at).split(' ')[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!isSequence && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer">
                                {message.sender_name}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[15px] break-words">
                            {renderMessageContent(message.content)}
                          </div>
                          {message.attachment_url && (
                            <div className="mt-2">
                              {isImageFile(message.attachment_type) ? (
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  {message.attachment_name}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // DM messages
                  dmMessages.map((message, i) => {
                    const prevMsg = dmMessages[i - 1];
                    const senderName = getDMSenderName(message);
                    const prevSenderName = prevMsg ? getDMSenderName(prevMsg) : '';
                    const isSequence = prevMsg && prevSenderName === senderName && (new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);

                    return (
                      <div key={message.id} className={`flex gap-3 md:gap-4 group ${isSequence ? 'mt-1' : 'mt-6'}`}>
                        {!isSequence ? (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs md:text-sm font-bold flex-shrink-0 shadow-sm ring-1 ring-white dark:ring-slate-600 select-none">
                            {message.sender?.avatar_url ? (
                              <img src={message.sender.avatar_url} alt={senderName} className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              getInitials(senderName)
                            )}
                          </div>
                        ) : (
                          <div className="w-8 md:w-10 flex-shrink-0 text-right text-[10px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 relative top-1 font-mono hidden md:block">
                            {formatTime(message.created_at).split(' ')[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!isSequence && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer">
                                {senderName}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[15px] break-words">
                            {message.content}
                          </div>
                          {message.attachment_url && (
                            <div className="mt-2">
                              {isImageFile(message.attachment_type) ? (
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  {message.attachment_name}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 md:p-4 pt-2">
                {/* Selected file preview */}
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-primary-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary-500" />
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="relative group bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all"
                >
                  {/* Mention dropdown */}
                  {showMentionDropdown && chatMode === 'channel' && (
                    <MentionDropdown
                      members={channelMembers}
                      searchQuery={mentionQuery}
                      onSelect={handleMentionSelect}
                      onClose={() => setShowMentionDropdown(false)}
                      position={mentionPosition}
                    />
                  )}

                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl overflow-x-auto scrollbar-none">
                    <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors">
                      <span className="font-bold font-serif text-sm px-0.5">B</span>
                    </button>
                    <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors">
                      <span className="italic font-serif text-sm px-0.5">I</span>
                    </button>
                    <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors">
                      <span className="line-through font-serif text-sm px-0.5">S</span>
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-end gap-1 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>

                  <div className="flex items-end gap-2 p-2 pb-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder={chatMode === 'channel' ? `Message #${currentChannel?.name}` : `Message ${currentDM?.other_user?.full_name}`}
                      className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-2 px-2 max-h-32 min-w-0"
                      disabled={sending}
                      autoComplete="off"
                    />
                    <div className="flex items-center gap-1 pb-1 relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={handleEmojiSelect}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                      <button
                        type="submit"
                        disabled={(!messageInput.trim() && !selectedFile) || sending}
                        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${(!messageInput.trim() && !selectedFile) || sending
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md'
                          }`}
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-[10px] text-slate-400 text-right mt-1.5 mr-1 font-medium hidden md:block">
                  {chatMode === 'channel' ? <><strong>@</strong> to mention · </> : ''}<strong>Return</strong> to send
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <Hash className="w-8 h-8 text-primary-200 dark:text-primary-800" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Conversation Selected</h3>
              <p className="max-w-xs text-center text-slate-500 dark:text-slate-400">
                Select a channel or start a direct message to begin chatting.
              </p>
            </div>
          )}
        </div>

        {/* Members Panel - Overlay on mobile */}
        {showMembers && chatMode === 'channel' && currentChannel && (
          <aside className={`
            w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col absolute right-0 inset-y-0 z-30 md:relative shadow-xl md:shadow-none animate-slide-in
          `}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Members</h3>
                <p className="text-xs text-slate-500 mt-0.5">{channelMembers.length} members</p>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Members</h4>
                  <ul className="space-y-1">
                    {channelMembers.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                        onClick={() => startDMConversation(member.user_id)}
                      >
                        <div className="relative">
                          <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded object-cover" />
                            ) : (
                              getInitials(member.full_name)
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-200 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                          {member.full_name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-0 overflow-hidden ring-1 ring-white/20 animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Channel</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Channels are where your team communicates.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Hash className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <form onSubmit={handleCreateChannel} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. marketing-updates"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 ml-1">Lowercase, no spaces. Hyphens are cool.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Description <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-6 py-2 text-sm font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-lg shadow-sm hover:shadow-md hover:shadow-primary-500/20 transition-all"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New DM Modal */}
      {showNewDMModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-0 overflow-hidden ring-1 ring-white/20 animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Message</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start a direct conversation with someone.</p>
              </div>
              <button
                onClick={() => {
                  setShowNewDMModal(false);
                  setDMSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={dmSearchQuery}
                  onChange={(e) => setDMSearchQuery(e.target.value)}
                  placeholder="Search for a person..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No users found</p>
                ) : (
                  <ul className="space-y-1">
                    {filteredMembers.map((member) => (
                      <li
                        key={member.id}
                        onClick={() => handleStartDM(member)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(member.full_name)
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{member.full_name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
