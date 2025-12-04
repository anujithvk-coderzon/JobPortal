'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { reportAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Flag, CheckCircle2, X } from 'lucide-react';

interface ReportModalProps {
  postId: string;
  postTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam / Advertisement' },
  { value: 'MISLEADING', label: 'Misleading Information' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'HARASSMENT', label: 'Harassment / Bullying' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportModal({
  postId,
  postTitle,
  open,
  onOpenChange,
  onReportSuccess,
}: ReportModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when "Other" is selected
  useEffect(() => {
    if (reason === 'OTHER' && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [reason]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Please select a reason',
        description: 'You must select a reason for your report.',
        variant: 'destructive',
      });
      return;
    }

    if (reason === 'OTHER' && !description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide details for your report.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await reportAPI.reportPost(postId, {
        reason,
        description: description.trim() || undefined,
      });

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
      });

      setReason('');
      setDescription('');
      onOpenChange(false);
      onReportSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit report';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setDescription('');
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Mobile: Bottom Sheet | Desktop: Centered Modal */}
      <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-4">
        <div className="w-full sm:max-w-md bg-background rounded-t-[20px] sm:rounded-2xl shadow-2xl max-h-[80vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
          {/* Handle & Header */}
          <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b flex-shrink-0">
            {/* Drag Handle - Mobile only */}
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="w-9 h-1 bg-muted-foreground/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Flag className="h-5 w-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-base sm:text-lg">Report Post</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {postTitle.length > 40 ? postTitle.slice(0, 40) + '...' : postTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 min-h-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Why are you reporting?
            </Label>

            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 text-left transition-all hover:bg-muted/30 active:scale-[0.98] ${
                    reason === item.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/50'
                  }`}
                >
                  <span className={`font-medium text-sm sm:text-base ${reason === item.value ? 'text-primary' : ''}`}>
                    {item.label}
                  </span>
                  {reason === item.value && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Description for Other */}
            {reason === 'OTHER' && (
              <div className="mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tell us more (required)
                </Label>
                <Textarea
                  ref={textareaRef}
                  placeholder="Describe the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-[100px] sm:min-h-[120px] resize-none text-base bg-muted/50 border-0 focus-visible:ring-1"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {description.length}/500
                </p>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t flex-shrink-0 bg-background safe-area-bottom">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !reason || (reason === 'OTHER' && !description.trim())}
                variant="destructive"
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base font-medium"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
