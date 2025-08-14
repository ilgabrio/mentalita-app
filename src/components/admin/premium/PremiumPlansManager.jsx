import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  Star, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Crown,
  DollarSign,
  Check,
  X,
  Save,
  Eye,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';

const PremiumPlansManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'active', label: 'Attivi' },
    { value: 'inactive', label: 'Inattivi' },
    { value: 'draft', label: 'Bozze' }
  ];

  const planTypes = [
    'basic',
    'premium',
    'pro',
    'elite',
    'enterprise'
  ];

  const billingPeriods = [
    { value: 'monthly', label: 'Mensile' },
    { value: 'yearly', label: 'Annuale' },
    { value: 'lifetime', label: 'A vita' }
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansQuery = query(
        collection(db, 'premiumPlans'),
        orderBy('monthlyPrice', 'asc')
      );
      
      const snapshot = await getDocs(plansQuery);
      const plansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching premium plans:', error);
      // Fallback query without orderBy
      try {
        const fallbackQuery = query(collection(db, 'premiumPlans'));
        const snapshot = await getDocs(fallbackQuery);
        const plansData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        setPlans(plansData.sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0)));
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        setPlans([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      lifetimePrice: 0,
      features: [],
      limitations: [],
      status: 'draft',
      isPopular: false,
      badge: '',
      color: 'blue',
      maxUsers: 1,
      supportLevel: 'basic',
      billingPeriods: ['monthly'],
      trialDays: 0,
      setupFee: 0,
      currency: 'EUR'
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      features: plan.features || [],
      limitations: plan.limitations || [],
      billingPeriods: plan.billingPeriods || ['monthly']
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const planData = {
        ...formData,
        updatedAt: new Date()
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'premiumPlans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'premiumPlans'), {
          ...planData,
          createdAt: new Date()
        });
      }

      await fetchPlans();
      setShowModal(false);
      setEditingPlan(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving premium plan:', error);
      alert('Errore nel salvataggio');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il piano "${plan.name}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'premiumPlans', plan.id));
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting premium plan:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const togglePlanStatus = async (plan) => {
    try {
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'premiumPlans', plan.id), {
        status: newStatus,
        updatedAt: new Date()
      });
      await fetchPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
      alert('Errore nell\'aggiornamento');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPlanColor = (color) => {
    switch (color) {
      case 'purple': return 'from-purple-500 to-pink-500';
      case 'blue': return 'from-blue-500 to-cyan-500';
      case 'green': return 'from-green-500 to-emerald-500';
      case 'orange': return 'from-orange-500 to-red-500';
      case 'gray': return 'from-gray-400 to-gray-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const handleFeatureAdd = (feature) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const handleFeatureRemove = (featureToRemove) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const handleLimitationAdd = (limitation) => {
    if (limitation && !formData.limitations.includes(limitation)) {
      setFormData(prev => ({
        ...prev,
        limitations: [...prev.limitations, limitation]
      }));
    }
  };

  const handleLimitationRemove = (limitationToRemove) => {
    setFormData(prev => ({
      ...prev,
      limitations: prev.limitations.filter(limitation => limitation !== limitationToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Piani Premium
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Caricamento piani...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 lg:mb-0">
          <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Piani Premium ({filteredPlans.length})
          </h2>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Piano</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome o descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none cursor-pointer min-w-40"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessun piano trovato
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Non ci sono ancora piani premium'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Crea il primo piano</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                plan.isPopular ? 'ring-2 ring-yellow-500' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute top-0 right-0 bg-gradient-to-r ${getPlanColor(plan.color)} text-white px-4 py-1 rounded-bl-lg text-sm font-semibold`}>
                  {plan.badge}
                </div>
              )}

              {/* Header */}
              <div className={`p-6 text-center bg-gradient-to-br ${getPlanColor(plan.color)} text-white`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm opacity-90 mb-4">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  {plan.monthlyPrice === 0 ? (
                    <div className="text-4xl font-bold">Gratis</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">
                        €{plan.monthlyPrice}
                        <span className="text-lg font-normal">/mese</span>
                      </div>
                      {plan.yearlyPrice > 0 && (
                        <div className="text-sm mt-1">
                          o €{plan.yearlyPrice}/anno
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Status */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                  {statusOptions.find(s => s.value === plan.status)?.label || plan.status}
                </span>
              </div>

              {/* Features */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {plan.features && plan.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.features && plan.features.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{plan.features.length - 5} altre funzionalità
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.maxUsers || 1}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Utenti</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.trialDays || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Giorni Prova</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="text-sm">Modifica</span>
                  </button>
                  <button
                    onClick={() => togglePlanStatus(plan)}
                    className="flex items-center justify-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                  >
                    {plan.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    className="flex items-center justify-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingPlan ? 'Modifica Piano Premium' : 'Nuovo Piano Premium'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome Piano *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrizione *
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prezzo Mensile (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.monthlyPrice || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prezzo Annuale (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.yearlyPrice || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, yearlyPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Badge
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="es: Più Popolare"
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stato
                    </label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      {statusOptions.slice(1).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Colore
                    </label>
                    <select
                      value={formData.color || 'blue'}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="blue">Blu</option>
                      <option value="purple">Viola</option>
                      <option value="green">Verde</option>
                      <option value="orange">Arancione</option>
                      <option value="gray">Grigio</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Utenti
                      </label>
                      <input
                        type="number"
                        value={formData.maxUsers || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Giorni di Prova
                      </label>
                      <input
                        type="number"
                        value={formData.trialDays || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        min="0"
                        max="365"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isPopular || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Piano popolare</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funzionalità
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.features && formData.features.map(feature => (
                    <span key={feature} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleFeatureRemove(feature)}
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Aggiungi una funzionalità e premi Enter..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const feature = e.target.value.trim();
                      if (feature) {
                        handleFeatureAdd(feature);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Limitations */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limitazioni
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.limitations && formData.limitations.map(limitation => (
                    <span key={limitation} className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {limitation}
                      <button
                        type="button"
                        onClick={() => handleLimitationRemove(limitation)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Aggiungi una limitazione e premi Enter..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const limitation = e.target.value.trim();
                      if (limitation) {
                        handleLimitationAdd(limitation);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading || !formData.name || !formData.description}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveLoading ? 'Salvataggio...' : 'Salva'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPlansManager;