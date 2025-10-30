import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WelcomeDialog = ({ open, onOpenChange }: WelcomeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl">🎉 Welcome to FacultyRate!</DialogTitle>
          <DialogDescription className="text-base space-y-6 pt-4">
            <div className="bg-destructive/10 p-6 rounded-lg border-2 border-destructive/30">
              <p className="font-bold text-foreground mb-3 text-lg">
                ⚠️ Important Guidelines
              </p>
              <p className="text-base leading-relaxed">
                This site helps students make informed decisions. Please post only honest reviews and refrain from any inappropriate activities. False reviews harm everyone.
              </p>
            </div>
            
            <div className="bg-gradient-primary/10 p-5 rounded-lg border border-primary/20">
              <p className="font-semibold text-foreground mb-3 text-base">
                ✨ Earn Rewards for Helping Others!
              </p>
              <ul className="space-y-2 text-sm">
                <li>🏆 <strong>20 points</strong> - Add a faculty member</li>
                <li>⭐ <strong>10 points</strong> - Write an honest review</li>
                <li>💬 <strong>5 points</strong> - Add helpful comments</li>
              </ul>
            </div>
            
            <p className="text-center font-semibold text-primary text-base">
              🙏 Together, we're building a trustworthy community!
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
