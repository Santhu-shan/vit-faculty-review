import { toast } from "sonner";
import { Trophy, Award, MessageCircle, Star, Heart } from "lucide-react";

export const showRewardToast = (points: number, action: 'faculty' | 'review' | 'comment') => {
  const messages = {
    faculty: {
      title: "🎉 Congratulations!",
      description: `You earned ${points} points for adding a faculty member! Thank you for helping other students make informed decisions! 🌟`,
      icon: "🏆"
    },
    review: {
      title: "⭐ Amazing Work!",
      description: `You earned ${points} points! Your honest review helps fellow students choose the right courses. Keep it up! 💪`,
      icon: "⭐"
    },
    comment: {
      title: "💬 Great Contribution!",
      description: `You earned ${points} points! Your comment adds valuable insight. Together we're building a better community! 🙏`,
      icon: "💬"
    }
  };

  const message = messages[action];
  
  toast.success(message.title, {
    description: message.description,
    duration: 5000,
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      fontSize: '16px',
    }
  });
};
