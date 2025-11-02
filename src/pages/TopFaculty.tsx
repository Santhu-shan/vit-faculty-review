import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";

interface Faculty {
  id: string;
  name: string;
  department: string;
  faculty_id: string | null;
  photo_url: string | null;
  averageRating?: number;
  reviewCount?: number;
  starCount?: number;
}

const TopFaculty = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [topRatedFaculty, setTopRatedFaculty] = useState<Faculty[]>([]);
  const [starredFaculty, setStarredFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTopFaculty();
    }
  }, [user]);

  const fetchTopFaculty = async () => {
    try {
      // Fetch all approved faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("approved", true);

      if (facultyError) throw facultyError;

      // Fetch all approved reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("faculty_id, teaching_quality, clarity, approachability, availability, fairness")
        .eq("status", "approved");

      if (reviewsError) throw reviewsError;

      // Fetch star counts
      const { data: starsData, error: starsError } = await supabase
        .from("faculty_stars")
        .select("faculty_id");

      if (starsError) throw starsError;

      // Calculate ratings and star counts
      const facultyWithRatings = facultyData?.map((faculty) => {
        const facultyReviews = reviewsData?.filter((r) => r.faculty_id === faculty.id) || [];
        const starCount = starsData?.filter((s) => s.faculty_id === faculty.id).length || 0;
        
        if (facultyReviews.length === 0) {
          return { ...faculty, averageRating: 0, reviewCount: 0, starCount };
        }

        const totalRating = facultyReviews.reduce((sum, review) => {
          const avg = (
            (review.teaching_quality || 0) +
            (review.clarity || 0) +
            (review.approachability || 0) +
            (review.availability || 0) +
            (review.fairness || 0)
          ) / 5;
          return sum + avg;
        }, 0);

        const averageRating = totalRating / facultyReviews.length;
        return { ...faculty, averageRating, reviewCount: facultyReviews.length, starCount };
      }) || [];

      // Split into top rated (>3.5 stars) and starred faculty
      const topRated = facultyWithRatings
        .filter((f) => f.averageRating && f.averageRating > 3.5)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

      const starred = facultyWithRatings
        .filter((f) => (f.starCount || 0) > 0)
        .sort((a, b) => (b.starCount || 0) - (a.starCount || 0));

      setTopRatedFaculty(topRated);
      setStarredFaculty(starred);
    } catch (error) {
      console.error("Error fetching top faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const FacultyCard = ({ faculty }: { faculty: Faculty }) => (
    <Card
      className="hover-lift cursor-pointer glass-effect animate-slide-up"
      onClick={() => navigate(`/faculty/${faculty.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={faculty.photo_url || ""} alt={faculty.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {faculty.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="font-semibold text-lg">{faculty.name}</h3>
            <p className="text-sm text-muted-foreground">{faculty.department}</p>
            {faculty.faculty_id && (
              <p className="text-xs text-muted-foreground">ID: {faculty.faculty_id}</p>
            )}
            
            <div className="flex items-center gap-3 mt-2">
              {faculty.averageRating !== undefined && faculty.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating rating={faculty.averageRating} size="sm" />
                  <span className="text-sm font-medium text-muted-foreground ml-1">
                    ({faculty.reviewCount})
                  </span>
                </div>
              )}
              {faculty.starCount && faculty.starCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {faculty.starCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Top Faculty
            </h1>
            <p className="text-muted-foreground">
              Discover the highest-rated and most appreciated faculty members
            </p>
          </div>

          {/* Top Rated Faculty (>3.5 stars) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Highly Rated Faculty</h2>
              <Badge variant="secondary">Rating {">"} 3.5</Badge>
            </div>
            
            {topRatedFaculty.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No faculty with ratings above 3.5 stars yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {topRatedFaculty.map((faculty) => (
                  <FacultyCard key={faculty.id} faculty={faculty} />
                ))}
              </div>
            )}
          </section>

          {/* Community Starred Faculty */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold">Community Favorites</h2>
              <Badge variant="secondary">Student Starred</Badge>
            </div>
            
            {starredFaculty.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No faculty have been starred yet. Be the first to star your favorite faculty!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {starredFaculty.map((faculty) => (
                  <FacultyCard key={faculty.id} faculty={faculty} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default TopFaculty;
