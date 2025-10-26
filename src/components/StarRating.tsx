import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}

const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  onRatingChange,
  readonly = false 
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        const isPartial = starValue > rating && starValue - 1 < rating;
        
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(starValue)}
            disabled={readonly}
            className={cn(
              "transition-all",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled && "fill-warning text-warning",
                isPartial && "fill-warning/50 text-warning",
                !isFilled && !isPartial && "fill-none text-muted-foreground"
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating;
