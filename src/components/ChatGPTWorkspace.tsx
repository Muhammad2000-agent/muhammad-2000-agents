import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Plus,
  Search,
  Trash2,
  Edit2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  Globe,
  Brain,
  Bot,
  User,
  PanelLeft,
  PanelLeftClose,
  Settings,
  X,
  ChevronDown,
  Terminal,
  Play,
  Share2,
  ThumbsUp,
  ThumbsDown,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  Wand2,
  Camera,
  Video,
  FolderArchive,
} from 'lucide-react';
import { ImageGenerationModule } from './ImageGenerationModule';
import { VideoGenerator } from './VideoGenerator';
import { BrandLogo } from './BrandLogo';
import { useAppTheme } from '../context/ThemeContext';
import { extractFilesFromDeliverable, downloadProjectAsZip } from '../utils/zipGenerator';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
  mode?: 'standard' | 'deep_thinking' | 'web_search' | 'image_gen' | 'video_gen';
  thoughtProcess?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaPrompt?: string;
  mediaEngine?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatGPTWorkspaceProps {
  language: 'roman-urdu' | 'urdu' | 'english';
  onLanguageChange: (lang: 'roman-urdu' | 'urdu' | 'english') => void;
  onOpenExplorer: () => void;
}

const STORAGE_KEY = 'muhammad_chatgpt_sessions_v1';
const ACTIVE_SESSION_KEY = 'muhammad_chatgpt_active_id_v1';

