import { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/layout';
import { Search, BookOpen, Clock, Loader2, AlertCircle, FileText, ArrowRight, Plus } from 'lucide-react';
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

const categoryStyle: Record<string, { bg: string, text: string, border: string }> = {
  'vendor': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'rider': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'customer_service': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
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

      <div className="p-6 max-w-[1600px] mx-auto animate-fade-in space-y-8">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            {sopCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedCategory === category
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search policies & procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
            <button onClick={handleCreateDocument} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" />
              New Document
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-primary-500" />
                Search Results
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {searchResults.length} found
                </span>
              </h3>
            </div>

            {searchResults.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No matches found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Targeted search for "{searchQuery}" yielded no results.</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${categoryStyle[result.department]?.bg || 'bg-slate-100'
                          } ${categoryStyle[result.department]?.text || 'text-slate-600'} ${categoryStyle[result.department]?.border || 'border-slate-200'}`}>
                          {categoryLabels[result.department] || result.department}
                        </span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          {Math.round(result.similarity * 100)}% match
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">
                        {result.section_title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Source: {result.document_title}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 py-2 pr-2 rounded-r-lg">
                        "{result.content.slice(0, 300)}{result.content.length > 300 ? '...' : ''}"
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 text-slate-400 group-hover:text-primary-500 transition-all flex-shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOP Documents grid */}
        {!hasSearched && (
          <div className="animate-fade-in">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Documents</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Access the latest standard operating procedures.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleViewDocument(doc)}
                  className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${categoryStyle[doc.department]?.bg || 'bg-slate-100'
                        } ${categoryStyle[doc.department]?.text || 'text-slate-600'} ${categoryStyle[doc.department]?.border || 'border-slate-200'}`}>
                        {categoryLabels[doc.department] || doc.department}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {doc.description || 'Standard operating procedure documentation containing guidelines and protocols.'}
                    </p>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(doc.updated_at || doc.created_at)}
                    </div>

                    <button className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      Read Document
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredDocuments.length === 0 && !loading && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                  <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No documents found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  {selectedCategory === 'All'
                    ? 'No SOP documents have been uploaded yet.'
                    : `No documents found in the ${categoryLabels[selectedCategory]} category.`}
                </p>
                <button onClick={handleCreateDocument} className="btn-primary">
                  <Plus className="w-4 h-4" />
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
