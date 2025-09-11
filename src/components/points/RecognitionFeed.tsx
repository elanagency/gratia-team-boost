import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
  const [givingPoints, setGivingPoints] = useState<{ [key: string]: boolean }>({});
  const [userPoints, setUserPoints] = useState<number>(0);
  
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to clean HTML content and extract plain text
  const cleanHtmlDescription = (description: string): string => {
    return description
      // Remove mention balloons
      .replace(/<span class="mention-balloon"[^>]*>([^<]*)<\/span>/g, '')
      // Remove point balloons  
      .replace(/<span class="point-balloon"[^>]*>[^<]*<\/span>/g, '')
      // Remove any other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    if (companyId && user?.id) {
      fetchRecognitionFeed();
      fetchUserPoints();
    }
  }, [companyId, user?.id]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefresh = () => {
      if (companyId && user?.id) {
        fetchRecognitionFeed();
        fetchUserPoints();
      }
    };

    window.addEventListener('refreshRecognitionFeed', handleRefresh);
    return () => {
      window.removeEventListener('refreshRecognitionFeed', handleRefresh);
    };
  }, [companyId, user?.id]);

  const fetchUserPoints = async () => {
    if (!user?.id || !companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      setUserPoints(data?.points || 0);
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };

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
    
    console.log('Main posts:', mainPosts);
    console.log('Comments:', comments);
    
    // Create threads for main posts
    mainPosts.forEach(post => {
      // Clean the description to get just the text content
      const cleanDescription = cleanHtmlDescription(post.description);
      const threadKey = `${post.recipient_id}-${cleanDescription}`;
      threads.set(threadKey, {
        mainPost: post,
        comments: [],
        lastActivity: post.created_at
      });
    });
    
    console.log('Initial threads:', Array.from(threads.keys()));
    
    // Add comments to their respective threads
    comments.forEach(comment => {
      const originalDescription = cleanHtmlDescription(
        comment.description.replace('Quick appreciation: ', '').trim()
      );
      const threadKey = `${comment.recipient_id}-${originalDescription}`;
      console.log(`Looking for thread: ${threadKey} for comment: ${comment.description}`);
      
      const thread = threads.get(threadKey);
      
      if (thread) {
        thread.comments.push(comment);
        // Update last activity if this comment is newer
        if (new Date(comment.created_at) > new Date(thread.lastActivity)) {
          thread.lastActivity = comment.created_at;
        }
        console.log(`Added comment to thread: ${threadKey}`);
      } else {
        console.log(`No matching thread found for: ${threadKey}`);
        console.log('Available threads:', Array.from(threads.keys()));
      }
    });
    
    const result = Array.from(threads.values()).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
    
    console.log('Final threaded recognitions:', result);
    return result;
  };

  const handleQuickPoints = async (recipientId: string, points: number, originalDescription: string) => {
    if (!user || !companyId) return;
    
    // Check if user has enough points
    if (userPoints < points) {
      toast.error(`Insufficient points. You have ${userPoints} points, need ${points}.`);
      return;
    }
    
    const transactionId = `${recipientId}-${points}`;
    setGivingPoints(prev => ({ ...prev, [transactionId]: true }));
    
    try {
      // Use the new transfer function for atomic point transfer
      const { data, error } = await supabase.rpc('transfer_points_between_users', {
        sender_user_id: user.id,
        recipient_user_id: recipientId,
        transfer_company_id: companyId,
        points_amount: points,
        transfer_description: `Quick appreciation: ${originalDescription}`
      });

      if (error) throw error;
      
      // Type the response data properly
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Transfer failed');
      }
      
      toast.success(`Gave ${points} additional points!`);
      fetchRecognitionFeed(); // Refresh feed
      // Invalidate user points query to trigger immediate refresh
      queryClient.invalidateQueries({ queryKey: ['userPoints', user.id, companyId] });
      
    } catch (error: any) {
      console.error("Error giving quick points:", error);
      toast.error(error.message || "Failed to give points");
    } finally {
      setGivingPoints(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const extractHashtags = (description: string) => {
    // First clean the HTML, then extract hashtags
    const cleanText = cleanHtmlDescription(description);
    const hashtags = cleanText.match(/#\w+/g) || [];
    const cleanDescription = cleanText.replace(/#\w+/g, '').trim();
    return { cleanDescription, hashtags };
  };

  const formatMessageWithBoldNames = (description: string) => {
    // First clean any HTML content to get plain text
    const cleanText = cleanHtmlDescription(description);
    
    // Pattern to match @mentions in the format @[Name] and +points in the format +[number]
    const mentionPattern = /@\[([^\]]+)\]/g;
    const pointPattern = /\+\[(\d+)\]/g;
    
    // Combine both patterns to find all occurrences
    const allMatches = [];
    let match;
    
    // Find all mentions
    while ((match = mentionPattern.exec(cleanText)) !== null) {
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
    while ((match = pointPattern.exec(cleanText)) !== null) {
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
      return cleanText;
    }
    
    const parts = [];
    let lastIndex = 0;
    
    allMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > lastIndex) {
        parts.push(cleanText.slice(lastIndex, match.start));
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
    if (lastIndex < cleanText.length) {
      parts.push(cleanText.slice(lastIndex));
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
              const { cleanDescription, hashtags } = extractHashtags(thread.mainPost.description);
              const canGivePoints = user?.id !== thread.mainPost.recipient_id;
              
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
                      
                      <div className="text-sm text-muted-foreground">{cleanDescription}</div>
                      
                      {hashtags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(thread.mainPost.created_at), { addSuffix: true })}
                        </div>
                        
                        {canGivePoints && (
                          <div className="flex gap-1">
                            {quickPoints.map((points) => {
                              const transactionId = `${thread.mainPost.recipient_id}-${points}`;
                              const isGiving = givingPoints[transactionId];
                              const hasEnoughPoints = userPoints >= points;
                              
                              return (
                                <Button
                                  key={points}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickPoints(thread.mainPost.recipient_id, points, cleanDescription)}
                                  disabled={isGiving || !hasEnoughPoints}
                                  className={`h-6 px-2 text-xs hover:bg-[#F572FF]/10 hover:text-[#F572FF] ${
                                    !hasEnoughPoints ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title={!hasEnoughPoints ? `You need ${points} points (you have ${userPoints})` : `Give ${points} additional points`}
                                >
                                  {isGiving ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                                  ) : (
                                    <>
                                      <Zap className="h-3 w-3 mr-1" />
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