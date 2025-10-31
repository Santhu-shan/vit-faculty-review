import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

interface TopUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
  created_at?: string;
}

const TopUsers = () => {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [topResult, recentResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, points")
          .order("points", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("id, display_name, avatar_url, points, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      if (topResult.error) throw topResult.error;
      if (recentResult.error) throw recentResult.error;
      
      setTopUsers(topResult.data || []);
      setRecentUsers(recentResult.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return null;
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                {getRankIcon(index) || (
                  <span className="text-sm font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
              </div>
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold">{user.display_name}</p>
                <Badge variant="secondary" className="font-bold mt-2">
                  {user.points} pts
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recently Joined
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-xl">
                    {getInitials(user.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{user.display_name}</p>
                  <Badge variant="outline" className="mt-2">
                    {user.points} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopUsers;
