interface AudioPlayerProps {
  src: string | null | undefined;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  if (!src) {
    return (
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
        Not available yet
      </div>
    );
  }
  return (
    <audio
      controls
      src={src}
      className="w-full h-10 rounded-lg [&::-webkit-media-controls-panel]:bg-slate-50"
    >
      Your browser does not support the audio element.
    </audio>
  );
}
