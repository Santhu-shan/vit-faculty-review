import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const EditFaculty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    facultyId: "",
    contactEmail: "",
    officeHours: "",
    mobileNumber: "",
    photoUrl: "",
    photoFile: null as File | null,
    detailsFile: null as File | null,
    coursesTaught: [] as string[],
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
    }
  }, [user, id]);

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.created_by !== user?.id) {
        toast.error("You don't have permission to edit this faculty");
        navigate(`/faculty/${id}`);
        return;
      }

      setFormData({
        name: data.name || "",
        department: data.department || "",
        facultyId: data.faculty_id || "",
        contactEmail: data.contact_email || "",
        officeHours: data.office_hours || "",
        mobileNumber: data.mobile_number || "",
        photoUrl: data.photo_url || "",
        photoFile: null,
        detailsFile: null,
        coursesTaught: data.courses_taught || [],
      });
    } catch (error: any) {
      toast.error("Failed to load faculty details");
      console.error(error);
      navigate(`/faculty/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.department) {
      toast.error("Name and Department are required");
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = formData.photoUrl;
      let detailsImageUrl = formData.photoUrl;

      // Upload photo if new file selected
      if (formData.photoFile) {
        const fileExt = formData.photoFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("faculty_photos")
          .upload(fileName, formData.photoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("faculty_photos")
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      // Upload details image if new file selected
      if (formData.detailsFile) {
        const fileExt = formData.detailsFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}-details.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("faculty_details")
          .upload(fileName, formData.detailsFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("faculty_details")
          .getPublicUrl(fileName);
        detailsImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("faculty")
        .update({
          name: formData.name,
          department: formData.department,
          faculty_id: formData.facultyId || null,
          contact_email: formData.contactEmail,
          office_hours: formData.officeHours,
          mobile_number: formData.mobileNumber || null,
          photo_url: photoUrl,
          details_image_url: detailsImageUrl,
          courses_taught: formData.coursesTaught,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Faculty updated successfully!");
      navigate(`/faculty/${id}`);
    } catch (error: any) {
      // Check for unique constraint violation on email
      if (error.code === '23505' && error.message?.includes('faculty_contact_email_unique')) {
        toast.error("Faculty already exists with this email address");
      } else {
        toast.error(error.message || "Failed to update faculty");
      }
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo file size must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      setFormData({ ...formData, photoFile: file });
    }
  };

  const handleDetailsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Details file size must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      setFormData({ ...formData, detailsFile: file });
    }
  };

  if (!user || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(`/faculty/${id}`)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Faculty</CardTitle>
            <CardDescription>Update faculty information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Dr. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    required
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty-id">Faculty ID (Optional)</Label>
                  <Input
                    id="faculty-id"
                    value={formData.facultyId}
                    onChange={(e) =>
                      setFormData({ ...formData, facultyId: e.target.value })
                    }
                    placeholder="e.g., FAC001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    placeholder="faculty@university.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office-hours">Office Hours (Optional)</Label>
                  <Input
                    id="office-hours"
                    value={formData.officeHours}
                    onChange={(e) =>
                      setFormData({ ...formData, officeHours: e.target.value })
                    }
                    placeholder="e.g., Mon-Fri 2-4 PM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-number">Mobile Number (Optional)</Label>
                  <Input
                    id="mobile-number"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, mobileNumber: e.target.value })
                    }
                    placeholder="e.g., +1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo-file">Faculty Profile Photo</Label>
                  <Input
                    id="photo-file"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload JPG or PNG (max 5MB). Leave empty to keep current photo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo-url">Photo URL (Optional)</Label>
                  <Input
                    id="photo-url"
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details-file">Faculty Details from VTOP (Optional)</Label>
                  <Input
                    id="details-file"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleDetailsFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload JPG or PNG (max 5MB). Leave empty to keep current image.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-gray-900"
                >
                  {submitting ? "Updating..." : "Update Faculty"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditFaculty;
