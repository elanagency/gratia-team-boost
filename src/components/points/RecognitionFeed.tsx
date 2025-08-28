import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Clock, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

const quickPoints = [5, 10, 25];

export function RecognitionFeed() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [givingPoints, setGivingPoints] = useState<{ [key: string]: boolean }>({});
  
  const { user, companyId } = useAuth();

  useEffect(() => {
    if (companyId) {
      fetchRecognitionFeed();
    }
  }, [companyId]);

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
        return;
      }
      
      // Get unique user IDs
      const userIds = [...new Set([
        ...transactionsData.map(t => t.sender_id),
        ...transactionsData.map(t => t.recipient_id)
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
      const formattedTransactions: PointTransaction[] = transactionsData.map(transaction => ({
        id: transaction.id,
        sender_id: transaction.sender_id,
        recipient_id: transaction.recipient_id,
        points: transaction.points,
        description: transaction.description,
        created_at: transaction.created_at,
        sender_name: profileMap.get(transaction.sender_id) || 'Unknown User',
        recipient_name: profileMap.get(transaction.recipient_id) || 'Unknown User'
      }));
      
      setTransactions(formattedTransactions);
      
    } catch (error) {
      console.error("Error fetching recognition feed:", error);
      toast.error("Failed to load recognition feed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPoints = async (recipientId: string, points: number, originalDescription: string) => {
    if (!user || !companyId) return;
    
    const transactionId = `${recipientId}-${points}`;
    setGivingPoints(prev => ({ ...prev, [transactionId]: true }));
    
    try {
      const { error } = await supabase
        .from('point_transactions')
        .insert({
          company_id: companyId,
          sender_id: user.id,
          recipient_id: recipientId,
          points: points,
          description: `Quick appreciation: ${originalDescription}`
        });

      if (error) throw error;
      
      toast.success(`Gave ${points} additional points!`);
      fetchRecognitionFeed(); // Refresh feed
      
    } catch (error) {
      console.error("Error giving quick points:", error);
      toast.error("Failed to give points");
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
    const hashtags = description.match(/#\w+/g) || [];
    const cleanDescription = description.replace(/#\w+/g, '').trim();
    return { cleanDescription, hashtags };
  };

  if (isLoading) {
    return (
      <Card className="dashboard-card h-fit">
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
    <Card className="backdrop-blur-sm bg-card/95 border-0 shadow-2xl shadow-accent/10 hover:shadow-accent/20 transition-all duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-accent/20 to-accent/30 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Recognition Feed</CardTitle>
            <CardDescription className="text-sm">Recent team recognitions and celebrations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {transactions.length > 0 ? (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
            {transactions.map((transaction) => {
              const { cleanDescription, hashtags } = extractHashtags(transaction.description);
              const canGivePoints = user?.id !== transaction.recipient_id && user?.id !== transaction.sender_id;
              
              return (
                <div key={transaction.id} className="group p-4 rounded-lg border border-border/30 bg-background/50 hover:bg-accent/5 transition-all duration-200 hover:border-accent/30">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-accent/20">
                      <AvatarFallback className="text-sm bg-gradient-to-r from-accent/20 to-accent/30 text-accent font-medium">
                        {getInitials(transaction.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{transaction.sender_name}</span>
                        <span className="text-xs text-muted-foreground">gave</span>
                        <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-accent/20">
                          <Heart className="h-3 w-3 mr-1" />
                          {transaction.points}
                        </Badge>
                        <span className="text-xs text-muted-foreground">to</span>
                        <span className="font-medium text-sm text-accent">{transaction.recipient_name}</span>
                      </div>
                      
                      <p className="text-sm text-foreground/80 leading-relaxed">{cleanDescription}</p>
                      
                      {hashtags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-accent/5 text-accent border-accent/30 hover:bg-accent/10 transition-colors">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </div>
                        
                        {canGivePoints && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {quickPoints.map((points) => {
                              const transactionId = `${transaction.recipient_id}-${points}`;
                              const isGiving = givingPoints[transactionId];
                              
                              return (
                                <Button
                                  key={points}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuickPoints(transaction.recipient_id, points, cleanDescription)}
                                  disabled={isGiving}
                                  className="h-7 px-3 text-xs hover:bg-accent/10 hover:text-accent transition-all duration-200 border border-transparent hover:border-accent/20"
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-accent/10 to-accent/20 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-accent/60" />
            </div>
            <p className="text-lg font-medium mb-2">No recognitions yet</p>
            <p className="text-sm">Be the first to recognize a teammate!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}