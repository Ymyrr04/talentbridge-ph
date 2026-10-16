import { Mic } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { useRecordingMedia } from "@/hooks/use-recording-media";

export function RecordingMicrophone({ media, disabled, id }: {
  media: ReturnType<typeof useRecordingMedia>; disabled: boolean; id: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Microphone</Label>
      <select id={id} value={media.deviceId} disabled={disabled} onChange={(e) => media.setDeviceId(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50">
        <option value="">System default</option>
        {media.devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>)}
      </select>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mic className="h-4 w-4" />
        <div role="meter" aria-label="Microphone sound level" aria-valuemin={0} aria-valuemax={8} aria-valuenow={media.level} className="flex gap-1">
          {Array.from({ length: 8 }, (_, i) => <span key={i} className={`h-3 w-2 rounded-sm ${i < media.level ? "bg-primary" : "bg-muted"}`} />)}
        </div>
        <span>{media.muted ? "Microphone is muted" : media.level ? "Sound detected" : "No sound detected"}</span>
      </div>
      {media.error && <p role="alert" className="text-sm text-destructive">{media.error}</p>}
    </div>
  );
}