import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import FacultyCard from "@/components/FacultyCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const SearchFaculty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

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
    if (user && searchQuery) {
      handleSearch(searchQuery);
    }
  }, [user, searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setFaculty([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("approved", true)
        .or(`name.ilike.%${query}%,department.ilike.%${query}%,faculty_id.ilike.%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFaculty(data || []);
    } catch (error: any) {
      toast.error("Failed to search faculty");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Search Faculty</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, department, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : faculty.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-4">
              Found {faculty.length} {faculty.length === 1 ? 'result' : 'results'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faculty.map(f => (
                <FacultyCard key={f.id} faculty={f} />
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No faculty found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Enter a search term to find faculty</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchFaculty;
