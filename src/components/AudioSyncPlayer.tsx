import React from 'react';
import { Volume2, Play, Pause, RotateCcw } from 'lucide-react';
import {
  APPROVED_AUDIO_RECORDINGS,
  ApprovedAudioRecording,
} from '../data/dossierData';

export interface AudioSyncPlayerProps {
  selectedRecordingId: string;
  isClarificationPlaying: boolean;
  isExecAppealPlaying: boolean;
  isMainDossierPlaying: boolean;
  currentTime: number;
  duration: number;
  activeTitle: string;
  onSelectRecording: (recordingId: ApprovedAudioRecording['id']) => void;
  onTogglePlayCurrent: () => void;
  onRestartCurrent: () => void;
  onSeek: (timeSec: number) => void;
  formatTime: (sec: number) => string;
}

export const AudioSyncPlayer: React.FC<AudioSyncPlayerProps> = ({
  selectedRecordingId,
  isClarificationPlaying,
  isExecAppealPlaying,
  isMainDossierPlaying,
  currentTime,
  duration,
  activeTitle,
  onSelectRecording,
  onTogglePlayCurrent,
  onRestartCurrent,
  onSeek,
  formatTime,
}) => {
  const isAnyPlaying =
    isClarificationPlaying || isExecAppealPlaying || isMainDossierPlaying;

  return (
    <div className="rounded-2xl bg-[#1f0b38]/65 border border-[#c9a452] p-4 sm:p-5 no-print">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c9a452]/35">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-[#e7cb82] shrink-0" />
          <span className="text-xs font-black text-[#f3dfa6]">
            المشغل الصوتي الرسمي المعتمد (الأسئلة الاستيضاحية خيار أساسي · منقّح بدون تكرار):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <select
            aria-label="اختيار التسجيل الصوتي المعتمد"
            value={selectedRecordingId}
            onChange={(e) =>
              onSelectRecording(e.target.value as ApprovedAudioRecording['id'])
            }
            className="bg-[#140526]/90 border border-[#c9a452] text-[#f3dfa6] rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
          >
            {APPROVED_AUDIO_RECORDINGS.map((rec) => (
              <option key={rec.id} value={rec.id}>
                {rec.title} ({rec.durationLabel})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 flex-wrap">
            {APPROVED_AUDIO_RECORDINGS.map((rec) => {
              const isActiveRec =
                (rec.id === 'clarification-questions' && isClarificationPlaying) ||
                (rec.id === 'executive-appeal' && isExecAppealPlaying) ||
                (rec.id === 'main-dossier' && isMainDossierPlaying);

              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecording(rec.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${
                    isActiveRec || selectedRecordingId === rec.id
                      ? 'gold-metallic-card'
                      : 'bg-[#2b124c]/80 text-[#f3dfa6] border-[#c9a452]/60'
                  }`}
                >
                  {isActiveRec ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{rec.badge}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlayCurrent}
            className="gold-metallic-card px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            {isAnyPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تشغيل الصوت المتزامن</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestartCurrent}
            className="px-3 py-2 rounded-xl bg-[#2b124c]/80 border border-[#c9a452] text-[#f3dfa6] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#e7cb82]" />
            <span>من البداية</span>
          </button>

          <span className="text-xs font-extrabold text-[#f3dfa6] truncate max-w-md">
            {activeTitle}
          </span>
        </div>

        <span className="font-mono text-xs font-bold text-[#e7cb82] bg-black/35 px-3 py-1 rounded-lg border border-[#c9a452]/40 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="mt-2.5">
        <input
          type="range"
          min={0}
          max={duration || 418}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-[#e7cb82] cursor-pointer h-1.5 rounded-lg"
        />
      </div>
    </div>
  );
};

export default AudioSyncPlayer;
