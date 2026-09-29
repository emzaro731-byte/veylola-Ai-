export type LocalVideoRequest = {
  prompt: string;
  seconds: 4 | 8 | 12;
  width: number;
  height: number;
};

export type LocalVideoResult = {
  supported: boolean;
  uri?: string;
  message: string;
};

/**
 * Native Android video rendering bridge.
 *
 * The JavaScript API is intentionally isolated here so a native MediaCodec/
 * OpenGL renderer can be added without changing the Video Studio UI.
 */
export async function renderLocalVideo(_request: LocalVideoRequest): Promise<LocalVideoResult> {
  return {
    supported: false,
    message:
      "Native on-device video encoding is not installed in this Expo build yet. Use the API fallback or add the Android native renderer module."
  };
}