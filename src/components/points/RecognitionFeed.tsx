import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, Heart } from "lucide-react";
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
  created_at: string;
  sender_name: string;
  recipient_name: string;
};

type ThreadedRecognition = {
  mainPost: PointTransaction;
  comments: PointTransaction[];
  lastActivity: string;
};

const quickPoints = [5, 10, 25];

export function RecognitionFeed() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [threadedRecognitions, setThreadedRecognitions] = useState<ThreadedRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingQuickPoints, setProcessingQuickPoints] = useState<Set<string>>(new Set());
  
  const { user, companyId } = useAuth();
  const optimisticAuth = useOptimisticAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (companyId && user?.id) {
      fetchRecognitionFeed();
    }
  }, [companyId, user?.id]);


  // Remove fetchUserPoints function as we now use optimisticAuth

  const fetchRecognitionFeed = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch recent point transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (transactionsError) throw transactionsError;
      
      if (!transactionsData?.length) {
        setTransactions([]);
        setThreadedRecognitions([]);
        return;
      }

      // Filter out system/cron job transactions by description patterns only
      const filteredTransactions = transactionsData.filter(transaction => {
        const systemDescriptionPatterns = [
          /monthly allocation/i,
          /system grant/i,
          /platform admin granted/i,
          /automated allocation/i,
          /scheduled points/i
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
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create profile map
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User');
      });
      
      // Format transactions
      const formattedTransactions: PointTransaction[] = filteredTransactions.map(transaction => ({
        id: transaction.id,
        sender_id: transaction.sender_profile_id,
        recipient_id: transaction.recipient_profile_id,
        points: transaction.points,
        description: transaction.description,
        structured_message: transaction.structured_message,
        created_at: transaction.created_at,
        sender_name: profileMap.get(transaction.sender_profile_id) || 'Unknown User',
        recipient_name: profileMap.get(transaction.recipient_profile_id) || 'Unknown User'
      }));
      
      setTransactions(formattedTransactions);
      
      // Group transactions into threaded recognitions
      const threaded = groupTransactionsIntoThreads(formattedTransactions);
      setThreadedRecognitions(threaded);
      
    } catch (error) {
      console.error("Error fetching recognition feed:", error);
      toast.error("Failed to load recognition feed");
    } finally {
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

  if (isLoading) {
    return (
    <Card className="dashboard-card h-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#F572FF]" />
            Recognition Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F572FF]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card h-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#F572FF]" />
          Recognition Feed
        </CardTitle>
        <CardDescription className="text-sm">
          Recent team recognitions and celebrations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 h-96 flex flex-col">
        {threadedRecognitions.length > 0 ? (
          <div className="space-y-6 flex-1 overflow-y-auto">
            {threadedRecognitions.map((thread) => {
              const parsed = parseStructuredMessage(thread.mainPost);
              const canGivePoints = user?.id !== thread.mainPost.recipient_id && user?.id !== thread.mainPost.sender_id;
              
              return (
                <div key={thread.mainPost.id} className="border-b border-border/50 pb-6 last:border-b-0">
                  {/* Main Post */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-[#F572FF]/10 text-[#F572FF]">
                        {getInitials(thread.mainPost.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                         <span className="font-bold text-sm">{thread.mainPost.sender_name}</span>
                         <span className="text-xs text-muted-foreground">gave</span>
                         <span className="text-xs">
                           {thread.mainPost.points} <span className="text-xs text-muted-foreground">points</span>
                         </span>
                         <span className="text-xs text-muted-foreground">to</span>
                         <span className="font-bold text-sm">{thread.mainPost.recipient_name}</span>
                      </div>
                      
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const parsed = parseStructuredMessage(thread.mainPost, true);
                            return (
                              <div className="flex flex-wrap items-center gap-1">
                                {parsed.mentions.map((mention, idx) => (
                                  <span key={`mention-${idx}`} className="inline-flex items-center bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                                    @{mention}
                                  </span>
                                ))}
                                {parsed.cleanText && <span className="text-sm">{parsed.cleanText}</span>}
                                {parsed.points.map((point, idx) => (
                                  <span key={`point-${idx}`} className="inline-flex items-center bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                    +{point}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                       
                       {(() => {
                         const parsed = parseStructuredMessage(thread.mainPost);
                         return parsed.hashtags.length > 0 && (
                           <div className="flex gap-1 flex-wrap">
                             {parsed.hashtags.map((tag, index) => (
                               <Badge key={index} variant="outline" className="text-xs">
                                 #{tag}
                               </Badge>
                             ))}
                           </div>
                         );
                       })()}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(thread.mainPost.created_at), { addSuffix: true })}
                        </div>
                        
                        {canGivePoints && (
                          <div className="flex gap-1">
                             {quickPoints.map((points) => {
                               const recipientId = thread.mainPost.recipient_id;
                               const isGiving = processingQuickPoints.has(recipientId);
                               const hasEnoughPoints = (optimisticAuth.monthlyPoints || 0) >= points;
                              
                              return (
                                <Button
                                  key={points}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickPoints(thread.mainPost.recipient_id, points, parsed.cleanText)}
                                  disabled={isGiving || !hasEnoughPoints}
                                  className={`h-6 px-2 text-xs hover:bg-[#F572FF]/10 hover:text-[#F572FF] ${
                                    !hasEnoughPoints ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title={!hasEnoughPoints ? `You need ${points} points (you have ${optimisticAuth.monthlyPoints || 0})` : `Give ${points} additional points`}
                                >
                                  {isGiving ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                                  ) : (
                                    <>
                                      <Heart className="h-3 w-3 mr-1" />
                                      +{points}
                                    </>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments/Appreciations */}
                  {thread.comments.length > 0 && (
                    <div className="mt-4 ml-11 space-y-3">
                      {/* Appreciations Title */}
                       <div className="text-xs text-muted-foreground font-medium border-t border-border/30 pt-2">
                         Appreciations ({thread.comments.length})
                       </div>
                      
                      {thread.comments
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((comment) => (
                        <div key={comment.id} className="flex gap-2 items-start">
                          <div className="w-px bg-border h-6 mt-1"></div>
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {getInitials(comment.sender_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs">{comment.sender_name}</span>
                              <span className="text-xs text-muted-foreground">gave</span>
                              <span className="text-xs text-[#F572FF] font-medium">
                                +{comment.points} points
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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