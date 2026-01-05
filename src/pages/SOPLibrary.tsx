import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/layout';
import { Search, Library, Clock, Loader2, AlertCircle, FileText, ArrowRight, Plus } from 'lucide-react';
import { useRAG, type SOPDocument, type SearchResult } from '../hooks';
import { DocumentModal } from '../components/DocumentModal';
import { DocumentFormModal } from '../components/DocumentFormModal';

const sopCategories = ['All', 'vendor', 'rider', 'customer_service'];
const categoryLabels: Record<string, string> = {
  'All': 'All Documents',
  'vendor': 'Vendor Ops',
  'rider': 'Rider Fleet',
  'customer_service': 'Customer Service',
};



export function SOPLibrary() {
  const { getDocuments, search, createDocument, updateDocument, deleteDocument, loading, error } = useRAG();

  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [selectedDocument, setSelectedDocument] = useState<SOPDocument | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<SOPDocument | null>(null);

  // Load documents
  const loadDocuments = useCallback(async () => {
    const docs = await getDocuments();
    setDocuments(docs);
  }, [getDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Debounced search
  const handleSearch = useCallback(async (query: string, department: string | null) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    const results = await search(query, department === 'All' ? null : department);
    setSearchResults(results);
    setIsSearching(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery, selectedCategory);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, handleSearch]);

  // Filter documents by category
  const filteredDocuments = documents.filter((doc) => {
    return selectedCategory === 'All' || doc.department === selectedCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handlers
  const handleViewDocument = (doc: SOPDocument) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setShowFormModal(true);
  };

  const handleEditDocument = (doc: SOPDocument) => {
    setEditingDocument(doc);
    setShowViewModal(false);
    setShowFormModal(true);
  };

  const handleSaveDocument = async (data: { title: string; department: string; description: string }) => {
    if (editingDocument) {
      const result = await updateDocument(editingDocument.id, data);
      if (result.success) {
        await loadDocuments();
        setShowFormModal(false);
      }
      return result;
    } else {
      const result = await createDocument(data.title, data.department, data.description);
      if (result.success) {
        await loadDocuments();
        setShowFormModal(false);
      }
      return result;
    }
  };

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      const result = await deleteDocument(selectedDocument.id);
      if (result.success) {
        await loadDocuments();
        setShowViewModal(false);
        setSelectedDocument(null);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="SOP Library" />

      <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-10">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-1 p-1 bg-slate-100/50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
            {sopCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 ${selectedCategory === category
                  ? 'bg-white dark:bg-[#111111] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                  : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search strokeWidth={1.5} className="h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-10 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-[13px] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleCreateDocument}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[13px] font-bold shadow-sm transition-all"
            >
              <Plus strokeWidth={1.5} className="w-4 h-4" />
              New Document
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle strokeWidth={1.5} className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && !hasSearched && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-400" />
            <p className="text-sm font-medium">Loading library...</p>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && searchQuery.trim() && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2">
                <Search strokeWidth={1.5} className="w-3.5 h-3.5 text-primary-500" />
                Search Results
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10 uppercase">
                  {searchResults.length} {searchResults.length === 1 ? 'found' : 'found'}
                </span>
              </h3>
            </div>

            {searchResults.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-100/30 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                <Search strokeWidth={1.5} className="w-10 h-10 text-slate-200 dark:text-white/5 mb-4" />
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">No matches found</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[12px] font-medium">Targeted search for "{searchQuery}" yielded no results.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-[#000000] rounded-xl border border-slate-200/60 dark:border-white/5 p-5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight border border-slate-200 dark:border-white/10">
                          {categoryLabels[result.department] || result.department}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-400/10 rounded-md border border-emerald-100 dark:border-emerald-400/20">
                          {Math.round(result.similarity * 100)}% match
                        </span>
                      </div>
                      <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">
                        {result.section_title}
                      </h4>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-4 tracking-tight">
                        <Library strokeWidth={1.5} className="w-3.5 h-3.5" />
                        <span>Source: {result.document_title}</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-600 dark:text-[#999999] leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] py-2.5 pr-2.5 rounded-r-lg italic">
                        "{result.content.slice(0, 300)}{result.content.length > 300 ? '...' : ''}"
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:border-primary-500/30 transition-all flex-shrink-0">
                      <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOP Documents grid */}
        {!hasSearched && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Recent Documents</h2>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white mt-1">Access the latest procedures</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleViewDocument(doc)}
                  className="flex flex-col bg-white dark:bg-[#000000] rounded-xl border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full relative overflow-hidden"
                >
                  {/* Decorative background accent */}
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center group-hover:border-primary-500/30 transition-all duration-300">
                        <FileText strokeWidth={1.5} className="w-5 h-5 text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors" />
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight border border-slate-200 dark:border-white/10">
                        {categoryLabels[doc.department] || doc.department}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-primary-500 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed">
                      {doc.description || 'Standard operating procedure documentation containing guidelines and protocols.'}
                    </p>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                      {formatDate(doc.updated_at || doc.created_at)}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 uppercase tracking-wider">
                      Read
                      <ArrowRight strokeWidth={1.5} className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDocuments.length === 0 && !loading && (
              <div className="text-center py-20 bg-slate-100/30 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <Library strokeWidth={1.5} className="w-12 h-12 text-slate-200 dark:text-white/5 mx-auto mb-4" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">No documents found</h3>
                <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto mb-6 leading-relaxed">
                  {selectedCategory === 'All'
                    ? 'No SOP documents have been uploaded yet. Start by creating your first document.'
                    : `No documents found in the ${categoryLabels[selectedCategory]} category.`}
                </p>
                <button
                  onClick={handleCreateDocument}
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[13px] font-bold shadow-sm transition-all flex items-center gap-2 mx-auto"
                >
                  <Plus strokeWidth={1.5} className="w-4 h-4" />
                  Create Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDocument(null);
          }}
          onEdit={() => handleEditDocument(selectedDocument)}
          onDelete={handleDeleteDocument}
        />
      )}

      {/* Create/Edit Document Modal */}
      {showFormModal && (
        <DocumentFormModal
          document={editingDocument}
          onClose={() => {
            setShowFormModal(false);
            setEditingDocument(null);
          }}
          onSave={handleSaveDocument}
        />
      )}
    </div>
  );
}
