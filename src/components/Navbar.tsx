import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
interface NavbarProps {
  user: any;
  onLogout: () => void;
  onSearch?: (query: string) => void;
}
const Navbar = ({
  user,
  onLogout,
  onSearch
}: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  return <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-soft">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 rounded-none bg-slate-400">
        <div className="flex h-16 items-center justify-between bg-slate-400 rounded-sm">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="gradient-primary p-2 transition-transform group-hover:scale-105 bg-slate-950 rounded-sm">
              <Star className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-slate-950">
              FacultyRate
            </span>
          </Link>

          {user && <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search faculty by name or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 px-[30px] bg-neutral-100" />
              </div>
            </form>}

          <div className="flex items-center space-x-2">
            {user ? <>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </> : <Link to="/auth">
                <Button className="gradient-primary text-white">Sign In</Button>
              </Link>}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;