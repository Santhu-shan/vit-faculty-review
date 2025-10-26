import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThumbsUp, ThumbsDown, MessageSquare, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const FacultyProfile = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [reviewContent, setReviewContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [ratings, setRatings] = useState({
    teaching_quality: 0,
    approachability: 0,
    clarity: 0,
    availability: 0,
    fairness: 0
  });
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  useEffect(() => {
    if (user && id) {
      fetchFaculty();
      fetchReviews();
    }
  }, [user, id]);
  const fetchFaculty = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("faculty").select("*").eq("id", id).single();
      if (error) throw error;
      setFaculty(data);
    } catch (error: any) {
      toast.error("Failed to load faculty");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const fetchReviews = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("reviews").select(`
          *,
          profiles!reviews_user_id_fkey(display_name, avatar_url)
        `).eq("faculty_id", id).eq("status", "approved").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const allRatingsSet = Object.values(ratings).every(r => r > 0);
    if (!allRatingsSet || !reviewContent.trim()) {
      toast.error("Please fill in all ratings and write a review");
      return;
    }
    setSubmitting(true);
    try {
      const {
        error
      } = await supabase.from("reviews").insert({
        user_id: user.id,
        faculty_id: id,
        content: reviewContent,
        is_anonymous: isAnonymous,
        ...ratings
      });
      if (error) throw error;
      toast.success("Review submitted! Pending admin approval.");
      setReviewContent("");
      setIsAnonymous(false);
      setRatings({
        teaching_quality: 0,
        approachability: 0,
        clarity: 0,
        availability: 0,
        fairness: 0
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => {
      return acc + (review.teaching_quality + review.approachability + review.clarity + review.availability + review.fairness) / 5;
    }, 0);
    return sum / reviews.length;
  };
  if (!user || loading) {
    return null;
  }
  if (!faculty) {
    return <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Faculty not found</p>
        </div>
      </div>;
  }
  const initials = faculty.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const avgRating = calculateAverageRating();
  return <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} className="bg-slate-400" />
      
      <main className="container mx-auto px-4 py-8 bg-neutral-50">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 bg-gray-900 hover:bg-gray-800 text-slate-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Faculty Header */}
        <Card className="mb-8 shadow-medium">
          <CardContent className="p-8 bg-neutral-50">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                <AvatarImage src={faculty.photo_url || undefined} alt={faculty.name} />
                <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{faculty.name}</h1>
                <p className="text-lg text-muted-foreground mb-3">{faculty.department}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge>ID: {faculty.faculty_id}</Badge>
                  {faculty.contact_email && <Badge variant="outline">{faculty.contact_email}</Badge>}
                </div>
                <div className="flex items-center gap-4">
                  <StarRating rating={avgRating} size="lg" readonly />
                  <span className="text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
            </div>

            {faculty.office_hours && <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Office Hours</h3>
                <p className="text-sm text-muted-foreground">{faculty.office_hours}</p>
              </div>}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6 bg-neutral-50">
          <TabsList>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="write">Write Review</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? reviews.map(review => <Card key={review.id} className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.profiles?.avatar_url} />
                          <AvatarFallback className="bg-primary/10">
                            {review.is_anonymous ? "?" : review.profiles?.display_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            {review.is_anonymous ? "Anonymous" : review.profiles?.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={(review.teaching_quality + review.approachability + review.clarity + review.availability + review.fairness) / 5} readonly />
                    </div>

                    <p className="text-foreground mb-4">{review.content}</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Teaching</p>
                        <StarRating rating={review.teaching_quality} size="sm" readonly />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Approachable</p>
                        <StarRating rating={review.approachability} size="sm" readonly />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Clarity</p>
                        <StarRating rating={review.clarity} size="sm" readonly />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Available</p>
                        <StarRating rating={review.availability} size="sm" readonly />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fair</p>
                        <StarRating rating={review.fairness} size="sm" readonly />
                      </div>
                    </div>
                  </CardContent>
                </Card>) : <Card className="shadow-soft">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No reviews yet</p>
                  <Button onClick={() => navigate("#write")}>Write the first review</Button>
                </CardContent>
              </Card>}
          </TabsContent>

          <TabsContent value="write">
            <Card className="shadow-medium">
              <CardContent className="p-6 bg-neutral-50">
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Rate this faculty</h3>
                    <div className="grid gap-4">
                      {[{
                      key: 'teaching_quality',
                      label: 'Teaching Quality'
                    }, {
                      key: 'approachability',
                      label: 'Approachability'
                    }, {
                      key: 'clarity',
                      label: 'Clarity of Communication'
                    }, {
                      key: 'availability',
                      label: 'Availability'
                    }, {
                      key: 'fairness',
                      label: 'Fairness in Grading'
                    }].map(({
                      key,
                      label
                    }) => <div key={key} className="flex items-center justify-between">
                          <Label className="text-sm">{label}</Label>
                          <StarRating rating={ratings[key as keyof typeof ratings]} onRatingChange={value => setRatings({
                        ...ratings,
                        [key]: value
                      })} />
                        </div>)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review</Label>
                    <Textarea id="review" placeholder="Share your experience with this faculty member..." value={reviewContent} onChange={e => setReviewContent(e.target.value)} rows={6} maxLength={2500} />
                    <p className="text-xs text-muted-foreground text-right">
                      {reviewContent.length}/2500
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={checked => setIsAnonymous(checked as boolean)} />
                    <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                      Post anonymously
                    </Label>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gradient-primary text-white bg-zinc-900 hover:bg-zinc-800">
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>;
};
export default FacultyProfile;