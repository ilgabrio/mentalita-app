import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Trash2,
  Eye,
  X,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  FileText,
  Send
} from 'lucide-react';

const QuestionnaireAssignmentsManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState({});
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch assignments
      const assignmentsQuery = query(
        collection(db, 'questionnaireAssignments'),
        orderBy('assignedAt', 'desc')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch users data
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = {};
      usersSnapshot.docs.forEach(doc => {
        usersData[doc.id] = doc.data();
      });

      // Fetch templates data
      const templatesQuery = query(collection(db, 'questionnaireTemplates'));
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = {};
      templatesSnapshot.docs.forEach(doc => {
        templatesData[doc.id] = doc.data();
      });

      setAssignments(assignmentsData);
      setUsers(usersData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'questionnaireAssignments', assignmentId), {
        status: newStatus,
        updatedAt: new Date()
      });
      await fetchData();
      alert('Status aggiornato con successo');
    } catch (error) {
      console.error('Error updating assignment status:', error);
      alert('Errore nell\'aggiornamento dello status');
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa assegnazione?')) return;
    
    try {
      await deleteDoc(doc(db, 'questionnaireAssignments', assignmentId));
      await fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const user = users[assignment.userId];
    const template = templates[assignment.templateId];
    
    const matchesSearch = !searchTerm || 
      user?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.templateTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Send className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assegnazioni Questionari
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Gestisci le assegnazioni di questionari agli atleti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Assegnati</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {assignments.filter(a => a.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Completati</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {assignments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Scaduti</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {assignments.filter(a => a.status === 'expired').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <ClipboardList className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Totali</p>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {assignments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cerca per atleta o questionario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tutti gli stati</option>
            <option value="assigned">Assegnati</option>
            <option value="completed">Completati</option>
            <option value="expired">Scaduti</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna assegnazione trovata
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora assegnazioni di questionari'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Questionario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assegnato il
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssignments.map((assignment) => {
                  const user = users[assignment.userId];
                  const template = templates[assignment.templateId];
                  
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.displayName || user?.name || 'Nome non disponibile'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user?.email || 'Email non disponibile'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {assignment.templateTitle || template?.title || 'Template eliminato'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {template?.category || 'Categoria non specificata'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {getStatusIcon(assignment.status)}
                          <span className="capitalize">{assignment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {assignment.assignedAt?.toDate ? 
                          assignment.assignedAt.toDate().toLocaleDateString('it-IT') :
                          new Date(assignment.assignedAt).toLocaleDateString('it-IT')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2 justify-end">
                          {assignment.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                title="Marca come completato"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'expired')}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                title="Marca come scaduto"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            title="Elimina assegnazione"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireAssignmentsManager;