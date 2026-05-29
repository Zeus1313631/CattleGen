import { useState, useMemo, useEffect, useCallback } from "react";
import {
  MapPin,
  Search,
  Star,
  Beef,
  Egg,
  Apple,
  Wheat,
  Milk,
  Filter,
  Heart,
  Phone,
  Navigation,
  Award,
  Sprout,
  X,
  Compass,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
} from "lucide-react";

// Deep forest: #1f3829 | Warm cream: #f7f1e3 | Burnished cream: #ebe2cc
// Clay red: #b54a2a | Harvest gold: #d4a017 | Sage: #6b8e5e | Bark brown: #4a3528

interface RanchProduct { name: string; price: string }

interface Ranch {
  id: number
  name: string
  tagline: string
  tier: "premium" | "free"
  rating: number
  reviews: number
  distance: number
  x: number
  y: number
  categories: string[]
  badges: string[]
  products: RanchProduct[]
  image: string
  accent: string
}

export interface RanchDocument {
  id: number
  ranch_id: number
  ranch_name: string
  document_name: string
  file_path: string
  file_type: string | null
  uploaded_at: string
}

const RANCHES: Ranch[] = [
  { id: 1, name: "Cedar Hollow Ranch", tagline: "Grass-fed beef & heritage pork since 1962", tier: "premium", rating: 4.9, reviews: 247, distance: 3.2, x: 38, y: 42, categories: ["beef", "pork"], badges: ["Regenerative", "Pasture-Raised", "USDA"], products: [{ name: "Ribeye, dry-aged 28d", price: "$32/lb" }, { name: "Ground beef, 80/20", price: "$11/lb" }, { name: "Heritage pork chops", price: "$18/lb" }], image: "🐄", accent: "#b54a2a" },
  { id: 2, name: "Goldenrod Apiary", tagline: "Single-origin wildflower honey", tier: "premium", rating: 5.0, reviews: 89, distance: 5.8, x: 62, y: 28, categories: ["honey"], badges: ["Raw", "Unfiltered", "Small-Batch"], products: [{ name: "Wildflower honey, 1lb jar", price: "$18" }, { name: "Comb honey", price: "$24" }, { name: "Beeswax candles", price: "$12" }], image: "🍯", accent: "#d4a017" },
  { id: 3, name: "Three Sisters Garden", tagline: "Heirloom produce, biodynamic certified", tier: "free", rating: 4.7, reviews: 134, distance: 7.1, x: 25, y: 65, categories: ["produce"], badges: ["Biodynamic", "Heirloom"], products: [{ name: "Cherokee Purple tomatoes", price: "$6/lb" }, { name: "Mixed greens box", price: "$15" }, { name: "Rainbow carrots", price: "$5/bunch" }], image: "🥬", accent: "#6b8e5e" },
  { id: 4, name: "Bluestem Poultry Co.", tagline: "Pasture-raised chicken & duck eggs", tier: "premium", rating: 4.8, reviews: 312, distance: 4.5, x: 72, y: 58, categories: ["chicken", "eggs"], badges: ["Pasture-Raised", "Soy-Free", "Non-GMO"], products: [{ name: "Whole chicken, 4-5lb", price: "$28" }, { name: "Duck eggs, dozen", price: "$14" }, { name: "Chicken feet, lb", price: "$6" }], image: "🐓", accent: "#a44a2c" },
  { id: 5, name: "Old Mill Dairy", tagline: "Raw A2 milk & farmstead cheese", tier: "free", rating: 4.9, reviews: 78, distance: 9.2, x: 48, y: 75, categories: ["dairy"], badges: ["A2/A2", "Grass-Fed"], products: [{ name: "Raw whole milk, gallon", price: "$12" }, { name: "Aged cheddar, 8oz", price: "$14" }, { name: "Cultured butter", price: "$10" }], image: "🥛", accent: "#5d7d4a" },
  { id: 6, name: "Rocky Bend Farm", tagline: "Heritage breed pork & seasonal produce", tier: "free", rating: 4.6, reviews: 92, distance: 11.4, x: 15, y: 35, categories: ["pork", "produce"], badges: ["Heritage Breed", "Forest-Raised"], products: [{ name: "Pork shoulder", price: "$12/lb" }, { name: "Smoked bacon", price: "$16/lb" }, { name: "Winter squash", price: "$3/lb" }], image: "🐖", accent: "#8b5a3c" },
  { id: 7, name: "Wildwood Honey & Hens", tagline: "Honey, eggs, and seasonal preserves", tier: "premium", rating: 4.8, reviews: 156, distance: 6.3, x: 85, y: 45, categories: ["honey", "eggs"], badges: ["Raw", "Pasture-Raised"], products: [{ name: "Mixed honey 3-pack", price: "$42" }, { name: "Heritage eggs, dozen", price: "$9" }, { name: "Seasonal jam", price: "$11" }], image: "🥚", accent: "#c8841a" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: Filter },
  { id: "beef", label: "Beef", icon: Beef },
  { id: "pork", label: "Pork", icon: Beef },
  { id: "chicken", label: "Poultry", icon: Egg },
  { id: "produce", label: "Produce", icon: Apple },
  { id: "honey", label: "Honey", icon: Wheat },
  { id: "dairy", label: "Dairy", icon: Milk },
  { id: "eggs", label: "Eggs", icon: Egg },
];

