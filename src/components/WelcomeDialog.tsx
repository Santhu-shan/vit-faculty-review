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
          <DialogTitle className="text-2xl">⚠️ Important Notice</DialogTitle>
          <DialogDescription className="text-base space-y-3 pt-2">
            <p>
              <strong>This site is designed to help students make informed decisions.</strong>
            </p>
            <p>
              Please refrain from posting false reviews or engaging in any inappropriate activities.
            </p>
            <p className="text-primary font-semibold">
              🙏 Thank you to all contributors who help by adding faculty information and providing honest reviews!
            </p>
            <p className="text-sm text-muted-foreground">
              Together, we're building a trustworthy community.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
