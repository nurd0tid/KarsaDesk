import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-destructive/20 h-64 bg-destructive/5">
      <AlertTriangle className="size-12 text-destructive mb-4 opacity-80" />
      <h3 className="text-lg font-medium text-destructive mb-2">Something went wrong</h3>
      <p className="text-sm text-destructive/80 max-w-sm mb-6">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10">
          <RefreshCcw className="mr-2 size-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}