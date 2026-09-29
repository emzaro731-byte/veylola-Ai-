import * as FileSystem from "expo-file-system";
import { execute, pickEncoder } from "munim-ffmpeg";

export type VideoScene = {
  id: string;
  type: "image" | "color";
  uri?: string;
  caption: string;
  duration: 3 | 5 | 8 | 10 | 15 | 30 | 60;
  transition: "cut" | "fade" | "zoom" | "slide";
  motion: "kenburns" | "slow-zoom";
};

export type VideoProject = {
  title: string;
  ratio: "9:16" | "16:9" | "1:1";
  fps: number;
  scenes: VideoScene[];
  audioUri?: string;
};

export type LocalVideoResult = {
  supported: boolean;
  uri?: string;
  message: string;
};

function escapeDrawText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function canvas(project: VideoProject) {
  if (project.ratio === "16:9") return { width: 1280, height: 720 };
  if (project.ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 720, height: 1280 };
}

/**
 * Local media renderer. It creates title-card scenes, image scenes,
 * transitions, optional audio, and an H.264 MP4 entirely on the device.
 */
export async function renderLocalVideo(project: VideoProject): Promise<LocalVideoResult> {
  if (!project.scenes.length) return { supported:false, message:"Add at least one scene." };

  const cache = FileSystem.cacheDirectory;
  if (!cache) return { supported:false, message:"Android cache storage is unavailable." };

  const { width, height } = canvas(project);
  const total = project.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const output = cache + `veylola-${Date.now()}.mp4`;
  const args: string[] = ["-y"];

  project.scenes.forEach(scene => {
    if (scene.type === "image" && scene.uri) {
      args.push("-loop","1","-t",String(scene.duration),"-i",scene.uri);
    } else {
      args.push("-f","lavfi","-i",`color=c=0x101827:s=${width}x${height}:r=${project.fps}:d=${scene.duration}`);
    }
  });

  if (project.audioUri) args.push("-stream_loop","-1","-i",project.audioUri);

  const filters: string[] = [];
  project.scenes.forEach((scene,index) => {
    const fadeIn = scene.transition === "fade" ? ",fade=t=in:st=0:d=0.35" : "";
    const fadeOut = scene.transition === "fade"
      ? `,fade=t=out:st=${Math.max(0,scene.duration-0.35)}:d=0.35`
      : "";
    const caption = scene.type === "color" && scene.caption
      ? `,drawtext=fontfile=/system/fonts/Roboto-Regular.ttf:text='${escapeDrawText(scene.caption)}':fontcolor=white:fontsize=${Math.max(30,Math.round(width/22))}:line_spacing=12:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=28`
      : "";

    filters.push(
      `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,format=yuv420p${caption}${fadeIn}${fadeOut}[v${index}]`
    );
  });

  filters.push(
    project.scenes.map((_,i)=>`[v${i}]`).join("") +
    `concat=n=${project.scenes.length}:v=1:a=0[vout]`
  );

  args.push("-filter_complex",filters.join(";"),"-map","[vout]");

  if (project.audioUri) {
    const audioIndex = project.scenes.length;
    args.push("-map",`${audioIndex}:a`,"-t",String(total),"-c:a","aac","-b:a","128k","-shortest");
  } else {
    args.push("-an");
  }

  const encoder = await pickEncoder(["h264_mediacodec","libopenh264","mpeg4"]);
  if (!encoder) return { supported:false, message:"No compatible Android video encoder was found." };

  args.push("-c:v",encoder,"-pix_fmt","yuv420p","-r",String(project.fps),"-movflags","+faststart",output);

  const result = await execute(args);
  if (!result.success) {
    return { supported:false, message:result.failStackTrace ?? result.output ?? "FFmpeg rendering failed." };
  }

  return { supported:true, uri:output, message:`Rendered ${total}s MP4 locally on Android.` };
}