export const ChatGPTWorkspace: React.FC<ChatGPTWorkspaceProps> = ({
  language,
  onLanguageChange,
  onOpenExplorer,
}) => {
  // Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load sessions:', e);
    }
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    return saved || (sessions[0]?.id ?? '');
  });

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [sessionSearch, setSessionSearch] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>('');

  // Mode: standard | deep_thinking | web_search | image_gen | video_gen
  const [activeMode, setActiveMode] = useState<'standard' | 'deep_thinking' | 'web_search' | 'image_gen' | 'video_gen'>('standard');
  
  // Workspace Views: 'chat' | 'image_studio' | 'video_studio'
  const [workspaceView, setWorkspaceView] = useState<'chat' | 'image_studio' | 'video_studio'>('chat');
  const [mediaInitialPrompt, setMediaInitialPrompt] = useState<string>('');
  
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    return localStorage.getItem('chatgpt_custom_instructions_v1') || '';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Input States
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Code Sandbox preview
  const [sandboxCode, setSandboxCode] = useState<{ id: string; code: string; lang: string } | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      if (activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      }
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions, activeSessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // New Chat Handler
  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputValue('');
    setAttachedImage(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Delete Chat
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: 'session-' + Date.now(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename Chat
  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitleInput.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editTitleInput.trim(), updatedAt: new Date().toISOString() } : s))
    );
    setEditingSessionId(null);
  };

  // Voice Input Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === 'roman-urdu'
          ? 'Aapke browser mein voice recognition support nahi hai. Chrome ya Edge istemal karein.'
          : 'Voice recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'urdu' ? 'ur-PK' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Image / File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Text to Speech
  const toggleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Media generated in Studio being sent into Chat
  const handleSendMediaToChat = (mediaUrl: string, caption: string) => {
    const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.includes('video');
    const mediaMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: isVideo
        ? `🎬 **Generated AI Video Clip**\n\n**Prompt:** *${caption}*\n\n[▶ Open / Download Video File](${mediaUrl})`
        : `🎨 **Generated Realistic Image (8K UHD)**\n\n**Prompt:** *${caption}*\n\n![Generated Realistic Image](${mediaUrl})`,
      image: isVideo ? undefined : mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, mediaMessage],
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
    setWorkspaceView('chat');
  };

  const handleOpenImageStudio = (initialText?: string) => {
    if (initialText) setMediaInitialPrompt(initialText);
    setWorkspaceView('image_studio');
  };

  const handleOpenVideoStudio = (initialText?: string) => {
    if (initialText) setMediaInitialPrompt(initialText);
    setWorkspaceView('video_studio');
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if ((!text && !attachedImage) || isLoading) return;

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessageId = 'msg-' + Date.now();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      image: attachedImage || undefined,
      mode: activeMode,
    };

    // Update session title on first message
    const isFirstMessage = activeSession.messages.length === 0;
    const autoTitle = text.slice(0, 36) + (text.length > 36 ? '...' : '');

    const updatedMessages = [...activeSession.messages, userMessage];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            title: isFirstMessage ? autoTitle : s.title,
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    setInputValue('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const lowerText = text.toLowerCase();

      // Broad Roman Urdu, Urdu & English detection for Image Generation
      const isImageRequest =
        activeMode === 'image_gen' ||
        (/\b(image|tasweer|tasveer|taswir|photo|picture|photograph|pic)\b/i.test(lowerText) &&
          /\b(banao|bnao|bana|bna|generate|create|make|draw|dikhao|chahiye|chahye|kro|kr do|kr k do|render)\b/i.test(lowerText)) ||
        /\b(generate|create|make|draw)\s*(a|an)?\s*(image|photo|picture|photograph|pic)\b/i.test(lowerText) ||
        /\b(ki|ka)\s*(image|tasweer|tasveer|taswir|photo|picture|pic)\b/i.test(lowerText) ||
        /\b(photo|image|picture|pic)\s*(of|for)\b/i.test(lowerText) ||
        /\b(sher|billi|car|supercar|lion|tiger|falcon|mosque|badshahi|nature|pahad|mountain|space|sunset)\s*(ki|ka)?\s*(image|photo|picture|tasweer|pic)\b/i.test(lowerText);

      // Broad Roman Urdu, Urdu & English detection for Video Generation
      const isVideoRequest =
        !isImageRequest &&
        (activeMode === 'video_gen' ||
          (/\b(video|clip|animation|movie|cinematic)\b/i.test(lowerText) &&
            /\b(banao|bnao|bana|bna|generate|create|make|dikhao|chahiye|chahye|kro|kr do|kr k do|render|play)\b/i.test(lowerText)) ||
          /\b(generate|create|make)\s*(a|an)?\s*(video|clip|movie)\b/i.test(lowerText) ||
          /\b(ki|ka)\s*(video|clip)\b/i.test(lowerText) ||
          /\b(video|clip)\s*(of|for)\b/i.test(lowerText));

      let assistantMessage: ChatMessage;

      if (isImageRequest) {
        // Clean prompt for Image Generator
        const cleanedImagePrompt = text
          .replace(/\b(mujhe|aik|ek|koi)?\s*(si|bhi|bh)?\s*(image|tasweer|tasveer|taswir|photo|picture|pic)\s*(banao|bnao|bana do|bna do|bana k do|bna k do|generate karo|generate kro|create karo|create kro|dikhao|chahiye|chahye|draw karo)\b/gi, '')
          .replace(/\b(generate|create|make|draw)\s*(a|an)?\s*(image|photo|picture|realistic photo|pic)\s*(of)?\b/gi, '')
          .replace(/\b(ki image|ki tasweer|ki photo|ki pic|ka photo|ka image)\b/gi, '')
          .trim() || text;

        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanedImagePrompt,
            aspectRatio: '1:1',
            style: 'photorealistic',
            quality: '1K',
          }),
        });

        const imgData = await imgRes.json();
        if (!imgRes.ok || !imgData.success) {
          throw new Error(imgData.error || 'Failed to generate realistic image');
        }

        assistantMessage = {
          id: 'msg-img-' + Date.now(),
          role: 'assistant',
          content:
            language === 'roman-urdu'
              ? `Yeh rahi aapki **Ultra-Realistic 8K Image**! 🎨\n\n**Prompt:** *${imgData.prompt}*\n\nChatGPT aur DALL-E 3 standard par Hasselblad medium format camera, 85mm f/1.4 lens, natural volumetric lighting aur lifelike textures ke sath generate ki gayi hai.`
              : `Here is your **Ultra-Realistic 8K Image**! 🎨\n\n**Prompt:** *${imgData.prompt}*\n\nGenerated with ChatGPT/DALL-E 3 photorealistic standards, Hasselblad camera optics, and lifelike lighting.`,
          timestamp: new Date().toISOString(),
          mode: activeMode,
          mediaType: 'image',
          mediaUrl: imgData.imageUrl,
          mediaPrompt: imgData.enhancedPrompt || imgData.prompt,
          mediaEngine: imgData.engine || 'DALL-E 3 / Stable Diffusion XL',
        };
      } else if (isVideoRequest) {
        // Clean prompt for Video Generator
        const cleanedVideoPrompt = text
          .replace(/\b(mujhe|aik|ek|koi)?\s*(si|bhi|bh)?\s*(video|clip)\s*(banao|bnao|bana do|bna do|bana k do|bna k do|generate karo|generate kro|create karo|create kro|dikhao|chahiye|chahye)\b/gi, '')
          .replace(/\b(generate|create|make)\s*(a|an)?\s*(video|clip|cinematic clip)\s*(of)?\b/gi, '')
          .replace(/\b(ki video|ka video)\b/gi, '')
          .trim() || text;

        const vidRes = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanedVideoPrompt,
            aspectRatio: '16:9',
            style: 'cinematic',
            duration: 5,
          }),
        });

        const vidData = await vidRes.json();
        if (!vidRes.ok || !vidData.success) {
          throw new Error(vidData.error || 'Failed to generate video clip');
        }

        assistantMessage = {
          id: 'msg-vid-' + Date.now(),
          role: 'assistant',
          content:
            language === 'roman-urdu'
              ? `Yeh raha aapka **Cinematic AI Video Clip**! 🎬\n\n**Title:** ${vidData.title || vidData.prompt}\n\nAap is video ko direct chat me play kar sakte hain ya high definition MP4 file download kar sakte hain.`
              : `Here is your **Cinematic AI Video Clip**! 🎬\n\n**Title:** ${vidData.title || vidData.prompt}\n\nYou can stream this video clip directly in chat or download the HD MP4 file.`,
          timestamp: new Date().toISOString(),
          mode: activeMode,
          mediaType: 'video',
          mediaUrl: vidData.videoUrl,
          mediaPrompt: vidData.prompt,
        };
      } else {
        // Standard conversational chat with Muhammad 2000 AI
        const payload = {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
          mode: activeMode,
          languagePreference: language,
          customSystemInstruction: customInstructions,
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to get response from assistant');
        }

        assistantMessage = {
          id: 'msg-asst-' + Date.now(),
          role: 'assistant',
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
          mode: activeMode,
        };
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: [...updatedMessages, assistantMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `**Error:** ${err.message || 'Kuch masla hua, barah-e-karam dobara koshish karein.'}`,
        timestamp: new Date().toISOString(),
        mode: activeMode,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: [...updatedMessages, errorMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = async () => {
    if (isLoading || activeSession.messages.length === 0) return;
    const lastUserIdx = [...activeSession.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserIdx === -1) return;
    const targetIdx = activeSession.messages.length - 1 - lastUserIdx;
    const messagesToKeep = activeSession.messages.slice(0, targetIdx + 1);

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: messagesToKeep,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    try {
      const payload = {
        messages: messagesToKeep.map((m) => ({
          role: m.role,
          content: m.content,
          image: m.image,
        })),
        mode: activeMode,
        languagePreference: language,
        customSystemInstruction: customInstructions,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to regenerate response');
      }

      const newAssistantMessage: ChatMessage = {
        id: 'msg-asst-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        mode: activeMode,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return {
              ...s,
              messages: [...messagesToKeep, newAssistantMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Regenerate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.txt,.pdf,.py,.js,.html,.css,.json"
        className="hidden"
      />

      {/* LEFT SIDEBAR (ChatGPT style) */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-md shrink-0 z-20 overflow-hidden select-none`}
      >
        {/* New Chat Button & Search */}
        <div className="p-3 border-b border-slate-800/80 flex flex-col gap-2">
          <button
            onClick={handleCreateNewChat}
            className="flex items-center justify-between w-full rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>
                {language === 'roman-urdu'
                  ? 'Nayi Chat Shuru Karein'
                  : language === 'urdu'
                  ? 'نئی چیٹ شروع کریں'
                  : 'New chat'}
              </span>
            </div>
            <span className="text-[10px] bg-indigo-700/60 px-1.5 py-0.5 rounded font-mono">
              +
            </span>
          </button>

          {/* Search Chats */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 py-1 text-[11px] font-medium tracking-wider text-slate-500 uppercase">
            Recent Chats
          </div>

          {filteredSessions.map((session) => {
            const isActive = session.id === activeSession.id;
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {editingSessionId === session.id ? (
                  <form
                    onSubmit={(e) => handleSaveRename(session.id, e)}
                    className="flex-1 mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitleInput}
                      onChange={(e) => setEditTitleInput(e.target.value)}
                      onBlur={() => handleSaveRename(session.id)}
                      autoFocus
                      className="w-full bg-slate-950 px-2 py-0.5 rounded text-xs text-white border border-indigo-500 outline-none"
                    />
                  </form>
                ) : (
                  <span className="truncate flex-1 pr-2">{session.title}</span>
                )}

                {/* Quick action buttons on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session.id);
                      setEditTitleInput(session.title);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60"
                    title="Rename chat"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
                    title="Delete chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Sidebar: 2,000 Agents Connected Status & Settings */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-2">
          {/* Link to 2,000 Agents Directory */}
          <button
            onClick={onOpenExplorer}
            className="flex items-center justify-between w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
              <span>2,000 Agents Fleet</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
              Active
            </span>
          </button>

          {/* User / Settings Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                M
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Muhammad 2000 AI</div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Creative AI & Media Studio
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Custom Instructions & Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT & STUDIO AREA */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-slate-950">
        {/* Top Chat Bar: Toggle Sidebar, Studio Switcher & Model Pill */}
        <div className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </button>

            {/* Studio Mode Switcher: Chat vs Image Studio vs Video Studio */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs">
              <button
                onClick={() => setWorkspaceView('chat')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 font-medium transition-all ${
                  workspaceView === 'chat'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setWorkspaceView('image_studio')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 font-medium transition-all ${
                  workspaceView === 'image_studio'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 text-amber-300" />
                <span>Image Studio</span>
                <span className="hidden sm:inline-block rounded bg-indigo-500/20 px-1 text-[9px] font-mono text-indigo-300">
                  8K
                </span>
              </button>

              <button
                onClick={() => setWorkspaceView('video_studio')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1 font-medium transition-all ${
                  workspaceView === 'video_studio'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="h-3.5 w-3.5 text-purple-300" />
                <span>Video Studio</span>
                <span className="hidden sm:inline-block rounded bg-purple-500/20 px-1 text-[9px] font-mono text-purple-300">
                  AI
                </span>
              </button>
            </div>

            {/* If in Chat view: Model & Capability Pill */}
            {workspaceView === 'chat' && (
              <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveMode('standard')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                    activeMode === 'standard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Direct intelligent conversational model"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Standard</span>
                </button>

                <button
                  onClick={() => setActiveMode('deep_thinking')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                    activeMode === 'deep_thinking'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="2,000 Agents Community Deep Reasoning"
                >
                  <Brain className="h-3 w-3" />
                  <span>Deep Think</span>
                </button>

                <button
                  onClick={() => setActiveMode('web_search')}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                    activeMode === 'web_search'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Search the live web for up-to-date answers"
                >
                  <Globe className="h-3 w-3" />
                  <span>Web Search</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Header: Share / Language */}
          <div className="flex items-center gap-2">
            {workspaceView === 'chat' && (
              <button
                onClick={handleCreateNewChat}
                className="sm:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

            {/* Language Quick Switcher */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => onLanguageChange('roman-urdu')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  language === 'roman-urdu' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                }`}
              >
                Roman Urdu
              </button>
              <button
                onClick={() => onLanguageChange('urdu')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  language === 'urdu' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                }`}
              >
                اردو
              </button>
              <button
                onClick={() => onLanguageChange('english')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  language === 'english' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* WORKSPACE VIEW SWITCHER RENDER */}
        {workspaceView === 'image_studio' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ImageGenerationModule
              language={language}
              onSendToChat={handleSendMediaToChat}
              initialPrompt={mediaInitialPrompt}
            />
          </div>
        ) : workspaceView === 'video_studio' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <VideoGenerator
              language={language}
              onSendToChat={handleSendMediaToChat}
              initialPrompt={mediaInitialPrompt}
            />
          </div>
        ) : (
          /* CHAT CONVERSATION VIEW */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* MESSAGE STREAM */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {activeSession.messages.length === 0 ? (
            /* Empty State: ChatGPT Signature Greeting & Suggestions */
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="mb-4">
                <BrandLogo size="hero" showText={false} />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                {language === 'roman-urdu'
                  ? 'Aap aaj kya poochna ya karna chahte hain?'
                  : language === 'urdu'
                  ? 'آپ آج کیا پوچھنا یا کرنا چاہتے ہیں؟'
                  : 'What can I help you with today?'}
              </h2>

              <p className="text-sm text-slate-400 max-w-md mb-8">
                {language === 'roman-urdu'
                  ? 'Main Muhammad 2000 AI hoon. Main har topic par baat karne, photorealistic images generate karne, images edit karne, aur AI video clips banane ke liye tayyar hoon.'
                  : language === 'urdu'
                  ? 'مجھ سے سوالات پوچھیں، فوٹو ریلسٹک تصاویر بنوائیں یا ایڈٹ کروائیں، اور اے آئی ویڈیو کلپس تیار کروائیں۔'
                  : 'Intelligent conversational AI, photorealistic 8K image studio, and generative AI video clip creation.'}
              </p>

              {/* Creative Media Studio Quick Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 w-full max-w-lg">
                <button
                  type="button"
                  onClick={() => handleOpenImageStudio()}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all shadow-sm"
                >
                  <ImageIcon className="h-4 w-4 text-amber-400" />
                  <span>🎨 Generate / Edit Realistic Images (8K)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenVideoStudio()}
                  className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all shadow-sm"
                >
                  <Film className="h-4 w-4 text-purple-400" />
                  <span>🎬 Create AI Video Clips</span>
                </button>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left">
                {/* Real Image Generator Card */}
                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Sher jungle me barish ke doran, ultra realistic 8k photo banao'
                        : 'Generate an ultra-realistic 8k photo of a majestic lion in rainforest during rain'
                    )
                  }
                  className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 hover:border-amber-400 hover:bg-amber-900/30 transition-all text-xs group"
                >
                  <div className="font-semibold text-amber-300 group-hover:text-amber-200 mb-1 flex items-center gap-1.5">
                    🎨 <span>Realistic Image (ChatGPT Style)</span>
                  </div>
                  <div className="text-slate-300 line-clamp-2">
                    Sher, car, nature ya portrait ki lifelike 8K photo banao.
                  </div>
                </button>

                {/* AI Cinematic Video Card */}
                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Tokyo cyberpunk neon rain city ka cinematic drone video generate karo'
                        : 'Generate a cinematic drone video of Tokyo cyberpunk neon rain streets'
                    )
                  }
                  className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 hover:border-purple-400 hover:bg-purple-900/30 transition-all text-xs group"
                >
                  <div className="font-semibold text-purple-300 group-hover:text-purple-200 mb-1 flex items-center gap-1.5">
                    🎬 <span>AI Video Clip (Sora Style)</span>
                  </div>
                  <div className="text-slate-300 line-clamp-2">
                    Drone flyover, cyberpunk city ya mountains ka 1080p video clip generate karein.
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Pakistan me digital marketing ya online business shuru karne ke liye 5 smart ideas aur steps batao.'
                        : 'Give me 5 creative business ideas to launch in Pakistan with actionable steps.'
                    )
                  }
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300 mb-1 flex items-center gap-1.5">
                    💡 <span>Business & Brainstorming</span>
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    Pakistan me online business shuru karne ke 5 smart ideas aur roadmap.
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Office ke boss ko formal sick leave ya remote work request email Roman Urdu aur English dono me likho.'
                        : 'Write a professional email requesting leave or remote work.'
                    )
                  }
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300 mb-1 flex items-center gap-1.5">
                    ✍️ <span>Writing & Emails</span>
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    Professional leave application ya official email drafting.
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Theory of Relativity aur Quantum Physics ka farq aam zaban me asaan misalon ke sath samjhao.'
                        : 'Explain the difference between General Relativity and Quantum Mechanics simply.'
                    )
                  }
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300 mb-1 flex items-center gap-1.5">
                    🧮 <span>Concept & Education</span>
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    Physics aur complex topics ko bilkul asaan alfaz me samjhein.
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      language === 'roman-urdu'
                        ? 'Ek complete Python program likho jo list me se duplicates remove kare aur clean output print kare.'
                        : 'Write a clean Python script to remove duplicates from a list with tests.'
                    )
                  }
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300 mb-1 flex items-center gap-1.5">
                    💻 <span>Code & Programming</span>
                  </div>
                  <div className="text-slate-400 line-clamp-2">
                    Python, React, JavaScript ya kisi bhi language ka complete code.
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Active Messages List */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 sm:gap-4 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-md ${
                        isUser
                          ? 'bg-slate-700 text-white'
                          : 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                    </div>

                    {/* Content Box */}
                    <div
                      className={`flex flex-col max-w-[85%] sm:max-w-[82%] ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Attached Image Preview if User sent an image */}
                      {message.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-800 max-w-xs shadow-md">
                          <img
                            src={message.image}
                            alt="Uploaded attachment"
                            className="max-h-56 w-auto object-cover"
                          />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-900/90 text-slate-100 border border-slate-800/80 rounded-tl-sm w-full'
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                          <div>
                            {/* Deep thinking badge if applicable */}
                            {message.mode === 'deep_thinking' && (
                              <div className="mb-3 flex items-center gap-1.5 text-xs text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg w-fit">
                                <Brain className="h-3.5 w-3.5" />
                                <span>2,000 Agents Community Deep Thought</span>
                              </div>
                            )}

                            {/* Web search badge if applicable */}
                            {message.mode === 'web_search' && (
                              <div className="mb-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg w-fit">
                                <Globe className="h-3.5 w-3.5" />
                                <span>Web Grounded Verification</span>
                              </div>
                            )}

                            {/* Markdown Renderer with custom code blocks */}
                            <div className="chat-markdown">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeText = String(children).replace(/\n$/, '');

                                    if (!inline && match) {
                                      const langName = match[1];
                                      return (
                                        <div className="my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
                                          {/* Code Block Header */}
                                          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-xs text-slate-400">
                                            <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-400">
                                              {langName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={async () => {
                                                  const extracted = extractFilesFromDeliverable(message.content, activeSession.title || 'chatgpt_project');
                                                  await downloadProjectAsZip(extracted.files, extracted.projectName);
                                                }}
                                                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                                                title="Direct ZIP File Download"
                                              >
                                                <FolderArchive className="h-3 w-3" />
                                                <span>Direct ZIP</span>
                                              </button>

                                              <button
                                                onClick={() =>
                                                  handleCopy(codeText, `code-${message.id}-${langName}`)
                                                }
                                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                                              >
                                                {copiedId === `code-${message.id}-${langName}` ? (
                                                  <>
                                                    <Check className="h-3 w-3 text-emerald-400" />
                                                    <span className="text-emerald-400">Copied</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="h-3 w-3" />
                                                    <span>Copy code</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                          {/* Code Body */}
                                          <pre className="overflow-x-auto p-3.5 font-mono text-xs text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                                            <code>{codeText}</code>
                                          </pre>
                                        </div>
                                      );
                                    }
                                    return (
                                      <code
                                        className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[12px] text-indigo-300"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>

                            {/* Embedded Image Card (ChatGPT / DALL-E 3 Style) */}
                            {message.mediaType === 'image' && message.mediaUrl && (
                              <div className="mt-3 rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 shadow-xl max-w-lg">
                                <div className="relative group">
                                  <img
                                    src={message.mediaUrl}
                                    alt={message.mediaPrompt || 'Generated Ultra-Realistic Image'}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      if (!target.src.includes('unsplash.com')) {
                                        target.src = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80';
                                      }
                                    }}
                                    className="w-full max-h-[420px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                                  />
                                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-[10px] font-mono text-indigo-300 shadow">
                                    <Sparkles className="h-3 w-3 text-amber-400" />
                                    <span className="uppercase">{message.mediaEngine || 'DALL-E 3 / STABLE DIFFUSION'}</span>
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-2">
                                  {message.mediaPrompt && (
                                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                                      "{message.mediaPrompt}"
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                                    <a
                                      href={message.mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download="generated-photorealistic.png"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-colors"
                                    >
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      <span>HD Download</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenImageStudio(message.mediaPrompt || '')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors"
                                    >
                                      <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                                      <span>Image Studio Editor</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Embedded Video Player Card (Sora / AI Cinematic Style) */}
                            {message.mediaType === 'video' && message.mediaUrl && (
                              <div className="mt-3 rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 shadow-xl max-w-lg">
                                <div className="relative">
                                  <video
                                    src={message.mediaUrl}
                                    controls
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLVideoElement;
                                      if (!target.src.includes('oceans.mp4')) {
                                        target.src = 'https://vjs.zencdn.net/v/oceans.mp4';
                                      }
                                    }}
                                    className="w-full max-h-[360px] rounded-t-2xl object-cover bg-black"
                                  />
                                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-[10px] font-mono text-purple-300 shadow">
                                    <Film className="h-3 w-3 text-cyan-400" />
                                    <span>AI CINEMATIC 1080P</span>
                                  </div>
                                </div>
                                <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-2">
                                  {message.mediaPrompt && (
                                    <p className="text-xs text-slate-300 line-clamp-2 italic">
                                      "{message.mediaPrompt}"
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                                    <a
                                      href={message.mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download="generated-video.mp4"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md transition-colors"
                                    >
                                      <Play className="h-3.5 w-3.5" />
                                      <span>Download MP4</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenVideoStudio(message.mediaPrompt || '')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors"
                                    >
                                      <Film className="h-3.5 w-3.5 text-cyan-400" />
                                      <span>Video Studio Player</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Bar below assistant message */}
                      {!isUser && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          {/* Speak / TTS */}
                          <button
                            onClick={() => toggleSpeak(message.id, message.content)}
                            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white transition-colors"
                            title={speakingMessageId === message.id ? 'Stop speaking' : 'Read aloud'}
                          >
                            {speakingMessageId === message.id ? (
                              <>
                                <VolumeX className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                                <span className="text-[11px] text-indigo-400">Speaking...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5" />
                                <span className="text-[11px]">Read</span>
                              </>
                            )}
                          </button>

                          {/* Direct ZIP Package Button if message contains code */}
                          {message.content.includes('```') && (
                            <button
                              onClick={async () => {
                                const extracted = extractFilesFromDeliverable(message.content, activeSession.title || 'chatgpt_project');
                                await downloadProjectAsZip(extracted.files, extracted.projectName);
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2 py-1 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                              title="Download complete project directly as a ZIP archive"
                            >
                              <FolderArchive className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-[11px] font-medium">Direct ZIP</span>
                            </button>
                          )}

                          {/* Regenerate (if last message) */}
                          {message.id ===
                            activeSession.messages[activeSession.messages.length - 1]?.id && (
                            <button
                              onClick={handleRegenerate}
                              className="flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white transition-colors"
                              title="Regenerate response"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              <span className="text-[11px]">Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 rounded-tl-sm flex items-center gap-2">
                    <span className="inline-flex gap-1 items-center">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce"></span>
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeMode === 'image_gen'
                        ? 'Creating Ultra-Realistic 8K Image (ChatGPT / DALL-E 3 Style)...'
                        : activeMode === 'video_gen'
                        ? 'Rendering Cinematic AI Video Clip (1080p Stream)...'
                        : activeMode === 'deep_thinking'
                        ? 'Thinking deeply through 2,000 agents network...'
                        : activeMode === 'web_search'
                        ? 'Searching the web for latest verified info...'
                        : 'Generating response...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* BOTTOM INPUT DOCK (ChatGPT signature style) */}
        <div className="p-3 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* Attachment Preview Chip */}
            {attachedImage && (
              <div className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-900 border border-slate-800 rounded-xl w-fit shadow-md">
                <img
                  src={attachedImage}
                  alt="Attachment"
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="text-xs text-slate-300">Image attached</span>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input Capsule */}
            <div className="relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-2 sm:p-3 shadow-2xl focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  language === 'roman-urdu'
                    ? 'Muhammad 2000 AI se kuch bhi poochein... (Shift+Enter for new line)'
                    : language === 'urdu'
                    ? 'مجھ سے کچھ بھی پوچھیں... (Shift+Enter نئی لائن کے لیے)'
                    : 'Ask Muhammad 2000 AI anything... (Shift+Enter for new line)'
                }
                className="w-full resize-none bg-transparent px-2 py-1 text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-48 scrollbar-thin scrollbar-thumb-slate-700"
              />

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between pt-2 px-1">
                {/* Left: Tools (Attach, Voice, Deep Think, Web Search) */}
                <div className="flex items-center gap-1.5">
                  {/* File / Image Attach */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Attach image or document"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {/* Voice Microphone */}
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-lg transition-all ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input (Dictation)'}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Deep Think Toggle Button */}
                  <button
                    onClick={() =>
                      setActiveMode(activeMode === 'deep_thinking' ? 'standard' : 'deep_thinking')
                    }
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                      activeMode === 'deep_thinking'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Deep Think mode"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Deep Think</span>
                  </button>

                  {/* Web Search Toggle Button */}
                  <button
                    onClick={() =>
                      setActiveMode(activeMode === 'web_search' ? 'standard' : 'web_search')
                    }
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                      activeMode === 'web_search'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Web Search mode"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>

                  {/* Image Mode Button (ChatGPT DALL-E 3 Style) */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMode(activeMode === 'image_gen' ? 'standard' : 'image_gen')
                    }
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                      activeMode === 'image_gen'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-sm shadow-amber-500/20'
                        : 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                    }`}
                    title={
                      activeMode === 'image_gen'
                        ? 'Image Gen Active (Press again for standard chat)'
                        : 'Switch to Image Gen mode (FLUX.1 Photorealistic 8K)'
                    }
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Image Gen</span>
                  </button>

                  {/* Video Mode Button (Sora AI Video Style) */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMode(activeMode === 'video_gen' ? 'standard' : 'video_gen')
                    }
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                      activeMode === 'video_gen'
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-400/50 shadow-sm shadow-purple-500/20'
                        : 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                    }`}
                    title={
                      activeMode === 'video_gen'
                        ? 'Video Gen Active (Press again for standard chat)'
                        : 'Switch to Video Gen mode (Cinematic 1080p Clip)'
                    }
                  >
                    <Film className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Video Gen</span>
                  </button>
                </div>

                {/* Right: Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || (!inputValue.trim() && !attachedImage)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    isLoading || (!inputValue.trim() && !attachedImage)
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 active:scale-95'
                  }`}
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Disclaimer note */}
            <div className="text-center text-[11px] text-slate-500">
              Muhammad 2000 AI can make mistakes. Verify critical facts and information.
            </div>
          </div>
        </div>
      </div>
    )}
  </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Muhammad AI Custom Instructions & Studio Settings
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  What would you like Muhammad 2000 AI to know about you to provide better responses?
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    localStorage.setItem('chatgpt_custom_instructions_v1', e.target.value);
                  }}
                  rows={4}
                  placeholder="e.g. I am a software engineer in Pakistan. I prefer answers in Roman Urdu with clear bullet points..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Language Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['roman-urdu', 'urdu', 'english'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        language === lang
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {lang === 'roman-urdu' ? 'Roman Urdu' : lang === 'urdu' ? 'اردو' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all conversation history?')) {
                      localStorage.removeItem(STORAGE_KEY);
                      const fresh: ChatSession = {
                        id: 'session-' + Date.now(),
                        title: 'New Chat',
                        messages: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      setSessions([fresh]);
                      setActiveSessionId(fresh.id);
                      setIsSettingsOpen(false);
                    }
                  }}
                  className="text-rose-400 hover:underline"
                >
                  Clear all chat history
                </button>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
