import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Users, BookOpen, MessageSquare, Trash2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFaculty, setPendingFaculty] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [pendingComments, setPendingComments] = useState<any[]>([]);
  const [allFaculty, setAllFaculty] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

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
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllItems();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (data?.role === "admin") {
        setIsAdmin(true);
        fetchPendingItems();
        fetchAllItems();
      } else {
        toast.error("Access denied: Admin only");
        navigate("/");
      }
    } catch (error: any) {
      console.error(error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const [facultyRes, reviewsRes, commentsRes] = await Promise.all([
        supabase.from("faculty").select("*").eq("approved", false),
        supabase.from("reviews").select(`*, faculty(name), profiles!reviews_user_id_fkey(display_name)`).eq("status", "pending"),
        supabase.from("comments").select(`*, profiles!comments_user_id_fkey(display_name)`).eq("status", "pending"),
      ]);

      setPendingFaculty(facultyRes.data || []);
      setPendingReviews(reviewsRes.data || []);
      setPendingComments(commentsRes.data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchAllItems = async () => {
    try {
      const [facultyRes, reviewsRes, commentsRes, usersRes] = await Promise.all([
        supabase.from("faculty").select("*"),
        supabase.from("reviews").select(`*, faculty(name), profiles!reviews_user_id_fkey(display_name)`),
        supabase.from("comments").select(`*, profiles!comments_user_id_fkey(display_name)`),
        supabase.from("profiles").select("*"),
      ]);

      setAllFaculty(facultyRes.data || []);
      setAllReviews(reviewsRes.data || []);
      setAllComments(commentsRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const approveFaculty = async (id: string) => {
    try {
      const { error } = await supabase
        .from("faculty")
        .update({ approved: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Faculty approved");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to approve faculty");
    }
  };

  const rejectFaculty = async (id: string) => {
    try {
      const { error } = await supabase
        .from("faculty")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Faculty rejected and removed");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to reject faculty");
    }
  };

  const approveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Review approved");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to approve review");
    }
  };

  const rejectReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "rejected", rejection_reason: "Inappropriate content" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Review rejected");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to reject review");
    }
  };

  const approveComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Comment approved");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to approve comment");
    }
  };

  const rejectComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      toast.success("Comment rejected");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to reject comment");
    }
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this faculty? This will also delete all associated reviews and comments.")) return;
    
    try {
      const { error } = await supabase.from("faculty").delete().eq("id", id);
      if (error) throw error;
      toast.success("Faculty deleted");
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to delete faculty");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This will also delete all associated comments.")) return;
    
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Review deleted");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to delete review");
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Comment deleted");
      fetchPendingItems();
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to delete comment");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will delete their profile, all reviews, and comments.")) return;
    
    try {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
      toast.success("User deleted");
      fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to delete user");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  if (!user || loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{pendingFaculty.length}</p>
              <p className="text-sm text-muted-foreground">Pending Faculty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold">{pendingReviews.length}</p>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold">{pendingComments.length}</p>
              <p className="text-sm text-muted-foreground">Pending Comments</p>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Tabs */}
        <Tabs defaultValue="faculty">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="faculty">Pending Faculty ({pendingFaculty.length})</TabsTrigger>
            <TabsTrigger value="reviews">Pending Reviews ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value="comments">Pending Comments ({pendingComments.length})</TabsTrigger>
            <TabsTrigger value="manage">Manage All</TabsTrigger>
            <TabsTrigger value="users">Users ({allUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Faculty Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingFaculty.length > 0 ? (
                  <div className="space-y-4">
                    {pendingFaculty.map((faculty) => (
                      <div key={faculty.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{faculty.name}</h3>
                            <p className="text-muted-foreground">{faculty.department}</p>
                            <Badge className="mt-2">ID: {faculty.faculty_id}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-success text-white"
                              onClick={() => approveFaculty(faculty.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectFaculty(faculty.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending faculty approvals
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Review Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReviews.length > 0 ? (
                  <div className="space-y-4">
                    {pendingReviews.map((review) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="mb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold">{review.faculty?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                By: {review.is_anonymous ? "Anonymous" : review.profiles?.display_name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-success text-white"
                                onClick={() => approveReview(review.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectReview(review.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm">{review.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending reviews
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Comment Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingComments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingComments.map((comment) => (
                      <div key={comment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-1">
                              {comment.profiles?.display_name}
                            </p>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-success text-white"
                              onClick={() => approveComment(comment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectComment(comment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending comments
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage All Tab */}
          <TabsContent value="manage" className="mt-6">
            <div className="space-y-6">
              {/* All Faculty */}
              <Card>
                <CardHeader>
                  <CardTitle>All Faculty ({allFaculty.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allFaculty.map((faculty) => (
                      <div key={faculty.id} className="p-3 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{faculty.name}</p>
                          <p className="text-sm text-muted-foreground">{faculty.department}</p>
                        </div>
                        <Button onClick={() => deleteFaculty(faculty.id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>All Reviews ({allReviews.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allReviews.map((review) => (
                      <div key={review.id} className="p-3 border rounded flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{review.faculty?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{review.content}</p>
                        </div>
                        <Button onClick={() => deleteReview(review.id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>All Comments ({allComments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allComments.map((comment) => (
                      <div key={comment.id} className="p-3 border rounded flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.profiles?.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{comment.content}</p>
                        </div>
                        <Button onClick={() => deleteComment(comment.id)} size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({allUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {allUsers.map((user) => (
                    <div key={user.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{user.display_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.bio || "No bio"} • {user.points || 0} points
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={() => deleteUser(user.user_id)} size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
