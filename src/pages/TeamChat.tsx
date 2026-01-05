import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Header } from '../components/layout';
import { Send, Hash, Lock, Smile, Paperclip, Search, Users, Plus, Loader2, X, Image, FileText, User, ChevronLeft, Trash2 } from 'lucide-react';
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
    deleteChannel,
    switchToDM,
    startDMConversation,
    sendDirectMessage,
    loadAllProfiles,
  } = useTeamChat();

  const { user, isAdmin } = useAuth();

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setUploading] = useState(false);
  const [dmSearchQuery, setDMSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [deleteChannelConfirm, setDeleteChannelConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-black">
      <Header title="Team Chat" />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Channel List - Linear style */}
        <aside className={`
          w-full md:w-64 border-r border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#080808] flex flex-col absolute inset-0 z-20 md:relative transition-transform duration-300
          ${mobileView === 'chat' ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}>
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <div className="relative group">
              <Search strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-md text-[13px] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
            {/* Channels Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1 group">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                  Channels
                </h3>
                <button
                  onClick={() => setShowNewChannelModal(true)}
                  className="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Create channel"
                >
                  <Plus strokeWidth={1.5} className="w-3.5 h-3.5" />
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
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all group ${chatMode === 'channel' && currentChannel?.id === channel.id
                        ? 'bg-primary-500/5 dark:bg-primary-500/10 text-primary-500 font-semibold'
                        : 'text-slate-600 dark:text-[#999999] hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      {channel.is_private ? (
                        <Lock strokeWidth={1.5} className={`w-3.5 h-3.5 ${chatMode === 'channel' && currentChannel?.id === channel.id ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                      ) : (
                        <Hash strokeWidth={1.5} className={`w-3.5 h-3.5 ${chatMode === 'channel' && currentChannel?.id === channel.id ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                      )}
                      <span className="truncate">{channel.name}</span>
                      {channel.unreadCount > 0 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1 group">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                  Direct Messages
                </h3>
                <button
                  onClick={() => {
                    loadAllProfiles();
                    setShowNewDMModal(true);
                  }}
                  className="p-1 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-all opacity-0 group-hover:opacity-100"
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
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all group ${chatMode === 'dm' && currentDM?.id === dm.id
                        ? 'bg-primary-500/5 dark:bg-primary-500/10 text-primary-500 font-semibold'
                        : 'text-slate-600 dark:text-[#999999] hover:bg-slate-100/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-400 shadow-sm overflow-hidden flex-shrink-0">
                          {dm.other_user?.avatar_url ? (
                            <img src={dm.other_user.avatar_url} alt={dm.other_user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(dm.other_user?.full_name || 'U')
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-[#080808] rounded-full"></div>
                      </div>
                      <span className="truncate">{dm.other_user?.full_name || 'Unknown'}</span>
                      {dm.unread_count !== undefined && dm.unread_count > 0 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
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
          flex-1 flex flex-col bg-white dark:bg-[#000000] min-w-0 absolute inset-0 md:relative z-10 transition-transform duration-300
          ${mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Chat Header - Linear style */}
          {(chatMode === 'channel' && currentChannel) || (chatMode === 'dm' && currentDM) ? (
            <>
              <div className="h-13 px-4 md:px-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    {chatMode === 'channel' ? (
                      <>
                        <Hash strokeWidth={1.5} className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <h2 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                          {currentChannel?.name}
                        </h2>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 overflow-hidden shadow-sm">
                          {currentDM?.other_user?.avatar_url ? (
                            <img src={currentDM.other_user.avatar_url} alt={currentDM.other_user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(currentDM?.other_user?.full_name || 'U')
                          )}
                        </div>
                        <h2 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                          {currentDM?.other_user?.full_name}
                        </h2>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {chatMode === 'channel' && (
                    <>
                      <button
                        onClick={() => setShowMembers(!showMembers)}
                        className={`p-1.5 rounded-md transition-all ${showMembers
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white'
                          : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        title="Show members"
                      >
                        <Users strokeWidth={1.5} className="w-4 h-4" />
                      </button>
                      {isAdmin && currentChannel && (
                        <button
                          onClick={() => setDeleteChannelConfirm(currentChannel.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors"
                          title="Delete channel"
                        >
                          <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-1" />
                  <button className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors">
                    <Search strokeWidth={1.5} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages - Linear style */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6 scrollbar-thin">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                  </div>
                )}

                {loading && currentMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center pb-20 animate-fade-in">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-white/5">
                      {chatMode === 'channel' ? (
                        <Hash className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      ) : (
                        <User className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {chatMode === 'channel' ? `Welcome to #${currentChannel?.name}` : `Message ${currentDM?.other_user?.full_name}`}
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-500 max-w-[280px]">
                      {chatMode === 'channel'
                        ? `This is the beginning of the #${currentChannel?.name} channel.`
                        : 'Send a message to start this conversation.'}
                    </p>
                  </div>
                ) : chatMode === 'channel' ? (
                  // Channel messages
                  messages.map((message, i) => {
                    const prevMsg = messages[i - 1];
                    const isSequence = prevMsg && prevMsg.sender_name === message.sender_name && (new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000);

                    return (
                      <div key={message.id} className={`flex gap-3.5 group ${isSequence ? 'mt-1' : 'mt-6'}`}>
                        {!isSequence ? (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[11px] font-bold flex-shrink-0 shadow-sm overflow-hidden select-none">
                            {getInitials(message.sender_name)}
                          </div>
                        ) : (
                          <div className="w-9 flex-shrink-0 text-right text-[9px] text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 relative top-1 font-semibold hidden md:block">
                            {formatTime(message.created_at).split(' ')[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!isSequence && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-bold text-[13px] text-slate-900 dark:text-[#EEEEEE] hover:text-primary-500 cursor-pointer transition-colors">
                                {message.sender_name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="text-slate-700 dark:text-[#CCCCCC] leading-relaxed text-[14px] font-medium break-words">
                            {renderMessageContent(message.content)}
                          </div>
                          {message.attachment_url && (
                            <div className="mt-2.5">
                              {isImageFile(message.attachment_type) ? (
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="max-w-sm rounded-lg border border-slate-200/60 dark:border-white/5 cursor-pointer hover:opacity-95 transition-all shadow-sm"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-white/5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
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
                      <div key={message.id} className={`flex gap-3.5 group ${isSequence ? 'mt-1' : 'mt-6'}`}>
                        {!isSequence ? (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[11px] font-bold flex-shrink-0 shadow-sm overflow-hidden select-none">
                            {message.sender?.avatar_url ? (
                              <img src={message.sender.avatar_url} alt={senderName} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(senderName)
                            )}
                          </div>
                        ) : (
                          <div className="w-9 flex-shrink-0 text-right text-[9px] text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 relative top-1 font-semibold hidden md:block">
                            {formatTime(message.created_at).split(' ')[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {!isSequence && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-bold text-[13px] text-slate-900 dark:text-[#EEEEEE] hover:text-primary-500 cursor-pointer transition-colors">
                                {senderName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="text-slate-700 dark:text-[#CCCCCC] leading-relaxed text-[14px] font-medium break-words">
                            {message.content}
                          </div>
                          {message.attachment_url && (
                            <div className="mt-2.5">
                              {isImageFile(message.attachment_type) ? (
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="max-w-sm rounded-lg border border-slate-200/60 dark:border-white/5 cursor-pointer hover:opacity-95 transition-all shadow-sm"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-white/5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
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

              {/* Message Input - Linear style */}
              <div className="p-4 md:p-6 pt-2">
                {/* Selected file preview */}
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image strokeWidth={1.5} className="w-3.5 h-3.5 text-primary-500" />
                    ) : (
                      <FileText strokeWidth={1.5} className="w-3.5 h-3.5 text-primary-500" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate flex-1">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Mention dropdown - positioned above the form */}
                {showMentionDropdown && chatMode === 'channel' && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 px-4 z-50">
                    <MentionDropdown
                      members={channelMembers}
                      searchQuery={mentionQuery}
                      onSelect={handleMentionSelect}
                      onClose={() => setShowMentionDropdown(false)}
                    />
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="relative group bg-white dark:bg-[#080808] border border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm focus-within:border-primary-500/50 transition-all"
                >

                  {/* Toolbar - Slimmer */}
                  <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <button type="button" className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 rounded transition-colors">
                      <span className="font-bold text-[10px] px-1">B</span>
                    </button>
                    <button type="button" className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 rounded transition-colors">
                      <span className="italic text-[10px] px-1">I</span>
                    </button>
                    <div className="w-px h-3 bg-slate-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 rounded transition-colors"
                    >
                      <Paperclip strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>

                  <div className="flex items-end gap-2 p-1.5 px-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      placeholder={chatMode === 'channel' ? `Message #${currentChannel?.name}` : `Message ${currentDM?.other_user?.full_name}`}
                      className="flex-1 bg-transparent border-0 text-[14px] font-medium text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none py-2 px-1"
                      disabled={sending}
                      autoComplete="off"
                    />
                    <div className="flex items-center gap-1.5 pb-1 relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <Smile strokeWidth={1.5} className="w-4.5 h-4.5" />
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
                        className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${(!messageInput.trim() && !selectedFile) || sending
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                          : 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
                          }`}
                      >
                        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send strokeWidth={1.5} className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-right mt-2 mr-1 uppercase tracking-wider hidden md:block">
                  {chatMode === 'channel' ? <>@ mention · </> : ''}Return to send
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#000000] text-center px-6">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-sm">
                <Hash className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No conversation selected</h3>
              <p className="max-w-[280px] text-[13px] text-slate-500 dark:text-slate-500 leading-relaxed font-medium">
                Select a channel from the list or start a new direct message to begin chatting with your team.
              </p>
              <button
                onClick={() => setMobileView('list')}
                className="mt-6 md:hidden px-4 py-2 bg-primary-500 text-white text-sm font-bold rounded-lg shadow-sm"
              >
                View Channels
              </button>
            </div>
          )}
        </div>

        {/* Members Panel - Linear style */}
        {showMembers && chatMode === 'channel' && currentChannel && (
          <>
            {/* Backdrop for mobile members panel */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setShowMembers(false)}
            />
            <aside className="w-full max-w-[280px] border-l border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#080808] h-full flex flex-col absolute right-0 inset-y-0 z-40 md:relative shadow-xl md:shadow-none animate-slide-in">
              <div className="h-13 px-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Members</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">{channelMembers.length} active</p>
                </div>
                <button
                  onClick={() => setShowMembers(false)}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 py-4 scrollbar-thin">
                <div className="px-3 mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-2">Team Members</h4>
                  <div className="space-y-0.5">
                    {channelMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => startDMConversation(member.user_id)}
                        className="w-full flex items-center gap-2.5 py-1.5 px-2.5 rounded-md hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all group group"
                      >
                        <div className="relative">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-400 overflow-hidden shadow-sm">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(member.full_name)
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-[#080808] rounded-full"></div>
                        </div>
                        <span className="text-[13px] font-medium text-slate-600 dark:text-[#999999] group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                          {member.full_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* New Channel Modal - Linear style */}
      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#111111] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200/60 dark:border-white/10 animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New channel</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Channels are where your team communicates.</p>
              </div>
              <button
                onClick={() => setShowNewChannelModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                  Channel Name
                </label>
                <div className="relative group">
                  <Hash strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. engineering"
                    className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannelTopic}
                  onChange={(e) => setNewChannelTopic(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full px-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChannelModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-5 py-2 text-sm font-bold bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New DM Modal - Linear style */}
      {showNewDMModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#111111] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200/60 dark:border-white/10 animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New message</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Start a direct conversation with someone.</p>
              </div>
              <button
                onClick={() => {
                  setShowNewDMModal(false);
                  setDMSearchQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4 group">
                <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={dmSearchQuery}
                  onChange={(e) => setDMSearchQuery(e.target.value)}
                  placeholder="Search for a person..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-10 h-10 text-slate-200 dark:text-white/10 mx-auto mb-3" />
                    <p className="text-[13px] font-medium text-slate-500">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleStartDM(member)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all group text-left"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 overflow-hidden shadow-sm">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(member.full_name)
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#111111] rounded-full"></div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 dark:text-white">{member.full_name}</p>
                          <p className="text-[12px] font-medium text-slate-500 truncate">{member.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal */}
      {deleteChannelConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 ring-1 ring-white/20 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              Delete Channel
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">#{currentChannel?.name}</strong>? All messages will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteChannelConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteChannelConfirm) return;
                  setDeleting(true);
                  await deleteChannel(deleteChannelConfirm);
                  setDeleting(false);
                  setDeleteChannelConfirm(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
