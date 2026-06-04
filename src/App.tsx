/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "react-qr-code";
import jsQR from "jsqr";
import { 
  Camera, 
  Heart, 
  Share2, 
  Info, 
  ArrowRight, 
  ArrowLeft,
  Maximize2,
  Minimize2,
  User, 
  UserPlus,
  Users,
  Upload, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  Download, 
  LayoutGrid,
  Filter, 
  Settings2,
  Settings,
  Calendar,
  X,
  Loader2,
  Image as ImageIcon,
  Plus,
  Minus,
  Search,
  LogOut,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Smile,
  Zap,
  Globe,
  QrCode,
  Home,
  Wand2,
  MessageSquare,
  Sparkles,
  ArrowDownAZ,
  Clock,
  ArrowUpDown,
  Tags
} from "lucide-react";
import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { auth, db, signInWithGoogle, OperationType, handleFirestoreError, storage, getDetailedErrorMessage } from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser, signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getDoc,
  setDoc,
  getDocFromServer,
  deleteDoc
} from "firebase/firestore";

type Step = "welcome" | "weddings" | "upload" | "verify" | "gallery" | "profile" | "dashboard" | "calendar" | "details";
type EventType = "wedding" | "anniversary" | "birthday" | "corporate" | "gala" | "sangeet" | "other";

import { WeddingTask, WeddingGuest, BudgetItem, EventVendor } from "./types/premium";
import { MOCK_WEDDINGS, MOCK_TASKS, MOCK_GUESTS, MOCK_BUDGET, MOCK_VENDORS, MOCK_ACTIVITY_FEED } from "./data/mockData";
import AestheticDashboard from "./components/AestheticDashboard";
import EventDetailsConsole from "./components/EventDetailsConsole";
import CalendarView from "./components/CalendarView";
import ButtonShowcase from "./components/ButtonShowcase";

interface Wedding {
  id: string;
  name: string;
  date: string;
  type?: EventType;
  ownerId: string;
  watermarkEnabled: boolean;
  watermarkType?: "text" | "image";
  watermarkText?: string;
  watermarkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  watermarkOpacity?: number;
  watermarkBg?: string;
  watermarkTextSize?: number;
  watermarkUrl?: string;
  watermarkScale?: number;
  watermarkOffsetX?: number;
  watermarkOffsetY?: number;
  liquidGlassEnabled?: boolean;
  photoBlur?: number;
  coverUrl?: string;
  sharingLimit: "1h" | "2h" | "5h" | "15h" | "1d" | "2d" | "3d" | "unlimited";
}

interface Photo {
  id: string;
  url: string;
  name: string;
  weddingId: string;
  uploadedBy: string;
  createdAt?: any;
  tags?: string[];
  size?: number;
  type?: string;
  dimensions?: string;
}

interface LazyPhotoProps {
  key?: any;
  photo: Photo;
  currentWedding: Wedding | null;
  index: number;
  onClick: () => void;
  isSaved: boolean;
  onDownload: (url: string, filename: string) => void;
  onShare: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
  canDelete?: boolean;
  onToggleSave: (photo: Photo) => void;
}

