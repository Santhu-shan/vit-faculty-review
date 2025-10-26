import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
const AddFaculty = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: "",
    name: "",
    department: "",
    photoUrl: "",
    officeHours: "",
    contactEmail: "",
    mobileNumber: "",
    coursesTaught: ""
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [detailsFile, setDetailsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
      let photoUrl = formData.photoUrl;
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
      const { error } = await supabase.from("faculty").insert({
        faculty_id: formData.facultyId || null,
        name: formData.name,
        department: formData.department,
        photo_url: photoUrl || null,
        details_image_url: detailsUrl,
        office_hours: formData.officeHours || null,
        contact_email: formData.contactEmail || null,
        mobile_number: formData.mobileNumber || null,
        courses_taught: courses.length > 0 ? courses : null,
        created_by: user.id,
        approved: true
      }).select();
      
      if (error) throw error;
      toast.success("Faculty added successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to add faculty");
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
  return <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl bg-neutral-50">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 bg-neutral-950 hover:bg-neutral-800 text-neutral-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Faculty</CardTitle>
            <CardDescription>
              Submit a faculty member. Your submission will be visible immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" placeholder="Dr. Jane Smith" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facultyId">Faculty ID (optional)</Label>
                  <Input id="facultyId" name="facultyId" placeholder="FAC001" value={formData.facultyId} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input id="department" name="department" placeholder="Computer Science" value={formData.department} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoFile">Faculty Profile Photo (optional)</Label>
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
                />
                <p className="text-xs text-muted-foreground">Upload JPG or PNG, max 5MB</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoUrl">Or enter Photo URL (optional)</Label>
                <Input id="photoUrl" name="photoUrl" type="url" placeholder="https://example.com/photo.jpg" value={formData.photoUrl} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                <Input id="contactEmail" name="contactEmail" type="email" placeholder="faculty@college.edu" value={formData.contactEmail} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeHours">Office Hours (optional)</Label>
                <Textarea id="officeHours" name="officeHours" placeholder="Mon-Fri, 2-4 PM" value={formData.officeHours} onChange={handleChange} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number (optional)</Label>
                <Input id="mobileNumber" name="mobileNumber" placeholder="+1234567890" value={formData.mobileNumber} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coursesTaught">Courses Taught (optional, comma-separated)</Label>
                <Textarea id="coursesTaught" name="coursesTaught" placeholder="Data Structures, Algorithms, Web Development" value={formData.coursesTaught} onChange={handleChange} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailsFile">Faculty Details from VTOP (optional)</Label>
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
                />
                <p className="text-xs text-muted-foreground">Upload faculty details screenshot (JPG/PNG, max 5MB)</p>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-white" 
                disabled={loading || uploading}
              >
                {loading || uploading ? "Submitting..." : "Submit Faculty"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>;
};
export default AddFaculty;