export default function HarvestMap() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedRanch, setSelectedRanch] = useState<Ranch | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [documents, setDocuments] = useState<RanchDocument[]>([]);

  const filtered = useMemo(() => {
    return RANCHES.filter((r) => {
      const matchCat = activeCategory === "all" || r.categories.includes(activeCategory);
      const matchSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === "premium" ? -1 : 1;
      return b.rating - a.rating;
    });
  }, [activeCategory, searchQuery]);

  const toggleFav = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadDocuments = useCallback(async (ranchId: number) => {
    const docs = await window.cattlegen.db.all<RanchDocument>(
      "SELECT * FROM harvest_ranch_documents WHERE ranch_id = ? ORDER BY uploaded_at DESC",
      [ranchId]
    );
    setDocuments(docs);
  }, []);

  const uploadDocuments = async (ranch: Ranch) => {
    const res = await window.cattlegen.dialog.openFile({
      filters: [
        {
          name: "Documents & Images",
          extensions: ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "csv", "xlsx", "xls"],
        },
        { name: "All files", extensions: ["*"] },
      ],
      properties: ["openFile", "multiSelections"],
    });
    if (res.canceled || res.filePaths.length === 0) return;

    for (const filePath of res.filePaths) {
      const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
      const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? null : null;
      await window.cattlegen.db.run(
        `INSERT INTO harvest_ranch_documents (ranch_id, ranch_name, document_name, file_path, file_type)
         VALUES (?, ?, ?, ?, ?)`,
        [ranch.id, ranch.name, fileName, filePath, ext]
      );
    }
    await loadDocuments(ranch.id);
  };

  const deleteDocument = async (docId: number, ranchId: number) => {
    await window.cattlegen.db.run("DELETE FROM harvest_ranch_documents WHERE id = ?", [docId]);
    await loadDocuments(ranchId);
  };

  const openDocument = (filePath: string) => {
    void window.cattlegen.shell.openPath(filePath);
  };

  useEffect(() => {
    if (selectedRanch) {
      void loadDocuments(selectedRanch.id);
    } else {
      setDocuments([]);
    }
  }, [selectedRanch, loadDocuments]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ fontFamily: "'Fraunces', Georgia, serif", background: "linear-gradient(180deg, #f7f1e3 0%, #ebe2cc 100%)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* HEADER */}
      <header className="relative z-20 bg-[#1f3829] text-[#f7f1e3] shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#d4a017] flex items-center justify-center shadow-md">
              <Sprout size={22} className="text-[#1f3829]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl tracking-tight leading-none" style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}>
                HARVEST<span className="text-[#d4a017]">MAP</span>
              </h1>
              <p className="text-[10px] tracking-[0.3em] text-[#d4a017] uppercase mt-1 font-bold">
                Direct from the producer
              </p>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-[#d4a017] text-[#1f3829] text-xs font-black tracking-widest uppercase rounded-full hover:bg-[#e5b428] transition shadow-md">
            List Your Ranch
          </button>
        </div>

        {/* Search & view toggle */}
        <div className="max-w-7xl mx-auto px-5 pb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1f3829]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ranches, products, or producers..."
                className="w-full pl-11 pr-4 py-3 rounded-full bg-[#f7f1e3] border-2 border-[#d4a017] text-[#1f3829] placeholder-[#4a3528]/60 focus:outline-none focus:border-[#b54a2a] text-sm font-semibold"
              />
            </div>
            <div className="flex bg-[#2d4a36] rounded-full p-1 border-2 border-[#3d5a46]">
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase transition ${view === "map" ? "bg-[#d4a017] text-[#1f3829]" : "text-[#f7f1e3]"}`}
              >
                Map
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase transition ${view === "list" ? "bg-[#d4a017] text-[#1f3829]" : "text-[#f7f1e3]"}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="max-w-7xl mx-auto px-5 pb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase transition whitespace-nowrap ${
                    active
                      ? "bg-[#d4a017] text-[#1f3829]"
                      : "bg-[#2d4a36] text-[#f7f1e3] border border-[#3d5a46] hover:bg-[#3d5a46]"
                  }`}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 max-w-7xl mx-auto px-5 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">
              {filtered.length} producers near you
            </p>
            <h2 className="text-3xl mt-1 text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
              From the land, <span className="italic font-light text-[#b54a2a]">to your table</span>
            </h2>
          </div>
        </div>

        {view === "map" ? (
          <MapView ranches={filtered} selectedRanch={selectedRanch} setSelectedRanch={setSelectedRanch} />
        ) : (
          <ListView ranches={filtered} favorites={favorites} toggleFav={toggleFav} onSelect={setSelectedRanch} />
        )}
      </main>

      {selectedRanch && (
        <RanchDetail
          ranch={selectedRanch}
          onClose={() => setSelectedRanch(null)}
          isFav={favorites.has(selectedRanch.id)}
          onFav={() => toggleFav(selectedRanch.id)}
          documents={documents}
          onUpload={() => uploadDocuments(selectedRanch)}
          onDelete={(docId) => deleteDocument(docId, selectedRanch.id)}
          onOpen={openDocument}
        />
      )}

      <div className="max-w-7xl mx-auto px-5 py-8 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-[#4a3528] font-bold">
          HarvestMap · Find food raised right
        </p>
      </div>
    </div>
  );
}

