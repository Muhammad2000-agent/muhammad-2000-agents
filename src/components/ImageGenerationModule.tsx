import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Sliders,
  Download,
  Share2,
  RefreshCw,
  Wand2,
  Upload,
  Layers,
  ZoomIn,
  Copy,
  Check,
  Eye,
  Trash2,
  ArrowRight,
  Maximize2,
  Sun,
  Contrast,
  Palette,
  Camera,
  HardDrive,
  CheckCircle2,
  FolderDown,
} from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  quality: string;
  createdAt: string;
  isEdited?: boolean;
  engine?: string;
  provider?: string;
}

interface ImageGenerationModuleProps {
  language: 'roman-urdu' | 'urdu' | 'english';
  onSendToChat?: (imageUrl: string, caption: string) => void;
  initialPrompt?: string;
}

export const ImageGenerationModule: React.FC<ImageGenerationModuleProps> = ({
  language,
  onSendToChat,
  initialPrompt = '',
}) => {
  // Tabs: 'generate' | 'edit'
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'edit'>('generate');

  // Generation States
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState<string>('blurry, distorted, oversaturated, low quality, artifacts, cartoon, anime, illustration');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [style, setStyle] = useState<string>('photorealistic');
  const [quality, setQuality] = useState<string>('1K');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gallery History (persisted in localStorage)
  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem('muhammad_ai_images_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    // Default initial showcase realistic sample
    return [
      {
        id: 'sample-1',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80',
        prompt: 'Futuristic architectural oasis in desert with crystalline glass and ambient sunset lighting',
        style: 'photorealistic',
        aspectRatio: '16:9',
        quality: '4K',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sample-2',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
        prompt: 'Ultra-realistic 8K studio portrait of a visionary artist with soft cinematic bokeh',
        style: 'studio',
        aspectRatio: '1:1',
        quality: '2K',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Image Editor States
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('muhammad_ai_images_v1', JSON.stringify(history));
    } catch (e) {
      console.warn(e);
    }
  }, [history]);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Prompt Enhancer for Ultra-Realism (ChatGPT / DALL-E 3 Style)
  const enhancePromptForRealism = () => {
    if (!prompt.trim()) return;
    const realismModifiers = [
      'shot on Hasselblad H6D-100c 85mm f/1.4 lens, natural dramatic lighting, 8k ultra-detailed photorealistic portrait, razor-sharp focus',
      'ultra-realistic 8K photograph, award-winning cinematic volumetric lighting, lifelike textures and authentic depth of field',
      'hyper-realistic National Geographic style photograph, crisp micro-details, authentic reflections, Hasselblad medium format masterpiece',
    ];
    const picked = realismModifiers[Math.floor(Math.random() * realismModifiers.length)];
    setPrompt((prev) => `${prev.trim()}, ${picked}`);
  };

  // Quick Prompt Style Presets
  const promptPresets = [
    { label: 'Cinematic Sunset', text: 'A breathtaking majestic mountain valley at golden hour sunset with crystal reflective lake, photorealistic 8k' },
    { label: 'Cyberpunk City', text: 'Vibrant cyberpunk neon skyscraper street in heavy rain with realistic puddle reflections, cinematic 8k' },
    { label: 'Studio Portrait', text: 'Ultra realistic studio portrait photography with dramatic rim light and detailed expressive eyes' },
    { label: 'Wildlife Close-up', text: 'National Geographic style extreme close up of a snow leopard in blizzard, crisp realistic fur details' },
    { label: 'Futuristic Luxury Car', text: 'Sleek aerodynamic concept electric supercar parked in modern architectural villa, raytracing reflections' },
  ];

  // Handle Image Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style,
          quality,
          negativePrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newImage: GeneratedImage = {
        id: 'img-' + Date.now(),
        url: data.imageUrl,
        prompt: prompt.trim(),
        style: data.style,
        aspectRatio: data.aspectRatio,
        quality: data.quality,
        engine: data.engine,
        provider: data.provider,
        createdAt: new Date().toISOString(),
      };

      setCurrentImage(newImage);
      setHistory((prev) => [newImage, ...prev]);
    } catch (err: any) {
      console.error('Image gen error:', err);
      setErrorMessage(err.message || 'Image generation encountered a temporary network delay. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle File Upload for Editing
  const handleUploadForEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToEdit(reader.result as string);
      setActiveSubTab('edit');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Select Image from History for Editing
  const handleSelectHistoryForEdit = (img: GeneratedImage) => {
    setImageToEdit(img.url);
    setActiveSubTab('edit');
    setEditPrompt(`Enhance lighting and realism: ${img.prompt.slice(0, 40)}`);
  };

  // Prompt-Based AI Image Editing
  const handlePromptEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageToEdit || !editPrompt.trim() || isEditing) return;

    setIsEditing(true);
    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          image: imageToEdit,
          adjustments: {
            brightness,
            contrast,
            saturation,
            blur,
            hueRotate,
            sepia,
            filter: activeFilter,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to edit image');
      }

      const editedItem: GeneratedImage = {
        id: 'edited-' + Date.now(),
        url: data.imageUrl,
        prompt: `Edited: ${editPrompt.trim()}`,
        style: 'edited',
        aspectRatio: '1:1',
        quality: '2K',
        createdAt: new Date().toISOString(),
        isEdited: true,
      };

      setImageToEdit(data.imageUrl);
      setCurrentImage(editedItem);
      setHistory((prev) => [editedItem, ...prev]);
    } catch (err: any) {
      console.error('Edit error:', err);
      alert(`Edit failed: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  // Compute CSS filter string for live interactive editor
  const getFilterStyle = () => {
    let base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg) sepia(${sepia}%)`;
    if (activeFilter === 'teal-orange') {
      base += ' contrast(115%) saturate(125%) hue-rotate(15deg)';
    } else if (activeFilter === 'cyberpunk') {
      base += ' contrast(130%) saturate(150%) hue-rotate(280deg)';
    } else if (activeFilter === 'monochrome') {
      base += ' grayscale(100%) contrast(120%)';
    } else if (activeFilter === 'vintage') {
      base += ' sepia(50%) contrast(90%) brightness(95%)';
    } else if (activeFilter === 'golden-sunset') {
      base += ' sepia(25%) saturate(140%) brightness(105%) hue-rotate(-10deg)';
    }
    return base;
  };

  // Reset interactive filters
  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHueRotate(0);
    setSepia(0);
    setActiveFilter('none');
  };

  // Download & Export Image directly to local storage / user device
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const handleExportToDisk = async (
    url: string,
    filename = 'muhammad-ai-image.png',
    applyCanvasFilters = false
  ) => {
    setIsExporting(true);
    try {
      if (applyCanvasFilters && imageToEdit) {
        // Draw image onto canvas with active filters and export
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageToEdit;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => resolve(null); // fallback if CORS blocks canvas
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = getFilterStyle();
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setExportToast(
              language === 'roman-urdu'
                ? 'Edited image local drive me export ho gayi aur library me save ho gayi!'
                : 'Edited image saved to local storage & downloaded to your device!'
            );
            setTimeout(() => setExportToast(null), 3500);
            return;
          } catch (e) {
            console.warn('Canvas export tainted, falling back to direct URL download', e);
          }
        }
      }

      // If data URL, download directly
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportToast(
          language === 'roman-urdu'
            ? 'Image device me download ho gayi!'
            : 'Image saved to local storage & downloaded to device!'
        );
        setTimeout(() => setExportToast(null), 3500);
        return;
      }

      // Otherwise fetch as blob for local device file saving
      try {
        const res = await fetch(url);
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
            ? 'Image kamyabi se aapke device par export ho gayi!'
            : 'Image exported to device & saved in local storage!'
        );
      } catch (blobErr) {
        // Fallback for strict cross-origin resources
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportToast('Image download opened!');
      }
      setTimeout(() => setExportToast(null), 3500);
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportToast(`Export: ${err.message || 'Error downloading'}`);
      setTimeout(() => setExportToast(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Local Library Backup (JSON)
  const handleExportLibraryJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `muhammad-ai-image-creations-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExportToast('Complete image creation library exported to JSON!');
      setTimeout(() => setExportToast(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-y-auto relative">
      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{exportToast}</span>
        </div>
      )}
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadForEdit}
        accept="image/*"
        className="hidden"
      />

      {/* Sub Header & Mode Switcher */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Muhammad AI Image Studio
              </h2>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                Ultra Realistic 8K
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'roman-urdu'
                ? 'Prompt se full realistic images banayein aur prompt ki madad se edit karein.'
                : language === 'urdu'
                ? 'پرامپٹ سے حقیقت پسندانہ تصاویر بنائیں اور پرامپٹ کے ذریعے ایڈٹ کریں۔'
                : 'Generate photorealistic images and edit existing images using natural language prompts.'}
            </p>
          </div>
        </div>

        {/* Generate / Edit Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
          <button
            onClick={() => setActiveSubTab('generate')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeSubTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {language === 'roman-urdu' ? 'Image Generator' : 'Generate Image'}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('edit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeSubTab === 'edit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>
              {language === 'roman-urdu' ? 'Image Editor (Prompt)' : 'Edit Image'}
            </span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Prompt Input (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {activeSubTab === 'generate' ? (
            /* GENERATOR PANEL */
            <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>
                    {language === 'roman-urdu' ? 'Image Prompt (Tafseeli description)' : 'Prompt Description'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={enhancePromptForRealism}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/20 transition-colors"
                  title="Automatically inject ultra-realistic 8K camera lighting keywords"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Auto-Enhance 8K</span>
                </button>
              </div>

              {/* Textarea for Prompt */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    language === 'roman-urdu'
                      ? 'Jaise ke: "Ek khubsurat pahari jheel par sunset, crystal water me reflection, ultra realistic 8k, cinematic camera lighting..."'
                      : 'E.g., "A magnificent snow-capped mountain valley at sunset with crystal clear reflective lake, photorealistic 8K, cinematic lighting..."'
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
              </div>

              {/* Quick Inspiration Presets */}
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                  {language === 'roman-urdu' ? 'Quick Ideas (Click karein):' : 'Inspiration Ideas:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {promptPresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(p.text)}
                      className="rounded-lg bg-slate-800/80 hover:bg-slate-800 px-2 py-1 text-[10px] text-slate-300 border border-slate-700/60 hover:border-indigo-500/50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio & Style Selectors */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="1:1">1:1 (Square - Instagram)</option>
                    <option value="16:9">16:9 (Landscape - HD)</option>
                    <option value="9:16">9:16 (Portrait - Reels/TikTok)</option>
                    <option value="4:3">4:3 (Standard Photo)</option>
                    <option value="3:4">3:4 (Portrait Masterpiece)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Realism Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="photorealistic">Photorealistic 8K</option>
                    <option value="cinematic">Cinematic 35mm Film</option>
                    <option value="studio">Studio Master Lighting</option>
                    <option value="analog">Vintage Kodak Analog</option>
                    <option value="cyberpunk">Cyberpunk Hyper-Real</option>
                    <option value="nature">National Geographic Nature</option>
                  </select>
                </div>
              </div>

              {/* Resolution / Quality Pill */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Target Quality:</span>
                <div className="flex items-center gap-1.5">
                  {(['1K', '2K', '4K'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                        quality === q
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {q} Ultra
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>
                      {language === 'roman-urdu' ? 'Realistic Image Banayi Ja Rahi Hai...' : 'Generating Realistic Image...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>
                      {language === 'roman-urdu' ? 'Full Realistic Image Generate Karein' : 'Generate Photorealistic Image'}
                    </span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-300 hover:text-white font-bold text-sm px-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* IMAGE EDITOR PANEL */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="h-4 w-4 text-purple-400" />
                  <span>
                    {language === 'roman-urdu' ? 'Prompt Se Image Edit Karein' : 'Prompt-Based Image Editor'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-colors"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload Image</span>
                </button>
              </div>

              {/* Prompt Input for Edit */}
              <form onSubmit={handlePromptEdit} className="flex flex-col gap-2">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder={
                    language === 'roman-urdu'
                      ? 'Prompt likhein: Jaise "Peeche background me golden sunset add kardo", "Vintage black and white film look do", "Cyberpunk neon lights glow add karo"...'
                      : 'Enter edit prompt: E.g., "Add dramatic golden sunset clouds in background", "Convert to cyberpunk neon aesthetic", "Add vintage film grain"...'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={isEditing || !imageToEdit || !editPrompt.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2.5 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>AI Prompt Edit Lagaya Ja Raha Hai...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Apply AI Prompt Edit</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick AI Edit Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Add golden hour sunset lighting',
                  'Make it cyberpunk with neon reflections',
                  'Transform into dramatic black and white',
                  'Add soft morning mist & cinematic depth',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setEditPrompt(sug)}
                    className="rounded-lg bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Manual Color & Lighting Sliders */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Visual Fine-Tuning</span>
                  </span>
                  <button
                    onClick={handleResetFilters}
                    className="text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Reset
                  </button>
                </div>

                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Color Saturation</span>
                    <span>{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Preset Filter Chips */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1.5">Color Grading Presets:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'none', label: 'Natural' },
                      { id: 'teal-orange', label: 'Teal & Orange' },
                      { id: 'golden-sunset', label: 'Sunset Glow' },
                      { id: 'cyberpunk', label: 'Cyberpunk' },
                      { id: 'vintage', label: 'Vintage Film' },
                      { id: 'monochrome', label: 'Noir B&W' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFilter(f.id)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-medium border transition-all ${
                          activeFilter === f.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Preview & Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Display Stage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden shadow-2xl">
            {activeSubTab === 'edit' && imageToEdit ? (
              /* Image Editor Active View */
              <div className="flex flex-col items-center w-full">
                <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                  <img
                    src={imageToEdit}
                    alt="Editing canvas"
                    referrerPolicy="no-referrer"
                    style={{ filter: getFilterStyle() }}
                    className="max-h-[360px] max-w-full object-contain rounded-lg transition-all duration-150"
                  />
                  <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-purple-300 backdrop-blur-sm">
                    Interactive Editor Active
                  </div>
                </div>

                {/* Edit Controls Toolbar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 w-full pt-2 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400">
                    Filter: <span className="text-purple-300 font-semibold uppercase">{activeFilter}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportToDisk(imageToEdit, 'edited-muhammad-ai.png', true)}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-md disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isExporting ? 'Exporting...' : 'Download Edited'}</span>
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => onSendToChat(imageToEdit, editPrompt || 'Edited Realistic Image')}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : currentImage ? (
              /* Display Generated Image */
              <div className="flex flex-col items-center w-full">
                <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 group">
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes('unsplash.com')) {
                        target.src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80';
                      }
                    }}
                    className="max-h-[360px] max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-slate-950/80 backdrop-blur-md p-2 border border-slate-800 text-[11px] text-slate-200">
                    <p className="line-clamp-2">{currentImage.prompt}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-indigo-400 font-mono">
                      <span className="truncate max-w-[200px]">{currentImage.engine || `${currentImage.style.toUpperCase()} • ${currentImage.aspectRatio}`}</span>
                      <span className="shrink-0">{currentImage.quality} ULTRA</span>
                    </div>
                  </div>
                </div>

                {/* Actions for current image */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 w-full pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSelectHistoryForEdit(currentImage)}
                    className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Edit This Image</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleExportToDisk(
                          currentImage.url,
                          `muhammad-ai-${currentImage.id}.png`,
                          currentImage.isEdited
                        )
                      }
                      disabled={isExporting}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-md disabled:opacity-50"
                      title="Download image directly to your computer / phone"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isExporting ? 'Exporting...' : 'Download / Export'}</span>
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => onSendToChat(currentImage.url, currentImage.prompt)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Standby State */
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {language === 'roman-urdu' ? 'Photorealistic Image Stage' : 'Ultra-Realistic Image Canvas'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {language === 'roman-urdu'
                    ? 'Left side par prompt likhein aur "Full Realistic Image Generate Karein" click karein ya "Image Editor" me apni image upload karein.'
                    : 'Describe your vision on the left to generate photorealistic masterworks, or switch to Image Editor to edit any photo using prompts.'}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <Upload className="h-3.5 w-3.5 text-purple-400" />
                    <span>Upload to Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrompt(promptPresets[0].text);
                      handleGenerate();
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Try Sample Prompt</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History / Gallery Grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {language === 'roman-urdu' ? 'Saved Creations (Local Storage)' : 'Local Storage Gallery'}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {history.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleExportLibraryJson}
                    className="flex items-center gap-1 text-[10px] font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/20 transition-colors"
                    title="Export complete local image library backup to disk (JSON format)"
                  >
                    <FolderDown className="h-3 w-3" />
                    <span>Export All Backup</span>
                  </button>
                )}
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear image history?')) setHistory([]);
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-1">
              {history.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setCurrentImage(img)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-indigo-500 transition-all shadow-sm"
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-[10px] text-white line-clamp-2 leading-tight">
                      {img.prompt}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHistoryForEdit(img);
                        }}
                        className="p-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white"
                        title="Edit image"
                      >
                        <Wand2 className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportToDisk(img.url, `muhammad-ai-image-${img.id}.png`, img.isEdited);
                        }}
                        className="p-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white"
                        title="Export & Download to device"
                      >
                        <Download className="h-2.5 w-2.5" />
                      </button>
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
