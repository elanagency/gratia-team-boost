import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Cake, PartyPopper, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { useOptimisticAuth } from "@/hooks/useOptimisticAuth";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

type PointTransaction = {
  id: string;
  sender_id: string;
  recipient_id: string;
  points: number;
  description: string;
  structured_message?: string;
  gif_url?: string;
  created_at: string;
  sender_name: string;
  recipient_name: string;
  sender_avatar_url?: string;
  company_value_id?: string;
  company_value_name?: string;
  company_value_color?: string;
};

type ThreadedRecognition = {
  mainPost: PointTransaction;
  comments: PointTransaction[];
  lastActivity: string;
};

const quickPoints = [5, 10, 25];
const MOCK_REACTIONS = [
  { emoji: '🎉', count: 12 },
  { emoji: '💚', count: 8 },
  { emoji: '🔥', count: 5 },
];

export function RecognitionFeed() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [threadedRecognitions, setThreadedRecognitions] = useState<ThreadedRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');
  const [processingQuickPoints, setProcessingQuickPoints] = useState<Set<string>>(new Set());
  
  const { user, companyId, isLoading: isAuthLoading } = useAuth();
  const optimisticAuth = useOptimisticAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[RecognitionFeed] useEffect triggered - isAuthLoading:', isAuthLoading, 'companyId:', companyId, 'user?.id:', user?.id);
    
    // Wait for auth to finish loading before taking any action
    if (isAuthLoading) {
      console.log('[RecognitionFeed] Auth still loading, waiting...');
      return;
    }

    // Auth is ready, now check if we have the data we need
    if (companyId && user?.id) {
      console.log('[RecognitionFeed] Auth ready with data, calling fetchRecognitionFeed');
      fetchRecognitionFeed();
    } else {
      console.log('[RecognitionFeed] Auth ready but missing companyId or user.id, stopping loading');
      setIsLoading(false);
    }
  }, [companyId, user?.id, isAuthLoading]);


  // Remove fetchUserPoints function as we now use optimisticAuth

  const fetchRecognitionFeed = async () => {
    console.log('[RecognitionFeed] fetchRecognitionFeed called with companyId:', companyId);
    if (!companyId) {
      console.log('[RecognitionFeed] No companyId, returning early');
      return;
    }
    
    try {
      console.log('[RecognitionFeed] Setting loading to true');
      setIsLoading(true);
      
      // Fetch recent point transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*, company_values:company_value_id(name, color)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (transactionsError) throw transactionsError;
      
      if (!transactionsData?.length) {
        setTransactions([]);
        setThreadedRecognitions([]);
        return;
      }

      // Filter out system/cron job transactions, redemptions, and self-transactions
      // but allow celebration rewards through
      const celebrationPatterns = [/^🎂/, /^🎉/];
      const filteredTransactions = transactionsData.filter(transaction => {
        const isCelebration = celebrationPatterns.some(p => p.test(transaction.description));
        
        // 1. Exclude self-transactions (redemptions, refunds, etc.) but allow celebrations
        if (transaction.sender_profile_id === transaction.recipient_profile_id && !isCelebration) {
          return false;
        }
        
        // 2. Exclude negative or zero point transactions (redemptions deduct points)
        if (transaction.points <= 0) {
          return false;
        }
        
        // 3. Exclude system/automated transactions by description pattern
        const systemDescriptionPatterns = [
          /monthly allocation/i,
          /system grant/i,
          /platform admin granted/i,
          /automated allocation/i,
          /scheduled points/i,
          /redeemed/i  // Catch any redemption-related transactions
        ];
        
        const isSystemTransaction = systemDescriptionPatterns.some(pattern => 
          pattern.test(transaction.description)
        );
        
        return !isSystemTransaction;
      });

      if (!filteredTransactions?.length) {
        setTransactions([]);
        setThreadedRecognitions([]);
        return;
      }
      
      // Get unique user IDs from filtered transactions
      const userIds = [...new Set([
        ...filteredTransactions.map(t => t.sender_profile_id),
        ...filteredTransactions.map(t => t.recipient_profile_id)
      ])];
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create profile map
      const profileMap = new Map<string, { name: string; avatar_url: string | null }>();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, {
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
          avatar_url: profile.avatar_url
        });
      });
      
      // Format transactions
      const formattedTransactions: PointTransaction[] = filteredTransactions.map(transaction => {
        const valueData = (transaction as any).company_values;
        return {
          id: transaction.id,
          sender_id: transaction.sender_profile_id,
          recipient_id: transaction.recipient_profile_id,
          points: transaction.points,
          description: transaction.description,
          structured_message: transaction.structured_message,
          gif_url: (transaction as any).gif_url || undefined,
          created_at: transaction.created_at,
          sender_name: profileMap.get(transaction.sender_profile_id)?.name || 'Unknown User',
          recipient_name: profileMap.get(transaction.recipient_profile_id)?.name || 'Unknown User',
          sender_avatar_url: profileMap.get(transaction.sender_profile_id)?.avatar_url || undefined,
          company_value_id: (transaction as any).company_value_id || undefined,
          company_value_name: valueData?.name || undefined,
          company_value_color: valueData?.color || undefined,
        };
      });
      
      setTransactions(formattedTransactions);
      
      // Group transactions into threaded recognitions
      const threaded = groupTransactionsIntoThreads(formattedTransactions);
      setThreadedRecognitions(threaded);
      
    } catch (error) {
      console.error("Error fetching recognition feed:", error);
      toast.error("Failed to load recognition feed");
    } finally {
      console.log('[RecognitionFeed] Setting loading to false');
      setIsLoading(false);
    }
  };

  const groupTransactionsIntoThreads = (transactions: PointTransaction[]): ThreadedRecognition[] => {
    const threads = new Map<string, ThreadedRecognition>();
    
    // Separate main posts from comments
    const mainPosts: PointTransaction[] = [];
    const comments: PointTransaction[] = [];
    
    transactions.forEach(transaction => {
      if (transaction.description.startsWith('Quick appreciation: ')) {
        comments.push(transaction);
      } else {
        mainPosts.push(transaction);
      }
    });
    
    // Celebration posts should never be grouped as comments
    // They are always standalone main posts (already handled above since they don't start with 'Quick appreciation: ')
    
    // Create threads for main posts
    mainPosts.forEach(post => {
      const threadKey = `${post.recipient_id}-${post.id}`;
      threads.set(threadKey, {
        mainPost: post,
        comments: [],
        lastActivity: post.created_at
      });
    });
    
    // Add comments to their respective threads using a more flexible matching approach
    comments.forEach(comment => {
      const originalDescription = comment.description.replace('Quick appreciation: ', '').trim();
      
      // Find the best matching thread for this comment
      // Look for threads with the same recipient and check if the comment text appears in the main post
      let bestMatch: ThreadedRecognition | null = null;
      let bestMatchScore = 0;
      
      for (const thread of threads.values()) {
        if (thread.mainPost.recipient_id === comment.recipient_id) {
          // Parse the main post description to extract the clean text
          const mainPostParsed = parseStructuredMessage(thread.mainPost);
          const mainPostCleanText = mainPostParsed.cleanText.toLowerCase().trim();
          const commentText = originalDescription.toLowerCase().trim();
          
          // Check for exact match or if comment text is contained in main post text
          let score = 0;
          if (mainPostCleanText === commentText) {
            score = 100; // Exact match
          } else if (mainPostCleanText.includes(commentText) || commentText.includes(mainPostCleanText)) {
            score = 50; // Partial match
          } else if (Math.abs(new Date(thread.mainPost.created_at).getTime() - new Date(comment.created_at).getTime()) < 300000) {
            // If created within 5 minutes, consider it a potential match
            score = 10;
          }
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = thread;
          }
        }
      }
      
      // If we found a good match, add the comment to that thread
      if (bestMatch && bestMatchScore >= 10) {
        bestMatch.comments.push(comment);
        // Update last activity if this comment is newer
        if (new Date(comment.created_at) > new Date(bestMatch.lastActivity)) {
          bestMatch.lastActivity = comment.created_at;
        }
      }
    });
    
    const result = Array.from(threads.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
    
    return result;
  };

  const { mutate: giveQuickPoints } = useOptimisticMutation({
    mutationFn: async (variables: { recipientId: string; points: number; originalDescription: string }) => {
      const { data, error } = await supabase.rpc('transfer_points_between_users', {
        sender_user_id: user!.id,
        recipient_user_id: variables.recipientId,
        transfer_company_id: companyId!,
        points_amount: variables.points,
        transfer_description: `Quick appreciation: ${variables.originalDescription}`
      });

      if (error) throw error;
      return data;
    },
    onOptimisticUpdate: (variables) => {
      // Immediately update UI: decrease sender's monthly points
      optimisticAuth.updateOptimisticPoints(-variables.points);
      // Add processing state for this specific recognition
      setProcessingQuickPoints(prev => new Set(prev).add(variables.recipientId));
    },
    onRollback: (variables) => {
      // Rollback the optimistic update
      optimisticAuth.rollbackOptimisticPoints();
      setProcessingQuickPoints(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.recipientId);
        return newSet;
      });
    },
    onSuccess: (data, variables) => {
      const result = data as { success: boolean; error?: string; message?: string };
      if (result?.success) {
        // Confirm optimistic changes and refresh data
        optimisticAuth.confirmOptimisticPoints();
        
        // Invalidate all relevant queries for real-time updates
        queryClient.invalidateQueries({ queryKey: ['recognitionFeed'] });
        queryClient.invalidateQueries({ queryKey: ['userPoints'] });
        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
        queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
        
        // Also refresh the local feed
        fetchRecognitionFeed();
        
        setProcessingQuickPoints(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.recipientId);
          return newSet;
        });
      } else {
        throw new Error(result?.error || "Failed to give points");
      }
    },
    successMessage: `Gave additional points!`,
    errorMessage: "Failed to give points. Please try again."
  });

  const handleQuickPoints = (recipientId: string, points: number, originalDescription: string) => {
    if (!user || !companyId) return;
    
    // Check if user has enough points
    if ((optimisticAuth.monthlyPoints || 0) < points) {
      return;
    }

    giveQuickPoints({ recipientId, points, originalDescription });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const parseStructuredMessage = (transaction: PointTransaction, filterRecipient = false) => {
    // Use structured_message if available, fallback to description
    const messageContent = transaction.structured_message || transaction.description;
    
    if (!messageContent) return { hashtags: [], cleanText: "", mentions: [], points: [] };
    
    // If it's HTML (structured message), parse it properly
    if (messageContent.includes('<')) {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = messageContent;
      
      // Extract mentions from mention bubbles
      const mentionElements = tempDiv.querySelectorAll('.mention-balloon, [data-mention="true"]');
      const mentions = Array.from(mentionElements).map(el => el.textContent || '').filter(Boolean);
      
      // Extract points from point bubbles
      const pointElements = tempDiv.querySelectorAll('.point-balloon, [data-points="true"]');
      const points = Array.from(pointElements).map(el => el.textContent || '').filter(Boolean);
      
      // Remove mention and point balloon elements before extracting clean text
      const balloonElements = tempDiv.querySelectorAll('.mention-balloon, [data-mention="true"], .point-balloon, [data-points="true"]');
      balloonElements.forEach(el => el.remove());
      
      // Get clean text by removing HTML but keeping the content
      const cleanText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Extract hashtags (simple regex for #word)
      const hashtagMatches = cleanText.match(/#\w+/g) || [];
      const hashtags = hashtagMatches.map(tag => tag.substring(1));
      
      return {
        hashtags,
        cleanText: cleanText.trim(),
        mentions,
        points
      };
    } else {
      // For plain text messages (backward compatibility)
      const cleanText = messageContent.trim();
      
      // Extract mentions (@username)
      const mentionMatches = cleanText.match(/@\w+/g) || [];
      const mentions = mentionMatches.map(mention => mention.substring(1));
      
      // Extract hashtags (#hashtag)
      const hashtagMatches = cleanText.match(/#\w+/g) || [];
      const hashtags = hashtagMatches.map(tag => tag.substring(1));
      
      // Extract points (+number)
      const pointMatches = cleanText.match(/\+\d+/g) || [];
      const points = pointMatches;
      
      return {
        hashtags,
        cleanText,
        mentions,
        points
      };
    }
  };

  const formatMessageWithBoldNames = (description: string) => {
    // Pattern to match @mentions in the format @[Name] and +points in the format +[number]
    const mentionPattern = /@\[([^\]]+)\]/g;
    const pointPattern = /\+\[(\d+)\]/g;
    
    // Combine both patterns to find all occurrences
    const allMatches = [];
    let match;
    
    // Find all mentions
    while ((match = mentionPattern.exec(description)) !== null) {
      allMatches.push({
        type: 'mention',
        start: match.index,
        end: match.index + match[0].length,
        value: match[1],
        fullMatch: match[0]
      });
    }
    
    // Reset regex lastIndex and find all points
    pointPattern.lastIndex = 0;
    while ((match = pointPattern.exec(description)) !== null) {
      allMatches.push({
        type: 'point',
        start: match.index,
        end: match.index + match[0].length,
        value: match[1],
        fullMatch: match[0]
      });
    }
    
    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start);
    
    if (allMatches.length === 0) {
      return description;
    }
    
    const parts = [];
    let lastIndex = 0;
    
    allMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        parts.push(description.slice(lastIndex, match.start));
      }
      
      if (match.type === 'mention') {
        // Add the mention as a balloon tag
        parts.push(
          <span 
            key={`mention-${index}`} 
            className="inline-flex items-center bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium mx-1"
          >
            @{match.value}
          </span>
        );
      } else if (match.type === 'point') {
        // Add the point as a balloon tag
        parts.push(
          <span 
            key={`point-${index}`} 
            className="inline-flex items-center bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold mx-1"
          >
            +{match.value}
          </span>
        );
      }
      
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < description.length) {
      parts.push(description.slice(lastIndex));
    }
    
    return parts;
  };

  const filteredThreads = threadedRecognitions.filter((thread) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'received') return thread.mainPost.recipient_id === user?.id;
    if (activeTab === 'sent') return thread.mainPost.sender_id === user?.id;
    return true;
  });

  const TabButton = ({ tab, label }: { tab: 'all' | 'received' | 'sent'; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1 rounded-[7px] text-xs font-medium transition-colors ${
        activeTab === tab
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      style={{ fontSize: '12px', lineHeight: '18px', fontWeight: 500 }}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-5 px-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold" style={{ color: '#0F0533', lineHeight: '24px' }}>Recognition Feed</span>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none flex flex-col">
      <CardContent className="p-5">
        {/* Header with tabs */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-semibold" style={{ color: '#0F0533', lineHeight: '24px' }}>Recognition Feed</span>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <TabButton tab="all" label="All" />
            <TabButton tab="received" label="Received" />
            <TabButton tab="sent" label="Sent" />
          </div>
        </div>
        <Separator className="mb-4" />

        {filteredThreads.length > 0 ? (
          <div className="flex flex-col">
            {filteredThreads.map((thread, index) => {
              const parsed = parseStructuredMessage(thread.mainPost);
              const isCelebration = thread.mainPost.sender_id === thread.mainPost.recipient_id && 
                (/^🎂/.test(thread.mainPost.description) || /^🎉/.test(thread.mainPost.description));
              const isBirthday = /^🎂/.test(thread.mainPost.description);
              
              return (
                <div key={thread.mainPost.id}>
                  <div className="flex gap-3 py-4">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {!isCelebration && thread.mainPost.sender_avatar_url && (
                        <AvatarImage src={thread.mainPost.sender_avatar_url} alt={thread.mainPost.sender_name} />
                      )}
                      <AvatarFallback className={`text-xs ${
                        isCelebration 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isCelebration ? (
                          isBirthday ? <Cake className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />
                        ) : (
                          getInitials(thread.mainPost.sender_name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      {isCelebration ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {thread.mainPost.description}
                            </span>
                            <Badge className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                              +{thread.mainPost.points}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Header line */}
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-semibold">{thread.mainPost.sender_name}</span>
                            <span className="text-muted-foreground">recognized</span>
                            <span className="font-semibold">{thread.mainPost.recipient_name}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(thread.mainPost.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Value badge + points badge */}
                          <div className="flex items-center gap-2">
                            {thread.mainPost.company_value_name ? (
                              <Badge 
                                className="border-0 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: (thread.mainPost.company_value_color || '#7F2BFE') + '20',
                                  color: thread.mainPost.company_value_color || '#7F2BFE',
                                  padding: '1.88px 9.375px',
                                  height: '21.75px',
                                }}
                              >
                                {thread.mainPost.company_value_name}
                              </Badge>
                            ) : null}
                            <Badge className="border-0 rounded-full text-xs font-medium" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                              +{thread.mainPost.points} pts
                            </Badge>
                          </div>
                      
                          {/* Message text */}
                          <div className="text-sm text-muted-foreground">
                            {parsed.cleanText}
                          </div>

                          {/* GIF attachment */}
                          {thread.mainPost.gif_url && (
                            <div className="mt-1">
                              <img
                                src={thread.mainPost.gif_url}
                                alt="GIF"
                                className="max-w-[280px] max-h-[200px] rounded-lg object-cover"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Emoji reactions */}
                          <div className="flex items-center gap-2 pt-1">
                            {MOCK_REACTIONS.map((reaction, i) => (
                              <button key={i} className="flex items-center gap-1 text-xs font-medium rounded-full hover:opacity-80 transition-colors" style={{ backgroundColor: '#F5F5F7', color: '#0F0533', padding: '1.875px 7.5px', height: '21.75px' }}>
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </button>
                            ))}
                          </div>

                          {/* Add Points popover */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center gap-1 text-xs font-medium border px-3 py-1 hover:opacity-80 transition-colors mt-1" style={{ borderRadius: '9.375px', borderColor: '#E8E6F0', color: '#9996AA' }}>
                                <Plus className="h-3 w-3" />
                                Add Points
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="bottom" align="start" sideOffset={4}>
                              <div className="flex items-center gap-2">
                                {[1, 5, 10].map((pts) => (
                                  <button
                                    key={pts}
                                    onClick={() => handleQuickPoints(thread.mainPost.recipient_id, pts, parsed.cleanText)}
                                    className="px-3 py-1 text-xs font-medium border border-border rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                                  >
                                    +{pts}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Tagged along section */}
                          {thread.comments.length > 0 && (
                            <div className="pt-2 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Tagged along:</span>
                                <Badge className="bg-green-100 text-green-700 border-0 px-2 py-0 rounded-full text-xs font-semibold">
                                  +{thread.comments.reduce((sum, c) => sum + c.points, 0)} pts
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {thread.comments.map((comment) => (
                                  <div key={comment.id} className="inline-flex items-center gap-1.5 border border-border rounded-full px-2 py-0.5">
                                    <Avatar className="h-5 w-5">
                                      {comment.sender_avatar_url && (
                                        <AvatarImage src={comment.sender_avatar_url} alt={comment.sender_name} />
                                      )}
                                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                        {getInitials(comment.sender_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-foreground">{comment.sender_name}</span>
                                    <span className="text-xs font-medium text-green-600">+{comment.points}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {index < filteredThreads.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No recognitions yet</p>
            <p className="text-xs mt-2">Be the first to recognize a teammate!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}