import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/StarRating";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Faculty {
  id: string;
  name: string;
  department: string;
  photo_url: string | null;
  faculty_id: string;
}

export const RandomFacultyReview = () => {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  const [ratings, setRatings] = useState({
    teaching_quality: 0,
    approachability: 0,
    clarity: 0,
    availability: 0,
    fairness: 0,
  });
  const [content, setContent] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchRandomFaculty();

    return () => subscription.unsubscribe();
  }, []);

  const fetchRandomFaculty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("approved", true);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setFaculty(data[randomIndex]);
      }
    } catch (error) {
      console.error("Error fetching random faculty:", error);
      toast.error("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!session) {
      toast.error("Please sign in to submit a review");
      navigate("/auth");
      return;
    }

    if (!faculty) return;

    const allRatingsSet = Object.values(ratings).every((r) => r > 0);
    if (!allRatingsSet) {
      toast.error("Please provide all ratings");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write a review");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        faculty_id: faculty.id,
        user_id: session.user.id,
        teaching_quality: ratings.teaching_quality,
        approachability: ratings.approachability,
        clarity: ratings.clarity,
        availability: ratings.availability,
        fairness: ratings.fairness,
        content: content,
        status: "approved",
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setRatings({
        teaching_quality: 0,
        approachability: 0,
        clarity: 0,
        availability: 0,
        fairness: 0,
      });
      setContent("");
      fetchRandomFaculty();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate a Random Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!faculty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate a Random Faculty</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No faculty available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">Rate a Random Faculty</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRandomFaculty}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={faculty.photo_url || ""} alt={faculty.name} />
            <AvatarFallback className="text-lg">{getInitials(faculty.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{faculty.name}</h3>
            <p className="text-sm text-muted-foreground">{faculty.department}</p>
            <p className="text-xs text-muted-foreground">ID: {faculty.faculty_id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Teaching Quality</Label>
            <StarRating
              rating={ratings.teaching_quality}
              onRatingChange={(r) => setRatings({ ...ratings, teaching_quality: r })}
              readonly={!session}
            />
          </div>
          <div>
            <Label className="text-sm">Approachability</Label>
            <StarRating
              rating={ratings.approachability}
              onRatingChange={(r) => setRatings({ ...ratings, approachability: r })}
              readonly={!session}
            />
          </div>
          <div>
            <Label className="text-sm">Clarity</Label>
            <StarRating
              rating={ratings.clarity}
              onRatingChange={(r) => setRatings({ ...ratings, clarity: r })}
              readonly={!session}
            />
          </div>
          <div>
            <Label className="text-sm">Availability</Label>
            <StarRating
              rating={ratings.availability}
              onRatingChange={(r) => setRatings({ ...ratings, availability: r })}
              readonly={!session}
            />
          </div>
          <div>
            <Label className="text-sm">Fairness</Label>
            <StarRating
              rating={ratings.fairness}
              onRatingChange={(r) => setRatings({ ...ratings, fairness: r })}
              readonly={!session}
            />
          </div>
        </div>

        <div>
          <Label>Your Review</Label>
          <Textarea
            placeholder="Share your experience with this faculty..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={!session}
          />
        </div>

        <Button
          onClick={handleSubmitReview}
          disabled={!session || submitting}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Review
        </Button>

        {!session && (
          <p className="text-sm text-center text-muted-foreground">
            Please <a href="/auth" className="text-primary underline">sign in</a> to submit reviews
          </p>
        )}
      </CardContent>
    </Card>
  );
};
