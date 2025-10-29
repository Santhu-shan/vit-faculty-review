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
          <DialogTitle className="text-2xl">🎉 Welcome to FacultyRate!</DialogTitle>
          <DialogDescription className="text-base space-y-4 pt-2">
            <div className="bg-gradient-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="font-semibold text-foreground mb-2">
                ✨ Earn Rewards for Helping Others!
              </p>
              <ul className="space-y-1 text-sm">
                <li>🏆 <strong>20 points</strong> - Add a faculty member</li>
                <li>⭐ <strong>10 points</strong> - Write an honest review</li>
                <li>💬 <strong>5 points</strong> - Add helpful comments</li>
              </ul>
            </div>
            
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <p className="font-semibold text-foreground mb-2">
                ⚠️ Important Guidelines
              </p>
              <p className="text-sm">
                This site helps students make informed decisions. Please post only honest reviews and refrain from any inappropriate activities. False reviews harm everyone.
              </p>
            </div>
            
            <p className="text-center font-semibold text-primary">
              🙏 Together, we're building a trustworthy community!
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