function MapView({
  ranches,
  selectedRanch,
  setSelectedRanch,
}: {
  ranches: Ranch[];
  selectedRanch: Ranch | null;
  setSelectedRanch: (r: Ranch) => void;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4">
      {/* Map canvas */}
      <div
        className="relative rounded-2xl overflow-hidden border-4 border-[#1f3829] aspect-[4/3] lg:aspect-auto lg:min-h-[600px] shadow-xl"
        style={{ background: "radial-gradient(circle at 30% 40%, #8fa876 0%, #6b8e5e 35%, #4a6b3f 70%, #2d4a2a 100%)" }}
      >
        {/* Topo lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {[...Array(8)].map((_, i) => (
            <ellipse key={i} cx="50%" cy="50%" rx={`${30 + i * 8}%`} ry={`${20 + i * 6}%`} fill="none" stroke="#1f3829" strokeWidth="1.5" />
          ))}
        </svg>

        {/* Roads */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          <path d="M 0 60% Q 30% 50%, 50% 55% T 100% 50%" stroke="#f7f1e3" strokeWidth="2" fill="none" strokeDasharray="6 4" />
          <path d="M 40% 0 Q 45% 30%, 50% 50% T 60% 100%" stroke="#f7f1e3" strokeWidth="2" fill="none" strokeDasharray="6 4" />
        </svg>

        {/* Current location */}
        <div className="absolute" style={{ left: "50%", top: "50%" }}>
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#d4a017] opacity-40 animate-ping" />
            <div className="relative w-7 h-7 rounded-full bg-[#d4a017] border-[3px] border-[#1f3829] flex items-center justify-center shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f3829]" />
            </div>
            <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-widest uppercase font-black text-[#1f3829] bg-[#d4a017] px-2.5 py-1 rounded-full shadow-md">
              You
            </div>
          </div>
        </div>

        {/* Ranch pins */}
        {ranches.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRanch(r)}
            className="absolute group"
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          >
            <div
              className={`relative -translate-x-1/2 -translate-y-full transition-all ${
                selectedRanch?.id === r.id ? "scale-125 z-10" : "hover:scale-110"
              }`}
            >
              {r.tier === "premium" && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#d4a017] border-2 border-[#1f3829] z-10 flex items-center justify-center shadow-md">
                  <Star size={10} className="fill-[#1f3829] text-[#1f3829]" />
                </div>
              )}
              <div
                className="w-11 h-11 rounded-full border-[3px] border-[#1f3829] flex items-center justify-center text-xl shadow-xl"
                style={{ backgroundColor: r.accent }}
              >
                {r.image}
              </div>
              <div
                className="w-0 h-0 mx-auto -mt-1 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent"
                style={{ borderTopColor: "#1f3829" }}
              />
            </div>
          </button>
        ))}

        {/* Compass */}
        <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-[#1f3829] border-2 border-[#d4a017] flex items-center justify-center text-[#f7f1e3] shadow-xl">
          <div className="text-center">
            <div className="text-[9px] tracking-widest font-bold text-[#d4a017]">N</div>
            <Compass size={20} className="text-[#d4a017]" />
          </div>
        </div>
      </div>

      {/* Side rail */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {ranches.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRanch(r)}
            className={`w-full text-left p-3 rounded-xl border-2 transition ${
              selectedRanch?.id === r.id
                ? "bg-[#1f3829] text-[#f7f1e3] border-[#d4a017]"
                : "bg-[#f7f1e3] border-[#1f3829]/20 hover:border-[#1f3829]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 border-2 border-[#1f3829]/20"
                style={{ backgroundColor: r.accent }}
              >
                {r.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm truncate" style={{ fontFamily: "'Fraunces', serif" }}>
                    {r.name}
                  </h3>
                  {r.tier === "premium" && <Award size={12} className="text-[#d4a017] flex-shrink-0" />}
                </div>
                <p className={`text-xs truncate ${selectedRanch?.id === r.id ? "text-[#ebe2cc]" : "text-[#4a3528]"}`}>
                  {r.tagline}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1">
                    <Star size={10} className="fill-[#d4a017] text-[#d4a017]" />
                    {r.rating}
                  </span>
                  <span className={selectedRanch?.id === r.id ? "text-[#ebe2cc]" : "text-[#4a3528]"}>
                    {r.distance} mi
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ListView({
  ranches,
  favorites,
  toggleFav,
  onSelect,
}: {
  ranches: Ranch[];
  favorites: Set<number>;
  toggleFav: (id: number) => void;
  onSelect: (r: Ranch) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ranches.map((r) => (
        <article
          key={r.id}
          className="group relative rounded-2xl border-2 border-[#1f3829] overflow-hidden bg-[#f7f1e3] hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer shadow-md"
          onClick={() => onSelect(r)}
        >
          {r.tier === "premium" && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-[#d4a017] text-[#1f3829] px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">
              <Award size={10} />
              Featured
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(r.id);
            }}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#1f3829] flex items-center justify-center hover:bg-[#2d4a36] transition shadow-md"
          >
            <Heart size={16} className={favorites.has(r.id) ? "fill-[#d4a017] text-[#d4a017]" : "text-[#f7f1e3]"} />
          </button>

          <div
            className="h-32 flex items-center justify-center text-6xl border-b-4 border-[#1f3829]"
            style={{ background: `linear-gradient(135deg, ${r.accent}ee, ${r.accent})` }}
          >
            {r.image}
          </div>

          <div className="p-4 bg-[#f7f1e3]">
            <h3 className="text-xl leading-tight text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 800 }}>
              {r.name}
            </h3>
            <p className="text-xs text-[#4a3528] mt-1 italic">{r.tagline}</p>

            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 font-bold text-[#1f3829]">
                <Star size={12} className="fill-[#d4a017] text-[#d4a017]" />
                {r.rating}
                <span className="text-[#4a3528] font-normal">({r.reviews})</span>
              </span>
              <span className="text-[#4a3528]">·</span>
              <span className="flex items-center gap-1 text-[#1f3829] font-semibold">
                <MapPin size={12} />
                {r.distance} mi
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {r.badges.slice(0, 2).map((b) => (
                <span key={b} className="text-[10px] tracking-wider uppercase px-2 py-0.5 border border-[#1f3829] text-[#1f3829] font-bold rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function RanchDetail({
  ranch,
  onClose,
  isFav,
  onFav,
  documents,
  onUpload,
  onDelete,
  onOpen,
}: {
  ranch: Ranch;
  onClose: () => void;
  isFav: boolean;
  onFav: () => void;
  documents: RanchDocument[];
  onUpload: () => void;
  onDelete: (docId: number) => void;
  onOpen: (filePath: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: "rgba(31, 56, 41, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-[#f7f1e3] w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl border-2 border-[#1f3829] max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div
          className="relative h-48 flex items-center justify-center text-8xl border-b-4 border-[#1f3829]"
          style={{ background: `linear-gradient(135deg, ${ranch.accent}ee, ${ranch.accent})` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1f3829] flex items-center justify-center text-[#f7f1e3] hover:bg-[#2d4a36] shadow-lg"
          >
            <X size={20} />
          </button>
          {ranch.tier === "premium" && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#1f3829] text-[#d4a017] px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">
              <Award size={12} />
              Premium Producer
            </div>
          )}
          {ranch.image}
        </div>

        <div className="p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl leading-tight text-[#1f3829]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 900 }}>
                {ranch.name}
              </h2>
              <p className="text-sm text-[#4a3528] italic mt-1">{ranch.tagline}</p>
            </div>
            <button
              onClick={onFav}
              className="w-11 h-11 rounded-full border-2 border-[#1f3829] flex items-center justify-center flex-shrink-0 hover:bg-[#1f3829] hover:text-[#f7f1e3] transition group"
            >
              <Heart size={18} className={isFav ? "fill-[#b54a2a] text-[#b54a2a]" : "text-[#1f3829] group-hover:text-[#f7f1e3]"} />
            </button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4 pb-4 border-b-2 border-[#1f3829]/15 flex-wrap">
            <span className="flex items-center gap-1 font-bold text-[#1f3829]">
              <Star size={14} className="fill-[#d4a017] text-[#d4a017]" />
              {ranch.rating}
              <span className="text-[#4a3528] font-normal text-sm ml-1">({ranch.reviews} reviews)</span>
            </span>
            <span className="flex items-center gap-1 text-[#1f3829] text-sm font-semibold">
              <MapPin size={14} />
              {ranch.distance} miles
            </span>
          </div>

          {/* Practices */}
          <div className="mt-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#4a3528] mb-2 font-black">Practices</p>
            <div className="flex flex-wrap gap-2">
              {ranch.badges.map((b) => (
                <span key={b} className="text-xs tracking-wider uppercase px-3 py-1 bg-[#1f3829] text-[#d4a017] font-bold rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="mt-6">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#4a3528] mb-2 font-black">Available Now</p>
            <div className="space-y-2">
              {ranch.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#ebe2cc] rounded-lg border-2 border-[#1f3829]/15">
                  <span style={{ fontFamily: "'Fraunces', serif" }} className="font-bold text-[#1f3829]">
                    {p.name}
                  </span>
                  <span className="font-black text-[#b54a2a]">{p.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#4a3528] font-black">
                Documents
                {documents.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1f3829] text-[#d4a017] text-[9px] font-black">
                    {documents.length}
                  </span>
                )}
              </p>
              <button
                onClick={onUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f3829] text-[#d4a017] rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#2d4a36] transition shadow-sm"
              >
                <Upload size={11} />
                Upload
              </button>
            </div>

            {documents.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-[#1f3829]/25 cursor-pointer hover:border-[#1f3829]/50 transition"
                onClick={onUpload}
              >
                <FileText size={28} className="text-[#4a3528]/40" />
                <p className="text-xs text-[#4a3528]/60 font-semibold">No documents attached</p>
                <p className="text-[10px] text-[#4a3528]/40 tracking-wider uppercase">
                  Click to upload certifications, reports, or records
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-[#ebe2cc] rounded-lg border-2 border-[#1f3829]/15 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1f3829] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[#d4a017]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-[#1f3829] truncate"
                        style={{ fontFamily: "'Fraunces', serif" }}
                        title={doc.document_name}
                      >
                        {doc.document_name}
                      </p>
                      <p className="text-[10px] text-[#4a3528] uppercase tracking-wider font-semibold">
                        {doc.file_type ? `.${doc.file_type}` : "file"} ·{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onOpen(doc.file_path)}
                        title="Open file"
                        className="w-8 h-8 rounded-lg bg-[#1f3829] flex items-center justify-center hover:bg-[#2d4a36] transition"
                      >
                        <ExternalLink size={13} className="text-[#d4a017]" />
                      </button>
                      <button
                        onClick={() => onDelete(doc.id)}
                        title="Remove document"
                        className="w-8 h-8 rounded-lg bg-[#b54a2a] flex items-center justify-center hover:bg-[#c8421a] transition"
                      >
                        <Trash2 size={13} className="text-[#f7f1e3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="flex items-center justify-center gap-2 py-3 bg-[#1f3829] text-[#f7f1e3] rounded-full font-black text-sm tracking-widest uppercase hover:bg-[#2d4a36] shadow-md">
              <Navigation size={16} />
              Directions
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-[#d4a017] text-[#1f3829] rounded-full font-black text-sm tracking-widest uppercase hover:bg-[#e5b428] shadow-md">
              <Phone size={16} />
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
