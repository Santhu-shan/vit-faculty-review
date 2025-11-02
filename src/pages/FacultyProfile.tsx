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
import { MessageSquare, ArrowLeft, Send, ThumbsUp, ThumbsDown, AlertTriangle, Star, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { showRewardToast } from "@/components/RewardToast";

const FacultyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});

  // Like/dislike states
  const [facultyVotes, setFacultyVotes] = useState({ likes: 0, dislikes: 0, userVote: null as string | null });
  const [reviewVotes, setReviewVotes] = useState<{ [key: string]: { likes: number, dislikes: number, userVote: string | null } }>({});
  const [blacklistVotes, setBlacklistVotes] = useState({ count: 0, userVoted: false });
  const [starState, setStarState] = useState({ count: 0, userStarred: false });
  const [editingCourses, setEditingCourses] = useState(false);
  const [coursesText, setCoursesText] = useState("");

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
    if (user && id) {
      fetchFaculty();
      fetchReviews();
      fetchFacultyVotes();
      fetchBlacklistVotes();
      fetchStarData();
    }
  }, [user, id]);

  const fetchFacultyVotes = async () => {
    try {
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("likes, dislikes")
        .eq("id", id)
        .single();

      const { data: userVote } = await supabase
        .from("faculty_votes")
        .select("vote_type")
        .eq("faculty_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      setFacultyVotes({
        likes: facultyData?.likes || 0,
        dislikes: facultyData?.dislikes || 0,
        userVote: userVote?.vote_type || null
      });
    } catch (error) {
      console.error("Error fetching faculty votes:", error);
    }
  };

  const fetchBlacklistVotes = async () => {
    try {
      const { count } = await supabase
        .from("blacklist_votes")
        .select("*", { count: "exact", head: true })
        .eq("faculty_id", id);

      const { data: userVote } = await supabase
        .from("blacklist_votes")
        .select("id")
        .eq("faculty_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      setBlacklistVotes({
        count: count || 0,
        userVoted: !!userVote
      });
    } catch (error) {
      console.error("Error fetching blacklist votes:", error);
    }
  };

  const fetchStarData = async () => {
    try {
      const { count } = await supabase
        .from("faculty_stars")
        .select("*", { count: 'exact', head: true })
        .eq("faculty_id", id);

      const { data: userStar } = await supabase
        .from("faculty_stars")
        .select("id")
        .eq("faculty_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      setStarState({
        count: count || 0,
        userStarred: !!userStar
      });
    } catch (error) {
      console.error("Error fetching star data:", error);
    }
  };

  const handleFacultyVote = async (voteType: 'like' | 'dislike') => {
    if (!user) return;

    try {
      if (facultyVotes.userVote === voteType) {
        // Remove vote
        await supabase
          .from("faculty_votes")
          .delete()
          .eq("faculty_id", id)
          .eq("user_id", user.id);
      } else {
        // Add or update vote
        if (facultyVotes.userVote) {
          await supabase
            .from("faculty_votes")
            .delete()
            .eq("faculty_id", id)
            .eq("user_id", user.id);
        }
        
        await supabase
          .from("faculty_votes")
          .insert({
            faculty_id: id,
            user_id: user.id,
            vote_type: voteType
          });
      }

      await fetchFacultyVotes();
      toast.success("Vote updated!");
    } catch (error: any) {
      toast.error("Failed to update vote");
      console.error(error);
    }
  };

  const handleBlacklistVote = async () => {
    if (!user) return;

    try {
      if (blacklistVotes.userVoted) {
        await supabase
          .from("blacklist_votes")
          .delete()
          .eq("faculty_id", id)
          .eq("user_id", user.id);
        toast.success("Blacklist vote removed");
      } else {
        await supabase
          .from("blacklist_votes")
          .insert({
            faculty_id: id,
            user_id: user.id
          });
        toast.success("Faculty marked as blacklisted");
      }

      await fetchBlacklistVotes();
    } catch (error: any) {
      toast.error("Failed to update blacklist vote");
      console.error(error);
    }
  };

  const handleStarToggle = async () => {
    if (!user) return;

    try {
      if (starState.userStarred) {
        // Remove star
        await supabase
          .from("faculty_stars")
          .delete()
          .eq("faculty_id", id)
          .eq("user_id", user.id);
        toast.success("Removed from top faculty");
      } else {
        // Add star
        await supabase
          .from("faculty_stars")
          .insert({
            faculty_id: id,
            user_id: user.id
          });
        toast.success("Added to top faculty!");
      }

      await fetchStarData();
    } catch (error: any) {
      toast.error("Failed to update top faculty status");
      console.error(error);
    }
  };

  const handleUpdateCourses = async () => {
    if (!user) return;

    try {
      const courses = coursesText.split(",").map(c => c.trim()).filter(c => c);
      const { error } = await supabase
        .from("faculty")
        .update({ courses_taught: courses.length > 0 ? courses : null })
        .eq("id", id);

      if (error) throw error;

      await fetchFaculty();
      setEditingCourses(false);
      toast.success("Courses updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update courses");
      console.error(error);
    }
  };

  const handleReviewVote = async (reviewId: string, voteType: 'like' | 'dislike') => {
    if (!user) return;

    try {
      const currentVote = reviewVotes[reviewId]?.userVote;

      if (currentVote === voteType) {
        // Remove vote
        await supabase
          .from("review_votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);
      } else {
        // Add or update vote
        if (currentVote) {
          await supabase
            .from("review_votes")
            .delete()
            .eq("review_id", reviewId)
            .eq("user_id", user.id);
        }
        
        await supabase
          .from("review_votes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      await fetchReviewVotes(reviewId);
      toast.success("Vote updated!");
    } catch (error: any) {
      toast.error("Failed to update vote");
      console.error(error);
    }
  };

  const fetchReviewVotes = async (reviewId: string) => {
    try {
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("likes, dislikes")
        .eq("id", reviewId)
        .single();

      const { data: userVote } = await supabase
        .from("review_votes")
        .select("vote_type")
        .eq("review_id", reviewId)
        .eq("user_id", user?.id)
        .maybeSingle();

      setReviewVotes(prev => ({
        ...prev,
        [reviewId]: {
          likes: reviewData?.likes || 0,
          dislikes: reviewData?.dislikes || 0,
          userVote: userVote?.vote_type || null
        }
      }));
    } catch (error) {
      console.error("Error fetching review votes:", error);
    }
  };

  const fetchComments = async (reviewId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles!comments_user_id_fkey(display_name, avatar_url)
        `)
        .eq("review_id", reviewId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments((prev) => ({ ...prev, [reviewId]: data || [] }));
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", id)
        .single();

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
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_user_id_fkey(display_name, avatar_url)
        `)
        .eq("faculty_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching reviews:", error);
        return;
      }
      
      const sanitizedReviews = (data || []).map(review => ({
        ...review,
        user_id: review.is_anonymous ? null : review.user_id
      }));
      
      setReviews(sanitizedReviews);

      // Fetch comments and votes for each review
      sanitizedReviews.forEach(review => {
        fetchComments(review.id);
        fetchReviewVotes(review.id);
      });
    } catch (error: any) {
      console.error("Unexpected error:", error);
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
      const { error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          faculty_id: id,
          content: reviewContent,
          is_anonymous: isAnonymous,
          status: 'approved',
          ...ratings
        });
      
      if (error) throw error;
      
      showRewardToast(10, 'review');
      toast.success("Review submitted successfully!");
      setReviewContent("");
      setIsAnonymous(false);
      setRatings({
        teaching_quality: 0,
        approachability: 0,
        clarity: 0,
        availability: 0,
        fairness: 0
      });
      
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (reviewId: string) => {
    if (!user || !commentTexts[reviewId]?.trim()) return;

    setSubmittingComment({ ...submittingComment, [reviewId]: true });

    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          review_id: reviewId,
          content: commentTexts[reviewId],
          status: "approved",
        });

      if (error) throw error;

      showRewardToast(5, 'comment');
      toast.success("Comment posted successfully!");
      setCommentTexts({ ...commentTexts, [reviewId]: "" });
      await fetchComments(reviewId);
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
      console.error(error);
    } finally {
      setSubmittingComment({ ...submittingComment, [reviewId]: false });
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
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Faculty not found</p>
        </div>
      </div>
    );
  }

  const initials = faculty.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const avgRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-8 shadow-medium">
          <CardContent className="p-8">
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
                <div className="flex items-center gap-4 mb-4">
                  <StarRating rating={avgRating} size="lg" readonly />
                  <span className="text-muted-foreground">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
                
                {/* Faculty Like/Dislike/Blacklist Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={facultyVotes.userVote === 'like' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFacultyVote('like')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {facultyVotes.likes}
                  </Button>
                  <Button
                    variant={facultyVotes.userVote === 'dislike' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFacultyVote('dislike')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {facultyVotes.dislikes}
                  </Button>
                  <Button
                    variant={blacklistVotes.userVoted ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleBlacklistVote()}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Blacklist ({blacklistVotes.count})
                  </Button>
                  <Button
                    variant={starState.userStarred ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStarToggle()}
                    className={starState.userStarred ? 'gradient-primary text-white animate-pulse-glow' : ''}
                  >
                    <Star className={`h-4 w-4 mr-1 ${starState.userStarred ? 'fill-current' : ''}`} />
                    Top Faculty ({starState.count})
                  </Button>
                </div>
              </div>
            </div>

            {faculty.office_hours && (
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Office Hours</h3>
                <p className="text-sm text-muted-foreground">{faculty.office_hours}</p>
              </div>
            )}

            {faculty.mobile_number && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Mobile Number</h3>
                <p className="text-sm text-muted-foreground">{faculty.mobile_number}</p>
              </div>
            )}

            {faculty.details_image_url && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">VTOP Details</h3>
                <img 
                  src={faculty.details_image_url} 
                  alt="VTOP Details" 
                  className="w-full max-w-2xl rounded-lg border shadow-sm"
                />
              </div>
            )}

            {/* Courses Taught Section - Editable by any user */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Courses Taught</h3>
                {!editingCourses && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingCourses(true)}
                    className="hover-lift"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {editingCourses ? (
                <div className="space-y-3">
                  <Textarea
                    value={coursesText}
                    onChange={(e) => setCoursesText(e.target.value)}
                    placeholder="Enter courses, comma-separated (e.g., Data Structures, Algorithms)"
                    rows={3}
                    className="border-primary/30"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleUpdateCourses}
                      className="gradient-primary text-white"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setEditingCourses(false);
                        setCoursesText(faculty.courses_taught ? faculty.courses_taught.join(", ") : "");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {faculty.courses_taught && faculty.courses_taught.length > 0 ? (
                    faculty.courses_taught.map((course: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {course}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No courses listed yet. Click Edit to add courses.</p>
                  )}
                </div>
              )}
            </div>

            {(user?.id === faculty.created_by) && (
              <div className="mt-4">
                <Button onClick={() => navigate(`/edit-faculty/${id}`)} variant="outline" className="hover-lift">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Faculty Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="write">Write Review</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <Card key={review.id} className="shadow-soft">
                  <CardContent className="p-6">
                    {/* Review Header */}
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
                      <StarRating 
                        rating={(review.teaching_quality + review.approachability + review.clarity + review.availability + review.fairness) / 5} 
                        readonly 
                      />
                    </div>

                    {/* Review Content */}
                    <p className="text-foreground mb-4">{review.content}</p>

                    {/* Rating Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
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

                    {/* Review Like/Dislike Buttons */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={reviewVotes[review.id]?.userVote === 'like' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReviewVote(review.id, 'like')}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {reviewVotes[review.id]?.likes || 0}
                      </Button>
                      <Button
                        variant={reviewVotes[review.id]?.userVote === 'dislike' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleReviewVote(review.id, 'dislike')}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        {reviewVotes[review.id]?.dislikes || 0}
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Comment Input */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentTexts[review.id] || ""}
                          onChange={(e) => setCommentTexts({ ...commentTexts, [review.id]: e.target.value })}
                          rows={2}
                          maxLength={1000}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleSubmitComment(review.id)}
                          disabled={!commentTexts[review.id]?.trim() || submittingComment[review.id]}
                          size="icon"
                          className="self-end"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comments Section - Below Review */}
                    {comments[review.id] && comments[review.id].length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h4 className="text-sm font-semibold">Comments ({comments[review.id].length})</h4>
                        {comments[review.id].map(comment => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-xs">
                                {comment.profiles?.display_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">{comment.profiles?.display_name || "Anonymous"}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-soft">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No reviews yet</p>
                  <Button onClick={() => {
                    const writeTab = document.querySelector('[value="write"]') as HTMLElement;
                    writeTab?.click();
                  }}>
                    Write the first review
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="write">
            <Card className="shadow-medium">
              <CardContent className="p-6">
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Rate this faculty</h3>
                    <div className="grid gap-4">
                      {[
                        { key: 'teaching_quality', label: 'Teaching Quality' },
                        { key: 'approachability', label: 'Approachability' },
                        { key: 'clarity', label: 'Clarity of Communication' },
                        { key: 'availability', label: 'Availability' },
                        { key: 'fairness', label: 'Fairness in Grading' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="text-sm">{label}</Label>
                          <StarRating 
                            rating={ratings[key as keyof typeof ratings]} 
                            onRatingChange={(value) => setRatings({ ...ratings, [key]: value })} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review</Label>
                    <Textarea 
                      id="review" 
                      placeholder="Share your experience with this faculty member..." 
                      value={reviewContent} 
                      onChange={(e) => setReviewContent(e.target.value)} 
                      rows={6} 
                      maxLength={2500} 
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {reviewContent.length}/2500
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="anonymous" 
                      checked={isAnonymous} 
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)} 
                    />
                    <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                      Post anonymously
                    </Label>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacultyProfile;