function LazyPhoto({ 
  photo, 
  currentWedding, 
  index, 
  onClick, 
  isSaved,
  onDownload,
  onShare,
  onDelete,
  canDelete,
  onToggleSave
}: LazyPhotoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div 
      ref={imgRef}
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className="group relative aspect-[4/5] ios-squircle overflow-hidden shadow-2xl shadow-stone-200/50 dark:shadow-black/50 cursor-pointer bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-white/5"
    >
      {/* Placeholder / Shimmer */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-200/50 dark:bg-stone-800/50 backdrop-blur-md flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse">
               <ImageIcon className="w-6 h-6 text-stone-300 dark:text-stone-600" />
            </div>
            <div className="h-1 w-12 bg-stone-300/30 dark:bg-stone-600/30 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 className="h-full w-full bg-stone-400/50 dark:bg-stone-500/50"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isInView && (
        <img 
          src={photo.url} 
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-[1.5s] group-hover:scale-110 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          style={{ filter: `blur(${currentWedding?.photoBlur || 0}px)` }}
        />
      )}
      
      {/* Watermark Consistency */}
      {currentWedding && (currentWedding.watermarkEnabled ?? true) && (
        <div className={`absolute inset-0 p-4 pointer-events-none flex ${
          currentWedding.watermarkPosition === 'top-left' ? 'items-start justify-start' :
          currentWedding.watermarkPosition === 'top-right' ? 'items-start justify-end' :
          currentWedding.watermarkPosition === 'bottom-left' ? 'items-end justify-start' :
          currentWedding.watermarkPosition === 'bottom-right' ? 'items-end justify-end' :
          'items-center justify-center'
        }`} style={{ 
          opacity: Math.max(0.1, currentWedding.watermarkOpacity ?? 0.4),
          transform: `translate(${currentWedding.watermarkOffsetX || 0}%, ${currentWedding.watermarkOffsetY || 0}%)`
        }}>
           {currentWedding.watermarkType === "image" && currentWedding.watermarkUrl ? (
             <div 
               className="origin-center p-2"
               style={{ transform: `scale(${currentWedding.watermarkScale || 1})` }}
             >
               <img 
                 src={currentWedding.watermarkUrl} 
                 className="max-w-[120px] max-h-[120px] object-contain drop-shadow-lg" 
                 alt="Watermark"
               />
             </div>
           ) : (
             <div className={`text-center space-y-1 p-4 rounded-2xl backdrop-blur-md border border-white/20 origin-center scale-[0.6] md:scale-90 ${currentWedding.watermarkBg || "transparent"}`}>
                <Camera className="w-5 h-5 text-white mx-auto mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                <p className="font-serif italic text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ fontSize: `${(currentWedding.watermarkTextSize || 18)}px` }}>
                   {currentWedding.watermarkText || "E. Moments"}
                </p>
                <p className="text-[10px] text-white font-bold uppercase tracking-[0.4em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{currentWedding.date}</p>
             </div>
           )}
        </div>
      )}
      
      {isSaved && (
        <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white dark:bg-stone-950 flex items-center justify-center shadow-2xl ring-1 ring-black/5 z-20">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
         <div className="flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-60">Hand-Picked Moment</p>
               <p className="font-serif italic text-2xl text-white">{photo.name}</p>
            </div>
            <div className="flex gap-3">
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onToggleSave(photo);
                 }}
                 className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isSaved ? 'accent-bg text-white shadow-lg accent-ring ring-4 ring-opacity-20' : 'bg-white/20 text-white hover:bg-white/40'}`}
              >
                 <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onShare(photo);
                 }}
                 className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-all text-white"
              >
                 <Share2 className="w-5 h-5" />
              </button>
              {canDelete && onDelete && (
                <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onDelete(photo);
                   }}
                   className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center hover:bg-red-500/40 transition-all group/del"
                >
                   <Trash2 className="w-5 h-5 text-white group-hover/del:scale-110 transition-transform" />
                </button>
              )}
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onDownload(photo.url, `E-Moment-${photo.id}.jpg`);
                 }}
                 className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-all"
              >
                 <Download className="w-5 h-5 text-white" />
              </button>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                 <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wId = params.get('v') || params.get('wedding');
    if (wId) {
      const fetchPublicWedding = async () => {
        try {
          const docSnap = await getDoc(doc(db, "weddings", wId));
          if (docSnap.exists()) {
            setCurrentWedding({ id: docSnap.id, ...docSnap.data() } as Wedding);
            setStep("gallery");
            showNotification(`Accessing ${docSnap.data().name}`);
          }
        } catch (e) {
          console.error("Link invalid or private", e);
        }
      };
      fetchPublicWedding();
    }
  }, []);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [accentId, setAccentId] = useState(0);

  const palettes = [
    { name: "Desert Sand", accent: "#e2b884", glow: "rgba(226, 184, 132, 0.5)", soft: "rgba(226, 184, 132, 0.1)" },
    { name: "Cosmic Indigo", accent: "#6366f1", glow: "rgba(99, 102, 241, 0.5)", soft: "rgba(99, 102, 241, 0.1)" },
    { name: "Rose Quartz", accent: "#f472b6", glow: "rgba(244, 114, 182, 0.5)", soft: "rgba(244, 114, 182, 0.1)" },
    { name: "Emerald Glass", accent: "#34d399", glow: "rgba(52, 211, 153, 0.5)", soft: "rgba(52, 211, 153, 0.1)" },
    { name: "Sunset Gold", accent: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)", soft: "rgba(251, 191, 36, 0.1)" },
    { name: "Celestial Blue", accent: "#38bdf8", glow: "rgba(56, 189, 248, 0.5)", soft: "rgba(56, 189, 248, 0.1)" },
    { name: "Lavender Fog", accent: "#a78bfa", glow: "rgba(167, 139, 250, 0.5)", soft: "rgba(167, 139, 250, 0.1)" },
    { name: "Crimson Velvet", accent: "#f87171", glow: "rgba(248, 113, 113, 0.5)", soft: "rgba(248, 113, 113, 0.1)" },
  ];

  useEffect(() => {
    const palette = palettes[accentId];
    const root = document.documentElement;
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-glow", palette.glow);
    root.style.setProperty("--accent-soft", palette.soft);
  }, [accentId]);

  // Cycle accent on step change or wedding change
  useEffect(() => {
    setAccentId((prev) => (prev + 1) % palettes.length);
  }, [step, currentWedding?.id]);

  const [activeTab, setActiveTab] = useState("home");
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
  const [weddings, setWeddings] = useState<Wedding[]>(MOCK_WEDDINGS);
  const [beganExperience, setBeganExperience] = useState(() => {
    return localStorage.getItem("onboarding_complete") === "true";
  });
  const [tasks, setTasks] = useState<WeddingTask[]>(() => {
    const saved = localStorage.getItem("premier_tasks");
    return saved ? JSON.parse(saved) : MOCK_TASKS;
  });
  const [guests, setGuests] = useState<WeddingGuest[]>(() => {
    const saved = localStorage.getItem("premier_guests");
    return saved ? JSON.parse(saved) : MOCK_GUESTS;
  });
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem("premier_budget");
    return saved ? JSON.parse(saved) : MOCK_BUDGET;
  });
  const [vendors, setVendors] = useState<EventVendor[]>(() => {
    const saved = localStorage.getItem("premier_vendors");
    return saved ? JSON.parse(saved) : MOCK_VENDORS;
  });
  const [activityFeeds, setActivityFeeds] = useState<{ id: string; eventId: string; message: string; timestamp: string }[]>(() => {
    const saved = localStorage.getItem("premier_feed");
    return saved ? JSON.parse(saved) : MOCK_ACTIVITY_FEED;
  });

  // Sync updates
  useEffect(() => {
    localStorage.setItem("premier_tasks", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("premier_guests", JSON.stringify(guests));
  }, [guests]);
  useEffect(() => {
    localStorage.setItem("premier_budget", JSON.stringify(budgetItems));
  }, [budgetItems]);
  useEffect(() => {
    localStorage.setItem("premier_vendors", JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    localStorage.setItem("premier_feed", JSON.stringify(activityFeeds));
  }, [activityFeeds]);

  useEffect(() => {
    if (step === "welcome" && beganExperience) {
      setStep("dashboard");
    }
  }, [step, beganExperience]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [networkView, setNetworkView] = useState<"followers" | "following">("followers");
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'completed' | 'error'; errorMessage?: string }[]>([]);
  const [showNav, setShowNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showSelectionsOnly, setShowSelectionsOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [isWatermarkUploading, setIsWatermarkUploading] = useState(false);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<Photo[]>([]);
  const [showControls, setShowControls] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'tags'>('newest');
  const [copied, setCopied] = useState(false);
  const [newWeddingData, setNewWeddingData] = useState({ 
    name: "", 
    date: "", 
    type: "wedding" as EventType, 
    sharingLimit: "unlimited" as Wedding["sharingLimit"], 
    coverUrl: "" 
  });
  const [selfie, setSelfie] = useState<string | null>(null);
  const [profileTitle, setProfileTitle] = useState("");
  const [profileAbout, setProfileAbout] = useState("");
  const [profileFavoriteSubject, setProfileFavoriteSubject] = useState("");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [collectionSummary, setCollectionSummary] = useState<string | null>(null);
  const [isGeneratingToast, setIsGeneratingToast] = useState(false);
  const [generatedToast, setGeneratedToast] = useState<string | null>(null);
  const [toastRelationship, setToastRelationship] = useState("Friend");
  const [toastTone, setToastTone] = useState("Humorous");
  const [toastMemory, setToastMemory] = useState("");
  const [showToastAssistant, setShowToastAssistant] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWedding, setEditingWedding] = useState<Wedding | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [hideEventCode, setHideEventCode] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [cameraInitialMode, setCameraInitialMode] = useState<"photo" | "qr">("photo");

  const handleJoinWedding = async () => {
    if (!joinId) return;
    try {
      const docRef = doc(db, "weddings", joinId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const wedding = { id: docSnap.id, ...docSnap.data() } as Wedding;
        setCurrentWedding(wedding);
        setStep("gallery");
        setShowJoinModal(false);
        setJoinId("");
        showNotification(`Joined "${wedding.name}"`);
      } else {
        showNotification("Invalid wedding ID");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `weddings/${joinId}`);
      showNotification(getDetailedErrorMessage(e));
    }
  };

  const handleQRScanJoin = async (scannedData: string) => {
    let targetId = scannedData;
    // Handle full URLs (e.g. from shared wedding link)
    if (scannedData.includes('?v=')) {
      targetId = new URL(scannedData).searchParams.get('v') || scannedData;
    } else if (scannedData.includes('/v/')) {
      targetId = scannedData.split('/v/').pop() || scannedData;
    }
    
    // Remove any trailing slashes or parameters if we took it from /v/
    if (!scannedData.includes('?v=')) {
      targetId = targetId.split('?')[0].split('#')[0].replace(/\/$/, "");
    }

    try {
      const docRef = doc(db, "weddings", targetId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const wedding = { id: docSnap.id, ...docSnap.data() } as Wedding;
        setCurrentWedding(wedding);
        setStep("gallery");
        setShowCamera(false);
        showNotification(`Joined with "${wedding.name}"`);
      } else {
        showNotification("Unrecognized Wedding ID");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `weddings/${targetId}`);
      showNotification(getDetailedErrorMessage(e));
    }
  };

  // Fetch profile data when entering profile step
  useEffect(() => {
    if (step === "profile" && user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, "profiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileTitle(data.title || "");
            setProfileAbout(data.about || "");
            setProfileFavoriteSubject(data.favoriteSubject || "");
            if (data.savedPhotos) {
              setSavedPhotos(data.savedPhotos);
            }
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `profiles/${user.uid}`);
        }
      };
      fetchProfile();
    }
  }, [step, user]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNav(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll to show/hide nav based on user direction
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling up, hide. If scrolling down, show.
      if (currentScrollY < lastScrollY && currentScrollY > 50) {
        setShowNav(false);
      } else if (currentScrollY > lastScrollY || currentScrollY <= 50) {
        setShowNav(true);
      }
      
      setLastScrollY(currentScrollY);

      // Reset timer to show after 5s of no scrolling (stalling) if it was hidden
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowNav(true);
      }, 5000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  useEffect(() => {
    let unsubWeddings: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      // Fetch public/all weddings regardless of auth for Discovery
      const q = query(collection(db, "weddings"));
      const unsubWeddings = onSnapshot(q, 
        (snapshot) => {
          const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Wedding));
          const combined = [...fetched, ...MOCK_WEDDINGS.filter(mw => !fetched.some(fw => fw.id === mw.id))];
          setWeddings(combined);
        },
        (error) => {
          console.warn("Public wedding fetch limited", error);
        }
      );

      if (!u) {
        // If not logged in and not currently viewing a wedding via URL link
        if (!currentWedding) {
          setStep("welcome");
        }
      }
      
      return () => {
        unsubWeddings();
      };
    });
    return () => unsubscribe();
  }, [currentWedding]);

  useEffect(() => {
    if (currentWedding) {
      const q = query(collection(db, "weddings", currentWedding.id, "photos"));
    try {
      const unsubPhotos = onSnapshot(q, 
        (snapshot) => {
          setUploadedPhotos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Photo)));
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `weddings/${currentWedding.id}/photos`);
        }
      );
      return () => unsubPhotos();
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, `weddings/${currentWedding.id}/photos`);
    }
    }
  }, [currentWedding]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, "profiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfileTitle(docSnap.data().title || "");
          }
        } catch (error) {
          console.error("Profile fetch skipped or failed (offline):", error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const showNotification = (message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("onboarding_complete");
    if (!hasSeenOnboarding) {
      setOnboardingStep(0);
    }
  }, []);

  const addPlanningTask = (taskData: Omit<WeddingTask, "id">) => {
    const newTask: WeddingTask = {
      ...taskData,
      id: "task_" + Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    const logInfo = {
      id: "feed_" + Date.now(),
      eventId: taskData.weddingId,
      message: `New task assigned: ${taskData.title}`,
      timestamp: "Just now"
    };
    setActivityFeeds(prev => [logInfo, ...prev]);
    showNotification("Task assigned successfully");
  };

  const togglePlanningTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === "completed" ? "pending" : "completed";
        const logInfo = {
          id: "feed_" + Date.now(),
          eventId: t.weddingId,
          message: `Task "${t.title}" marked as ${nextStatus}`,
          timestamp: "Just now"
        };
        setActivityFeeds(prev => [logInfo, ...prev]);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const deletePlanningTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showNotification("Task removed");
  };

  const addEventGuest = (guestData: Omit<WeddingGuest, "id">) => {
    const newGuest: WeddingGuest = {
      ...guestData,
      id: "guest_" + Date.now()
    };
    setGuests(prev => [newGuest, ...prev]);
    const logInfo = {
      id: "feed_" + Date.now(),
      eventId: guestData.weddingId,
      message: `Guest registry updated: ${guestData.name} invited`,
      timestamp: "Just now"
    };
    setActivityFeeds(prev => [logInfo, ...prev]);
    showNotification("Guest added to registry");
  };

  const toggleGuestRSVP = (guestId: string, rsvp: WeddingGuest["rsvp"]) => {
    setGuests(prev => prev.map(g => {
      if (g.id === guestId) {
        const logInfo = {
          id: "feed_" + Date.now(),
          eventId: g.weddingId,
          message: `${g.name} RSVP updated to ${rsvp}`,
          timestamp: "Just now"
        };
        setActivityFeeds(prev => [logInfo, ...prev]);
        return { ...g, rsvp };
      }
      return g;
    }));
  };

  const deleteEventGuest = (guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
    showNotification("Guest removed");
  };

  const addBudgetItemExpense = (itemData: Omit<BudgetItem, "id">) => {
    const newItem: BudgetItem = {
      ...itemData,
      id: "budget_" + Date.now()
    };
    setBudgetItems(prev => [newItem, ...prev]);
    const logInfo = {
      id: "feed_" + Date.now(),
      eventId: itemData.weddingId,
      message: `Added budget expense: ${itemData.name} (₹${itemData.amount})`,
      timestamp: "Just now"
    };
    setActivityFeeds(prev => [logInfo, ...prev]);
    showNotification("Budget expense saved");
  };

  const deleteBudgetItemExpense = (itemId: string) => {
    setBudgetItems(prev => prev.filter(b => b.id !== itemId));
    showNotification("Expense removed");
  };

  const addEventVendor = (vendorData: Omit<EventVendor, "id">) => {
    const newVendor: EventVendor = {
      ...vendorData,
      id: "vendor_" + Date.now()
    };
    setVendors(prev => [newVendor, ...prev]);
    const logInfo = {
      id: "feed_" + Date.now(),
      eventId: vendorData.weddingId,
      message: `Booked vendor contract: ${vendorData.name} for ${vendorData.category}`,
      timestamp: "Just now"
    };
    setActivityFeeds(prev => [logInfo, ...prev]);
    showNotification("Vendor booked successfully");
  };

  const deleteEventVendor = (vendorId: string) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    showNotification("Vendor removed");
  };

  const completeOnboarding = () => {
    setOnboardingStep(null);
    localStorage.setItem("onboarding_complete", "true");
    setBeganExperience(true);
    showNotification("Welcome to E. Moments");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("Session terminated safely");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const handleCreateWedding = async () => {
    if (!user || !newWeddingData.name || !newWeddingData.date) return;

    try {
      const docRef = await addDoc(collection(db, "weddings"), {
        ...newWeddingData,
        ownerId: user.uid,
        watermarkEnabled: true,
        watermarkText: "E. Moments",
        watermarkPosition: "center",
        watermarkOpacity: 0.4,
        watermarkBg: "transparent",
        watermarkTextSize: 24,
        liquidGlassEnabled: false,
        photoBlur: 0,
        createdAt: serverTimestamp(),
      });
      
      const newWed = { 
        id: docRef.id, 
        ...newWeddingData, 
        ownerId: user.uid,
        watermarkEnabled: true,
        watermarkText: "E. Moments",
        watermarkPosition: "center",
        watermarkOpacity: 0.4,
        watermarkBg: "transparent",
        watermarkTextSize: 24,
        liquidGlassEnabled: false,
        photoBlur: 0
      } as Wedding;
      
      setCurrentWedding(newWed);
      setShowCreateModal(false);
      setNewWeddingData({ name: "", date: "", type: "wedding" as EventType, sharingLimit: "unlimited", coverUrl: "" });
      setStep("upload");
      showNotification("Event created successfully.");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "weddings");
      showNotification(getDetailedErrorMessage(e));
    }
  };

  const uploadImageToStorage = async (file: File | Blob, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const compressImage = async (file: File): Promise<File | Blob> => {
    // Only compress if photo > 1.5MB and is an image
    if (file.size < 1.5 * 1024 * 1024 || !file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // High fidelity but manageable size (2500px max)
        const max = 2500;
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || !currentWedding || !user) return;

    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    const ALLOWED_TYPES = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif', 
      'image/heic'
    ];

    const fileArray = Array.from(files) as File[];
    const validFiles = fileArray.filter(file => {
      const isValidType = ALLOWED_TYPES.includes(file.type) || 
                          file.name.toLowerCase().endsWith('.heic') || 
                          file.name.toLowerCase().endsWith('.heif');
      const isValidSize = file.size <= MAX_FILE_SIZE;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0 && fileArray.length > 0) {
      showNotification("Images must be under 15MB (JPG/PNG/WebP/HEIC)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed("Optimizing...");
    
    try {
      const totalFiles = validFiles.length;
      let completedCount = 0;
      
      const initialQueue = validFiles.map((f, i) => ({
        id: `${Date.now()}_${i}`,
        name: f.name,
        progress: 0,
        status: 'uploading' as const
      }));
      setUploadingFiles(initialQueue);

      // Track bytes for total progress calculation
      const fileStatusMap: Record<string, { bytesTransferred: number, totalBytes: number }> = {};
      validFiles.forEach((f, i) => {
        fileStatusMap[initialQueue[i].id] = { bytesTransferred: 0, totalBytes: f.size };
      });

      const updateTotalProgress = () => {
        const total = Object.values(fileStatusMap).reduce((acc, curr) => acc + curr.totalBytes, 0);
        const transferred = Object.values(fileStatusMap).reduce((acc, curr) => acc + curr.bytesTransferred, 0);
        setUploadProgress(Math.round((transferred / total) * 100));
      };

      const uploadPromises = validFiles.map(async (file, index) => {
        const fileId = initialQueue[index].id;
        let lastTransferred = 0;
        let lastTime = performance.now();
        
        try {
          // Compression pass
          const blobToUpload = await compressImage(file);
          fileStatusMap[fileId].totalBytes = blobToUpload.size;
          
          const storagePath = `weddings/${currentWedding.id}/photos/${fileId}_${file.name}`;
          const storageRef = ref(storage, storagePath);
          const uploadTask = uploadBytesResumable(storageRef, blobToUpload);
          
          return new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                fileStatusMap[fileId].bytesTransferred = snapshot.bytesTransferred;
                updateTotalProgress();

                const currentTime = performance.now();
                const timeDiff = (currentTime - lastTime) / 1000;
                if (timeDiff >= 0.8) {
                  const bytesDiff = snapshot.bytesTransferred - lastTransferred;
                  const speedKbps = (bytesDiff / 1024) / timeDiff;
                  setUploadSpeed(`${speedKbps.toFixed(1)} KB/s`);
                  lastTransferred = snapshot.bytesTransferred;
                  lastTime = currentTime;
                }

                setUploadingFiles(prev => prev.map(f => 
                  f.id === fileId ? { ...f, progress } : f
                ));
              },
              (error) => {
                setUploadingFiles(prev => prev.map(f => 
                  f.id === fileId ? { ...f, status: 'error', errorMessage: "Network interruption" } : f
                ));
                reject(error);
              },
              async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                const photoData = {
                  url: downloadUrl,
                  name: file.name,
                  weddingId: currentWedding.id,
                  uploadedBy: user.uid,
                  createdAt: serverTimestamp(),
                  size: blobToUpload.size,
                  type: "image/jpeg",
                  dimensions: 'High Fidelity'
                };
                
                await addDoc(collection(db, "weddings", currentWedding.id, "photos"), photoData);
                
                setUploadingFiles(prev => prev.map(f => 
                  f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
                ));
                
                completedCount++;
                resolve();
              }
            );
          });
        } catch (e) {
          console.error(e);
          return Promise.resolve();
        }
      });

      await Promise.allSettled(uploadPromises);
      showNotification(`Mission successful. ${completedCount} moments added.`);
    } catch (e) {
      console.error(e);
      showNotification("Upload encountered issues");
    } finally {
      setIsUploading(false);
      setUploadSpeed(null);
    }
  };

  const handleFolderUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleWatermarkUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWedding || !user) return;

    // Check size (max 2MB for watermark)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Watermark image must be under 2MB");
      return;
    }

    setIsWatermarkUploading(true);
    try {
      const filename = `watermark_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `weddings/${currentWedding.id}/watermark/${filename}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateWatermarkSettings({ 
        watermarkUrl: url, 
        watermarkType: 'image',
        watermarkScale: 1,
        watermarkOffsetX: 0,
        watermarkOffsetY: 0
      });
      showNotification("Watermark logo updated");
    } catch (e) {
      console.error(e);
      showNotification(getDetailedErrorMessage(e));
    } finally {
      setIsWatermarkUploading(false);
    }
  };

  const handleCameraCapture = async (dataUrl: string) => {
    if (!currentWedding || !user) return;
    setIsUploading(true);
    try {
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const filename = `capture_${Date.now()}.jpg`;
      const storagePath = `weddings/${currentWedding.id}/photos/${filename}`;
      const downloadUrl = await uploadImageToStorage(blob, storagePath);

      const photoData = {
        url: downloadUrl,
        name: filename,
        weddingId: currentWedding.id,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
        size: blob.size,
        type: blob.type,
        dimensions: "1920x1080" // Captured from device
      };
      await addDoc(collection(db, "weddings", currentWedding.id, "photos"), photoData);
      showNotification("Memory captured and archived");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `weddings/${currentWedding.id}/photos`);
      showNotification(getDetailedErrorMessage(e));
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyFace = async (selfieDataUrl: string) => {
    if (!currentWedding || uploadedPhotos.length === 0) {
      setStep("gallery");
      return;
    }
    
    setIsVerifying(true);
    setSelfie(selfieDataUrl);
    try {
      const resp = await fetch(selfieDataUrl);
      const blob = await resp.blob();
      const formData = new FormData();
      formData.append("selfie", blob, "selfie.jpg");
      
      const weddingPhotos = uploadedPhotos.filter(p => p.weddingId === currentWedding.id);
      formData.append("galleryUrls", JSON.stringify(weddingPhotos.slice(0, 30).map(p => p.url)));

      const response = await fetch("/api/verify-face", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("API failure");
      const data = await response.json();
      
      if (data.matchedIndices) {
        const realIndices = data.matchedIndices.map((relIdx: number) => {
          const photo = weddingPhotos.slice(0, 30)[relIdx];
          return uploadedPhotos.findIndex(p => p.url === photo.url);
        }).filter((idx: number) => idx !== -1);
        
        setMatchedIndices(realIndices.length > 0 ? realIndices : []);
        setStep("gallery");
        showNotification(realIndices.length > 0 ? `Found ${realIndices.length} matches` : "No matches in scan range");
      }
    } catch (e) {
      console.error(e);
      showNotification("Face scan failed");
      setStep("gallery");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelfieUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWedding) return;

    if (selfie) try { URL.revokeObjectURL(selfie); } catch(e) {}
    const url = URL.createObjectURL(file);
    handleVerifyFace(url);
  };

  const downloadQRCode = (id: string, name: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      ctx!.fillStyle = "white";
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 50, 50, 500, 500);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${name}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleProfilePicUpdate = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUpdatingProfile(true);
    try {
      const storagePath = `profiles/${user.uid}/avatar_${Date.now()}`;
      const downloadUrl = await uploadImageToStorage(file, storagePath);
      await updateProfile(user, { photoURL: downloadUrl });
      await setDoc(doc(db, "profiles", user.uid), { photoURL: downloadUrl }, { merge: true });
      setUser({ ...user, photoURL: downloadUrl } as FirebaseUser); // Trigger local update
      showNotification("Profile picture updated");
    } catch (e) {
      console.error(e);
      showNotification(getDetailedErrorMessage(e));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        title: profileTitle,
        about: profileAbout,
        favoriteSubject: profileFavoriteSubject,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showNotification("Profile updated");
      setShowProfileSettings(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `profiles/${user.uid}`);
      showNotification(getDetailedErrorMessage(e));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleToggleTag = async (photo: Photo, tag: string) => {
    if (!currentWedding) return;
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;

    const currentTags = photo.tags || [];
    const newTags = currentTags.includes(cleanTag)
      ? currentTags.filter(t => t !== cleanTag)
      : [...currentTags, cleanTag];

    try {
      await updateDoc(doc(db, "weddings", currentWedding.id, "photos", photo.id), {
        tags: newTags
      });
      // Logic for local state update is handled by onSnapshot of photos
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto({ ...selectedPhoto, tags: newTags });
      }
      showNotification(currentTags.includes(cleanTag) ? `Tag "${cleanTag}" removed` : `Tag "${cleanTag}" added`);
    } catch (e) {
      console.error("Tag update failed:", e);
      showNotification("Failed to update tags");
    }
  };

  const applyWatermarkToBlob = async (blob: Blob, wedding: Wedding): Promise<Blob> => {
    if (!wedding.watermarkEnabled) return blob;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        
        // Normalize resolution to prevent memory crashes but maintain print quality
        const maxDim = 3200; 
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(blob); return; }

        // Draw original
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const opacity = Math.max(0.1, wedding.watermarkOpacity ?? 0.4);
        ctx.globalAlpha = opacity;

        const padding = width * 0.04; // 4% padding
        const offsetX = (wedding.watermarkOffsetX || 0) / 100 * width;
        const offsetY = (wedding.watermarkOffsetY || 0) / 100 * height;

        if (wedding.watermarkType === 'image' && wedding.watermarkUrl) {
           try {
             const logoImg = await new Promise<HTMLImageElement>((res, rej) => {
               const l = new Image();
               l.crossOrigin = "anonymous";
               l.onload = () => res(l);
               l.onerror = rej;
               l.src = wedding.watermarkUrl!;
             });

             const baseScale = (width / 1800); 
             const scale = (wedding.watermarkScale || 1) * baseScale;
             const lw = logoImg.width * scale;
             const lh = logoImg.height * scale;

             let lx = padding;
             let ly = padding;

             const pos = wedding.watermarkPosition || 'center';
             if (pos === 'top-right') lx = width - lw - padding;
             else if (pos === 'bottom-left') ly = height - lh - padding;
             else if (pos === 'bottom-right') { lx = width - lw - padding; ly = height - lh - padding; }
             else if (pos === 'center') { lx = (width - lw) / 2; ly = (height - lh) / 2; }

             ctx.drawImage(logoImg, lx + offsetX, ly + offsetY, lw, lh);
           } catch (e) {
             console.error("Logo load failed during bake", e);
           }
        } else {
           const fontSize = (wedding.watermarkTextSize || 24) * (width / 1400);
           ctx.font = `italic ${fontSize}px "serif"`; // Fallback to system serif if Playfair isn't loaded on canvas
           ctx.fillStyle = "white";
           ctx.shadowColor = "rgba(0,0,0,0.6)";
           ctx.shadowBlur = fontSize / 6;
           ctx.shadowOffsetX = fontSize / 12;
           ctx.shadowOffsetY = fontSize / 12;

           const text = wedding.watermarkText || "E. Moments";
           const dateText = wedding.date || "";
           const metrics = ctx.measureText(text);
           const tw = metrics.width;
           
           let tx = padding;
           let ty = padding + fontSize;

           const pos = wedding.watermarkPosition || 'center';
           if (pos === 'top-right') tx = width - tw - padding;
           else if (pos === 'bottom-left') ty = height - padding - fontSize * 0.5;
           else if (pos === 'bottom-right') { tx = width - tw - padding; ty = height - padding - fontSize * 0.5; }
           else if (pos === 'center') { tx = (width - tw) / 2; ty = (height + fontSize) / 2; }

           ctx.fillText(text, tx + offsetX, ty + offsetY);
           
           // Small date line
           if (dateText) {
             ctx.font = `bold ${fontSize * 0.4}px sans-serif`;
             ctx.globalAlpha = opacity * 0.8;
             const dMetrics = ctx.measureText(dateText);
             ctx.fillText(dateText, tx + offsetX + (tw - dMetrics.width) / 2, ty + offsetY + fontSize * 0.6);
           }
        }

        canvas.toBlob((result) => {
          URL.revokeObjectURL(img.src);
          if (result) resolve(result);
          else resolve(blob);
        }, 'image/jpeg', 0.92);
      };
      img.onerror = () => resolve(blob);
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleDownloadAll = async () => {
    if (uploadedPhotos.length === 0 || !currentWedding) return;
    setIsDownloading(true);
    let downloadCount = 0;
    
    try {
      const zip = new JSZip();
      const folder = zip.folder(currentWedding.name || "Wedding Photos");
      
      const photosToDownload = showSelectionsOnly ? filteredPhotos : uploadedPhotos;
      
      if (photosToDownload.length === 0) {
        showNotification("No photos selected");
        setIsDownloading(false);
        return;
      }

      showNotification(`Processing ${photosToDownload.length} photos...`);

      const BATCH_SIZE = 3; 
      for (let i = 0; i < photosToDownload.length; i += BATCH_SIZE) {
        const batch = photosToDownload.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (photo, index) => {
          const fileIndex = i + index;
          const fileName = `E-Moment-${photo.id || fileIndex + 1}.jpg`;
          
          try {
            let blob: Blob;
            if (photo.url.startsWith('data:')) {
              const base64Data = photo.url.split(',')[1];
              const binaryString = window.atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
              blob = new Blob([bytes], { type: "image/jpeg" });
            } else {
              const resp = await fetch(photo.url, { mode: 'cors' });
              if (!resp.ok) throw new Error("Fetch failed");
              blob = await resp.blob();
            }

            // Bake watermark
            const bakedBlob = await applyWatermarkToBlob(blob, currentWedding);
            folder?.file(fileName, bakedBlob);
            downloadCount++;
          } catch (err) {
            console.error(`Failed photo ${fileIndex}`, err);
          }
        }));
      }
      
      if (downloadCount === 0) {
        throw new Error("Download failed. Check your network permits CORS.");
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${currentWedding.name.replace(/\s+/g, '_')}-Gallery.zip`);
      showNotification(`${downloadCount} photos downloaded with watermarks`);
    } catch (e) {
      console.error(e);
      showNotification(e instanceof Error ? e.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPhoto = async (url: string, filename: string) => {
    try {
      showNotification("Applying watermark & downloading...");
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error("CORS or Network error");
      const blob = await response.blob();
      
      const bakedBlob = await applyWatermarkToBlob(blob, currentWedding!);
      saveAs(bakedBlob, filename);
      showNotification("Perfectly captured");
    } catch (e) {
      console.error("Advanced download failed, using standard", e);
      // Even the fallback can't have watermark because of CORS issues with canvas
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Downloaded original (Watermark not supported on this device)");
    }
  };

  const handleSharePhoto = async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo from ${currentWedding?.name || 'Wedding'}`,
          text: `Check out this photo: ${photo.name}`,
          url: photo.url,
        });
      } catch (err) {
        console.warn("Share aborted", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(photo.url);
        showNotification("Link copied to clipboard");
      } catch (err) {
        showNotification("Copy failed");
      }
    }
  };

  const handleToggleSave = async (photo: Photo) => {
    if (!user) {
      showNotification("Please sign in to save photos");
      return;
    }

    const isAlreadySaved = savedPhotos.some(s => s.url === photo.url);
    let newSaved: Photo[];

    if (isAlreadySaved) {
      newSaved = savedPhotos.filter(s => s.url !== photo.url);
      showNotification("Removed from collection");
    } else {
      newSaved = [...savedPhotos, photo];
      showNotification("Added to your selection");
    }

    setSavedPhotos(newSaved);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        savedPhotos: newSaved,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Cloud sync failed:", e);
    }
  };
  
  const handleDeletePhoto = async () => {
    if (!photoToDelete || !currentWedding) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "weddings", currentWedding.id, "photos", photoToDelete.id));
      
      // 2. Delete from Storage (extract path from URL or reconstruct it)
      // Since we don't store the storage path in the Photo object, 
      // we have to be careful. But usually the path is in the URL.
      // However, it's safer to just delete the doc if we can't reliably get the storage ref.
      // But we should try to delete the storage object too.
      try {
        const fileRef = ref(storage, photoToDelete.url);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.error("Storage deletion failed, but Firestore doc removed:", storageErr);
      }
      
      showNotification("Photo deleted successfully");
      setPhotoToDelete(null);
      if (selectedPhoto?.id === photoToDelete.id) {
        setSelectedPhoto(null);
      }
    } catch (e) {
      console.error(e);
      showNotification(getDetailedErrorMessage(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateWedding = async () => {
    if (!user || !editingWedding) return;
    try {
      await updateDoc(doc(db, "weddings", editingWedding.id), {
        name: editingWedding.name,
        date: editingWedding.date,
        type: editingWedding.type || "wedding",
        sharingLimit: editingWedding.sharingLimit,
        coverUrl: editingWedding.coverUrl || "",
        updatedAt: serverTimestamp(),
      });
      setShowEditModal(false);
      setEditingWedding(null);
      showNotification("Event updated");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `weddings/${editingWedding.id}`);
      showNotification(getDetailedErrorMessage(e));
    }
  };

  const handleSummarizeCollection = async () => {
    if (!currentWedding || uploadedPhotos.length === 0) return;
    
    setIsSummarizing(true);
    setCollectionSummary(null);
    try {
      const getBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:')) return url;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return url;
        }
      };

      // Only take the first few images to avoid massive payloads
      const imagesToSummarize = uploadedPhotos.slice(0, 8);
      const base64Images = await Promise.all(imagesToSummarize.map(p => getBase64(p.url)));

      const response = await fetch("/api/summarize-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: base64Images,
          weddingName: currentWedding.name
        }),
      });
      
      const data = await response.json();
      if (data.summary) {
        setCollectionSummary(data.summary);
        showNotification("Aesthetic analysis complete");
      }
    } catch (e) {
      console.error("Summarization error:", e);
      showNotification("Analysis failed");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateToast = async () => {
    if (!currentWedding) return;
    
    setIsGeneratingToast(true);
    setGeneratedToast(null);
    try {
      const response = await fetch("/api/generate-toast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship: toastRelationship,
          tone: toastTone,
          memory: toastMemory,
          weddingName: currentWedding.name
        }),
      });
      
      const data = await response.json();
      if (data.toast) {
        setGeneratedToast(data.toast);
        showNotification("Toast composed");
      }
    } catch (e) {
      console.error("Toast generation error:", e);
      showNotification("Composition failed");
    } finally {
      setIsGeneratingToast(false);
    }
  };

  const toggleWatermark = async () => {
    if (!currentWedding) return;
    const nextState = !currentWedding.watermarkEnabled;
    try {
      if (user && currentWedding.ownerId === user.uid) {
        await updateDoc(doc(db, "weddings", currentWedding.id), {
          watermarkEnabled: nextState
        });
      }
      setCurrentWedding(prev => prev ? { ...prev, watermarkEnabled: nextState } : null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `weddings/${currentWedding.id}`);
      showNotification(getDetailedErrorMessage(e));
    }
  };

  const updateWatermarkSettings = async (settings: Partial<Wedding>) => {
    if (!currentWedding || !user || currentWedding.ownerId !== user.uid) return;
    try {
      await updateDoc(doc(db, "weddings", currentWedding.id), settings);
      setCurrentWedding(prev => prev ? { ...prev, ...settings } : null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `weddings/${currentWedding.id}`);
      showNotification(getDetailedErrorMessage(e));
    }
  };

  const matchedPhotos = (matchedIndices.length > 0) 
    ? matchedIndices.map(index => uploadedPhotos[index]).filter(Boolean)
    : (step === 'gallery' ? uploadedPhotos : []);

  const filteredPhotos = matchedPhotos.filter(photo => {
    if (!tagFilter) return true;
    return photo.tags?.includes(tagFilter);
  });

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
      const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
      return timeB - timeA;
    }
    if (sortBy === 'oldest') {
      const timeA = a.createdAt?.seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
      const timeB = b.createdAt?.seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
      return timeA - timeB;
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'tags') {
      const tagsA = (a.tags || []).join(',');
      const tagsB = (b.tags || []).join(',');
      return tagsA.localeCompare(tagsB);
    }
    return 0;
  });

  const CameraCapture = ({ onCapture, onClose, onScan, accessKeyId, initialMode = "photo" }: { onCapture: (url: string) => void, onClose: () => void, onScan?: (data: string) => void, accessKeyId?: string, initialMode?: "photo" | "qr" }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [mode, setMode] = useState<"photo" | "qr">(initialMode);
    const [isMinimized, setIsMinimized] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [justScanned, setJustScanned] = useState(false);
    const [scannerMessage, setScannerMessage] = useState<string | null>(null);

    useEffect(() => {
      async function startCamera() {
        try {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          const mStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: facingMode, 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 } 
            } 
          });
          setStream(mStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mStream;
          }
          setIsStarting(false);
        } catch (err: any) {
          console.error("Camera error:", err);
          setError("Camera link failed. Please check camera permissions.");
          setIsStarting(false);
        }
      }
      startCamera();
      return () => {
        stream?.getTracks().forEach(track => track.stop());
      };
    }, [facingMode]);

    useEffect(() => {
      let animationFrameId: number;
      let lastScannedData: string | null = null;

      const scanCode = () => {
        if (mode === "qr" && videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (code && code.data !== lastScannedData) {
                lastScannedData = code.data;
                setJustScanned(true);
                setScannerMessage("ACCESS CODE ACQUIRED");
                
                // Haptic feedback if available
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(200);
                }

                setTimeout(() => {
                  setJustScanned(false);
                  setScannerMessage(null);
                }, 2000);

                if (onScan) {
                   onScan(code.data);
                } else {
                   setScanResult(code.data);
                }
              }
            }
          }
        }
        animationFrameId = requestAnimationFrame(scanCode);
      };
      
      if (mode === "qr") {
        animationFrameId = requestAnimationFrame(scanCode);
      }
      return () => cancelAnimationFrame(animationFrameId);
    }, [mode, onScan]);

    const toggleFacingMode = () => {
      setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    const capture = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          onCapture(dataUrl);
          stream?.getTracks().forEach(track => track.stop());
        }
      }
    };

    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed z-[500] transition-all duration-700 ${
          isMinimized 
            ? "right-6 bottom-32 w-48 h-64 rounded-3xl shadow-2xl overflow-hidden ring-4 ring-white/20" 
            : "inset-0 bg-black"
        }`}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover" 
        />
        <canvas ref={canvasRef} className="hidden" />

        {isStarting && !isMinimized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin accent-text" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold accent-text">Calibrating Sensor...</p>
          </div>
        )}

        {error && !isMinimized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10 text-center bg-stone-950">
             <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-100" />
             </div>
             <p className="text-red-100 text-sm max-w-xs">{error}</p>
             <button onClick={onClose} className="px-10 py-4 bg-white text-stone-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest">Return</button>
          </div>
        )}

        {/* QR Overlay Controls */}
        {!isMinimized && mode === "qr" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-72 h-72 border-2 transition-all duration-300 rounded-[3rem] relative overflow-hidden ${justScanned ? 'border-green-400 bg-green-500/10' : 'border-white/20'}`}>
              <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-2xl shadow-xl transition-colors ${justScanned ? 'border-green-400' : 'accent-border'}`} />
              <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-2xl shadow-xl transition-colors ${justScanned ? 'border-green-400' : 'accent-border'}`} />
              <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-2xl shadow-xl transition-colors ${justScanned ? 'border-green-400' : 'accent-border'}`} />
              <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-2xl shadow-xl transition-colors ${justScanned ? 'border-green-400' : 'accent-border'}`} />
              
              <motion.div 
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className={`absolute left-0 right-0 h-[4px] shadow-[0_0_30px_rgba(129,140,248,1)] transition-colors ${justScanned ? 'bg-green-400' : 'bg-indigo-400'}`}
              />

              {justScanned && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-white"
                />
              )}
            </div>
            
            <div className="absolute bottom-40 flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                {scannerMessage ? (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="px-6 py-3 bg-green-500 rounded-full border border-white/20 shadow-2xl flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{scannerMessage}</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-2 bg-indigo-600 rounded-full border border-white/20 shadow-xl flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Scanning Code</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Top Control Bar */}
        <div className={`absolute top-12 left-0 right-0 px-8 flex items-center justify-between transition-all ${isMinimized ? "hidden" : "visible"}`}>
          <div className="glass-dark px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">ID:</span>
            <span className="text-[10px] font-mono font-bold text-indigo-400">{accessKeyId || "UNNAMED"}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMinimized(true)}
              className="w-12 h-12 rounded-full glass-dark text-white flex items-center justify-center hover:bg-stone-800 transition-all border border-white/10"
              title="Minimize to Side"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="px-6 h-12 rounded-full glass-dark text-white flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all border border-white/10 group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cancel</span>
            </button>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className={`absolute bottom-16 left-0 right-0 flex flex-col items-center gap-10 transition-all ${isMinimized ? "hidden" : "visible"}`}>
          <div className="flex bg-stone-900/80 p-1.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-3xl">
            <button 
              onClick={() => setMode("photo")}
              className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all ${mode === "photo" ? "bg-white text-stone-900" : "text-white/40 hover:text-white"}`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Memoir</span>
            </button>
            <button 
              onClick={() => setMode("qr")}
              className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all ${mode === "qr" ? "bg-white text-stone-900" : "text-white/40 hover:text-white"}`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Type</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-12">
            <button 
              onClick={toggleFacingMode}
              className="w-16 h-16 rounded-full glass-dark text-white flex items-center justify-center hover:bg-stone-800 transition-all border border-white/10"
            >
              <Zap className="w-6 h-6" />
            </button>

            <button 
              onClick={mode === "photo" ? capture : () => {}}
              disabled={mode === "qr"}
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all group ${mode === "qr" ? "opacity-20 translate-y-4" : "bg-white text-stone-900 hover:scale-105 active:scale-95"}`}
            >
              <div className="w-24 h-24 rounded-full border-2 border-stone-100 flex items-center justify-center group-hover:border-stone-900 transition-all">
                <div className="w-20 h-20 rounded-full border border-stone-200" />
              </div>
            </button>
            
            <button 
              onClick={() => {}} // Additional action?
              className="w-16 h-16 rounded-full glass-dark text-white flex items-center justify-center opacity-40"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Minimized UI Controls */}
        {isMinimized && (
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-between p-4 group cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="w-full flex justify-end">
               <button 
                 onClick={(e) => { e.stopPropagation(); onClose(); }}
                 className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
            <div className="text-white text-center">
               <p className="text-[8px] font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded">Tap to Expand</p>
            </div>
          </div>
        )}
      </motion.div>
    );
  };


  return (
    <div 
      className="min-h-screen bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white font-sans selection:bg-stone-200 transition-all duration-1000 relative overflow-hidden flex items-center justify-center p-0 md:p-12"
      style={{ 
        backgroundColor: isDark ? undefined : `${palettes[accentId].accent}05`,
      }}
    >
      {/* Cinematic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.1, 0.2, 0.1],
            backgroundColor: palettes[accentId].accent 
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[20%] -left-[10%] w-[80%] aspect-square rounded-full blur-[150px]"
          style={{ opacity: 0.1 }}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1], 
            opacity: [0.1, 0.15, 0.1],
            backgroundColor: palettes[(accentId + 2) % palettes.length].accent 
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] aspect-square rounded-full blur-[150px]"
          style={{ opacity: 0.1 }}
        />
      </div>

      {/* Responsive Wrapper - Wide on PC, Compact on Mobile */}
      <div className="w-full max-w-7xl h-screen md:h-[92vh] md:rounded-[3rem] bg-white dark:bg-stone-950 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden transition-all duration-1000">
        
        {/* Compact Dynamic Island Header */}
        {isUiVisible && (
          <nav className="absolute top-4 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm md:max-w-xl transition-all duration-700">
            <div className="glass-morphism rounded-2xl px-4 py-2 flex items-center justify-between shadow-xl ring-1 ring-white/10 backdrop-blur-3xl overflow-hidden border border-white/10">
              <div className="flex items-center gap-2">
                {step !== "welcome" && (
                  <button 
                    onClick={() => {
                      if (step === "gallery") {
                        setStep("weddings");
                      } else if (step === "upload" || step === "weddings" || step === "profile") {
                        setStep("welcome");
                      }
                      setAccentId((prev) => (prev + 1) % palettes.length);
                    }}
                    className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setStep("welcome"); setCurrentWedding(null); }}>
                   <div className="w-7 h-7 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                   </div>
                   <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-900 dark:text-white">E. Moments</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDark(!isDark)}
                  className="w-7 h-7 rounded-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/10 flex items-center justify-center text-stone-400"
                >
                  {isDark ? <Zap className="w-3.5 h-3.5 text-yellow-500" /> : <Zap className="w-3.5 h-3.5" />}
                </button>
                {user && (
                  <div 
                    onClick={() => setStep("profile")}
                    className="w-7 h-7 rounded-full border border-stone-200 dark:border-white/10 overflow-hidden bg-stone-100 dark:bg-stone-900 cursor-pointer"
                  >
                     <img src={user.photoURL || ""} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}

        {/* Liquid Bottom Tab Bar - Slimmed Down */}
        {isUiVisible && (
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm md:max-w-xl">
            <div className="glass-dark rounded-[2rem] p-1.5 flex items-center justify-around shadow-2xl ring-1 ring-white/10 backdrop-blur-3xl border border-white/5">
              {[
                { id: beganExperience ? "dashboard" : "welcome", label: beganExperience ? "Home" : "Intro", icon: beganExperience ? Home : Sparkles },
                { id: "weddings", label: "Events", icon: LayoutGrid },
                { id: "calendar", label: "Calendar", icon: Calendar, disabled: !beganExperience },
                { id: "gallery", label: "Studio", icon: ImageIcon, disabled: !currentWedding && !showSelectionsOnly },
                { id: "profile", label: "Bio", icon: User }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = step === tab.id;
                return (
                  <button
                    key={tab.id}
                    disabled={tab.disabled}
                    onClick={() => {
                        setStep(tab.id as Step);
                        setAccentId((prev) => (prev + 1) % palettes.length);
                    }}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all relative ${isActive ? 'text-white' : 'text-white/40'} ${tab.disabled ? 'cursor-not-allowed opacity-10' : 'hover:scale-110 active:scale-95'}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="nav-pill"
                        className="absolute inset-0 accent-bg opacity-20 rounded-2xl -z-10 shadow-inner"
                      />
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse accent-text' : ''}`} />
                    <span className="text-[6px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-700 w-full relative ${isUiVisible ? 'pt-20 pb-28' : 'pt-0 pb-0'}`}>
          <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative min-h-screen flex flex-col items-center justify-start text-center space-y-24 py-20 pb-40 overflow-x-hidden"
            >
              {/* Cinematic Background Elements */}
              <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-screen bg-gradient-to-b from-stone-100/50 to-transparent dark:from-stone-900/50" />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-indigo-200 dark:bg-indigo-950/30 rounded-full blur-[120px]" 
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1]
                  }}
                  transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                  className="absolute bottom-[20%] right-[-5%] w-[50%] aspect-square bg-stone-200 dark:bg-stone-900/40 rounded-full blur-[100px]" 
                />
              </div>

              {/* Hero Section */}
              <div className="space-y-12 max-w-6xl mx-auto px-6 relative z-10 pt-20">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-4 px-8 py-4 rounded-full glass-morphism border border-white/40 shadow-2xl text-stone-900 dark:text-white text-[10px] font-bold uppercase tracking-[0.5em]"
                >
                  <Sparkles className="w-4 h-4 accent-text animate-pulse" />
                  E. Moments v3.0
                </motion.div>
                
                <div className="space-y-4">
                  <h1 className="text-[10vw] lg:text-[7rem] font-serif italic text-stone-900 dark:text-white leading-[0.8] tracking-tight">
                    Pure <br />
                    <span className="text-stone-300 dark:text-stone-700/50">Eternal</span>
                  </h1>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-[1px] w-24 accent-bg mx-auto opacity-40"
                  />
                </div>
                
                <p className="text-xl md:text-3xl text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-serif italic">
                  "Beyond mere pixels, we curate the emotional atmosphere of your most sacred exchanges."
                </p>

              <div className="flex flex-col items-center justify-center gap-4">
                <button 
                  onClick={user ? () => setStep("profile") : signInWithGoogle}
                  className="group relative w-full max-w-xs py-5 rounded-2xl accent-bg text-white font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl overflow-hidden hover:scale-105 active:scale-95 transition-all"
                >
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-3 text-[11px]">
                    {user ? "View My Archive" : "Begin Experience"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    className="flex-1 py-5 rounded-2xl glass-morphism border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white font-bold text-[9px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all"
                  >
                    Enter Code
                  </button>

                  <button 
                    onClick={() => {
                      setCameraInitialMode("qr");
                      setShowCamera(true);
                    }}
                    className="p-5 rounded-2xl accent-bg text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl accent-ring ring-2 ring-opacity-20"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>

              {/* Featured Marquee Section */}
              <div className="w-full py-10 space-y-10">
                <div className="flex items-center gap-6 px-10">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-stone-200 dark:to-white/10" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-stone-400 whitespace-nowrap">Atmospheric Extractions</p>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-stone-200 dark:to-white/10" />
                </div>

                <div className="relative overflow-hidden group">
                  <motion.div 
                    animate={{ x: [0, -2000] }}
                    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                    className="flex gap-10 whitespace-nowrap w-max px-6"
                  >
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-[45vw] md:w-[35vw] aspect-[3/4] ios-squircle overflow-hidden bg-stone-200 dark:bg-white/5 border border-white/10 shadow-2xl relative group/card">
                        <img 
                          src={`https://images.unsplash.com/photo-${1519741497674 + i*200}?auto=format&fit=crop&q=80&w=800`} 
                          className="w-full h-full object-cover grayscale group-hover/card:grayscale-0 transition-all duration-1000 scale-110 group-hover/card:scale-100" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity p-8 flex flex-col justify-end">
                          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 mb-2">Photo Captured</p>
                          <h4 className="text-xl font-serif italic text-white line-clamp-1">Moment Ref: {1000 + i}</h4>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Philosophy Section */}
              <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-10 pt-20">
                <div className="p-12 rounded-[3.5rem] glass-morphism border border-white/40 space-y-6 text-left group">
                  <div className="w-14 h-14 rounded-2xl accent-bg text-white opacity-80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest text-stone-900 dark:text-white">Instant <br />Recall</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-medium leading-relaxed italic">"Experience your memories in real-time, beautifully organized for you."</p>
                </div>

                <div className="p-12 rounded-[3.5rem] bg-stone-900 dark:bg-white text-white dark:text-stone-900 space-y-6 text-left group shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-stone-900/10 flex items-center justify-center text-white dark:text-stone-900 group-hover:rotate-12 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Aesthetic <br />Purity</h3>
                  <p className="text-sm opacity-60 font-medium leading-relaxed italic">"Every pixel is treated as a piece of history. We maintain the sacred geometry of your day."</p>
                </div>

                <div className="p-12 rounded-[3.5rem] glass-morphism border border-white/40 space-y-6 text-left group">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/10 flex items-center justify-center text-stone-400 group-hover:translate-y-[-5px] transition-transform">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Global <br />Sync</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-medium leading-relaxed italic">"A private gallery accessible from anywhere in the world."</p>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-20 pointer-events-none hidden md:flex">
                <p className="text-[8px] font-bold uppercase tracking-[0.6em] text-stone-500">Immerse</p>
                <div className="w-[1px] h-20 bg-stone-300 relative overflow-hidden">
                  <motion.div 
                    animate={{ y: [0, 80] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-0 left-0 w-full h-[30%] bg-stone-900 dark:bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Gallery */}
          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto py-20 px-6 space-y-12 relative"
            >
              <button 
                onClick={() => setStep("welcome")}
                className="absolute top-0 left-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" /> Cancel / Exit Profile
              </button>
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full ring-4 ring-stone-900/5 dark:ring-white/10 p-1.5 transition-transform duration-700 group-hover:scale-105">
                    <img src={user?.photoURL || ""} className="w-full h-full rounded-full object-cover shadow-2xl" />
                  </div>
                  <button 
                    onClick={() => profilePicRef.current?.click()}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={profilePicRef}
                    onChange={handleProfilePicUpdate}
                    className="hidden"
                    accept="image/*"
                  />
                  {isUpdatingProfile && (
                    <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 w-full max-w-lg">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-serif italic text-stone-900 dark:text-white tracking-tighter leading-none">{user?.displayName}</h2>
                    <div className="flex items-center justify-center gap-3">
                      {profileTitle && (
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.5em]">{profileTitle}</p>
                      )}
                      <div className="flex items-center justify-center gap-6 py-2">
                        <div 
                          onClick={() => { setNetworkView("followers"); document.getElementById('curator-network')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="text-center group/stat cursor-pointer hover:scale-105 transition-transform"
                        >
                          <p className="text-xl font-serif italic text-stone-900 dark:text-white group-hover/stat:text-indigo-500 transition-colors">1.2k</p>
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Followers</p>
                        </div>
                        <div className="w-[1px] h-6 bg-stone-200 dark:bg-white/10" />
                        <div 
                          onClick={() => { setNetworkView("following"); document.getElementById('curator-network')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="text-center group/stat cursor-pointer hover:scale-105 transition-transform"
                        >
                          <p className="text-xl font-serif italic text-stone-900 dark:text-white group-hover/stat:text-indigo-500 transition-colors">482</p>
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Following</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:translate-y-[-2px] transition-all flex items-center gap-3 group">
                           <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                           Follow
                        </button>
                        <button 
                          onClick={() => setShowProfileSettings(!showProfileSettings)}
                          className="w-12 h-12 rounded-2xl glass-morphism text-stone-400 hover:text-stone-900 dark:hover:text-white flex items-center justify-center hover:bg-stone-100 dark:hover:bg-white/10 transition-all border border-stone-200 dark:border-white/10"
                        >
                          <Settings2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showProfileSettings && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6 text-left overflow-hidden mt-6"
                      >
                        <div className="flex items-center justify-between mb-2">
                           <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-900 dark:text-white">Profile Editor</h3>
                           <button 
                             onClick={() => setIsPreviewMode(!isPreviewMode)}
                             className="px-4 py-2 rounded-full glass-morphism text-[8px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                           >
                             {isPreviewMode ? <div className="flex items-center gap-2 text-indigo-500"><Sparkles className="w-3 h-3" /> Live View</div> : "Show After-Look"}
                           </button>
                        </div>

                        {isPreviewMode ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 pt-4 pb-4"
                          >
                            <div className="space-y-8 p-10 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 text-left shadow-2xl relative overflow-hidden backdrop-blur-xl">
                               <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                               <div className="space-y-2 relative z-10">
                                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">Curator Statement</p>
                                 <p className="text-lg font-serif italic leading-relaxed text-stone-800 dark:text-stone-200">
                                   {profileAbout ? `"${profileAbout}"` : "The silence of a moment captured is a language only the heart understands."}
                                 </p>
                               </div>
                               <div className="space-y-2 relative z-10">
                                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">Preferred Medium</p>
                                 <div className="inline-flex px-5 py-2 rounded-full bg-indigo-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                   {profileFavoriteSubject || "Ethereal Landscapes"}
                                 </div>
                               </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                               <div className="h-[1px] w-12 bg-stone-200 dark:bg-white/10" />
                               <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Photo Preview</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="space-y-4">
                             <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Display Name</label>
                                <div className="px-6 py-4 bg-white dark:bg-stone-900 rounded-2xl text-sm font-medium border border-stone-200 dark:border-white/5 opacity-50 cursor-not-allowed">
                                  {user?.displayName}
                                </div>
                                <p className="text-[8px] text-stone-400 ml-2">Linked to your Google Identity</p>
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Email Identity</label>
                                <div className="px-6 py-4 bg-white dark:bg-stone-900 rounded-2xl text-sm font-medium border border-stone-200 dark:border-white/5 opacity-50 cursor-not-allowed">
                                  {user?.email}
                                </div>
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Legacy Title (Description)</label>
                                <input 
                                  value={profileTitle}
                                  onChange={(e) => setProfileTitle(e.target.value)}
                                  placeholder="Elite Curator, Master of Moments..."
                                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 accent-ring ring-opacity-30 transition-all shadow-inner text-stone-900 dark:text-white"
                                />
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">About Me</label>
                                <textarea 
                                  value={profileAbout}
                                  onChange={(e) => setProfileAbout(e.target.value)}
                                  placeholder="Tell us about your photographic journey..."
                                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 accent-ring ring-opacity-30 transition-all shadow-inner min-h-[100px] resize-none text-stone-900 dark:text-white"
                                />
                             </div>

                             <div className="space-y-1.5">
                                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Favorite Subject</label>
                                <input 
                                  value={profileFavoriteSubject}
                                  onChange={(e) => setProfileFavoriteSubject(e.target.value)}
                                  placeholder="Portraits, Landscapes, Candids..."
                                  className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 accent-ring ring-opacity-30 transition-all shadow-inner text-stone-900 dark:text-white"
                                />
                             </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                           <button 
                             onClick={() => setShowProfileSettings(false)}
                             className="flex-1 py-4 rounded-2xl glass-morphism text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-white/10 transition-all"
                           >
                             Cancel
                           </button>
                           <button 
                             onClick={handleUpdateProfile}
                             disabled={isUpdatingProfile}
                             className="flex-1 py-4 rounded-2xl bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest hover:translate-y-[-2px] transition-all disabled:opacity-50 shadow-xl"
                           >
                             {isUpdatingProfile ? "Updating..." : "Save Profile"}
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showProfileSettings && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 pt-4"
                    >
                      {(profileAbout || profileFavoriteSubject) && (
                        <div className="space-y-6 p-8 rounded-[2.5rem] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 text-left max-w-md mx-auto">
                           {profileAbout && (
                             <div className="space-y-1">
                               <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-indigo-400">Curator Statement</p>
                               <p className="text-sm font-medium leading-relaxed italic opacity-70">"{profileAbout}"</p>
                             </div>
                           )}
                           {profileFavoriteSubject && (
                             <div className="space-y-1">
                               <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-indigo-400">Preferred Medium</p>
                               <p className="text-xs font-bold uppercase tracking-widest">{profileFavoriteSubject}</p>
                             </div>
                           )}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-center gap-3 pt-4">
                        <div className="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-bold uppercase tracking-widest shadow-xl">Elite Curator</div>
                        <div className="px-5 py-2.5 rounded-full glass-morphism text-stone-900 dark:text-white text-[10px] font-bold uppercase tracking-widest">Premium Member</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {/* Atmospheric Ambiance Mixer */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 md:p-10 glass-morphism rounded-3xl md:rounded-[3.5rem] space-y-6 text-left border border-stone-200/50 dark:border-white/5 relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sand-primary animate-pulse" />
                        <h3 className="text-xl font-bold uppercase tracking-widest text-stone-900 dark:text-white">Emotional Atmosphere Mixer</h3>
                      </div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest leading-relaxed">
                        Curate the chromatic essence of your experience. Click any sacred hue to bath the interface in its light.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      {palettes.map((p, idx) => {
                        const isCurrent = accentId === idx;
                        return (
                          <button
                            key={p.name}
                            onClick={() => setAccentId(idx)}
                            className={`p-4 rounded-2xl flex flex-col items-start gap-3 transition-all relative border ${
                              isCurrent 
                                ? "bg-white dark:bg-stone-900 border-indigo-500/30 dark:border-indigo-500/50 shadow-md scale-[1.03]" 
                                : "bg-white/40 dark:bg-stone-900/30 hover:bg-white/70 dark:hover:bg-stone-800/40 border-stone-100/50 dark:border-white/[0.03] scale-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-4 h-4 rounded-full border border-white/20 shadow-md shrink-0 block"
                                style={{ backgroundColor: p.accent, boxShadow: `0 0 10px ${p.accent}` }}
                              />
                              <span className="text-xs font-serif font-bold text-stone-800 dark:text-stone-100 truncate max-w-[100px]">{p.name}</span>
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400">
                              {p.name === "Desert Sand" && "Warm Celebration"}
                              {p.name === "Cosmic Indigo" && "Atmospheric Night"}
                              {p.name === "Rose Quartz" && "Sacred Romance"}
                              {p.name === "Emerald Glass" && "Lush Gardens"}
                              {p.name === "Sunset Gold" && "Royal Palace"}
                              {p.name === "Celestial Blue" && "Sky Sanctuary"}
                              {p.name === "Lavender Fog" && "Dreamlike Evening"}
                              {p.name === "Crimson Velvet" && "Deep Passion"}
                            </span>
                            {isCurrent && (
                              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Managed Sanctuaries */}
                {user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 md:p-12 glass-morphism rounded-3xl md:rounded-[3.5rem] space-y-8"
                  >
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h3 className="text-2xl font-bold uppercase tracking-widest">Managed Events</h3>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest text-indigo-500">Your Created Registries</p>
                       </div>
                       <button 
                         onClick={() => setShowCreateModal(true)}
                         className="px-6 py-3 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                       >
                         <Plus className="w-4 h-4" /> New Event
                       </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {weddings.filter(w => w.ownerId === user.uid).map((wedding) => (
                         <div 
                           key={wedding.id}
                           className="group relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 hover:border-indigo-500/50 transition-all p-6 space-y-4"
                         >
                            <div className="space-y-1">
                               <h4 className="font-serif italic text-xl text-stone-900 dark:text-white">{wedding.name}</h4>
                               <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{wedding.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => { setCurrentWedding(wedding); setStep("gallery"); }}
                                 className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest"
                               >
                                 Open
                               </button>
                               <button 
                                 onClick={() => { setEditingWedding(wedding); setShowEditModal(true); }}
                                 className="p-3 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                               >
                                 <Settings className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                       ))}
                       {weddings.filter(w => w.ownerId === user.uid).length === 0 && (
                         <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center gap-4">
                            <Heart className="w-10 h-10 text-stone-100" />
                            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">No events found</p>
                            <button 
                              onClick={() => setShowCreateModal(true)}
                              className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest border-b border-indigo-500/20 pb-1"
                            >
                              Create Your First Event Gallery
                            </button>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-12 glass-morphism rounded-[3.5rem] space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold uppercase tracking-widest">Saved Objects</h3>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">Aesthetic Collections</p>
                      </div>
                      <span className="text-4xl font-serif italic opacity-20">{savedPhotos.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {savedPhotos.slice(0, 9).map((photo, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedPhoto(photo)}
                          className="aspect-square rounded-3xl overflow-hidden bg-stone-50 border border-stone-200 cursor-pointer hover:scale-105 transition-transform group relative"
                        >
                          <img src={photo.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                      {savedPhotos.length === 0 && (
                        <div className="col-span-3 py-16 text-center border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center gap-4">
                          <ImageIcon className="w-8 h-8 text-stone-200" />
                          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Your collection is empty</p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        if (savedPhotos.length > 0) {
                          setStep("gallery");
                          setShowSelectionsOnly(true);
                          // If no specific wedding context, we treat savedPhotos as the primary collection
                          if (!currentWedding) {
                            setUploadedPhotos(savedPhotos);
                            setMatchedIndices(savedPhotos.map((_, i) => i));
                          }
                        } else {
                          showNotification("Select photos from a wedding to save them to your collection");
                        }
                      }}
                      className="w-full py-5 rounded-[2rem] bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl hover:translate-y-[-4px] transition-all flex items-center justify-center gap-4"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Enter Private Viewport
                    </button>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-12 glass-dark rounded-[3.5rem] space-y-10 text-white"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold uppercase tracking-widest text-indigo-400">Gallery Security</h3>
                      <p className="text-sm opacity-50 font-medium">Manage your profile and wedding access.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-white/20 transition-all group">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Biometric Key</p>
                            <div className="w-12 h-6 rounded-full bg-green-500/20 p-1 flex items-center justify-end">
                               <div className="w-4 h-4 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                            </div>
                         </div>
                         <p className="text-xs opacity-40">Your unique biometric signature is used for all high-fidelity archival extractions.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={handleLogout}
                          className="w-full py-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                        >
                          <LogOut className="w-4 h-4" /> Terminate Session
                        </button>
                        <button 
                          onClick={() => setStep("welcome")}
                          className="w-full py-5 rounded-[2rem] bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-all flex items-center justify-center gap-3"
                        >
                          <ArrowLeft className="w-4 h-4" /> Return to Atrium
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Curator Network */}
                <motion.div 
                  id="curator-network"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 glass-morphism rounded-[3.5rem] space-y-10"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold uppercase tracking-widest text-stone-900 dark:text-white">Curator Network</h3>
                      <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">
                        {networkView === "followers" ? "Followers" : "Following"}
                      </p>
                    </div>
                    <div className="flex bg-stone-100 dark:bg-white/5 p-1 rounded-2xl border border-stone-200 dark:border-white/10">
                       <button 
                         onClick={() => setNetworkView("followers")}
                         className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${networkView === "followers" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm" : "text-stone-400 hover:text-stone-900 dark:hover:text-white"}`}
                       >
                         Followers
                       </button>
                       <button 
                         onClick={() => setNetworkView("following")}
                         className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${networkView === "following" ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm" : "text-stone-400 hover:text-stone-900 dark:hover:text-white"}`}
                       >
                         Following
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(networkView === "followers" ? [
                      { name: "Julian Thorne", role: "Light Sculptor", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
                      { name: "Elena Rossi", role: "Ethereal Curator", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
                      { name: "Marcus Vane", role: "Wedding Planner", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
                      { name: "Sasha Grey", role: "Moment Weaver", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" }
                    ] : [
                      { name: "Aria Volt", role: "Prism Architect", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
                      { name: "Kai Chen", role: "Shadow Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
                    ]).map((curator, i) => (
                      <div key={i} className="group p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 dark:border-white/10 group-hover:scale-105 transition-transform shadow-lg">
                          <img src={curator.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-white">{curator.name}</h4>
                          <p className="text-[9px] text-indigo-500 uppercase tracking-widest font-bold">{curator.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full py-5 rounded-[2rem] border border-dashed border-stone-200 dark:border-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                    <Users className="w-4 h-4" />
                    Expand Shared Network
                  </button>
                </motion.div>

                {/* Premium tactile button materials showcase */}
                <ButtonShowcase />
              </div>
            </motion.div>
          )}

          {step === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8"
            >
              <AestheticDashboard 
                user={user}
                weddings={weddings}
                tasks={tasks}
                guests={guests}
                budgetItems={budgetItems}
                onSelectEvent={(w) => {
                  setCurrentWedding(w);
                  setStep("details");
                }}
                onCreateEventClick={() => {
                  setShowCreateModal(true);
                }}
              />
            </motion.div>
          )}

          {step === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8"
            >
              <CalendarView 
                weddings={weddings}
                onSelectEvent={(w) => {
                  setCurrentWedding(w);
                  setStep("details");
                }}
              />
            </motion.div>
          )}

          {step === "details" && currentWedding && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8"
            >
              <EventDetailsConsole 
                wedding={currentWedding}
                tasks={tasks}
                guests={guests}
                budgetItems={budgetItems}
                vendors={vendors}
                activityFeeds={activityFeeds}
                isDark={isDark}
                onBack={() => {
                  setStep("dashboard");
                }}
                onAddTask={addPlanningTask}
                onToggleTask={togglePlanningTask}
                onDeleteTask={deletePlanningTask}
                onAddGuest={addEventGuest}
                onToggleGuestRSVP={toggleGuestRSVP}
                onDeleteGuest={deleteEventGuest}
                onAddBudgetItem={addBudgetItemExpense}
                onDeleteBudgetItem={deleteBudgetItemExpense}
                onAddVendor={addEventVendor}
                onToggleVendorStatus={() => {}}
                onDeleteVendor={deleteEventVendor}
                onEnterGallery={() => {
                  setStep("gallery");
                }}
              />
            </motion.div>
          )}

          {step === "weddings" && (
            <motion.div
              key="weddings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-stone-950 text-white flex flex-col items-center justify-start py-20 px-6 md:px-12 overflow-y-auto"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" 
                />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-stone-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              </div>

              <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-white/10 glass-dark"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.4em]">Active</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-serif italic leading-[1.1] tracking-tighter">
                      Search <br/> <span className="text-white/20">Events</span>
                    </h2>
                  </div>

                    <div className="space-y-5 max-w-[280px]">
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">01. Integrity</h3>
                      <p className="text-white/40 text-[11px] leading-relaxed font-medium">Your personalized profile details.</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">02. Temporal</h3>
                      <p className="text-white/40 text-[11px] leading-relaxed font-medium">Session-based ephemeral access codes.</p>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">03. High-Fi</h3>
                      <p className="text-white/40 text-[11px] leading-relaxed font-medium">Soft-blur protected archival viewing.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setStep("welcome"); setActiveTab("home"); }}
                    className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.5em] text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel / Exit Gallery
                  </button>
                </div>

                <div className="flex flex-col justify-center">
                   <motion.div 
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ delay: 0.1 }}
                     className="glass-dark rounded-[2rem] p-8 space-y-8 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
                   >
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-white uppercase tracking-[0.5em]">Session Key</p>
                            <p className="text-[8px] text-white/40 italic">Linking Wedding...</p>
                         </div>
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-14 h-14 bg-white p-2.5 rounded-xl flex items-center justify-center shadow-2xl">
                                <QRCode id="qr-wedding" value={user?.uid || "eternal-moments"} size={40} />
                             </div>
                             <p className="text-[7px] font-mono text-stone-200 opacity-60 uppercase">{user?.uid?.slice(0, 8)}</p>
                             <button 
                               onClick={() => downloadQRCode("qr-wedding", "wedding")}
                               className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                             >
                                <Download className="w-2 h-2" /> Download
                             </button>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setShowJoinModal(true)}
                           className="relative overflow-hidden py-4 rounded-xl bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-[0.4em] flex flex-col items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 group"
                         >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40 animate-scan-slow" />
                            <div className="flex items-center gap-1 relative z-10">
                               <Camera className="w-4 h-4 text-white/50" />
                               <QrCode className="w-5 h-5" />
                            </div>
                            <span className="relative z-10">Scan Code</span>
                         </button>
                         <button 
                           onClick={() => {
                             if (!user) {
                               signInWithGoogle();
                             } else {
                               setShowCreateModal(true);
                             }
                           }}
                           className="relative overflow-hidden py-4 rounded-xl bg-white text-stone-900 font-bold text-[9px] uppercase tracking-[0.4em] flex flex-col items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl group"
                         >
                            <Plus className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Create Event</span>
                         </button>
                      </div>
                         <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={async () => {
                                await navigator.clipboard.writeText(user?.uid || "");
                                showNotification("Primary Access link copied");
                              }}
                              className="py-3 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-mono"
                            >
                               <Share2 className="w-3 h-3 opacity-40" />
                               Copy Key
                            </button>
                            <button 
                               onClick={() => showNotification("Access codes terminated")}
                               className="py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all font-mono"
                             >
                                <Zap className="w-3 h-3 opacity-40" />
                                Kill Codes
                             </button>
                         </div>

                      <div className="pt-8 border-t border-white/5 space-y-6">
                         <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">Active Events</h3>
                            <span className="text-[10px] font-mono text-white/20">{weddings.length} detected</span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* Profile Shortcut Card */}
                            {user && (
                              <div 
                                onClick={() => setStep("profile")}
                                className="group/profile relative overflow-hidden rounded-2xl bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/20 transition-all p-5 space-y-4 cursor-pointer"
                              >
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-full border-2 border-indigo-400/50 overflow-hidden shadow-lg shadow-indigo-500/20">
                                      <img src={user.photoURL || ""} className="w-full h-full object-cover" />
                                   </div>
                                   <div className="space-y-0.5">
                                      <h4 className="font-serif italic text-lg text-white group-hover/profile:text-indigo-300 transition-colors">My Profile</h4>
                                      <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">User Identity</p>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                   <p className="text-[9px] text-white/40 italic">Manage your profile and saved objects.</p>
                                   <ArrowRight className="w-4 h-4 text-indigo-400 group-hover/profile:translate-x-1 transition-transform" />
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/profile:opacity-30 transition-opacity">
                                   <User className="w-10 h-10 text-white" />
                                </div>
                              </div>
                            )}

                            {weddings.map((wedding) => (
                              <div 
                                key={wedding.id} 
                                className="group/item relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all p-5 space-y-4"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                      <h4 className="font-serif italic text-lg text-white group-hover/item:text-indigo-400 transition-colors">{wedding.name}</h4>
                                      <span className="text-[7px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{(wedding.type || "wedding").charAt(0).toUpperCase() + (wedding.type || "wedding").slice(1)}</span>
                                   </div>
                                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{wedding.date}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => { setCurrentWedding(wedding); setStep("gallery"); }}
                                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                    >
                                      Initialize View
                                    </button>
                                    <button
                                      onClick={() => { setCurrentWedding(wedding); setStep("upload"); }}
                                      className="p-2 rounded-lg bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all"
                                      title="Upload Memories"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {wedding.ownerId === user?.uid && (
                                    <button 
                                      onClick={() => { setEditingWedding(wedding); setShowEditModal(true); }}
                                      className="p-2 rounded-lg bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/item:opacity-20 transition-opacity">
                                   <Heart className="w-12 h-12 text-white" />
                                </div>
                              </div>
                            ))}
                            {weddings.length === 0 && (
                              <div className="col-span-full py-10 text-center space-y-4">
                                <Search className="w-10 h-10 text-white/10 mx-auto" />
                                <p className="text-[9px] text-white/20 italic tracking-[0.4em] uppercase font-bold">No Active Registries Found</p>
                              </div>
                            )}
                         </div>
                      </div>
                   </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "upload" && currentWedding && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-5xl mx-auto"
            >
              <div className="bg-white rounded-[3rem] p-16 text-center border border-stone-200 shadow-2xl shadow-stone-200/30 space-y-12">
                <div className="flex flex-col items-center gap-6">
                  <button 
                    onClick={() => setStep("weddings")}
                    className="absolute top-12 left-12 flex items-center gap-2 px-6 py-3 rounded-full bg-stone-50 hover:bg-stone-100 transition-all text-stone-500 font-bold text-[10px] uppercase tracking-widest"
                  >
                    <X className="w-4 h-4" /> Cancel / Back
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center ring-1 ring-stone-100 shadow-inner">
                      <Upload className="w-10 h-10 text-stone-400" />
                    </div>
                    <button 
                      onClick={() => {
                        setCameraInitialMode("photo");
                        setShowCamera(true);
                      }}
                      className="w-20 h-20 bg-stone-900 text-white rounded-3xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group"
                      title="Turn on Camera"
                    >
                      <Camera className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tight">{currentWedding.name}</h2>
                    <p className="text-stone-400 font-medium uppercase tracking-[0.2em] text-[10px]">Photo Collection Room</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-4 border-dashed rounded-[2.5rem] p-20 cursor-pointer transition-all duration-500 group relative ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-stone-300 hover:bg-stone-50'} ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-stone-100'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFolderUpload}
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    className="hidden" 
                  />
                  
                  {isDragging && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-500/10 backdrop-blur-[2px] rounded-[2.5rem]"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl text-indigo-600">
                        <Upload className="w-8 h-8 animate-bounce" />
                      </div>
                      <p className="mt-4 text-indigo-600 font-bold uppercase tracking-widest text-xs">Release to start teleporting photos</p>
                    </motion.div>
                  )}

                  <div className="flex flex-col items-center gap-6">
                    {isUploading || uploadingFiles.length > 0 ? (
                      <div className="space-y-8 w-full max-w-lg mx-auto">
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative h-32 w-32 flex items-center justify-center">
                            <motion.svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle 
                                cx="50" cy="50" r="45" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="5" 
                                className="text-stone-100"
                              />
                              <motion.circle 
                                cx="50" cy="50" r="45" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="5" 
                                strokeLinecap="round"
                                className="text-indigo-600"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: (isUploading ? uploadProgress : 100) / 100 }}
                                style={{ rotate: -90, originX: "50%", originY: "50%" }}
                              />
                            </motion.svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-stone-900">{isUploading ? uploadProgress : 100}%</span>
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isUploading ? 'Total' : 'Done'}</span>
                            </div>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-2xl font-serif italic text-stone-900">
                              {isUploading ? 'Uploading Photos' : 'Mission Accomplished'}
                            </p>
                            <div className="flex flex-col items-center gap-4">
                              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                <Zap className="w-3 h-3 fill-current" />
                                {isUploading ? (uploadSpeed || "0 KB/s") : "Sustained"}
                              </div>
                              
                              {!isUploading && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadingFiles([]);
                                    setStep("gallery");
                                  }}
                                  className="px-8 py-3 rounded-xl bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                >
                                  Enter Gallery View
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Individual File Progress */}
                        <div className="space-y-3 max-h-60 overflow-y-auto px-2 custom-scrollbar">
                           <AnimatePresence mode="popLayout">
                             {uploadingFiles.map((file) => (
                               <motion.div 
                                 key={file.id}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, scale: 0.95 }}
                                 className="glass-light p-4 rounded-2xl border border-stone-200/50 flex items-center gap-4"
                               >
                                 <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center relative overflow-hidden">
                                   {file.status === 'completed' ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                   ) : file.status === 'error' ? (
                                      <AlertCircle className="w-6 h-6 text-red-500" />
                                   ) : (
                                      <div className="relative w-full h-full flex items-center justify-center">
                                         <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                         <div 
                                           className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 transition-all duration-300" 
                                           style={{ width: `${file.progress}%` }}
                                         />
                                      </div>
                                   )}
                                 </div>
                                 <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-[11px] font-medium text-stone-900 truncate">{file.name}</span>
                                      <span className="text-[10px] font-mono text-stone-400">{file.status === 'error' ? 'FAILED' : `${file.progress}%`}</span>
                                    </div>
                                    {file.status === 'error' && file.errorMessage && (
                                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter leading-none mt-1">
                                        {file.errorMessage}
                                      </p>
                                    )}
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden mt-1">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${file.progress}%` }}
                                        className={`h-full transition-colors duration-500 ${
                                          file.status === 'completed' ? 'bg-green-500' : 
                                          file.status === 'error' ? 'bg-red-500' : 'bg-indigo-600'
                                        }`}
                                      />
                                    </div>
                                 </div>
                               </motion.div>
                             ))}
                           </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-stone-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                          <Plus className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-medium text-stone-900">Add Photos to Collection</p>
                          <p className="text-stone-400 text-sm">Drag & drop files here, or click to browse</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {uploadedPhotos.length > 0 && !isUploading && (
                  <div className="space-y-6 pt-4">
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {uploadedPhotos.slice(0, 5).map((p, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden">
                          <img src={p.url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {uploadedPhotos.length > 5 && (
                        <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400">
                          +{uploadedPhotos.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setStep("verify")}
                        className="px-12 py-5 rounded-2xl bg-stone-900 text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-4 hover:translate-y-[-2px] active:scale-95 transition-all shadow-2xl shadow-stone-400"
                      >
                        Process & Find Me
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="max-w-2xl mx-auto relative"
            >
              <button 
                onClick={() => setStep("weddings")}
                className="absolute top-[-48px] left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Cancel Verification
              </button>
              <div className="bg-white rounded-[3rem] overflow-hidden border border-stone-200 shadow-2xl shadow-stone-200/40">
                <div className="p-12 bg-stone-900 text-white text-center space-y-4">
                   <h2 className="text-4xl font-serif italic">Face Verification</h2>
                   <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Secure Scanning Technology</p>
                </div>
                
                 <div className="p-16 space-y-12 text-center bg-stone-50/20">
                   <div className="relative w-64 h-64 mx-auto">
                      <div className="w-full h-full rounded-[2.5rem] border-8 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-stone-100 ring-1 ring-stone-200 group">
                        {selfie ? (
                          <img src={selfie} className="w-full h-full object-cover grayscale-[0.2]" />
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <User className="w-20 h-20 text-stone-200" />
                            <Smile className="w-10 h-10 text-stone-200 animate-bounce" />
                          </div>
                        )}
                        {isVerifying && (
                          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                            <span className="text-[10px] text-white font-bold uppercase tracking-[0.3em]">Analyzing...</span>
                          </div>
                        )}
                      </div>
                      {!isVerifying && (
                        <div className="absolute -bottom-6 -right-6 flex flex-col gap-3">
                          <button 
                            onClick={() => {
                              setCameraInitialMode("photo");
                              setShowCamera(true);
                            }}
                            className="w-16 h-16 rounded-[1.5rem] bg-stone-900 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all ring-4 ring-white"
                          >
                            <Camera className="w-7 h-7" />
                          </button>
                          <button 
                            onClick={() => selfieInputRef.current?.click()}
                            className="w-12 h-12 rounded-[1rem] bg-stone-100 text-stone-600 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all ring-2 ring-white"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={selfieInputRef}
                        onChange={handleSelfieUpload}
                        className="hidden" 
                        accept="image/*"
                      />
                   </div>

                   <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold max-w-xs mx-auto leading-loose">
                     {isVerifying ? "Comparing biometric data with the registry collection..." : "Capture a real-time portrait or select one from your library to initialize the discovery engine."}
                   </p>

                   {!isVerifying && (
                     <div className="pt-8">
                       <button 
                         onClick={() => {
                           setMatchedIndices(uploadedPhotos.map((_, i) => i));
                           setStep("gallery");
                           showNotification("Accessing full registry collection");
                         }}
                         className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 hover:text-stone-900 transition-colors"
                       >
                         Skip Verification & View All
                       </button>
                     </div>
                   )}
                </div>
              </div>
              
              <AnimatePresence>
                {showCamera && (
                  <CameraCapture 
                    accessKeyId={currentWedding?.id || user?.uid}
                    initialMode={cameraInitialMode}
                    onCapture={(url) => {
                      setShowCamera(false);
                      handleVerifyFace(url);
                    }}
                    onScan={handleQRScanJoin}
                    onClose={() => setShowCamera(false)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Scoped Global Overlay for Camera */}
          <AnimatePresence>
            {showCamera && (
              <CameraCapture 
                accessKeyId={currentWedding?.id || joinId || user?.uid}
                initialMode={cameraInitialMode}
                onCapture={(url) => {
                  setShowCamera(false);
                  if (step === "verify") {
                    handleVerifyFace(url);
                  } else if (step === "upload") {
                    handleCameraCapture(url);
                  } else if (step === "profile") {
                     // Handled by profile click handler but keep as fallback
                  } else {
                     showNotification("Capture process recorded and analyzed");
                  }
                }}
                onScan={handleQRScanJoin}
                onClose={() => setShowCamera(false)}
              />
            )}
          </AnimatePresence>

          {step === "gallery" && (currentWedding || (showSelectionsOnly && savedPhotos.length > 0)) && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-16 relative"
            >
              <button 
                onClick={() => setStep("weddings")}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Cancel / Back to Events
              </button>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-16">
                <div className="space-y-6">
                  <span className="text-stone-400 font-mono text-xs uppercase tracking-[0.5em] block">{currentWedding ? `Found ${currentWedding.type || "Event"}` : "General Gallery"}</span>
                  <h2 className="text-8xl font-serif italic text-stone-900 dark:text-white leading-tight tracking-tighter">{currentWedding ? `${currentWedding.name}` : "Event Gallery"}</h2>
                  <div className="flex items-center gap-6">
                     <p className="text-stone-500 font-medium text-lg whitespace-nowrap">{currentWedding ? `Access your beautiful **${currentWedding.type || "event"} photos**.` : "Your curated collection of photo memories."}</p>
                     <div className="h-[2px] w-20 bg-stone-200 dark:bg-white/10" />
                     
                     <div className="flex bg-stone-100 dark:bg-white/5 p-1 rounded-2xl border border-stone-200/50 dark:border-white/10">
                       <button 
                         disabled={!currentWedding}
                         onClick={() => setShowSelectionsOnly(false)}
                         className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${!showSelectionsOnly ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 disabled:opacity-30'}`}
                       >
                         All Captures
                       </button>
                       <button 
                         onClick={() => setShowSelectionsOnly(true)}
                         className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all relative flex items-center gap-2 ${showSelectionsOnly ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400'}`}
                       >
                         My Selection
                         {savedPhotos.length > 0 && (
                           <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[7px] flex items-center justify-center animate-pulse">
                             {savedPhotos.length}
                           </span>
                         )}
                       </button>
                     </div>
                  </div>

                  {/* AI Summarization Section */}
                  {currentWedding && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-12 space-y-8"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">Curator's Analysis</h3>
                             <div className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-[8px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Experimental AI</div>
                          </div>
                          <p className="text-[11px] text-stone-400 italic font-medium leading-relaxed max-w-sm">Synthesize the aesthetic essence and emotional core of this collection via Gemini.</p>
                        </div>
                        <button 
                          onClick={handleSummarizeCollection}
                          disabled={isSummarizing || uploadedPhotos.length === 0}
                          className={`px-8 py-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 w-full sm:w-auto ${isSummarizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          {isSummarizing ? 'Synthesizing...' : 'Generate AI Summary'}
                        </button>
                      </div>

                      {collectionSummary && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-10 rounded-[3rem] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 shadow-inner relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <Zap className="w-20 h-20 text-indigo-500" />
                          </div>
                          <p className="text-xl md:text-2xl text-stone-800 dark:text-stone-200 font-serif italic leading-relaxed relative z-10">
                            "{collectionSummary}"
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* AI Toast Assistant Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-12 space-y-8 border-t border-stone-100 dark:border-white/5 mt-12"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500">Toast Master AI</h3>
                           <div className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Guest Companion</div>
                        </div>
                        <p className="text-[11px] text-stone-400 italic font-medium leading-relaxed max-w-sm">Need words for the big moment? Let Gemini compose a timeless toast for you.</p>
                      </div>
                      <button 
                        onClick={() => setShowToastAssistant(!showToastAssistant)}
                        className={`px-8 py-4 rounded-2xl ${showToastAssistant ? 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-white' : 'bg-amber-500 text-white'} text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 w-full sm:w-auto`}
                      >
                        <Wand2 className="w-4 h-4" />
                        {showToastAssistant ? 'Hide Assistant' : 'Open Toast Assistant'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showToastAssistant && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-8 md:p-12 rounded-[3.5rem] bg-stone-100/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-6">
                                  <div className="space-y-3">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">My Relationship</label>
                                    <div className="flex flex-wrap gap-2">
                                      {["Friend", "Sibling", "Parent", "Maid of Honor", "Best Man", "Groom", "Bride"].map(r => (
                                        <button 
                                          key={r}
                                          onClick={() => setToastRelationship(r)}
                                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${toastRelationship === r ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-200 dark:border-white/10'}`}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Desired Tone</label>
                                    <div className="flex flex-wrap gap-2">
                                      {["Humorous", "Emotional", "Formal", "Short & Sweet"].map(t => (
                                        <button 
                                          key={t}
                                          onClick={() => setToastTone(t)}
                                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${toastTone === t ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-200 dark:border-white/10'}`}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                               </div>

                               <div className="space-y-3">
                                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 ml-2">Key Memory (Optional)</label>
                                  <textarea 
                                    value={toastMemory}
                                    onChange={(e) => setToastMemory(e.target.value)}
                                    placeholder="e.g., That road trip in 2018, or how they first met at the cafe..."
                                    className="w-full h-full min-h-[120px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none shadow-inner"
                                  />
                               </div>
                            </div>

                            <div className="flex justify-center">
                              <button 
                                onClick={handleGenerateToast}
                                disabled={isGeneratingToast}
                                className={`px-12 py-5 rounded-[2.5rem] bg-amber-500 text-white font-bold text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50`}
                              >
                                {isGeneratingToast ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isGeneratingToast ? 'Composing...' : 'Generate My Toast'}
                              </button>
                            </div>

                            {generatedToast && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-10 md:p-14 rounded-[3.5rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 shadow-2xl space-y-8 relative group"
                              >
                                <div className="absolute top-8 left-8 text-6xl text-amber-500/10 font-serif leading-none italic">
                                  "
                                </div>
                                <div className="space-y-6 relative z-10">
                                   <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.4em]">Gemini Composition</p>
                                      <button 
                                        onClick={async () => {
                                          await navigator.clipboard.writeText(generatedToast);
                                          showNotification("Toast copied to clipboard");
                                        }}
                                        className="text-[9px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 dark:hover:text-white transition-colors"
                                      >
                                        Copy Text
                                      </button>
                                   </div>
                                   <div className="whitespace-pre-wrap text-lg md:text-xl text-stone-800 dark:text-stone-300 font-serif leading-relaxed italic">
                                      {generatedToast}
                                   </div>
                                </div>
                                <div className="absolute bottom-8 right-8 text-6xl text-amber-500/10 font-serif leading-none italic">
                                  "
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                
                  {/* QR Access Code - New Section */}
                {currentWedding && (
                  <div className="flex flex-col gap-6 w-full max-w-md">
                     <div className="glass-dark rounded-[2.5rem] p-8 space-y-6 border border-white/10">
                        {!user ? (
                           <div className="space-y-6">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em]">Guest Mode Active</p>
                                <p className="text-xl font-serif italic text-white">Join the legacy.</p>
                                <p className="text-[10px] text-white/60 leading-relaxed uppercase tracking-widest">Sign in to upload your own moments and participate in the curated collection.</p>
                              </div>
                              <button 
                                onClick={() => signInWithGoogle()}
                                className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                              >
                                <LogOut className="w-4 h-4 rotate-180" />
                                Authenticate to Contribute
                              </button>
                           </div>
                        ) : (
                           <>
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Entry Code</p>
                              <p className="text-[10px] text-white/40 italic">Digital Key Synchronized</p>
                           </div>
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center shadow-2xl">
                                 <QRCode id="qr-gallery-key" value={`${window.location.origin}${window.location.pathname}?v=${currentWedding.id}`} size={48} />
                              </div>
                              <p className="text-[8px] font-mono text-white/40 uppercase">{currentWedding.id.slice(0, 12)}</p>
                              <button 
                                onClick={() => downloadQRCode("qr-gallery-key", "gallery-key")}
                                className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                              >
                                 <Download className="w-2 h-2" /> Download Key
                              </button>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => {
                               setCameraInitialMode("photo");
                               setShowCamera(true);
                             }}
                             className="py-5 rounded-2xl bg-white text-stone-900 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all"
                           >
                              <Camera className="w-4 h-4" />
                              Scanner
                           </button>
                           <button 
                             onClick={() => setStep("upload")}
                             className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                           >
                              <Upload className="w-4 h-4" />
                              File
                           </button>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5">
                           <button 
                             onClick={() => {
                               showNotification("Deactivating temporary access codes...");
                             }}
                             className="w-full flex items-center justify-between group"
                           >
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Terminate Active Codes</span>
                              <div className="w-10 h-6 rounded-full bg-red-500/20 p-1 flex items-center justify-end group-hover:bg-red-500/30 transition-all">
                                 <div className="w-4 h-4 rounded-full bg-red-400" />
                              </div>
                           </button>
                        </div>
                        </>
                        )}
                     </div>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showControls && currentWedding && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="overflow-hidden"
                  >
                    <div className="p-10 rounded-[3rem] glass-morphism border-2 border-stone-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                       <div className="space-y-4">
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Signature Engine</p>
                         <div className="flex flex-col gap-2">
                           <button 
                             onClick={() => updateWatermarkSettings({ watermarkEnabled: !(currentWedding.watermarkEnabled ?? true) })}
                             className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${(currentWedding.watermarkEnabled ?? true) ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' : 'bg-stone-50 dark:bg-stone-900 text-stone-400'}`}
                           >
                             Watermark: {(currentWedding.watermarkEnabled ?? true) ? 'ENABLED' : 'DISABLED'}
                           </button>
                           <button 
                             onClick={() => setShowWatermarkModal(true)}
                             className="w-full py-4 rounded-xl border border-stone-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-white/5"
                           >
                             Configure Aesthetics
                           </button>
                         </div>
                       </div>

                       <div className="space-y-4">
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Bulk Extraction</p>
                         <button 
                           onClick={handleDownloadAll}
                           disabled={isDownloading}
                           className="w-full py-5 rounded-2xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                         >
                           {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                           Download All Memories
                         </button>
                         <p className="text-[8px] text-center text-stone-400 uppercase tracking-widest leading-loose">Download all high-resolution photos<br/>as a single ZIP file</p>
                       </div>
                       
                       <div className="space-y-4">
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Atmospheric Density</p>
                         <div className="grid grid-cols-2 gap-2">
                            {[0, 4, 10, 20].map((b) => (
                              <button 
                                key={b}
                                onClick={() => updateWatermarkSettings({ photoBlur: b })}
                                className={`py-4 rounded-xl text-[10px] font-bold transition-all ${currentWedding.photoBlur === b ? 'bg-indigo-600 text-white shadow-md' : 'bg-stone-50 dark:bg-stone-900 text-stone-400'}`}
                              >
                                {b === 0 ? 'Clear' : b === 4 ? 'Soft' : b === 10 ? 'Medium' : 'Deep'}
                              </button>
                            ))}
                         </div>
                       </div>

                        {!hideEventCode ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Access Key</p>
                               <button 
                                 onClick={() => setHideEventCode(true)}
                                 className="text-[8px] font-bold text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                               >
                                 Deactivate
                               </button>
                            </div>
                            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 space-y-5">
                               <div className="flex items-center gap-4">
                                 <div className="flex flex-col items-center gap-2">
                                   <div className="w-16 h-16 rounded-2xl bg-stone-50 dark:bg-black p-2 flex items-center justify-center shadow-inner cursor-pointer" onClick={() => setShowShareModal(true)}>
                                     <QRCode value={`${window.location.origin}${window.location.pathname}?v=${currentWedding.id}`} size={48} />
                                   </div>
                                   <p className="text-[8px] font-mono text-stone-400 dark:text-stone-600 uppercase">{currentWedding.id.slice(0, 12)}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-900 dark:text-white">Entrance Key</p>
                                    <p className="text-[9px] text-stone-400 italic">Connected Wedding</p>
                                 </div>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(currentWedding.id);
                                      showNotification("Key sequence secured");
                                    }}
                                    className="py-3 rounded-xl bg-stone-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest"
                                  >
                                    Wedding ID
                                  </button>
                                  <button 
                                    onClick={() => setShowShareModal(true)}
                                    className="py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest hover:translate-y-[-2px] transition-all"
                                  >
                                    Transmit
                                  </button>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setHideEventCode(false)}
                            className="w-full py-4 rounded-xl border border-dashed border-stone-200 dark:border-white/10 text-[8px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
                          >
                            Manage Access Codes                          </button>
                        )}

                       <div className="space-y-4">
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Sync Metadata</p>
                         <div className="flex items-center gap-2">
                            <div className="w-12 h-12 flex items-center justify-center text-green-500">
                               <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Biometric Cloud<br/><span className="text-stone-400 font-normal">Synchronized</span></p>
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showWatermarkModal && currentWedding && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md"
                  >
                    <motion.div 
                      key="watermark-modal-content"
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      transition={{ type: "spring", damping: 15, stiffness: 300 }}
                      className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-serif italic text-stone-900">Watermark Stylist</h3>
                        <button onClick={() => setShowWatermarkModal(false)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                          <X className="w-6 h-6 text-stone-400" />
                        </button>
                      </div>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                        {/* Mode Switcher */}
                        <div className="flex bg-stone-100 p-1 rounded-2xl gap-1">
                          <button 
                            onClick={() => updateWatermarkSettings({ watermarkType: 'text' })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                              (currentWedding.watermarkType || 'text') === 'text' 
                                ? 'bg-white text-stone-900 shadow-sm' 
                                : 'text-stone-400'
                            }`}
                          >
                            Signature Text
                          </button>
                          <button 
                            onClick={() => updateWatermarkSettings({ watermarkType: 'image' })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                              currentWedding.watermarkType === 'image' 
                                ? 'bg-white text-stone-900 shadow-sm' 
                                : 'text-stone-400'
                            }`}
                          >
                            Custom Logo
                          </button>
                        </div>

                        {(currentWedding.watermarkType || 'text') === 'text' ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Signature Text</label>
                              <input 
                                type="text" 
                                value={currentWedding.watermarkText || ""}
                                onChange={(e) => updateWatermarkSettings({ watermarkText: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 focus:outline-none focus:ring-2 accent-ring ring-opacity-30 transition-all font-serif italic text-lg text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
                              />
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Typography Scale</label>
                                <span className="text-[10px] font-mono text-stone-500 font-bold">{currentWedding.watermarkTextSize || 24}px</span>
                              </div>
                              <input 
                                type="range" 
                                min="12" 
                                max="72" 
                                step="1"
                                value={currentWedding.watermarkTextSize || 24}
                                onChange={(e) => updateWatermarkSettings({ watermarkTextSize: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-6">
                             <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Watermark Image</label>
                               <div 
                                 onClick={() => !isWatermarkUploading && watermarkInputRef.current?.click()}
                                 className="border-2 border-dashed border-stone-100 rounded-[2rem] p-8 cursor-pointer hover:bg-stone-50 transition-all flex flex-col items-center gap-4 group"
                               >
                                 <input 
                                   type="file" 
                                   ref={watermarkInputRef} 
                                   onChange={handleWatermarkUpload} 
                                   accept="image/*" 
                                   className="hidden" 
                                 />
                                 {currentWedding.watermarkUrl ? (
                                   <div className="relative group">
                                     <img 
                                       src={currentWedding.watermarkUrl} 
                                       className="h-20 object-contain drop-shadow-md" 
                                       alt="Current Watermark"
                                     />
                                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                       <Upload className="w-6 h-6 text-white" />
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:scale-110 transition-transform">
                                     {isWatermarkUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-8 h-8" />}
                                   </div>
                                 )}
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                   {isWatermarkUploading ? 'Crystallizing...' : 'Upload PNG or Signature'}
                                 </p>
                               </div>
                             </div>

                             <div className="space-y-4">
                               <div className="flex justify-between items-center ml-1">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Logo Scale</label>
                                 <span className="text-[10px] font-mono text-stone-500 font-bold">{Math.round((currentWedding.watermarkScale || 1) * 100)}%</span>
                               </div>
                               <input 
                                 type="range" 
                                 min="0.2" 
                                 max="3" 
                                 step="0.1"
                                 value={currentWedding.watermarkScale || 1}
                                 onChange={(e) => updateWatermarkSettings({ watermarkScale: parseFloat(e.target.value) })}
                                 className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                               />
                             </div>
                          </div>
                        )}

                        {/* Composition Positioning */}
                        <div className="grid grid-cols-2 gap-6 bg-stone-50 p-6 rounded-[2rem]">
                           <div className="space-y-4 col-span-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-stone-900 ml-1">Composition Drift (Fine Tuning)</label>
                           </div>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center ml-1">
                               <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Horizon Drift (X)</label>
                               <span className="text-[10px] font-mono text-stone-500 font-bold">{currentWedding.watermarkOffsetX || 0}%</span>
                             </div>
                             <input 
                               type="range" 
                               min="-100" 
                               max="100" 
                               step="1"
                               value={currentWedding.watermarkOffsetX || 0}
                               onChange={(e) => updateWatermarkSettings({ watermarkOffsetX: parseInt(e.target.value) })}
                               className="w-full h-1.5 bg-white rounded-lg appearance-none cursor-pointer accent-stone-900"
                             />
                           </div>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center ml-1">
                               <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Vertical Drift (Y)</label>
                               <span className="text-[10px] font-mono text-stone-500 font-bold">{currentWedding.watermarkOffsetY || 0}%</span>
                             </div>
                             <input 
                               type="range" 
                               min="-100" 
                               max="100" 
                               step="1"
                               value={currentWedding.watermarkOffsetY || 0}
                               onChange={(e) => updateWatermarkSettings({ watermarkOffsetY: parseInt(e.target.value) })}
                               className="w-full h-1.5 bg-white rounded-lg appearance-none cursor-pointer accent-stone-900"
                             />
                           </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Atmospheric Canvas Style</label>
                          <div className="grid grid-cols-2 gap-3">
                            {([
                              { id: "transparent", name: "Glass" },
                              { id: "bg-white/20", name: "Frost" },
                              { id: "bg-stone-900/40", name: "Obsidian" },
                              { id: "border-2 border-white/40", name: "Outline" }
                            ] as const).map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => updateWatermarkSettings({ watermarkBg: bg.id })}
                                className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                                  currentWedding.watermarkBg === bg.id 
                                    ? 'bg-stone-900 text-white border-stone-900 shadow-lg' 
                                    : 'bg-white text-stone-400 border-stone-100'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full border border-stone-200 ${bg.id === 'transparent' ? 'bg-stone-50' : bg.id}`} />
                                {bg.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Anchor Position</label>
                          <div className="grid grid-cols-3 gap-3">
                            {(["top-left", "top-right", "center", "bottom-left", "bottom-right"] as const).map((pos) => (
                              <button
                                key={pos}
                                onClick={() => updateWatermarkSettings({ watermarkPosition: pos })}
                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                  currentWedding.watermarkPosition === pos 
                                    ? 'bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-200' 
                                    : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                                }`}
                              >
                                {pos.replace("-", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Atmospheric Opacity</label>
                            <span className="text-[10px] font-mono text-stone-500 font-bold">{Math.round((currentWedding.watermarkOpacity ?? 0.4) * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={currentWedding.watermarkOpacity ?? 0.4}
                            onChange={(e) => updateWatermarkSettings({ watermarkOpacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                          />
                        </div>

                        <div className="pt-6 space-y-6 border-t border-stone-100">
                           <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    Liquid Glass Effect
                                  </p>
                                  <p className="text-[8px] text-stone-400 uppercase tracking-widest leading-loose">Depth of field background distortion<br/>making the subject pop</p>
                              </div>
                              <button 
                                onClick={() => updateWatermarkSettings({ liquidGlassEnabled: !currentWedding.liquidGlassEnabled })}
                                className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${currentWedding.liquidGlassEnabled ? 'bg-indigo-600 justify-end' : 'bg-stone-200 justify-start'}`}
                              >
                                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                              </button>
                           </div>
                           
                           {currentWedding.liquidGlassEnabled && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="space-y-4"
                             >
                               <div className="flex justify-between items-center ml-1">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Diffusion Intensity</label>
                                 <span className="text-[10px] font-mono text-stone-500 font-bold">{currentWedding.photoBlur || 20}px</span>
                               </div>
                               <input 
                                 type="range" 
                                 min="5" 
                                 max="60" 
                                 step="1"
                                 value={currentWedding.photoBlur || 20}
                                 onChange={(e) => updateWatermarkSettings({ photoBlur: parseInt(e.target.value) })}
                                 className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                               />
                             </motion.div>
                           )}
                        </div>
                      </div>

                      <button 
                        onClick={() => setShowWatermarkModal(false)}
                        className="w-full py-5 rounded-2xl bg-stone-900 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-stone-200"
                      >
                        Preserve Settings
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {showShareModal && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-6 md:p-12 bg-stone-900/40 backdrop-blur-md"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", damping: 15, stiffness: 300 }}
                      className="bg-white rounded-[2.5rem] p-12 w-full max-w-md shadow-2xl shadow-stone-900/20 space-y-8 text-center my-auto"
                    >
                      <div className="space-y-4 relative">
                        <button 
                          onClick={() => setShowShareModal(false)}
                          className="absolute -top-16 -right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 hover:bg-stone-100 transition-all text-stone-400 hover:text-stone-600 font-bold text-[8px] uppercase tracking-widest"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-stone-100 shadow-inner">
                          <Share2 className="w-8 h-8 text-stone-900" />
                        </div>
                        <h3 className="text-3xl font-serif italic text-stone-900">Share Your Magic</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em]">Private Access Link</p>
                      </div>

                      <div className="space-y-6 text-left">
                        <div className="p-8 rounded-[2rem] bg-stone-50 border border-stone-100 space-y-8">
                           <div className="flex flex-col items-center gap-6">
                              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-stone-200 group relative">
                                <QRCode 
                                  id="qr-share-magic"
                                  value={`${window.location.origin}${window.location.pathname}?v=${currentWedding.id}`}
                                  size={160}
                                  bgColor="transparent"
                                  fgColor="#1c1917"
                                />
                                <div className="mt-4 px-4 py-2 bg-stone-50 rounded-xl flex items-center justify-center gap-2 border border-stone-100">
                                   <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Access Key:</span>
                                   <span className="text-xs font-mono font-bold text-stone-900">{currentWedding.id}</span>
                                </div>
                                <button 
                                  onClick={() => downloadQRCode("qr-share-magic", `wedding-${currentWedding.id.slice(0,8)}`)}
                                  className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                  title="Download QR"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              </div>
                              <button 
                                onClick={() => downloadQRCode("qr-share-magic", `wedding-${currentWedding.id.slice(0,8)}`)}
                                className="text-[10px] font-bold text-stone-900 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2 mt-4"
                              >
                                <Download className="w-3 h-3" /> Download Entry Key
                              </button>
                              <div className="text-center space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-900">Entrance Key</p>
                                <p className="text-[10px] text-stone-400 italic">Scan to synchronize collection</p>
                              </div>
                           </div>
                           
                           <div className="h-[1px] w-full bg-stone-200/50" />

                           <div className="space-y-3">
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Gallery Direct Link</p>
                             <div className="flex items-center justify-between gap-4">
                               <code className="flex-1 px-5 py-3 rounded-xl bg-white border border-stone-100 text-[10px] font-mono text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap">
                                 {window.location.host}?v={currentWedding.id.slice(0, 8)}...
                               </code>
                               <button 
                                 onClick={async () => {
                                   try {
                                     await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?v=${currentWedding.id}`);
                                     setCopied(true);
                                     showNotification("Link copied to clipboard");
                                     setTimeout(() => setCopied(false), 2000);
                                   } catch (e) {
                                     console.error("Clipboard access failed:", e);
                                   }
                                 }}
                                 className="text-stone-900 hover:scale-110 transition-transform"
                               >
                                 {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
                               </button>
                             </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center justify-between px-2">
                           <div className="space-y-1">
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Limit Status</p>
                              <p className="text-xs font-serif italic text-stone-900">
                                Expires in: {currentWedding.sharingLimit === 'unlimited' ? 'No Expiry' : currentWedding.sharingLimit}
                              </p>
                           </div>
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <button 
                          onClick={() => setShowShareModal(false)}
                          className="w-full py-5 rounded-2xl bg-stone-900 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-stone-200"
                        >
                          Done / Close
                        </button>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">This link allows public viewing of the curated atmosphere. Face verification is for contributor-only actions.</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Tag Filter Section */}
              <div className="flex flex-wrap items-center gap-3 pt-6">
                <div className="flex items-center gap-2 mr-4">
                  <Filter className="w-3 h-3 text-stone-400" />
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-stone-500 dark:text-stone-400">Atmospheric Filters</span>
                </div>
                
                <button 
                  onClick={() => setTagFilter(null)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${!tagFilter ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xl' : 'bg-stone-50 dark:bg-white/5 text-stone-400 border border-stone-100 dark:border-white/5 hover:border-stone-200'}`}
                >
                  All Captures
                </button>
                
                {Array.from(new Set(uploadedPhotos.flatMap(p => p.tags || []))).sort().map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${tagFilter === tag ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-stone-50 dark:bg-white/5 text-stone-400 border border-stone-100 dark:border-white/5 hover:border-stone-200'}`}
                  >
                    {tag}
                  </button>
                ))}

                {tagFilter && (
                   <button 
                     onClick={() => setTagFilter(null)}
                     className="ml-auto flex items-center gap-2 text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                   >
                     <X className="w-3 h-3" />
                     Reset Filters
                   </button>
                )}
              </div>

              {/* Sorting Section */}
              <div className="flex flex-wrap items-center gap-3 pt-4 pb-8 border-b border-stone-100 dark:border-white/5 mb-8">
                <div className="flex items-center gap-2 mr-4">
                  <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Chronology & Order</span>
                </div>

                <div className="flex bg-stone-50 dark:bg-white/5 p-1 rounded-xl gap-1">
                  <button 
                    onClick={() => setSortBy('newest')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  >
                    <Clock className="w-3 h-3" />
                    Newest
                  </button>
                  <button 
                    onClick={() => setSortBy('oldest')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${sortBy === 'oldest' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  >
                    <Clock className="w-3 h-3" />
                    Oldest
                  </button>
                  <button 
                    onClick={() => setSortBy('name')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${sortBy === 'name' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  >
                    <ArrowDownAZ className="w-3 h-3" />
                    A-Z
                  </button>
                  <button 
                    onClick={() => setSortBy('tags')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${sortBy === 'tags' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  >
                    <Tags className="w-3 h-3" />
                    Tag Class
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                {(showSelectionsOnly 
                  ? sortedPhotos.filter(p => savedPhotos.some(s => s.url === p.url)) 
                  : sortedPhotos
                ).map((photo, i) => (
                    <LazyPhoto 
                      key={photo.id}
                      photo={photo}
                      currentWedding={currentWedding}
                      index={i}
                      isSaved={savedPhotos.some(s => s.url === photo.url)}
                      onClick={() => setSelectedPhoto(photo)}
                      onDownload={(url, name) => handleDownloadPhoto(url, name)}
                      onShare={(p) => handleSharePhoto(p)}
                      onDelete={(p) => setPhotoToDelete(p)}
                      onToggleSave={(p) => handleToggleSave(p)}
                      canDelete={user?.uid === photo.uploadedBy || user?.uid === currentWedding?.ownerId}
                    />
                ))}
              </div>

              {showSelectionsOnly && matchedPhotos.filter(p => savedPhotos.some(s => s.url === p.url)).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-40 text-center space-y-8"
                >
                  <div className="w-24 h-24 rounded-[2rem] bg-stone-50 dark:bg-stone-900 flex items-center justify-center mx-auto border border-stone-100 dark:border-white/5">
                    <Heart className="w-10 h-10 text-stone-200" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-serif italic text-stone-900 dark:text-white">Your selection is empty</h3>
                    <p className="text-stone-400 text-sm font-medium">Capture the moments you love most to collect them here.</p>
                  </div>
                  <button 
                    onClick={() => setShowSelectionsOnly(false)}
                    className="px-10 py-5 rounded-2xl glass-dark text-white text-[10px] font-bold uppercase tracking-widest"
                  >
                    Examine All Captures
                  </button>
                </motion.div>
              )}

              {!showSelectionsOnly && sortedPhotos.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-40 text-center space-y-8"
                >
                  <div className="w-24 h-24 rounded-[2rem] bg-stone-50 dark:bg-stone-900 flex items-center justify-center mx-auto border border-stone-100 dark:border-white/5">
                    <Sparkles className="w-10 h-10 text-stone-200" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-serif italic text-stone-900 dark:text-white">
                      {tagFilter ? `No photos tagged "${tagFilter}"` : "The gallery is quiet"}
                    </h3>
                    <p className="text-stone-400 text-sm font-medium">
                      {tagFilter ? "Try a different filter or clear the selection." : "Be the first to upload a memory to this collection."}
                    </p>
                  </div>
                  {tagFilter && (
                    <button 
                      onClick={() => setTagFilter(null)}
                      className="px-10 py-5 rounded-2xl glass-dark text-white text-[10px] font-bold uppercase tracking-widest"
                    >
                      Clear Filter
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-stone-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
              onClick={() => setSelectedPhoto(null)}
            >
              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-8 right-8 z-[210] px-6 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-3 backdrop-blur-xl border border-white/20 transition-all font-bold group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Cancel</span>
              </motion.button>

              <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-12 max-w-7xl mx-auto">
                {/* Navigation Controls */}
                {(() => {
                  const currentList = showSelectionsOnly 
                    ? sortedPhotos.filter(p => savedPhotos.some(s => s.url === p.url)) 
                    : sortedPhotos;
                  const idx = currentList.findIndex(p => p.id === selectedPhoto.id);
                  
                  return currentList.length > 1 ? (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const prevIdx = (idx - 1 + currentList.length) % currentList.length;
                          setSelectedPhoto(currentList[prevIdx]);
                        }}
                        className="fixed left-8 top-1/2 -translate-y-1/2 z-[250] w-16 h-16 rounded-full glass-dark flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border border-white/10"
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIdx = (idx + 1) % currentList.length;
                          setSelectedPhoto(currentList[nextIdx]);
                        }}
                        className="fixed right-8 top-1/2 -translate-y-1/2 z-[250] w-16 h-16 rounded-full glass-dark flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border border-white/10"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </>
                  ) : null;
                })()}

                {/* Photo Viewer */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative flex-1 w-full h-full flex items-center justify-center bg-transparent p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative max-h-full aspect-auto rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 group bg-black">
                    {currentWedding?.liquidGlassEnabled && (
                      <div 
                        className="absolute inset-0 z-0 scale-110 opacity-70"
                        style={{ 
                          backgroundImage: `url(${selectedPhoto.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: `blur(${currentWedding.photoBlur || 20}px) saturate(1.2)`,
                        }}
                      />
                    )}
                    <img 
                      src={selectedPhoto.url} 
                      className="relative z-10 max-h-[75vh] w-auto object-contain transition-transform duration-700 hover:scale-105"
                      style={{ 
                        filter: currentWedding?.liquidGlassEnabled ? 'none' : `blur(${currentWedding?.photoBlur || 0}px)`,
                        maskImage: currentWedding?.liquidGlassEnabled 
                          ? 'radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 80%)' 
                          : 'none',
                        WebkitMaskImage: currentWedding?.liquidGlassEnabled 
                          ? 'radial-gradient(circle at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 80%)' 
                          : 'none'
                      }}
                      alt={selectedPhoto.name}
                    />

                    {/* Quick Blur Controls */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 glass-dark p-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => currentWedding && updateWatermarkSettings({ photoBlur: Math.max(0, (currentWedding.photoBlur || 0) - 2) })}
                         className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white"
                       >
                          <Minus className="w-4 h-4" />
                       </button>
                       <div className="w-[1px] h-4 bg-white/20" />
                       <span className="text-[10px] font-bold font-mono px-2 text-white/60 uppercase">Density</span>
                       <div className="w-[1px] h-4 bg-white/20" />
                       <button 
                         onClick={() => currentWedding && updateWatermarkSettings({ photoBlur: Math.min(20, (currentWedding.photoBlur || 0) + 2) })}
                         className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white"
                       >
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                    
                    {/* Watermark in Zen Mode */}
                    {currentWedding && (currentWedding.watermarkEnabled ?? true) && (
                      <div className={`absolute inset-0 p-12 pointer-events-none flex ${
                        currentWedding.watermarkPosition === 'top-left' ? 'items-start justify-start' :
                        currentWedding.watermarkPosition === 'top-right' ? 'items-start justify-end' :
                        currentWedding.watermarkPosition === 'bottom-left' ? 'items-end justify-start' :
                        currentWedding.watermarkPosition === 'bottom-right' ? 'items-end justify-end' :
                        'items-center justify-center'
                      }`} style={{ 
                        opacity: Math.max(0.1, currentWedding.watermarkOpacity ?? 0.4),
                        transform: `translate(${currentWedding.watermarkOffsetX || 0}%, ${currentWedding.watermarkOffsetY || 0}%)`
                      }}>
                         {currentWedding.watermarkType === "image" && currentWedding.watermarkUrl ? (
                           <div 
                             className="origin-center"
                             style={{ transform: `scale(${(currentWedding.watermarkScale || 1) * 1.5})` }}
                           >
                             <img 
                               src={currentWedding.watermarkUrl} 
                               className="max-w-[200px] max-h-[200px] object-contain drop-shadow-2xl" 
                               alt="Watermark"
                             />
                           </div>
                         ) : (
                           <div className={`text-center space-y-4 p-12 rounded-[2.5rem] backdrop-blur-lg border border-white/30 shadow-2xl ${currentWedding.watermarkBg || "transparent"}`}>
                              <Camera className="w-10 h-10 text-white mx-auto mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                              <p className="font-serif italic text-white whitespace-nowrap drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ fontSize: `${(currentWedding.watermarkTextSize || 24) * 1.5}px` }}>
                                 {currentWedding.watermarkText || "E. Moments"}
                              </p>
                              <p className="text-sm text-white font-bold uppercase tracking-[0.4em] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">{currentWedding.date}</p>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Unified Photo Sidebar panel */}
                <motion.div 
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full md:w-[400px] glass-dark rounded-[4rem] p-12 flex flex-col gap-12 shadow-[0_50px_100px_rgba(0,0,0,0.7)] border border-white/10 ring-1 ring-white/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-14 bg-indigo-500 rounded-full" />
                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em]">{currentWedding ? "Wedding Link" : "General Gallery"}</p>
                          <h3 className="text-5xl font-serif italic text-white leading-tight">{selectedPhoto.name || "Photo"}</h3>
                       </div>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{currentWedding ? `${currentWedding.name} — ${currentWedding.date}` : "Wedding Gallery"}</p>
                    
                    {/* Metadata Section */}
                    <div className="pt-8 space-y-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Technical Specs</span>
                        <Info className="w-3 h-3 text-white/20" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 group/meta">
                          <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Resolution</span>
                          <p className="text-[10px] font-mono text-white/60 group-hover/meta:text-indigo-400 transition-colors">
                            {selectedPhoto.dimensions || "High Fidelity"}
                          </p>
                        </div>
                        <div className="space-y-1 group/meta">
                          <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">File Weight</span>
                          <p className="text-[10px] font-mono text-white/60 group-hover/meta:text-indigo-400 transition-colors">
                            {selectedPhoto.size ? (selectedPhoto.size > 1024 * 1024 ? `${(selectedPhoto.size / (1024 * 1024)).toFixed(2)} MB` : `${(selectedPhoto.size / 1024).toFixed(1)} KB`) : "Vector/Optimized"}
                          </p>
                        </div>
                        <div className="space-y-1 group/meta">
                          <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Type</span>
                          <p className="text-[10px] font-mono text-white/60 group-hover/meta:text-indigo-400 transition-colors truncate">
                            {selectedPhoto.type?.split('/')[1]?.toUpperCase() || "JPEG"}
                          </p>
                        </div>
                        <div className="space-y-1 group/meta">
                          <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Aesthetics</span>
                          <p className="text-[10px] font-mono text-white/60 group-hover/meta:text-indigo-400 transition-colors">
                            {currentWedding?.liquidGlassEnabled ? "Liquid Glass" : "Clean Render"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <div className="flex justify-between items-center group/meta">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Archival ID</span>
                          <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-1 rounded transition-colors group-hover/meta:text-indigo-400">{selectedPhoto.id}</span>
                        </div>
                        <div className="flex justify-between items-center group/meta">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Architect</span>
                          <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-1 rounded transition-colors group-hover/meta:text-indigo-400 truncate max-w-[140px]">{selectedPhoto.uploadedBy || "System"}</span>
                        </div>
                        <div className="flex justify-between items-center group/meta">
                          <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Time Decipher</span>
                          <span className="text-[9px] font-mono text-white/50 bg-white/5 px-2 py-1 rounded transition-colors group-hover/meta:text-indigo-400">
                            {selectedPhoto.createdAt?.toDate 
                              ? selectedPhoto.createdAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                              : (selectedPhoto.createdAt instanceof Date ? selectedPhoto.createdAt.toLocaleString() : "Moment Captured")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Tags Section */}
                    <div className="pt-8 space-y-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Aesthetic Tags</span>
                        <Filter className="w-3 h-3 text-white/20" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags?.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => handleToggleTag(selectedPhoto, tag)}
                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/80 uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center gap-2 group/tag"
                          >
                            {tag}
                            <X className="w-2.5 h-2.5 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                          </button>
                        ))}
                        {(!selectedPhoto.tags || selectedPhoto.tags.length === 0) && (
                          <p className="text-[9px] text-white/20 italic">No tags assigned</p>
                        )}
                      </div>

                      <div className="relative mt-2">
                        <input 
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleToggleTag(selectedPhoto, newTag);
                              setNewTag("");
                            }
                          }}
                          placeholder="Add new tag..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 accent-ring ring-opacity-30 transition-all"
                        />
                        <button 
                          onClick={() => {
                            handleToggleTag(selectedPhoto, newTag);
                            setNewTag("");
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-white/5">
                    <button 
                      onClick={() => handleSharePhoto(selectedPhoto)}
                      className="w-full py-6 rounded-3xl bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.3em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                      <Share2 className="w-5 h-5" />
                      Share Photo
                    </button>
                    <button 
                      onClick={() => handleDownloadPhoto(selectedPhoto.url, `E-Moment-Original-${selectedPhoto.id}.jpg`)}
                      className="w-full py-6 rounded-3xl bg-white text-stone-900 font-bold text-xs uppercase tracking-[0.3em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                      <Download className="w-5 h-5" />
                      Aesthetic Download
                    </button>
                    <button 
                      onClick={() => handleToggleSave(selectedPhoto)}
                      className={`w-full py-8 rounded-[2rem] font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:translate-y-[-4px] active:scale-95 transition-all shadow-3xl ${savedPhotos.some(s => s.url === selectedPhoto.url) ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white text-stone-900 shadow-xl border border-stone-100'}`}
                    >
                      <Heart className={`w-7 h-7 ${savedPhotos.some(s => s.url === selectedPhoto.url) ? 'fill-current text-white' : 'text-stone-400'}`} />
                      {savedPhotos.some(s => s.url === selectedPhoto.url) ? 'Saved to Collection' : 'Add to Collection'}
                    </button>
                    
                    <button 
                      onClick={() => {
                        updateWatermarkSettings({ coverUrl: selectedPhoto.url });
                        showNotification("Silhouette (Cover) updated");
                      }}
                      className="w-full py-8 rounded-[2rem] bg-white text-stone-900 font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:translate-y-[-4px] active:scale-95 transition-all shadow-xl"
                    >
                      <LayoutGrid className="w-7 h-7 opacity-60" />
                      Set Silhouette
                    </button>

                    {(user?.uid === selectedPhoto.uploadedBy || user?.uid === currentWedding?.ownerId) && (
                      <button 
                        onClick={() => {
                          setPhotoToDelete(selectedPhoto);
                        }}
                        className="w-full py-8 rounded-[2rem] bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-red-500/20 transition-all border border-red-500/20 mt-6"
                      >
                        <Trash2 className="w-7 h-7" />
                        Delete Photo
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedPhoto(null)}
                      className="w-full py-6 mt-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.5em] hover:text-white transition-colors"
                    >
                      Close Viewport
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>



      {/* Join Wedding Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-[3rem] p-12 w-full max-w-md shadow-2xl dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-stone-100 dark:border-white/5 space-y-10 text-center"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-indigo-100 dark:ring-white/10 shadow-inner gap-1">
                  <Camera className="w-4 h-4 text-indigo-300 dark:text-stone-500" />
                  <QrCode className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-3xl font-serif italic text-stone-900 dark:text-white">Join Event</h3>
                <p className="text-stone-400 dark:text-stone-300 text-xs font-bold uppercase tracking-widest leading-relaxed">Enter the access key provided by the event host.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-2">Access Key ID</label>
                  <input 
                    type="text" 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="e.g. event-code-123"
                    className="w-full px-8 py-5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-white/5 focus:outline-none focus:ring-2 accent-ring ring-opacity-30 transition-all font-mono text-sm tracking-tighter text-stone-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setCameraInitialMode("qr");
                      setShowCamera(true);
                    }}
                    className="flex-1 py-5 rounded-2xl border border-stone-100 dark:border-white/10 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-indigo-600 dark:text-indigo-400"
                  >
                    <QrCode className="w-4 h-4" /> Scan QR
                  </button>
                  <button 
                    onClick={() => setShowJoinModal(false)}
                    className="px-6 py-5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-300 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>

                <button 
                  onClick={handleJoinWedding}
                  disabled={!joinId}
                  className="w-full py-6 rounded-[2rem] bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs uppercase tracking-[0.4em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all disabled:opacity-30 disabled:translate-y-0"
                >
                  Join Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {photoToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-dark max-w-sm w-full p-10 rounded-[3rem] border border-red-500/20 shadow-[0_40px_100px_rgba(239,68,68,0.2)] text-center space-y-8"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto ring-1 ring-red-500/30">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic text-white flex items-center justify-center gap-2">
                   Delete Photo?
                </h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed px-4">
                  This action will permanently remove this photo from the gallery.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeletePhoto}
                  disabled={isDeleting}
                  className="w-full py-6 rounded-[2rem] bg-red-600 text-white font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Delete
                </button>
                <button
                  onClick={() => setPhotoToDelete(null)}
                  disabled={isDeleting}
                  className="w-full py-6 rounded-[2rem] bg-white/5 text-white/40 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-white transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wedding Modals - Create & Edit */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-[3rem] p-12 w-full max-w-xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-stone-100 dark:border-white/5 space-y-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-serif italic text-stone-900 dark:text-white">
                  {showEditModal ? "Edit Event" : "Create New Event"}
                </h3>
                <button 
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} 
                  className="p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-slate-200"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Event Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["wedding", "anniversary", "birthday"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          if (showEditModal && editingWedding) {
                            setEditingWedding({...editingWedding, type: type});
                          } else {
                            setNewWeddingData({...newWeddingData, type: type});
                          }
                        }}
                        className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                          (showEditModal && editingWedding ? (editingWedding.type || "wedding") : newWeddingData.type) === type 
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xl' 
                            : 'bg-white dark:bg-stone-950 text-stone-400 dark:text-indigo-200 border-stone-100 dark:border-white/5 hover:border-stone-200 dark:hover:border-white/10'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Event Name</label>
                  <input 
                    type="text" 
                    value={showEditModal && editingWedding ? editingWedding.name : newWeddingData.name}
                    onChange={(e) => {
                      if (showEditModal && editingWedding) {
                        setEditingWedding({...editingWedding, name: e.target.value});
                      } else {
                        setNewWeddingData({...newWeddingData, name: e.target.value});
                      }
                    }}
                    placeholder={`e.g. My ${showEditModal && editingWedding ? (editingWedding.type || "Event") : newWeddingData.type}...`}
                    className="w-full px-8 py-5 rounded-[2xl] bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 focus:outline-none focus:ring-2 accent-ring ring-opacity-20 transition-all font-serif italic text-xl text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Temporal Anchor (Date)</label>
                  <input 
                    type="date" 
                    value={showEditModal && editingWedding ? editingWedding.date : newWeddingData.date}
                    onChange={(e) => {
                      if (showEditModal && editingWedding) {
                        setEditingWedding({...editingWedding, date: e.target.value});
                      } else {
                        setNewWeddingData({...newWeddingData, date: e.target.value});
                      }
                    }}
                    className="w-full px-8 py-5 rounded-[2xl] bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 focus:outline-none focus:ring-2 accent-ring ring-opacity-20 transition-all text-sm font-bold uppercase tracking-widest text-stone-900 dark:text-white"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Atmospheric Cover (Optional)</label>
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full aspect-video rounded-[2xl] bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-all overflow-hidden relative group"
                  >
                    {(showEditModal && editingWedding?.coverUrl) || newWeddingData.coverUrl ? (
                      <img 
                        src={showEditModal && editingWedding ? editingWedding.coverUrl : newWeddingData.coverUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt="Cover Preview"
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-stone-200" />
                        <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400 mt-2">Select Hero Image</p>
                      </>
                    )}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Plus className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={coverInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && user) {
                        try {
                          showNotification("Uploading atmospheric cover...");
                          const storagePath = `covers/${user.uid}/${Date.now()}_${file.name}`;
                          const downloadUrl = await uploadImageToStorage(file, storagePath);
                          if (showEditModal && editingWedding) {
                            setEditingWedding({...editingWedding, coverUrl: downloadUrl});
                          } else {
                            setNewWeddingData({...newWeddingData, coverUrl: downloadUrl});
                          }
                          showNotification("Silhouette synchronized");
                        } catch (err) {
                           console.error(err);
                           showNotification("Cover upload failed");
                        }
                      }
                    }}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1">Session Duration</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(["1h", "2h", "5h", "15h", "1d", "2d", "3d", "unlimited"] as const).map((limit) => (
                      <button
                        key={limit}
                        onClick={() => {
                          if (showEditModal && editingWedding) {
                            setEditingWedding({...editingWedding, sharingLimit: limit});
                          } else {
                            setNewWeddingData({...newWeddingData, sharingLimit: limit});
                          }
                        }}
                        className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                          (showEditModal && editingWedding ? editingWedding.sharingLimit : newWeddingData.sharingLimit) === limit 
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xl' 
                            : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                        }`}
                      >
                        {limit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button 
                  onClick={showEditModal ? handleUpdateWedding : handleCreateWedding}
                  disabled={showEditModal ? !editingWedding?.name || !editingWedding?.date : !newWeddingData.name || !newWeddingData.date}
                  className="w-full py-7 rounded-[2.5rem] bg-stone-900 text-white font-bold text-xs uppercase tracking-[0.4em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
                >
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  {showEditModal ? "Save Changes" : "Create Gallery"}
                </button>
                <button 
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="w-full py-6 rounded-[2.5rem] bg-stone-50 text-stone-400 font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-stone-100 hover:text-stone-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Notifications */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 pointer-events-none items-center">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.15 } }}
              transition={{ type: "spring", damping: 12, stiffness: 250 }}
              className="px-8 py-4 rounded-full glass-dark text-white text-[11px] font-bold uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/5"
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-stone-100" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Onboarding Sequence */}
      <AnimatePresence>
        {onboardingStep !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-stone-900 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="bg-white rounded-[3rem] p-12 max-w-xl w-full text-center space-y-12 shadow-[0_0_100px_rgba(255,255,255,0.1)]"
            >
              <div className="space-y-6">
                <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-stone-100">
                  <Heart className="w-12 h-12 text-stone-300" />
                </div>
                <h2 className="text-5xl font-serif italic text-stone-900 leading-tight">Where did you start?</h2>
                <p className="text-xl text-stone-500 font-medium">A beautiful space for your most precious memories. Let us help you organize your photos.</p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={completeOnboarding}
                  className="w-full py-6 rounded-3xl bg-stone-900 text-white font-bold text-xs uppercase tracking-[0.3em] shadow-2xl shadow-stone-200"
                >
                  Begin Journey
                </button>
                <button 
                  onClick={completeOnboarding}
                  className="w-full py-6 rounded-3xl bg-white text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-stone-900 transition-colors"
                >
                  Skip for now                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

