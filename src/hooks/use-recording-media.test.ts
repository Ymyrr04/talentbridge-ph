import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRecordingMedia } from "./use-recording-media";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("recording microphone", () => {
  it("captures a live enabled microphone for video and releases it on exit", async () => {
    const stop = vi.fn();
    const track = { enabled: false, muted: false, readyState: "live", stop };
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal("MediaRecorder", class {});
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) } });
    const { result, unmount } = renderHook(() => useRecordingMedia(true));
    await waitFor(() => expect(result.current.stream).toBe(stream));
    expect(track.enabled).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it("does not permit a recording without an audio track", async () => {
    const stop = vi.fn();
    vi.stubGlobal("MediaRecorder", class {});
    vi.stubGlobal("navigator", { mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({ getAudioTracks: () => [], getTracks: () => [{ stop }] }),
    } });
    const { result } = renderHook(() => useRecordingMedia(false));
    await waitFor(() => expect(result.current.error).toContain("No microphone is available"));
    expect(result.current.stream).toBeNull();
    expect(stop).toHaveBeenCalled();
  });
});