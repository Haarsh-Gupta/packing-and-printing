"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, Plus, Search, Globe, Edit2, Trash2, 
  CheckCircle2, XCircle, Layout, Share2, 
  Tag, ExternalLink, ArrowLeft, Save
} from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Link from "next/link";

interface SEOConfig {
  id: number;
  path: string;
  title: string;
  description: string;
  keywords: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

const COMMON_ROUTES = [
  "/",
  "/products",
  "/services",
  "/about",
  "/contact",
  "/cart",
  "/quote",
  "/privacy",
  "/terms",
  "/dashboard",
  "/dashboard/inquiries",
  "/dashboard/orders",
  "/dashboard/support",
  "/dashboard/settings"
];

export default function SEOSettingsPage() {
  const { showAlert } = useAlert();
  const [configs, setConfigs] = useState<SEOConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<SEOConfig> | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/seo/admin/configs`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      showAlert("Failed to load SEO configurations.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig?.path || !editingConfig?.title) {
        showAlert("Path and Title are required.", "error");
        return;
    }

    setIsSaving(true);
    try {
      const method = editingConfig.id ? "PUT" : "POST";
      const url = editingConfig.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/seo/admin/configs/${editingConfig.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/seo/admin/configs`;

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingConfig)
      });

      if (!res.ok) throw new Error("Save failed");
      
      showAlert(editingConfig.id ? "SEO updated!" : "SEO configuration created!", "success");
      setIsModalOpen(false);
      fetchConfigs();
    } catch (error) {
      showAlert("Failed to save SEO configuration.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this SEO configuration?")) return;

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/seo/admin/configs/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      showAlert("SEO configuration deleted.", "success");
      fetchConfigs();
    } catch (error) {
      showAlert("Failed to delete.", "error");
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* ── Header Banner ── */}
      <header className="relative overflow-hidden rounded-2xl bg-[#fdf567] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-black/60 hover:text-black font-bold text-sm uppercase tracking-wider transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
              </Link>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black leading-none">
                SEO <span className="text-black/40">Engine</span>
              </h1>
              <p className="text-base text-black/70 font-medium max-w-xl">
                Manage meta tags, Open Graph data, and search engine visibility for every path on your website.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingConfig({ path: "/", title: "", description: "", keywords: "" });
                setIsModalOpen(true);
              }}
              className="h-14 px-8 bg-black text-white border-3 border-black font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-xl flex items-center gap-3"
            >
              <Plus className="w-6 h-6" />
              Add New Path
            </button>
          </div>
        </div>
      </header>

      {/* ── Search Bar ── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-black/40 group-focus-within:text-black transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by path or title..."
          className="w-full h-16 pl-14 pr-6 bg-white border-3 border-black rounded-2xl font-bold placeholder:text-black/20 focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── SEO Config List ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-black/20" />
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredConfigs.map((config) => (
            <div 
              key={config.id} 
              className="group border-3 border-black bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col"
            >
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 bg-[#c8d8ff] border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {config.path}
                    </span>
                    <h3 className="text-xl font-black truncate max-w-[200px] pt-1">{config.title}</h3>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingConfig(config);
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-[#fdf567] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(config.id)}
                      className="p-2 bg-[#ff90e8] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-black/60 font-medium line-clamp-3 leading-relaxed">
                  {config.description || "No description set."}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                   {config.keywords?.split(',').slice(0, 3).map((k, i) => (
                     <span key={i} className="text-[10px] font-bold bg-zinc-100 border border-black/10 px-2 py-0.5 rounded">
                        #{k.trim()}
                     </span>
                   ))}
                </div>
              </div>
              
              <div className="p-4 border-t-2 border-black bg-zinc-50 rounded-b-[13px] flex justify-between items-center">
                 <div className="flex gap-4">
                    <div className="flex items-center gap-1.5" title="Open Graph Ready">
                        <Share2 className={`w-4 h-4 ${config.og_title ? 'text-green-500' : 'text-zinc-300'}`} />
                    </div>
                    <div className="flex items-center gap-1.5" title="Canonical URL Set">
                        <Globe className={`w-4 h-4 ${config.canonical_url ? 'text-blue-500' : 'text-zinc-300'}`} />
                    </div>
                 </div>
                 <a 
                   href={config.path} 
                   target="_blank" 
                   className="text-xs font-black uppercase flex items-center gap-1 hover:underline"
                 >
                   View Page <ExternalLink className="w-3 h-3" />
                 </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-3 border-dashed border-black/20 rounded-3xl p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-zinc-50 border-3 border-black/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-black/10" />
          </div>
          <h3 className="text-2xl font-black text-black/20 uppercase tracking-tighter">No SEO Configs Found</h3>
          <p className="text-black/40 font-bold max-w-sm mx-auto">
            Get started by adding SEO metadata for your most important pages like Home, About, and Products.
          </p>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4be794] border-3 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {editingConfig?.id ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    {editingConfig?.id ? "Edit SEO Config" : "New SEO Config"}
                  </h2>
                  <p className="text-xs font-bold text-black/40">Configure metadata for {editingConfig?.path || "a path"}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 border-3 border-black rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Path
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="common-paths"
                      placeholder="/about"
                      className="w-full p-4 border-3 border-black rounded-xl font-bold bg-zinc-50 focus:bg-white focus:outline-none transition-all"
                      value={editingConfig?.path || ""}
                      onChange={e => setEditingConfig({ ...editingConfig, path: e.target.value })}
                      required
                    />
                    <datalist id="common-paths">
                      {COMMON_ROUTES.map(path => (
                        <option key={path} value={path} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Title
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 border-3 border-black rounded-xl font-bold bg-zinc-50 focus:bg-white focus:outline-none transition-all"
                    value={editingConfig?.title || ""}
                    onChange={e => setEditingConfig({ ...editingConfig, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest">Metadata Description</label>
                  <textarea
                    rows={3}
                    className="w-full p-4 border-3 border-black rounded-xl font-bold bg-zinc-50 focus:bg-white focus:outline-none transition-all resize-none"
                    value={editingConfig?.description || ""}
                    onChange={e => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="packaging, customization, printing"
                    className="w-full p-4 border-3 border-black rounded-xl font-bold bg-zinc-50 focus:bg-white focus:outline-none transition-all"
                    value={editingConfig?.keywords || ""}
                    onChange={e => setEditingConfig({ ...editingConfig, keywords: e.target.value })}
                  />
                </div>

                {/* ── OG/Social Section ── */}
                <div className="md:col-span-2 pt-4 border-t-2 border-black/10">
                   <h3 className="font-black uppercase tracking-widest text-black/40 text-xs mb-6 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Social Graph (OpenGraph)
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest">OG Title</label>
                        <input
                          type="text"
                          className="w-full p-3 border-3 border-black rounded-lg font-bold bg-zinc-50"
                          value={editingConfig?.og_title || ""}
                          onChange={e => setEditingConfig({ ...editingConfig, og_title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest">OG Image URL</label>
                        <input
                          type="text"
                          placeholder="https://example.com/og.png"
                          className="w-full p-3 border-3 border-black rounded-lg font-bold bg-zinc-50"
                          value={editingConfig?.og_image || ""}
                          onChange={e => setEditingConfig({ ...editingConfig, og_image: e.target.value })}
                        />
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t-4 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 border-3 border-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-10 py-3 bg-[#4be794] text-black border-3 border-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingConfig?.id ? "Update SEO" : "Create SEO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
