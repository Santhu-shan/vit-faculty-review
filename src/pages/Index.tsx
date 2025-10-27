import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Session, User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import FacultyCard from "@/components/FacultyCard";
import { Plus, TrendingUp, Users, Award } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-bg.jpg";
const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      fetchFaculty();
    } else {
      setLoading(false);
    }
  }, [user]);
  const fetchFaculty = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("faculty").select("*").eq("approved", true).order("created_at", {
        ascending: false
      }).limit(6);
      if (error) throw error;
      setFaculty(data || []);
    } catch (error: any) {
      toast.error("Failed to load faculty");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  if (!user) {
    return <div className="min-h-screen">
        <Navbar user={user} onLogout={handleLogout} />
        
        <div className="relative overflow-hidden">
          {/* Hero Section */}
          <div className="relative h-[600px] flex items-center justify-center" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.9), rgba(109, 40, 217, 0.9)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
            <div className="container mx-auto px-4 text-center text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Rate Your Faculty,
                <br />
                Help Your Peers
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
                Join thousands of students sharing honest reviews and making informed decisions about their courses.
              </p>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-glow" onClick={() => navigate("/auth")}>
                Get Started Free
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Why Choose FacultyRate?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-all">
                  <div className="inline-block p-4 rounded-full gradient-primary mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Student Community</h3>
                  <p className="text-muted-foreground">
                    Real reviews from real students, helping you make the best choices for your education.
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-all">
                  <div className="inline-block p-4 rounded-full gradient-primary mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Verified Ratings</h3>
                  <p className="text-muted-foreground">
                    Multi-criteria ratings across teaching quality, approachability, and more.
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-card shadow-soft hover:shadow-medium transition-all">
                  <div className="inline-block p-4 rounded-full gradient-primary mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Smart Search</h3>
                  <p className="text-muted-foreground">
                    Quickly find faculty by name, department, or ID with our powerful search.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} onSearch={handleSearch} className="bg-slate-400 rounded-sm" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Important Notice */}
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            ⚠️ <strong>Important:</strong> This site is designed to help students make informed decisions. 
            Please refrain from posting false reviews or engaging in any inappropriate activities. 
            We appreciate all contributors who help by adding faculty information and providing honest reviews. 
            Thank you for building a trustworthy community! 🙏
          </p>
        </div>
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Discover faculty reviews and share your experiences
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate("/add-faculty")} className="gradient-primary text-white bg-neutral-950 font-extralight rounded-full text-justify text-base">
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
            <Button variant="outline" onClick={() => navigate("/browse")}>
              Browse All Faculty
            </Button>
            <Button variant="outline" onClick={() => navigate("/search")}>
              Search Faculty
            </Button>
          </div>
        </div>

        {/* Recently Added Faculty */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recently Added Faculty</h2>
          {loading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />)}
            </div> : faculty.length > 0 ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50">
              {faculty.map(f => <FacultyCard key={f.id} faculty={f} />)}
            </div> : <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground mb-4">No faculty added yet</p>
              <Button onClick={() => navigate("/add-faculty")}>
                Add First Faculty
              </Button>
            </div>}
        </div>
      </main>
    </div>;
};
export default Index;