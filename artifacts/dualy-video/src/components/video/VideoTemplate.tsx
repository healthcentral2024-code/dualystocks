import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence } from 'framer-motion';

import { PersistentBackground } from './video_scenes/Shared';
import Scene01_Intro from './video_scenes/Scene01_Intro';
import Scene02_Analysis from './video_scenes/Scene02_Analysis';
import Scene03_Screener from './video_scenes/Scene03_Screener';
import Scene04_Outro from './video_scenes/Scene04_Outro';

export const SCENE_DURATIONS = {
  intro: 5500,
  analysis: 6500,
  screener: 5500,
  outro: 4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene01_Intro,
  analysis: Scene02_Analysis,
  screener: Scene03_Screener,
  outro: Scene04_Outro,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div
      className="w-full h-screen overflow-hidden relative bg-slate-950 font-body"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {/* Persistent Background Layer */}
      <PersistentBackground sceneIndex={sceneIndex} />

      {/* mode="sync" = simultaneous, allowing overlapping transitions between scenes */}
      <AnimatePresence mode="sync">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
