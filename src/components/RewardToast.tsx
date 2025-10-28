import { toast } from "sonner";
import { Trophy, Award, MessageCircle } from "lucide-react";

export const showRewardToast = (points: number, action: 'faculty' | 'review' | 'comment') => {
  const messages = {
    faculty: {
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      title: "🎉 Faculty Added!",
      description: `You earned ${points} points for adding a faculty member!`
    },
    review: {
      icon: <Award className="h-5 w-5 text-blue-500" />,
      title: "⭐ Review Submitted!",
      description: `You earned ${points} points for your review!`
    },
    comment: {
      icon: <MessageCircle className="h-5 w-5 text-green-500" />,
      title: "💬 Comment Added!",
      description: `You earned ${points} points for your comment!`
    }
  };

  const message = messages[action];
  
  toast.success(message.title, {
    description: message.description,
    duration: 4000,
  });
};
