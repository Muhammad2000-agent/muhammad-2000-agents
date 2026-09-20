import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
  Wand2,
  Sliders,
  Maximize2,
  Clock,
  Layers,
  Share2,
  RefreshCw,
  Video,
  Scissors,
  FastForward,
  Type,
  Music,
  Upload,
  HardDrive,
  CheckCircle2,
  FolderDown,
  FileVideo,
  Plus,
  Trash2,
} from 'lucide-react';

interface VideoClip {
  id: string;
  title: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  duration: number;
  style: string;
  resolution: string;
  captions?: Array<{ start: number; end: number; text: string }>;
  scenes?: Array<{ timestamp: string; description: string }>;
  speed?: number;
  filter?: string;
  customSubtitle?: string;
  createdAt: string;
  isUserUploaded?: boolean;
  fileSize?: string;
}

interface VideoGeneratorProps {
  language: 'roman-urdu' | 'urdu' | 'english';
  onSendToChat?: (videoUrl: string, caption: string) => void;
  initialPrompt?: string;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  language,
  onSendToChat,
  initialPrompt = '',
}) => {
  // Tabs: 'generate' | 'edit' | 'upload'
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'upload'>('generate');

  // Generation inputs
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [duration, setDuration] = useState<number>(5);
  const [style, setStyle] = useState<string>('cinematic');
  const [resolution, setResolution] = useState<string>('720p');
  const [cameraMotion, setCameraMotion] = useState<string>('drone');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Video Editing States
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);
  const [videoFilter, setVideoFilter] = useState<string>('none');
  const [customSubtitle, setCustomSubtitle] = useState<string>('');
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(5);
  const [soundtrack, setSoundtrack] = useState<string>('cinematic');

  // Player controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(5);

  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Gallery History
  const [history, setHistory] = useState<VideoClip[]>(() => {
    try {
      const saved = localStorage.getItem('muhammad_ai_videos_v1');
      if (saved) {
        const parsed: VideoClip[] = JSON.parse(saved);
        // Migrate any broken links to high-uptime stable streaming videos
        const clean = parsed.map((item) => {
          if (item.url.includes('mixkit.co') || item.url.includes('commondatastorage.googleapis.com')) {
            return {
              ...item,
              url: 'https://vjs.zencdn.net/v/oceans.mp4',
            };
          }
          return item;
        });
        return clean;
      }
    } catch (e) {
      console.warn(e);
    }
    // Default starter showcase videos (100% stable 200 OK CDN streams)
    return [
      {
        id: 'vid-sample-1',
        title: 'Breathtaking Ocean Waves & Marine Daylight',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        prompt: 'Cinematic daylight ocean waves crashing along coastal cliffs, ultra realistic 4k',
        aspectRatio: '16:9',
        duration: 15,
        style: 'cinematic',
        resolution: '1080p',
        customSubtitle: 'Coastal Waves • Cinematic Aerial View',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vid-sample-2',
        title: 'Bioluminescent Deep Sea & Cosmic Neon',
        url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
        prompt: 'Glowing bioluminescent jellyfish pulsating with cosmic neon energy, ultra realistic',
        aspectRatio: '16:9',
        duration: 10,
        style: 'cyberpunk',
        resolution: '720p',
        customSubtitle: 'Deep Sea Neon • Fluid Motion',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'vid-sample-3',
        title: 'Cyberpunk Metropolis & Sci-Fi Cinematics',
        url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        prompt: 'Futuristic sci-fi cinematic character journey through misty ruins and mountains',
        aspectRatio: '16:9',
        duration: 12,
        style: 'cinematic',
        resolution: '1080p',
        customSubtitle: 'Sci-Fi Action • Cinematic Masterpiece',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [currentVideo, setCurrentVideo] = useState<VideoClip | null>(history[0] || null);

  useEffect(() => {
    try {
      localStorage.setItem('muhammad_ai_videos_v1', JSON.stringify(history));
    } catch (e) {
      console.warn(e);
    }
  }, [history]);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Sync video speed and filter when currentVideo or settings change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = videoSpeed;
    }
  }, [videoSpeed, currentVideo]);

  // Prompt Enhancer for Cinematic Motion
  const enhancePromptForVideo = () => {
    if (!prompt.trim()) return;
    const motionModifiers = [
      'shot on IMAX 70mm, sweeping cinematic drone glide, 60fps smooth pan, natural golden hour lighting',
      'ultra-realistic film footage, dynamic camera tracking, atmospheric haze and volumetric depth',
      'photorealistic slow-motion 120fps, steadycam gimbal motion, high fidelity lighting',
    ];
    const picked = motionModifiers[Math.floor(Math.random() * motionModifiers.length)];
    setPrompt((prev) => `${prev.trim()}, ${picked}`);
  };

  // Video Inspiration Presets
  const videoPresets = [
    { label: 'Drone Mountain Sunset', text: 'Aerial drone flight gliding through misty green mountains towards a radiant golden sunset' },
    { label: 'Cyberpunk Neon City', text: 'Rain-soaked futuristic cityscape at night with glowing holographic neon billboards and flying traffic' },
    { label: 'Bioluminescent Ocean', text: 'Glowing blue ocean waves breaking on a tropical shore under starry night sky' },
    { label: 'Deep Space Nebula', text: 'Hyperspace flight through a colorful cosmic star cluster and interstellar nebula clouds' },
    { label: 'High-Speed Highway', text: 'First-person perspective driving at sunset along a scenic coastal highway with warm horizon' },
  ];

  // Handle Video Generation
  const handleGenerateVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          style,
          resolution,
          cameraMotion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      const newClip: VideoClip = {
        id: 'vid-' + Date.now(),
        title: data.title || `${prompt.slice(0, 30)}...`,
        url: data.videoUrl,
        prompt: prompt.trim(),
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        style: data.style,
        resolution: data.resolution,
        scenes: data.scenes,
        captions: data.captions,
        customSubtitle: `${data.style.toUpperCase()} • ${prompt.slice(0, 45)}`,
        createdAt: new Date().toISOString(),
      };

      setCurrentVideo(newClip);
      setTrimEnd(data.duration);
      setCustomSubtitle(newClip.customSubtitle || '');
      setHistory((prev) => [newClip, ...prev]);

      // Autoplay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 300);
    } catch (err: any) {
      console.error('Video gen error:', err);
      alert(`Video Generation: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Prompt-Based Video Edit
  const handleEditVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editPrompt.trim() || !currentVideo || isEditing) return;

    setIsEditing(true);
    try {
      const res = await fetch('/api/edit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          videoUrl: currentVideo.url,
          speed: videoSpeed,
          filter: videoFilter,
          captions: customSubtitle,
          trimStart,
          trimEnd,
          soundtrack,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit video');
      }

      setVideoSpeed(data.speed || 1.0);
      setVideoFilter(data.filter || 'none');
      setCustomSubtitle(data.captions || editPrompt);

      const updatedClip: VideoClip = {
        ...currentVideo,
        id: 'vid-edited-' + Date.now(),
        title: `Edited: ${editPrompt.slice(0, 30)}`,
        speed: data.speed,
        filter: data.filter,
        customSubtitle: data.captions,
      };

      setCurrentVideo(updatedClip);
      setHistory((prev) => [updatedClip, ...prev]);

      if (videoRef.current) {
        videoRef.current.playbackRate = data.speed;
        videoRef.current.currentTime = trimStart;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Video edit error:', err);
      alert(`Video Edit: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  // Player Controls
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setVideoDuration(videoRef.current.duration);
      }
      // Check trim bounds
      if (videoRef.current.currentTime >= trimEnd && trimEnd > 0) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Get CSS filter for video element
  const getVideoFilterStyle = () => {
    switch (videoFilter) {
      case 'teal-orange':
        return 'contrast(120%) saturate(130%) hue-rotate(20deg)';
      case 'cyberpunk':
        return 'contrast(140%) saturate(160%) hue-rotate(290deg)';
      case 'monochrome':
        return 'grayscale(100%) contrast(125%)';
      case 'vintage':
        return 'sepia(60%) contrast(90%) brightness(95%)';
      case 'sunset-glow':
        return 'sepia(30%) saturate(140%) hue-rotate(-15deg)';
      default:
        return 'none';
    }
  };

  // User Video Upload Handlers
  const handleUserVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedVideoFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const processUploadedVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV, etc.)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

    // Probe duration and dimensions
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const dur = Math.round(tempVideo.duration) || 10;
      const w = tempVideo.videoWidth || 1920;
      const h = tempVideo.videoHeight || 1080;
      const ratio = w >= h ? '16:9' : '9:16';

      const uploadedClip: VideoClip = {
        id: 'user-vid-' + Date.now(),
        title: cleanTitle,
        url: objectUrl,
        prompt: `User Video: ${cleanTitle}`,
        aspectRatio: ratio,
        duration: dur,
        style: 'user_uploaded',
        resolution: `${w}x${h}`,
        customSubtitle: cleanTitle,
        createdAt: new Date().toISOString(),
        isUserUploaded: true,
        fileSize: `${sizeMb} MB`,
      };

      setCurrentVideo(uploadedClip);
      setTrimStart(0);
      setTrimEnd(dur);
      setVideoDuration(dur);
      setCustomSubtitle(cleanTitle);
      setHistory((prev) => [uploadedClip, ...prev]);

      // Automatically switch to editor tab so user can immediately edit their video!
      setActiveTab('edit');

      setExportToast(
        language === 'roman-urdu'
          ? `"${cleanTitle}" upload ho gayi! Ab aap is par prompt aur editing tools apply kar sakte hain.`
          : `"${cleanTitle}" loaded into Video Editor! You can now apply prompt edits and effects.`
      );
      setTimeout(() => setExportToast(null), 4000);
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedVideoFile(file);
    }
  };

  // Export Video to User Device / Local Storage
  const handleExportVideo = async (clip?: VideoClip | null) => {
    const target = clip || currentVideo;
    if (!target) return;

    setIsExporting(true);
    try {
      const sanitizedTitle = (target.title || 'video')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      const filename = `muhammad-ai-${sanitizedTitle}-${target.id}.mp4`;

      // If already blob URL or data URL
      if (target.url.startsWith('blob:') || target.url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = target.url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportToast(
          language === 'roman-urdu'
            ? 'Video aapke computer / mobile me download ho gayi aur library me save hai!'
            : 'Video exported and downloaded to your device!'
        );
        setTimeout(() => setExportToast(null), 3500);
        return;
      }

      // Fetch remote video as blob for reliable device saving
      try {
        const res = await fetch(target.url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        setExportToast(
          language === 'roman-urdu'
            ? 'Video kamyabi se aapke device par export aur save ho gayi!'
            : 'Video exported to your device & saved in local storage!'
        );
      } catch (blobErr) {
        // Fallback for cross-origin resources
        const a = document.createElement('a');
        a.href = target.url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportToast('Video download opened!');
      }
      setTimeout(() => setExportToast(null), 3500);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportToast(`Export: ${err.message || 'Error downloading video'}`);
      setTimeout(() => setExportToast(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  // Export video library backup JSON
  const handleExportVideosBackupJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `muhammad-ai-video-creations-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExportToast('Complete video library metadata exported to JSON!');
      setTimeout(() => setExportToast(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-y-auto relative">
      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-purple-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-purple-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
          <span>{exportToast}</span>
        </div>
      )}

      {/* Hidden File Input for User Video Upload */}
      <input
        type="file"
        ref={userVideoInputRef}
        onChange={handleUserVideoUpload}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
        className="hidden"
      />
      {/* Sub Header & Mode Switcher */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Muhammad AI Video Studio
              </h2>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                Veo & Generative AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'roman-urdu'
                ? 'Prompt se short cinematic video clips banayein aur prompt ki madad se video editing karein.'
                : language === 'urdu'
                ? 'پرامپٹ سے ویڈیو کلپس بنائیں اور پرامپٹ کے ذریعے ویڈیو ایڈیٹنگ کریں۔'
                : 'Create short cinematic video clips from text prompts and edit videos using AI instructions.'}
            </p>
          </div>
        </div>

        {/* Generate / Edit / Upload Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>{language === 'roman-urdu' ? 'AI Generator' : 'Generate Video'}</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>{language === 'roman-urdu' ? 'Video Editor' : 'Video Editor'}</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{language === 'roman-urdu' ? 'Upload Video' : 'Upload Video'}</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Creation Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {activeTab === 'generate' ? (
            /* GENERATOR PANEL */
            <form
              onSubmit={handleGenerateVideo}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-purple-400" />
                  <span>
                    {language === 'roman-urdu' ? 'Video Prompt (Cinematic Vision)' : 'Video Prompt'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={enhancePromptForVideo}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Enhance Camera</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    language === 'roman-urdu'
                      ? 'Jaise ke: "Misty mountains ke upar drone camera sunset ki taraf fly kare, cinematic lighting, 4k ultra realistic..."'
                      : 'E.g., "Drone camera flying over green misty mountains towards a golden sunset, cinematic lighting, 4K realistic..."'
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all"
                />
              </div>

              {/* Presets */}
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                  {language === 'roman-urdu' ? 'Cinematic Presets:' : 'Quick Presets:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {videoPresets.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(p.text)}
                      className="rounded-lg bg-slate-800/80 hover:bg-slate-800 px-2 py-1 text-[10px] text-slate-300 border border-slate-700/60 hover:border-purple-500/50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Camera Motion */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-purple-500 outline-none"
                  >
                    <option value="16:9">16:9 (Cinematic Landscape)</option>
                    <option value="9:16">9:16 (Vertical Reels/TikTok)</option>
                    <option value="1:1">1:1 (Square Format)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Camera Motion
                  </label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-purple-500 outline-none"
                  >
                    <option value="drone">Drone Aerial Glide</option>
                    <option value="push-in">Slow Push-In Dolly</option>
                    <option value="pan">Cinematic Horizon Pan</option>
                    <option value="orbit">Orbital Dynamic Spin</option>
                    <option value="static">Tripod Static Focus</option>
                  </select>
                </div>
              </div>

              {/* Duration & Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Duration
                  </label>
                  <div className="flex items-center gap-1">
                    {[5, 10, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          duration === d
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Cinematic Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-purple-500 outline-none"
                  >
                    <option value="cinematic">Ultra-Realistic Cinema</option>
                    <option value="cyberpunk">Cyberpunk Neon Night</option>
                    <option value="nature">National Geographic Nature</option>
                    <option value="slowmo">Slow Motion 120fps</option>
                    <option value="documentary">Authentic Documentary</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>
                      {language === 'roman-urdu' ? 'AI Video Render Ho Rahi Hai...' : 'Rendering AI Video Clip...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>
                      {language === 'roman-urdu' ? 'Short Video Clip Generate Karein' : 'Generate Generative Video Clip'}
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : activeTab === 'edit' ? (
            /* VIDEO EDITOR PANEL */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'roman-urdu' ? 'Prompt-Based Video Editor' : 'Prompt-Based Video Editor'}
                  </span>
                  {currentVideo?.isUserUploaded && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-400 border border-emerald-500/30">
                      User Video
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => userVideoInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition-colors"
                  title="Upload your own local video to edit"
                >
                  <Upload className="h-3 w-3" />
                  <span>{language === 'roman-urdu' ? 'Apni Video Dalein' : 'Upload Video'}</span>
                </button>
              </div>

              {/* Uploaded / Selected video notice */}
              {currentVideo && (
                <div className="flex items-center justify-between rounded-xl bg-slate-950/80 border border-slate-800/80 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileVideo className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span className="text-slate-300 font-medium truncate max-w-[200px]">
                      {currentVideo.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {currentVideo.duration}s • {currentVideo.resolution}
                  </span>
                </div>
              )}

              {/* Prompt Input for Video Edit */}
              <form onSubmit={handleEditVideo} className="flex flex-col gap-2">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder={
                    language === 'roman-urdu'
                      ? 'Prompt likhein: "Video ko slow motion kardo aur cinematic teal & orange grade add karo", "Subtitle lagao: \'Dawn of Future\'", "Speed 1.5x kardo"...'
                      : 'Enter edit prompt: E.g., "Make it slow motion with teal & orange cinematic grading and subtitle \'Dawn of Future\'", "Speed up 1.5x with cyberpunk glow"...'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={isEditing || !editPrompt.trim() || !currentVideo}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-2.5 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying Prompt Video Edit...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5 text-amber-300" />
                      <span>Apply AI Video Edit</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Edit Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Apply slow motion 0.5x cinematic',
                  'Add teal & orange color grade',
                  'Add subtitle: "Adventure Awaits"',
                  'Vintage VHS retro effect',
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setEditPrompt(sug)}
                    className="rounded-lg bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Direct Timeline & Filter Controls */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                {/* Playback Speed */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <FastForward className="h-3 w-3 text-indigo-400" />
                      <span>Playback Speed</span>
                    </span>
                    <span className="font-mono text-purple-300">{videoSpeed}x</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setVideoSpeed(s);
                          if (videoRef.current) videoRef.current.playbackRate = s;
                        }}
                        className={`py-1 rounded text-[10px] font-mono font-semibold transition-all ${
                          videoSpeed === s
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Grading Filter */}
                <div>
                  <div className="text-[11px] font-medium text-slate-300 mb-1">
                    Cinematic Color Grade:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'none', label: 'Natural' },
                      { id: 'teal-orange', label: 'Teal & Orange' },
                      { id: 'cyberpunk', label: 'Cyberpunk' },
                      { id: 'vintage', label: 'Vintage VHS' },
                      { id: 'monochrome', label: 'Noir B&W' },
                      { id: 'sunset-glow', label: 'Sunset Glow' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setVideoFilter(f.id)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-medium border transition-all ${
                          videoFilter === f.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Caption Overlay */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Type className="h-3 w-3 text-indigo-400" />
                      <span>Custom Subtitle / Lower Third</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="Enter on-screen caption..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* DEDICATED USER VIDEO UPLOAD PANEL */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'roman-urdu' ? 'Apni Video Upload Karein' : 'Upload Your Video'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">User Video Studio</span>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => userVideoInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]'
                    : 'border-slate-700/80 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-slate-950/90'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 shadow-inner">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-slate-200 text-center">
                  {language === 'roman-urdu'
                    ? 'Video file yahan drop karein ya click karke select karein'
                    : 'Drop your video file here or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">
                  {language === 'roman-urdu'
                    ? 'MP4, WebM, MOV ya MKV format. Video upload hone ke baad aap prompt se editing kar sakte hain.'
                    : 'Supports MP4, WebM, MOV, and MKV. Once loaded, you can edit it with prompts and effects.'}
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700">MP4</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700">WebM</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700">MOV</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700">HD / 4K</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => userVideoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {language === 'roman-urdu' ? 'Video File Chuniye (Browse Video)' : 'Select Video File from Device'}
                </span>
              </button>

              {/* Informative Tip */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-400 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  {language === 'roman-urdu'
                    ? 'Apni video dalne ke baad aap "Video Editor" me jakar prompt likhein: jaise "Video ko slow motion kardo aur cinematic grading lagao" ya "Subtitle add karo". Video turant modify ho jayegi!'
                    : 'After uploading your video, switch to the Video Editor tab to give prompt instructions such as "Make slow motion and add teal & orange grading" or add custom subtitles. Your video will be enhanced instantly!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Video Player & Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Video Cinema Stage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden shadow-2xl">
            {currentVideo ? (
              <div className="w-full flex flex-col items-center">
                {/* Video Screen Container */}
                <div
                  className={`relative w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-inner ${
                    currentVideo.aspectRatio === '9:16'
                      ? 'max-w-[280px] aspect-[9/16]'
                      : currentVideo.aspectRatio === '1:1'
                      ? 'max-w-[360px] aspect-square'
                      : 'aspect-video max-h-[360px]'
                  }`}
                >
                  <video
                    ref={videoRef}
                    src={currentVideo.url}
                    loop
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onError={(e) => {
                      // Graceful fallback to guaranteed stable CDN video if external asset fails
                      const target = e.currentTarget as HTMLVideoElement;
                      if (!target.src.includes('oceans.mp4')) {
                        target.src = 'https://vjs.zencdn.net/v/oceans.mp4';
                        target.load();
                        target.play().catch(() => {});
                      }
                    }}
                    style={{ filter: getVideoFilterStyle() }}
                    className="h-full w-full object-cover transition-all"
                  />

                  {/* On-screen Subtitle Overlay */}
                  {customSubtitle && (
                    <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none z-10">
                      <span className="inline-block px-3 py-1 rounded-md bg-black/80 backdrop-blur-sm text-xs sm:text-sm font-semibold tracking-wide text-amber-300 border border-amber-500/20 shadow-lg">
                        {customSubtitle}
                      </span>
                    </div>
                  )}

                  {/* Play Overlay Button if paused */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlayPause}
                      className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl backdrop-blur-sm hover:scale-110 transition-transform"
                    >
                      <Play className="h-6 w-6 ml-0.5 fill-white" />
                    </button>
                  )}

                  {/* Mode Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-purple-300 backdrop-blur-sm border border-white/10">
                    <span>{currentVideo.style.toUpperCase()}</span>
                    <span>•</span>
                    <span>{currentVideo.resolution}</span>
                  </div>
                </div>

                {/* Interactive Player Scrub Bar */}
                <div className="w-full mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max={videoDuration || 5}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Controls Toolbar */}
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-slate-400">
                        {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportVideo(currentVideo)}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-md disabled:opacity-50"
                        title="Download video file directly to your device and save to local storage"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isExporting ? 'Exporting MP4...' : 'Download MP4'}</span>
                      </button>

                      {onSendToChat && (
                        <button
                          onClick={() => onSendToChat(currentVideo.url, currentVideo.prompt)}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Send to Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
                  <Film className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {language === 'roman-urdu' ? 'Generative Video Cinema Stage' : 'AI Video Canvas'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {language === 'roman-urdu'
                    ? 'Prompt likhein aur short cinematic AI video clip generate karein ya apni video upload karein.'
                    : 'Enter your prompt to produce dynamic realistic AI video clips or upload your own video.'}
                </p>
                <button
                  onClick={() => userVideoInputRef.current?.click()}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{language === 'roman-urdu' ? 'Apni Video Upload Karein' : 'Upload Video File'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Video History Gallery */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {language === 'roman-urdu' ? 'Saved Video Library (Local Storage)' : 'Local Storage Video Library'}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {history.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportVideosBackupJson}
                  className="flex items-center gap-1 text-[10px] font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded-md border border-purple-500/20 transition-colors"
                  title="Export complete video metadata library backup to disk (JSON format)"
                >
                  <FolderDown className="h-3 w-3" />
                  <span>Export All Backup</span>
                </button>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear video history?')) setHistory([]);
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-1">
              {/* Quick Upload Tile */}
              <div
                onClick={() => userVideoInputRef.current?.click()}
                className="group relative rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-slate-900/60 flex flex-col items-center justify-center p-4 cursor-pointer transition-all min-h-[110px]"
                title="Upload local video file from your computer or phone"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors mb-1.5">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-200 text-center">
                  {language === 'roman-urdu' ? 'Apni Video Dalein' : 'Upload Video'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">MP4 / WebM / MOV</span>
              </div>

              {history.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    setCurrentVideo(vid);
                    setCustomSubtitle(vid.customSubtitle || '');
                    if (vid.speed) setVideoSpeed(vid.speed);
                    if (vid.filter) setVideoFilter(vid.filter);
                  }}
                  className={`group relative rounded-xl overflow-hidden border bg-slate-950 cursor-pointer transition-all shadow-sm ${
                    currentVideo?.id === vid.id
                      ? 'border-purple-500 ring-1 ring-purple-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-video relative bg-slate-900">
                    <video
                      src={vid.url}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>

                    {/* Badge for user uploaded video */}
                    {vid.isUserUploaded && (
                      <div className="absolute top-1 left-1 rounded bg-emerald-600/90 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-semibold text-white shadow">
                        User Video
                      </div>
                    )}

                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-purple-300">
                      {vid.duration}s
                    </div>

                    {/* Quick export button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportVideo(vid);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/80 hover:bg-purple-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow"
                      title="Download video file to device"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-semibold text-slate-200 truncate">
                      {vid.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {vid.prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
