import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Session, User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "@/components/StarRating";

interface Faculty {
  id: string;
  name: string;
  department: string;
  photo_url: string | null;
  faculty_id: string;
  averageRating: number;
  reviewCount: number;
  blacklistCount: number;
}

const BlacklistedFaculty = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchBlacklistedFaculty();
  }, []);

  const fetchBlacklistedFaculty = async () => {
    try {
      // Fetch all approved faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("approved", true);

      if (facultyError) throw facultyError;

      if (!facultyData || facultyData.length === 0) {
        setFaculty([]);
        setLoading(false);
        return;
      }

      // Fetch all reviews at once
      const { data: allReviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("teaching_quality, approachability, clarity, availability, fairness, faculty_id")
        .eq("status", "approved");

      if (reviewsError) throw reviewsError;

      // Fetch all blacklist votes at once
      const { data: allBlacklistVotes, error: blacklistError } = await supabase
        .from("blacklist_votes")
        .select("faculty_id");

      if (blacklistError) throw blacklistError;

      // Group reviews by faculty_id
      const reviewsByFaculty = (allReviews || []).reduce((acc, review) => {
        if (!acc[review.faculty_id]) {
          acc[review.faculty_id] = [];
        }
        acc[review.faculty_id].push(review);
        return acc;
      }, {} as Record<string, any[]>);

      // Count blacklist votes by faculty_id
      const blacklistCountByFaculty = (allBlacklistVotes || []).reduce((acc, vote) => {
        acc[vote.faculty_id] = (acc[vote.faculty_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate stats for each faculty
      const facultyWithStats = facultyData.map((f) => {
        const reviews = reviewsByFaculty[f.id] || [];
        let averageRating = 0;
        
        if (reviews.length > 0) {
          const sum = reviews.reduce((acc, review) => {
            return acc + (review.teaching_quality + review.approachability + review.clarity + review.availability + review.fairness) / 5;
          }, 0);
          averageRating = sum / reviews.length;
        }

        return {
          ...f,
          averageRating,
          reviewCount: reviews.length,
          blacklistCount: blacklistCountByFaculty[f.id] || 0,
        };
      });

      // Filter faculty with less than 2 stars and at least one review
      const blacklisted = facultyWithStats.filter(
        (f) => f.averageRating < 2 && f.reviewCount > 0
      );

      setFaculty(blacklisted);
    } catch (error) {
      console.error("Error fetching blacklisted faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} onSearch={handleSearch} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl font-bold">Blacklisted Faculty</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Faculty members with average ratings below 2 stars
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : faculty.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map((f) => {
              const initials = f.name.split(" ").map(n => n[0]).join("").toUpperCase();
              return (
                <Link key={f.id} to={`/faculty/${f.id}`}>
                  <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer border-destructive/50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16 ring-2 ring-destructive/30">
                          <AvatarImage src={f.photo_url || undefined} alt={f.name} />
                          <AvatarFallback className="bg-destructive/20 text-destructive font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                            {f.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 truncate">
                            {f.department}
                          </p>
                          <Badge variant="outline" className="text-xs mb-3">
                            ID: {f.faculty_id}
                          </Badge>

                          <div className="space-y-2">
                            <StarRating rating={f.averageRating} size="sm" readonly />
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {f.blacklistCount} reports
                              </Badge>
                              <span className="text-muted-foreground">
                                {f.reviewCount} reviews
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No faculty members are currently blacklisted
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BlacklistedFaculty;
