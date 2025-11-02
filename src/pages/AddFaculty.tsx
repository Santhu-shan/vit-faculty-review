import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Upload, Star } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import { showRewardToast } from "@/components/RewardToast";
import { Checkbox } from "@/components/ui/checkbox";

const AddFaculty = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: "",
    name: "",
    department: "",
    contactEmail: "",
    coursesTaught: ""
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [detailsFile, setDetailsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Review fields
  const [addReview, setAddReview] = useState(false);
  const [reviewData, setReviewData] = useState({
    content: "",
    teachingQuality: 3,
    clarity: 3,
    approachability: 3,
    availability: 3,
    fairness: 3,
    isAnonymous: false
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setUploading(true);
    
    try {
      let photoUrl = null;
      let detailsUrl = null;

      // Upload faculty photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const uploadResult = await supabase.storage
          .from('faculty_photos')
          .upload(filePath, photoFile);

        if (uploadResult.error) throw uploadResult.error;

        const { data: { publicUrl } } = supabase.storage
          .from('faculty_photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      // Upload faculty details image if provided
      if (detailsFile) {
        const fileExt = detailsFile.name.split('.').pop();
        const fileName = `details_${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const uploadResult = await supabase.storage
          .from('faculty_details')
          .upload(filePath, detailsFile);

        if (uploadResult.error) throw uploadResult.error;

        const { data: { publicUrl } } = supabase.storage
          .from('faculty_details')
          .getPublicUrl(filePath);

        detailsUrl = publicUrl;
      }

      const courses = formData.coursesTaught.split(",").map(c => c.trim()).filter(c => c);
      const { data: facultyData, error: facultyError } = await supabase.from("faculty").insert({
        faculty_id: formData.facultyId || null,
        name: formData.name,
        department: formData.department,
        photo_url: photoUrl,
        details_image_url: detailsUrl,
        contact_email: formData.contactEmail || null,
        courses_taught: courses.length > 0 ? courses : null,
        created_by: user.id,
        approved: true
      }).select().single();
      
      if (facultyError) throw facultyError;

      // Add review if checkbox is checked
      if (addReview && reviewData.content.trim()) {
        const { error: reviewError } = await supabase.from("reviews").insert({
          faculty_id: facultyData.id,
          user_id: user.id,
          content: reviewData.content,
          teaching_quality: reviewData.teachingQuality,
          clarity: reviewData.clarity,
          approachability: reviewData.approachability,
          availability: reviewData.availability,
          fairness: reviewData.fairness,
          is_anonymous: reviewData.isAnonymous,
          status: "approved"
        });

        if (reviewError) throw reviewError;
        showRewardToast(20, 'faculty');
        showRewardToast(10, 'review');
      } else {
        showRewardToast(20, 'faculty');
      }

      toast.success("Faculty added successfully!");
      navigate("/");
    } catch (error: any) {
      if (error.code === '23505' && error.message?.includes('faculty_contact_email_unique')) {
        toast.error("Faculty already exists with this email address");
      } else {
        toast.error(error.message || "Failed to add faculty");
      }
      console.error(error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 hover-lift"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-colorful glass-effect animate-slide-up">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Add New Faculty
            </CardTitle>
            <CardDescription>
              Submit a faculty member and optionally add your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Faculty Information
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Dr. Jane Smith" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facultyId">Faculty ID (optional)</Label>
                    <Input 
                      id="facultyId" 
                      name="facultyId" 
                      placeholder="FAC001" 
                      value={formData.facultyId} 
                      onChange={handleChange}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input 
                    id="department" 
                    name="department" 
                    placeholder="Computer Science" 
                    value={formData.department} 
                    onChange={handleChange} 
                    required
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                  <Input 
                    id="contactEmail" 
                    name="contactEmail" 
                    type="email" 
                    placeholder="faculty@college.edu" 
                    value={formData.contactEmail} 
                    onChange={handleChange}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coursesTaught">Courses Taught (optional, comma-separated)</Label>
                  <Textarea 
                    id="coursesTaught" 
                    name="coursesTaught" 
                    placeholder="Data Structures, Algorithms, Web Development" 
                    value={formData.coursesTaught} 
                    onChange={handleChange} 
                    rows={2}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoFile">Profile Photo (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="photoFile" 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File size must be less than 5MB");
                            e.target.value = '';
                            return;
                          }
                          setPhotoFile(file);
                        }
                      }}
                      className="border-primary/20"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">JPG or PNG, max 5MB</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detailsFile">Faculty Details from VTOP (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="detailsFile" 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File size must be less than 5MB");
                            e.target.value = '';
                            return;
                          }
                          setDetailsFile(file);
                        }
                      }}
                      className="border-primary/20"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Screenshot (JPG/PNG, max 5MB)</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Optional Review Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="addReview" 
                    checked={addReview}
                    onCheckedChange={(checked) => setAddReview(checked as boolean)}
                  />
                  <Label htmlFor="addReview" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Add Your Review (Optional)
                  </Label>
                </div>

                {addReview && (
                  <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="reviewContent">Review Content *</Label>
                      <Textarea 
                        id="reviewContent"
                        placeholder="Share your experience with this faculty member..." 
                        value={reviewData.content}
                        onChange={(e) => setReviewData({...reviewData, content: e.target.value})}
                        rows={4}
                        className="border-primary/30"
                        required={addReview}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { key: 'teachingQuality', label: 'Teaching Quality' },
                        { key: 'clarity', label: 'Clarity' },
                        { key: 'approachability', label: 'Approachability' },
                        { key: 'availability', label: 'Availability' },
                        { key: 'fairness', label: 'Fairness' }
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>{label} (1-5)</Label>
                          <Input 
                            id={key}
                            type="number" 
                            min="1" 
                            max="5"
                            value={reviewData[key as keyof typeof reviewData] as number}
                            onChange={(e) => setReviewData({
                              ...reviewData, 
                              [key]: parseInt(e.target.value)
                            })}
                            className="border-primary/30"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isAnonymous"
                        checked={reviewData.isAnonymous}
                        onCheckedChange={(checked) => setReviewData({
                          ...reviewData, 
                          isAnonymous: checked as boolean
                        })}
                      />
                      <Label htmlFor="isAnonymous" className="cursor-pointer">
                        Post anonymously
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-white text-lg py-6 hover-lift animate-pulse-glow" 
                disabled={loading || uploading}
              >
                {loading || uploading ? "Submitting..." : "Submit Faculty" + (addReview ? " & Review" : "")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddFaculty;
