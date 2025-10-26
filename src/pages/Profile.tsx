import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, MessageSquare, Star } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      fetchProfile();
      fetchUserReviews();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setProfile(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          faculty(name, department)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const uploadResult = await supabase.storage
        .from('user_avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadResult.error) throw uploadResult.error;

      const { data: { publicUrl } } = supabase.storage
        .from('user_avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  if (!user || loading) {
    return null;
  }

  const initials = profile?.display_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8 shadow-medium">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <span className="text-white text-xs">Upload</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile?.display_name || "User"}
                </h1>
                <p className="text-muted-foreground mb-3">{user.email}</p>
                <div className="flex gap-2">
                  <Badge className="gradient-primary text-white">
                    {profile?.role === 'admin' ? 'Admin' : 'Student'}
                  </Badge>
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    {profile?.points || 0} Points
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground">Reviews Written</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-3xl font-bold">
                {reviews.filter(r => r.status === 'approved').length}
              </p>
              <p className="text-sm text-muted-foreground">Approved Reviews</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-3xl font-bold">{profile?.points || 0}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Your Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 border rounded-lg hover:shadow-soft transition-shadow cursor-pointer"
                    onClick={() => navigate(`/faculty/${review.faculty_id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{review.faculty?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {review.faculty?.department}
                        </p>
                      </div>
                      <Badge
                        variant={
                          review.status === 'approved'
                            ? 'default'
                            : review.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {review.status}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{review.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't written any reviews yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
