import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Channel {
    id: string;
    name: string;
    topic: string;
    is_private: boolean;
    created_at: string;
}

interface Message {
    id: string;
    channel_id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    content: string;
    created_at: string;
    mentions?: string[];
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
}

interface ChannelMember {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
}

interface ChannelWithUnread extends Channel {
    unreadCount: number;
}

interface DMConversation {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message_at: string;
    created_at: string;
    other_user?: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
    };
    unread_count?: number;
}

interface DirectMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url?: string;
    };
}

export function useTeamChat() {
    const { user, profile } = useAuth();
    const [channels, setChannels] = useState<ChannelWithUnread[]>([]);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // DM State
    const [dmConversations, setDMConversations] = useState<DMConversation[]>([]);
    const [currentDM, setCurrentDM] = useState<DMConversation | null>(null);
    const [dmMessages, setDMMessages] = useState<DirectMessage[]>([]);
    const [chatMode, setChatMode] = useState<'channel' | 'dm'>('channel');
    const [allProfiles, setAllProfiles] = useState<ChannelMember[]>([]);

    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
    const dmRealtimeRef = useRef<RealtimeChannel | null>(null);
    const lastReadRef = useRef<Record<string, string>>({});

    /**
     * Load all channels
     */
    const loadChannels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('chat_channels')
                .select('*')
                .order('name');

            if (queryError) throw queryError;

            const channelsWithUnread: ChannelWithUnread[] = (data || []).map(ch => ({
                ...ch,
                unreadCount: 0,
            }));

            setChannels(channelsWithUnread);

            if (!currentChannel && !currentDM && channelsWithUnread.length > 0) {
                setCurrentChannel(channelsWithUnread[0]);
                setChatMode('channel');
            }

            return channelsWithUnread;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load channels';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentChannel, currentDM]);

    /**
     * Load messages for current channel
     */
    const loadMessages = useCallback(async (channelId?: string) => {
        const targetChannelId = channelId || currentChannel?.id;
        if (!targetChannelId) return [];

        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('channel_id', targetChannelId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (queryError) throw queryError;

            const msgs = data || [];
            setMessages(msgs);

            if (msgs.length > 0) {
                lastReadRef.current[targetChannelId] = msgs[msgs.length - 1].created_at;
            }

            return msgs;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load messages';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentChannel?.id]);

    /**
     * Load channel members for @mentions
     */
    const loadChannelMembers = useCallback(async () => {
        try {
            // Get all users from profiles table as potential members
            const { data, error: queryError } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .order('full_name');

            if (queryError) throw queryError;

            const members: ChannelMember[] = (data || []).map(p => ({
                id: p.id,
                user_id: p.id,
                full_name: p.full_name || p.email?.split('@')[0] || 'Anonymous',
                email: p.email || '',
                avatar_url: p.avatar_url,
            }));

            setChannelMembers(members);
            return members;
        } catch (err) {
            console.error('Failed to load channel members:', err);
            return [];
        }
    }, []);

    /**
     * Load DM conversations for current user
     */
    const loadDMConversations = useCallback(async () => {
        if (!user) return [];

        try {
            const { data, error: queryError } = await supabase
                .from('dm_conversations')
                .select(`
                    *,
                    user1:profiles!dm_conversations_user1_id_fkey(id, full_name, email, avatar_url),
                    user2:profiles!dm_conversations_user2_id_fkey(id, full_name, email, avatar_url)
                `)
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (queryError) throw queryError;

            // Map to include the "other" user info
            const conversations: DMConversation[] = (data || []).map(conv => {
                const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
                return {
                    ...conv,
                    other_user: otherUser,
                    unread_count: 0, // TODO: Calculate unread count
                };
            });

            setDMConversations(conversations);
            return conversations;
        } catch (err) {
            console.error('Failed to load DM conversations:', err);
            return [];
        }
    }, [user]);

    /**
     * Load all profiles for DM modal (not just channel members)
     */
    const loadAllProfiles = useCallback(async (): Promise<ChannelMember[]> => {
        try {
            const { data, error: queryError } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url, role')
                .order('full_name');

            if (queryError) throw queryError;

            const profiles: ChannelMember[] = (data || []).map(p => ({
                id: p.id,
                user_id: p.id,
                full_name: p.full_name || 'Unknown',
                email: p.email || '',
                avatar_url: p.avatar_url,
                role: p.role,
            }));

            setAllProfiles(profiles);
            return profiles;
        } catch (err) {
            console.error('Failed to load profiles:', err);
            return [];
        }
    }, []);

    /**
     * Load messages for a DM conversation
     */
    const loadDMMessages = useCallback(async (conversationId?: string) => {
        const targetId = conversationId || currentDM?.id;
        if (!targetId) return [];

        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)
                `)
                .eq('conversation_id', targetId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (queryError) throw queryError;

            setDMMessages(data || []);
            return data || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load messages';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentDM?.id]);

    /**
     * Start or open a DM conversation with a user
     */
    const startDMConversation = useCallback(async (otherUserId: string): Promise<DMConversation | null> => {
        if (!user) {
            console.error('Cannot start DM: No user logged in');
            return null;
        }
        if (otherUserId === user.id) {
            console.error('Cannot start DM: Cannot message yourself');
            setError('You cannot send a message to yourself');
            return null;
        }

        try {
            // Use the database function to get or create conversation
            const { data, error: rpcError } = await supabase
                .rpc('get_or_create_dm_conversation', { other_user_id: otherUserId });

            if (rpcError) throw rpcError;

            const conversationId = data;

            // Fetch the full conversation details
            const { data: convData, error: fetchError } = await supabase
                .from('dm_conversations')
                .select(`
                    *,
                    user1:profiles!dm_conversations_user1_id_fkey(id, full_name, email, avatar_url),
                    user2:profiles!dm_conversations_user2_id_fkey(id, full_name, email, avatar_url)
                `)
                .eq('id', conversationId)
                .single();

            if (fetchError) throw fetchError;

            const otherUser = convData.user1_id === user.id ? convData.user2 : convData.user1;
            const conversation: DMConversation = {
                ...convData,
                other_user: otherUser,
            };

            // Update conversations list
            await loadDMConversations();

            // Switch to this DM
            setCurrentDM(conversation);
            setCurrentChannel(null);
            setChatMode('dm');
            await loadDMMessages(conversationId);

            return conversation;
        } catch (err) {
            console.error('Failed to start DM conversation:', err);
            setError('Failed to start conversation');
            return null;
        }
    }, [user, loadDMConversations, loadDMMessages]);

    /**
     * Switch to a DM conversation
     */
    const switchToDM = useCallback(async (conversation: DMConversation) => {
        setCurrentDM(conversation);
        setCurrentChannel(null);
        setChatMode('dm');
        await loadDMMessages(conversation.id);
    }, [loadDMMessages]);

    /**
     * Switch to a channel
     */
    const switchChannel = useCallback(async (channel: Channel) => {
        setCurrentChannel(channel);
        setCurrentDM(null);
        setChatMode('channel');
        await loadMessages(channel.id);
    }, [loadMessages]);

    /**
     * Extract @mentions from message content
     */
    const extractMentions = useCallback((content: string): string[] => {
        const mentionRegex = /@(\w+(?:\s\w+)?)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedName = match[1].toLowerCase();
            const member = channelMembers.find(m =>
                m.full_name.toLowerCase().includes(mentionedName) ||
                m.email.toLowerCase().split('@')[0] === mentionedName
            );
            if (member) {
                mentions.push(member.user_id);
            }
        }

        return [...new Set(mentions)];
    }, [channelMembers]);

    /**
     * Send a message to the current channel
     */
    const sendMessage = useCallback(async (
        content: string,
        attachment?: { url: string; name: string; type: string }
    ): Promise<Message | null> => {
        if (!currentChannel || !user || (!content.trim() && !attachment)) return null;

        setError(null);
        try {
            const mentions = extractMentions(content);

            const newMessage: Record<string, unknown> = {
                channel_id: currentChannel.id,
                sender_id: user.id,
                sender_name: profile?.full_name || user.email || 'Anonymous',
                sender_avatar: null,
                content: content.trim(),
                mentions: mentions.length > 0 ? mentions : null,
            };

            if (attachment) {
                newMessage.attachment_url = attachment.url;
                newMessage.attachment_name = attachment.name;
                newMessage.attachment_type = attachment.type;
            }

            const { data, error: insertError } = await supabase
                .from('chat_messages')
                .insert(newMessage)
                .select()
                .single();

            if (insertError) throw insertError;

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send message';
            setError(message);
            return null;
        }
    }, [currentChannel, user, profile, extractMentions]);

    /**
     * Send a direct message
     */
    const sendDirectMessage = useCallback(async (
        content: string,
        attachment?: { url: string; name: string; type: string }
    ): Promise<DirectMessage | null> => {
        if (!currentDM || !user || (!content.trim() && !attachment)) return null;

        setError(null);
        try {
            const newMessage: Record<string, unknown> = {
                conversation_id: currentDM.id,
                sender_id: user.id,
                content: content.trim(),
            };

            if (attachment) {
                newMessage.attachment_url = attachment.url;
                newMessage.attachment_name = attachment.name;
                newMessage.attachment_type = attachment.type;
            }

            const { data, error: insertError } = await supabase
                .from('direct_messages')
                .insert(newMessage)
                .select(`
                    *,
                    sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)
                `)
                .single();

            if (insertError) throw insertError;

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send message';
            setError(message);
            return null;
        }
    }, [currentDM, user]);

    /**
     * Upload a file to Supabase Storage
     */
    const uploadFile = useCallback(async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
        if (!user) return null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `chat-files/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

            return {
                url: urlData.publicUrl,
                name: file.name,
                type: file.type,
            };
        } catch (err) {
            console.error('File upload failed:', err);
            setError('Failed to upload file');
            return null;
        }
    }, [user]);

    /**
     * Create a new channel
     */
    const createChannel = useCallback(async (
        name: string,
        topic: string,
        isPrivate = false
    ): Promise<Channel | null> => {
        setError(null);
        try {
            const { data, error: insertError } = await supabase
                .from('chat_channels')
                .insert({
                    name: name.toLowerCase().replace(/\s+/g, '-'),
                    topic,
                    is_private: isPrivate,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await loadChannels();

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create channel';
            setError(message);
            return null;
        }
    }, [loadChannels]);

    /**
     * Subscribe to real-time updates for channel messages
     */
    const subscribeToMessages = useCallback(() => {
        if (!currentChannel) return;

        if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
        }

        realtimeChannelRef.current = supabase
            .channel(`messages:${currentChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `channel_id=eq.${currentChannel.id}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();
    }, [currentChannel]);

    /**
     * Subscribe to real-time updates for DM messages
     */
    const subscribeToDMMessages = useCallback(() => {
        if (!currentDM) return;

        if (dmRealtimeRef.current) {
            supabase.removeChannel(dmRealtimeRef.current);
        }

        dmRealtimeRef.current = supabase
            .channel(`dm:${currentDM.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${currentDM.id}`,
                },
                async (payload) => {
                    // Fetch the complete message with sender info
                    const { data } = await supabase
                        .from('direct_messages')
                        .select(`
                            *,
                            sender:profiles!direct_messages_sender_id_fkey(full_name, avatar_url)
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setDMMessages(prev => {
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    }
                }
            )
            .subscribe();
    }, [currentDM]);

    // Load channels, members, and DMs on mount
    useEffect(() => {
        loadChannels();
        loadChannelMembers();
        loadDMConversations();
    }, [loadChannels, loadChannelMembers, loadDMConversations]);

    // Load messages and subscribe when channel changes
    useEffect(() => {
        if (chatMode === 'channel' && currentChannel) {
            loadMessages();
            subscribeToMessages();
        }

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
            }
        };
    }, [currentChannel, chatMode, loadMessages, subscribeToMessages]);

    // Load DM messages and subscribe when DM changes
    useEffect(() => {
        if (chatMode === 'dm' && currentDM) {
            loadDMMessages();
            subscribeToDMMessages();
        }

        return () => {
            if (dmRealtimeRef.current) {
                supabase.removeChannel(dmRealtimeRef.current);
            }
        };
    }, [currentDM, chatMode, loadDMMessages, subscribeToDMMessages]);

    /**
     * Delete a channel (admin only)
     */
    const deleteChannel = useCallback(async (channelId: string): Promise<boolean> => {
        setError(null);
        try {
            // First delete all messages in the channel
            const { error: messagesError } = await supabase
                .from('chat_messages')
                .delete()
                .eq('channel_id', channelId);

            if (messagesError) {
                console.error('Error deleting messages:', messagesError);
                // Continue anyway to try to delete the channel
            }

            // Delete the channel
            const { error: deleteError } = await supabase
                .from('chat_channels')
                .delete()
                .eq('id', channelId);

            if (deleteError) throw deleteError;

            // If deleted channel was the current channel, switch to another
            if (currentChannel?.id === channelId) {
                const remainingChannels = channels.filter(c => c.id !== channelId);
                if (remainingChannels.length > 0) {
                    setCurrentChannel(remainingChannels[0]);
                    await loadMessages(remainingChannels[0].id);
                } else {
                    setCurrentChannel(null);
                    setMessages([]);
                }
            }

            // Reload channels list
            await loadChannels();

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete channel';
            setError(message);
            return false;
        }
    }, [currentChannel, channels, loadChannels, loadMessages]);

    return {
        // Channel state
        channels,
        currentChannel,
        messages,
        channelMembers,

        // DM state
        dmConversations,
        currentDM,
        dmMessages,
        chatMode,
        allProfiles,

        // Common state
        loading,
        error,

        // Channel actions
        loadChannels,
        loadMessages,
        loadChannelMembers,
        switchChannel,
        sendMessage,
        uploadFile,
        createChannel,
        deleteChannel,

        // DM actions
        loadDMConversations,
        loadDMMessages,
        loadAllProfiles,
        startDMConversation,
        switchToDM,
        sendDirectMessage,
    };
}

export type { Channel, Message, ChannelWithUnread, ChannelMember, DMConversation, DirectMessage };
