import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FacultyCardProps {
  faculty: {
    id: string;
    name: string;
    department: string;
    photo_url?: string | null;
    faculty_id: string;
  };
}

const FacultyCard = ({ faculty }: FacultyCardProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchReviewStats();
  }, [faculty.id]);

  const fetchReviewStats = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("teaching_quality, approachability, clarity, availability, fairness")
        .eq("faculty_id", faculty.id)
        .eq("status", "approved");

      if (error) throw error;

      if (data && data.length > 0) {
        const sum = data.reduce((acc, review) => {
          return acc + (review.teaching_quality + review.approachability + review.clarity + review.availability + review.fairness) / 5;
        }, 0);
        setAverageRating(sum / data.length);
        setReviewCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };
  const initials = faculty.name.split(" ").map(n => n[0]).join("").toUpperCase();
  return <Link to={`/faculty/${faculty.id}`}>
      <Card className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in">
        <CardContent className="p-6 bg-neutral-50">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
              <AvatarImage src={faculty.photo_url || undefined} alt={faculty.name} />
              <AvatarFallback className="bg-gradient-primary text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                {faculty.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {faculty.department}
              </p>
              <Badge variant="outline" className="text-xs mb-3">
                ID: {faculty.faculty_id}
              </Badge>
              
              <div className="flex items-center justify-between">
                <StarRating rating={averageRating} size="sm" readonly />
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {reviewCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>;
};
export default FacultyCard;