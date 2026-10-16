import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const TOOL_SUGGESTIONS = [
  "Excel", "Google Workspace", "QuickBooks", "Xero", "Canva", "HubSpot", "Shopify", "WordPress",
  "Slack", "Zapier", "Make", "n8n", "Notion", "Asana", "Trello", "ClickUp", "Salesforce",
  "Zendesk", "Gorgias", "Figma", "Photoshop", "CapCut", "ChatGPT",
];
export const MAX_TOOLS = 10;
export const TOOL_MAX_LEN = 40;

/** Adds a tool to the list; returns the new list or an error message. */
export function addTool(list: string[], raw: string): string[] | string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return list;
  if (list.some((x) => x.toLowerCase() === t.toLowerCase())) return list;
  if (t.length > TOOL_MAX_LEN) return `Tool names can be up to ${TOOL_MAX_LEN} characters.`;
  if (list.length >= MAX_TOOLS) return `You can add up to ${MAX_TOOLS} tools.`;
  return [...list, t];
}

export function ToolsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const full = value.length >= MAX_TOOLS;
  const q = text.trim().toLowerCase();
  const suggestions = q
    ? TOOL_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q) && !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 6)
    : [];

  const add = (raw: string) => {
    const r = addTool(value, raw);
    if (typeof r === "string") { toast.error(r); return; }
    onChange(r);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
    else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="tools">Must-have tools (optional)</Label>
        <span className="text-xs text-muted-foreground">{value.length}/{MAX_TOOLS}</span>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Input id="tools" value={text} disabled={full} maxLength={TOOL_MAX_LEN + 5}
          placeholder={full ? "Limit reached" : "Type a tool and press Enter"}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) { const parts = v.split(","); let cur = value;
              for (const p of parts.slice(0, -1)) { const r = addTool(cur, p); if (typeof r === "string") { toast.error(r); break; } cur = r; }
              onChange(cur); setText(parts[parts.length - 1] ?? ""); }
            else setText(v);
          }}
          onKeyDown={onKey} />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="block w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent">{s}</button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Tools the candidate must already know.</p>
    </div>
  );
}
