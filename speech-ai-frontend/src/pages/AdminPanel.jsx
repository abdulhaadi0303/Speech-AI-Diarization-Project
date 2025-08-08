import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Search, 
  Filter,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const AdminDashboard = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Form data for creating/editing prompts
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    description: '',
    prompt_template: '',
    icon: 'Brain',
    emoji: '🤖',
    category: 'general',
    gradient_from: 'cyan-500',
    gradient_to: 'cyan-600',
    max_tokens: 2000,
    estimated_time: 30.0
  });

  const categories = [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'meeting', label: 'Meeting', color: 'green' },
    { value: 'content', label: 'Content', color: 'purple' },
    { value: 'analysis', label: 'Analysis', color: 'yellow' },
    { value: 'productivity', label: 'Productivity', color: 'red' }
  ];

  const gradientOptions = [
    { from: 'cyan-500', to: 'cyan-600', name: 'Cyan' },
    { from: 'blue-500', to: 'blue-600', name: 'Blue' },
    { from: 'green-500', to: 'green-600', name: 'Green' },
    { from: 'yellow-500', to: 'yellow-600', name: 'Yellow' },
    { from: 'red-500', to: 'red-600', name: 'Red' },
    { from: 'purple-500', to: 'purple-600', name: 'Purple' },
    { from: 'pink-500', to: 'pink-600', name: 'Pink' },
    { from: 'gray-500', to: 'gray-600', name: 'Gray' }
  ];

  const popularIcons = [
    'Brain', 'FileText', 'BarChart3', 'Heart', 'Lightbulb', 'Calendar',
    'HelpCircle', 'CheckSquare', 'Users', 'MessageCircle', 'Target',
    'TrendingUp', 'Zap', 'Star', 'Bookmark', 'Clock'
  ];

  useEffect(() => {
    loadPrompts();
    loadAnalytics();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockPrompts = [
        {
          id: 1,
          key: 'summary',
          title: 'Conversation Summary',
          description: 'Generate a comprehensive summary of the conversation',
          icon: 'FileText',
          emoji: '📋',
          category: 'general',
          gradient_from: 'cyan-500',
          gradient_to: 'cyan-600',
          is_active: true,
          is_system: true,
          usage_count: 156,
          estimated_time: 25.0,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          key: 'action_items',
          title: 'Action Items & Tasks',
          description: 'Extract actionable tasks and decisions',
          icon: 'CheckSquare',
          emoji: '✅',
          category: 'productivity',
          gradient_from: 'green-500',
          gradient_to: 'green-600',
          is_active: true,
          is_system: true,
          usage_count: 89,
          estimated_time: 20.0,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 3,
          key: 'sentiment',
          title: 'Sentiment Analysis',
          description: 'Analyze emotional tone and sentiment',
          icon: 'Heart',
          emoji: '😊',
          category: 'analysis',
          gradient_from: 'pink-500',
          gradient_to: 'pink-600',
          is_active: false,
          is_system: false,
          usage_count: 23,
          estimated_time: 30.0,
          created_at: '2024-01-20T14:15:00Z'
        }
      ];
      setPrompts(mockPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Simulate analytics API call
      const mockAnalytics = {
        total_prompts: 6,
        active_prompts: 5,
        total_usage: 342,
        most_used: [
          { key: 'summary', title: 'Conversation Summary', usage_count: 156 },
          { key: 'action_items', title: 'Action Items', usage_count: 89 },
          { key: 'key_insights', title: 'Key Insights', usage_count: 67 }
        ],
        categories: {
          general: { count: 2, total_usage: 198 },
          productivity: { count: 2, total_usage: 156 },
          analysis: { count: 2, total_usage: 45 }
        }
      };
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form
      if (!formData.key || !formData.title || !formData.prompt_template) {
        alert('Please fill in all required fields');
        return;
      }

      if (!formData.prompt_template.includes('{transcript}')) {
        alert('Prompt template must contain {transcript} placeholder');
        return;
      }

      // Simulate API call
      console.log('Creating prompt:', formData);
      
      // Add to local state (in real app, refresh from API)
      const newPrompt = {
        id: Date.now(),
        ...formData,
        is_active: true,
        is_system: false,
        usage_count: 0,
        created_at: new Date().toISOString()
      };
      
      setPrompts([...prompts, newPrompt]);
      setShowCreateModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to create prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      console.log('Updating prompt:', editingPrompt.id, formData);
      
      // Update local state
      setPrompts(prompts.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, ...formData, updated_at: new Date().toISOString() }
          : p
      ));
      
      setShowEditModal(false);
      setEditingPrompt(null);
      resetForm();
      
    } catch (error) {
      console.error('Failed to update prompt:', error);
      alert('Failed to update prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (id) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    setLoading(true);
    try {
      // Simulate API call
      console.log('Deleting prompt:', id);
      setPrompts(prompts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    try {
      // Simulate API call
      setPrompts(prompts.map(p => 
        p.id === id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Failed to toggle prompt status:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      title: '',
      description: '',
      prompt_template: '',
      icon: 'Brain',
      emoji: '🤖',
      category: 'general',
      gradient_from: 'cyan-500',
      gradient_to: 'cyan-600',
      max_tokens: 2000,
      estimated_time: 30.0
    });
  };

  const openEditModal = (prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      key: prompt.key,
      title: prompt.title,
      description: prompt.description,
      prompt_template: prompt.prompt_template || '',
      icon: prompt.icon,
      emoji: prompt.emoji,
      category: prompt.category,
      gradient_from: prompt.gradient_from,
      gradient_to: prompt.gradient_to,
      max_tokens: prompt.max_tokens,
      estimated_time: prompt.estimated_time
    });
    setShowEditModal(true);
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const IconPreview = ({ iconName }) => {
    const Icon = LucideIcons[iconName] || LucideIcons.Brain;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Prompt Management</h1>
              <p className="text-gray-400">Manage analysis prompts and view usage analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Prompt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Usage Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400">{analytics.total_prompts}</div>
                <div className="text-sm text-gray-400">Total Prompts</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{analytics.active_prompts}</div>
                <div className="text-sm text-gray-400">Active Prompts</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{analytics.total_usage}</div>
                <div className="text-sm text-gray-400">Total Usage</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {Object.keys(analytics.categories).length}
                </div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Prompts */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Most Used Prompts</h3>
                <div className="space-y-2">
                  {analytics.most_used.map((prompt, index) => (
                    <div key={prompt.key} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-cyan-400 font-semibold">#{index + 1}</span>
                        <span className="text-white">{prompt.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>{prompt.usage_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Category Usage</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.categories).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-white capitalize">{category}</span>
                        <span className="text-gray-400">({data.count} prompts)</span>
                      </div>
                      <div className="text-gray-400">{data.total_usage} uses</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading prompts...</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No prompts found matching your criteria</p>
            </div>
          ) : (
            filteredPrompts.map(prompt => (
              <div key={prompt.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 bg-gradient-to-r from-${prompt.gradient_from} to-${prompt.gradient_to} rounded-lg`}>
                      <IconPreview iconName={prompt.icon} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {prompt.emoji} {prompt.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{prompt.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(prompt.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        prompt.is_active 
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                          : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                      }`}
                      title={prompt.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {prompt.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(prompt)}
                      className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      title="Edit Prompt"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!prompt.is_system && (
                      <button
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                        title="Delete Prompt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded border ${
                      categories.find(c => c.value === prompt.category)?.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      categories.find(c => c.value === prompt.category)?.color === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      categories.find(c => c.value === prompt.category)?.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      categories.find(c => c.value === prompt.category)?.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {prompt.category}
                    </span>
                    {prompt.is_system && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                        System
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500">
                    <span>{prompt.usage_count} uses</span>
                    <span>~{prompt.estimated_time}s</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Prompt Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Create New Prompt</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePrompt} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prompt Key * <span className="text-xs text-gray-500">(unique identifier)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="e.g., custom_analysis"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="e.g., Custom Analysis"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none"
                    placeholder="Brief description of what this prompt does"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt Template * <span className="text-xs text-gray-500">(must include {'{transcript}'})</span>
                  </label>
                  <textarea
                    value={formData.prompt_template}
                    onChange={(e) => setFormData({...formData, prompt_template: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-32 resize-none"
                    placeholder="Analyze the following transcript: {transcript}

Please provide..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {popularIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <span>Preview:</span>
                      <IconPreview iconName={formData.icon} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="🤖"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color Gradient</label>
                    <select
                      value={`${formData.gradient_from}-${formData.gradient_to}`}
                      onChange={(e) => {
                        const [from, to] = e.target.value.split('-');
                        setFormData({...formData, gradient_from: from, gradient_to: to});
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {gradientOptions.map(gradient => (
                        <option key={gradient.name} value={`${gradient.from}-${gradient.to}`}>
                          {gradient.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <div className={`h-8 rounded bg-gradient-to-r from-${formData.gradient_from} to-${formData.gradient_to}`}></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Time (seconds)</label>
                    <input
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({...formData, estimated_time: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({...formData, max_tokens: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    min="100"
                    max="8000"
                    step="100"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Prompt Modal */}
        {showEditModal && editingPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Edit Prompt: {editingPrompt.title}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editingPrompt.is_system && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">
                    This is a system prompt. Some fields cannot be modified.
                  </span>
                </div>
              )}

              <form onSubmit={handleEditPrompt} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prompt Key {editingPrompt.is_system && <span className="text-xs text-gray-500">(read-only)</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({...formData, key: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      disabled={editingPrompt.is_system}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt Template {editingPrompt.is_system && <span className="text-xs text-gray-500">(read-only)</span>}
                  </label>
                  <textarea
                    value={formData.prompt_template}
                    onChange={(e) => setFormData({...formData, prompt_template: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-32 resize-none"
                    disabled={editingPrompt.is_system}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {popularIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <span>Preview:</span>
                      <IconPreview iconName={formData.icon} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color Gradient</label>
                    <select
                      value={`${formData.gradient_from}-${formData.gradient_to}`}
                      onChange={(e) => {
                        const [from, to] = e.target.value.split('-');
                        setFormData({...formData, gradient_from: from, gradient_to: to});
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {gradientOptions.map(gradient => (
                        <option key={gradient.name} value={`${gradient.from}-${gradient.to}`}>
                          {gradient.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <div className={`h-8 rounded bg-gradient-to-r from-${formData.gradient_from} to-${formData.gradient_to}`}></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Time (seconds)</label>
                    <input
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({...formData, estimated_time: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({...formData, max_tokens: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    min="100"
                    max="8000"
                    step="100"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;