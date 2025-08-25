import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Settings, 
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
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { backendApi } from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data for creating/editing prompts
  const [formData, setFormData] = useState(() => {
    const defaultGradient = { from: 'blue-500', to: 'blue-600' };
    return {
      key: '',
      title: '',
      description: '',
      prompt_template: '',
      icon: 'Brain',
      emoji: '🤖',
      category: 'general',
      gradient_from: defaultGradient.from,
      gradient_to: defaultGradient.to,
      max_tokens: 2000,
      estimated_time: 30.0
    };
  });

  const defaultCategories = [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'general', label: 'General', color: 'blue' },
    { value: 'meeting', label: 'Meeting', color: 'green' },
    { value: 'content', label: 'Content', color: 'purple' },
    { value: 'analysis', label: 'Analysis', color: 'yellow' },
    { value: 'productivity', label: 'Productivity', color: 'orange' }
  ];

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPrompts(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const response = await backendApi.prompts.getAll({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        active_only: false
      });
      setPrompts(response.data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      // toast.error('Failed to load prompts');
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const response = await backendApi.prompts.getCategories();
      setCategories(response.data.categories || defaultCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories(defaultCategories);
    }
  };

  // Reload prompts when category filter changes
  useEffect(() => {
    if (!loading) {
      loadPrompts();
    }
  }, [selectedCategory]);

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Validate form
      if (!formData.key || !formData.title || !formData.prompt_template) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.prompt_template.includes('{transcript}')) {
        toast.error('Prompt template must contain {transcript} placeholder');
        return;
      }

      // Create prompt via API
      await backendApi.prompts.create(formData);
      
      toast.success('Prompt created successfully!');
      setShowCreateModal(false);
      resetForm();
      
      // Reload data
      await loadPrompts();
      
    } catch (error) {
      console.error('Failed to create prompt:', error);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid prompt data');
      } else if (error.response?.status === 503) {
        toast.error('Database not available');
      } else {
        toast.error('Failed to create prompt');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPrompt = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (!editingPrompt) return;

      // Update prompt via API
      await backendApi.prompts.update(editingPrompt.id, formData);
      
      toast.success('Prompt updated successfully!');
      setShowEditModal(false);
      setEditingPrompt(null);
      resetForm();
      
      // Reload data
      await loadPrompts();
      
    } catch (error) {
      console.error('Failed to update prompt:', error);
      
      if (error.response?.status === 403) {
        toast.error('Cannot modify system prompts');
      } else if (error.response?.status === 404) {
        toast.error('Prompt not found');
      } else {
        toast.error('Failed to update prompt');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = async (prompt) => {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) return;
    
    try {
      await backendApi.prompts.delete(prompt.id);
      toast.success('Prompt deleted successfully!');
      
      // Reload data
      await loadPrompts();
      
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      
      if (error.response?.status === 403) {
        toast.error('Cannot delete system prompts');
      } else if (error.response?.status === 404) {
        toast.error('Prompt not found');
      } else {
        toast.error('Failed to delete prompt');
      }
    }
  };

  const handleToggleStatus = async (prompt) => {
    try {
      await backendApi.prompts.toggle(prompt.key);
      toast.success(`Prompt ${prompt.is_active ? 'deactivated' : 'activated'} successfully!`);
      
      // Reload prompts
      await loadPrompts();
      
    } catch (error) {
      console.error('Failed to toggle prompt status:', error);
      toast.error('Failed to update prompt status');
    }
  };

  const openEditModal = (prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      key: prompt.key,
      title: prompt.title,
      description: prompt.description,
      prompt_template: prompt.prompt_template,
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

  const resetForm = () => {
    const defaultGradient = getCategoryGradient('general');
    setFormData({
      key: '',
      title: '',
      description: '',
      prompt_template: '',
      icon: 'Brain',
      emoji: '🤖',
      category: 'general',
      gradient_from: defaultGradient.from,
      gradient_to: defaultGradient.to,
      max_tokens: 2000,
      estimated_time: 30.0
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-update gradient colors when category changes
      if (field === 'category') {
        const gradient = getCategoryGradient(value);
        newData.gradient_from = gradient.from;
        newData.gradient_to = gradient.to;
      }
      
      return newData;
    });
  };

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getIconComponent = (iconName) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Brain;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      general: 'blue',
      meeting: 'green', 
      content: 'purple',
      analysis: 'yellow',
      productivity: 'orange'
    };
    return categoryColors[category] || 'blue';
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      general: { from: 'blue-500', to: 'blue-600' },
      meeting: { from: 'green-500', to: 'green-600' },
      content: { from: 'purple-500', to: 'purple-600' },
      analysis: { from: 'yellow-500', to: 'yellow-600' },
      productivity: { from: 'orange-500', to: 'orange-600' }
    };
    return gradients[category] || gradients.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage analysis prompts and system settings</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadInitialData()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Prompt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredPrompts.length} of {prompts.length} prompts
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className={`p-4 bg-gradient-to-r from-${prompt.gradient_from || getCategoryGradient(prompt.category).from} to-${prompt.gradient_to || getCategoryGradient(prompt.category).to}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <span className="text-2xl">{prompt.emoji}</span>
                    </div>
                    <div className="text-white">
                      <h3 className="font-semibold">{prompt.title}</h3>
                      <p className="text-sm opacity-90">{prompt.key}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {prompt.is_system && (
                      <div className="p-1 bg-white/20 rounded">
                        <Settings className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`p-1 rounded ${prompt.is_active ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {prompt.is_active ? 
                        <Eye className="w-3 h-3 text-white" /> : 
                        <EyeOff className="w-3 h-3 text-white" />
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {prompt.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className={`px-2 py-1 rounded-full bg-${getCategoryColor(prompt.category)}-100 text-${getCategoryColor(prompt.category)}-800`}>
                    {prompt.category}
                  </span>
                  <span>{prompt.usage_count} uses</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(prompt)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(prompt)}
                      className={`p-2 transition-colors ${
                        prompt.is_active 
                          ? 'text-gray-400 hover:text-orange-600' 
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={prompt.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {prompt.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    {!prompt.is_system && (
                      <button
                        onClick={() => handleDeletePrompt(prompt)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    ~{prompt.estimated_time}s
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p>No prompts found matching your criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {showCreateModal ? 'Create New Prompt' : 'Edit Prompt'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingPrompt(null);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreatePrompt : handleEditPrompt} className="space-y-4">
                {/* Key and Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key* <span className="text-xs text-gray-500">(unique identifier)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => handleInputChange('key', e.target.value)}
                      placeholder="e.g., summary, action_items"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      required
                      disabled={showEditModal} // Can't change key when editing
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title*
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Display name for the prompt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of what this prompt does"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                {/* Prompt Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Template*
                    <span className="text-xs text-gray-500 ml-2">
                      (must include {'{transcript}'} placeholder)
                    </span>
                  </label>
                  <textarea
                    value={formData.prompt_template}
                    onChange={(e) => handleInputChange('prompt_template', e.target.value)}
                    placeholder="Enter your prompt template here. Use {transcript} where the transcript should be inserted."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                  {formData.prompt_template && !formData.prompt_template.includes('{transcript}') && (
                    <p className="text-red-500 text-xs mt-1">
                      ⚠️ Prompt template must contain {'{transcript}'} placeholder
                    </p>
                  )}
                </div>

                {/* Icon, Emoji, Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="Brain">Brain</option>
                      <option value="MessageSquare">MessageSquare</option>
                      <option value="FileText">FileText</option>
                      <option value="BarChart3">BarChart3</option>
                      <option value="Users">Users</option>
                      <option value="Calendar">Calendar</option>
                      <option value="HelpCircle">HelpCircle</option>
                      <option value="TrendingUp">TrendingUp</option>
                      <option value="Zap">Zap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => handleInputChange('emoji', e.target.value)}
                      placeholder="🤖"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      {categories.filter(cat => cat.value !== 'all').map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gradients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gradient From
                    </label>
                    <select
                      value={formData.gradient_from}
                      onChange={(e) => handleInputChange('gradient_from', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="cyan-500">Cyan 500</option>
                      <option value="blue-500">Blue 500</option>
                      <option value="purple-500">Purple 500</option>
                      <option value="green-500">Green 500</option>
                      <option value="yellow-500">Yellow 500</option>
                      <option value="red-500">Red 500</option>
                      <option value="orange-500">Orange 500</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gradient To
                    </label>
                    <select
                      value={formData.gradient_to}
                      onChange={(e) => handleInputChange('gradient_to', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="cyan-600">Cyan 600</option>
                      <option value="blue-600">Blue 600</option>
                      <option value="purple-600">Purple 600</option>
                      <option value="green-600">Green 600</option>
                      <option value="yellow-600">Yellow 600</option>
                      <option value="red-600">Red 600</option>
                      <option value="orange-600">Orange 600</option>
                    </select>
                  </div>
                </div>

                {/* Max Tokens and Estimated Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                      min="100"
                      max="8000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => handleInputChange('estimated_time', parseFloat(e.target.value))}
                      min="1"
                      max="300"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                  <div className={`p-3 rounded-lg bg-gradient-to-r from-${formData.gradient_from} to-${formData.gradient_to} text-white`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{formData.emoji}</span>
                      <div>
                        <h5 className="font-medium">{formData.title || 'Prompt Title'}</h5>
                        <p className="text-sm opacity-90">{formData.key || 'prompt_key'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingPrompt(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.key || !formData.title || !formData.prompt_template || !formData.prompt_template.includes('{transcript}')}
                    className="flex items-center space-x-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{showCreateModal ? 'Create Prompt' : 'Update Prompt'}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
