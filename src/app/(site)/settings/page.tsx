"use client";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { UserPlus, Users, ShieldCheck, Lock, GitCompare, FileCog, Wrench, Globe, Image as ImageIcon, Plus, Trash2, Edit3, ChevronDown, Calendar, Building2, Tag, DollarSign, Check, X, Save } from "lucide-react";
import { HydrationSafe } from "@/components/ui/HydrationSafe";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


// Types for our dynamic configuration entities
type FiscalYear = {
  id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Ward = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

type ProgramType = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

type FundingSource = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

// Modal component for adding/editing entities
function ConfigModal({ 
  isOpen, 
  onClose, 
  title, 
  fields, 
  onSubmit, 
  initialValues = {}, 
  isEdit = false 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  fields: {name: string; label: string; type: string}[]; 
  onSubmit: (data: any) => void; 
  initialValues?: any; 
  isEdit?: boolean;
}) {
  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                {field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] || false}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Confirmation modal for delete operations
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  
  // State for dynamic configuration entities
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  
  // State for inline add form
  const [showAddFiscalYearForm, setShowAddFiscalYearForm] = useState(false);
  const [newFiscalYear, setNewFiscalYear] = useState({ year: "", isActive: false });
  
  // State for modals
  const [fiscalYearModal, setFiscalYearModal] = useState(false);
  const [wardModal, setWardModal] = useState(false);
  const [programTypeModal, setProgramTypeModal] = useState(false);
  const [fundingSourceModal, setFundingSourceModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  
  // State for inline add form
  const [showAddWardForm, setShowAddWardForm] = useState(false);
  const [newWard, setNewWard] = useState({ name: "", code: "" });
  const [showAddProgramTypeForm, setShowAddProgramTypeForm] = useState(false);
  const [newProgramType, setNewProgramType] = useState({ name: "", code: "" });
  const [showAddFundingSourceForm, setShowAddFundingSourceForm] = useState(false);
  const [newFundingSource, setNewFundingSource] = useState({ name: "", code: "" });
  
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState('');
  const [deleteId, setDeleteId] = useState('');
  
  // State for inline editing
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingProgramType, setEditingProgramType] = useState<ProgramType | null>(null);
  const [editingFundingSource, setEditingFundingSource] = useState<FundingSource | null>(null);
  
  // State for inline delete confirmation
  const [deletingFiscalYear, setDeletingFiscalYear] = useState<string | null>(null);
  const [deletingWard, setDeletingWard] = useState<string | null>(null);
  const [deletingProgramType, setDeletingProgramType] = useState<string | null>(null);
  const [deletingFundingSource, setDeletingFundingSource] = useState<string | null>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchFiscalYears();
    fetchWards();
    fetchProgramTypes();
    fetchFundingSources();
  }, []);
  
  // Fetch functions
  const fetchFiscalYears = async () => {
    try {
      const response = await fetch('/api/fiscyears');
      if (response.ok) {
        const data = await response.json();
        setFiscalYears(data.fiscalYears || []);
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      toast.error('Failed to load fiscal years');
    }
  };
  
  const fetchWards = async () => {
    try {
      const response = await fetch('/api/wards');
      if (response.ok) {
        const data = await response.json();
        setWards(data.wards || []);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      toast.error('Failed to load wards');
    }
  };
  
  const fetchProgramTypes = async () => {
    try {
      const response = await fetch('/api/programtypes');
      if (response.ok) {
        const data = await response.json();
        setProgramTypes(data.programTypes || []);
      }
    } catch (error) {
      console.error('Error fetching program types:', error);
      toast.error('Failed to load program types');
    }
  };
  
  const fetchFundingSources = async () => {
    try {
      const response = await fetch('/api/fundsources');
      if (response.ok) {
        const data = await response.json();
        setFundingSources(data.fundingSources || []);
      }
    } catch (error) {
      console.error('Error fetching funding sources:', error);
      toast.error('Failed to load funding sources');
    }
  };
  
  // CRUD operations
  const handleAddFiscalYear = async (data: any) => {
    try {
      // Validate input
      if (!data.year.trim()) {
        toast.error('Fiscal year is required');
        return;
      }
      
      const response = await fetch('/api/fiscyears', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Fiscal year added successfully');
        setShowAddFiscalYearForm(false);
        setNewFiscalYear({ year: "", isActive: false });
        fetchFiscalYears();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add fiscal year');
      }
    } catch (error) {
      console.error('Error adding fiscal year:', error);
      toast.error('Failed to add fiscal year');
    }
  };
  
  const handleUpdateFiscalYear = async (data: any) => {
    try {
      // Validate input
      if (!data.year.trim()) {
        toast.error('Fiscal year is required');
        return;
      }
      
      const response = await fetch('/api/fiscyears', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Fiscal year updated successfully');
        setEditingFiscalYear(null);
        fetchFiscalYears();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update fiscal year');
      }
    } catch (error) {
      console.error('Error updating fiscal year:', error);
      toast.error('Failed to update fiscal year');
    }
  };
  
  const handleDeleteFiscalYear = async (id: string) => {
    try {
      const response = await fetch(`/api/fiscyears?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Fiscal year deleted successfully');
        fetchFiscalYears();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete fiscal year');
      }
    } catch (error) {
      console.error('Error deleting fiscal year:', error);
      toast.error('Failed to delete fiscal year');
    }
  };
  
  const handleAddWard = async (data: any) => {
    try {
      // Validate input
      if (!data.name.trim() || !data.code.trim()) {
        toast.error('Ward name and code are required');
        return;
      }
      
      const response = await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Ward added successfully');
        setShowAddWardForm(false);
        setNewWard({ name: "", code: "" });
        fetchWards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add ward');
      }
    } catch (error) {
      console.error('Error adding ward:', error);
      toast.error('Failed to add ward');
    }
  };
  
  const handleUpdateWard = async (data: any) => {
    try {
      // Validate input
      if (!data.name.trim() || !data.code.trim()) {
        toast.error('Ward name and code are required');
        return;
      }
      
      const response = await fetch('/api/wards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Ward updated successfully');
        setEditingWard(null);
        fetchWards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update ward');
      }
    } catch (error) {
      console.error('Error updating ward:', error);
      toast.error('Failed to update ward');
    }
  };
  
  const handleDeleteWard = async (id: string) => {
    try {
      const response = await fetch(`/api/wards?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Ward deleted successfully');
        fetchWards();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete ward');
      }
    } catch (error) {
      console.error('Error deleting ward:', error);
      toast.error('Failed to delete ward');
    }
  };
  
  const handleAddProgramType = async (data: any) => {
    try {
      // Validate input
      if (!data.name.trim() || !data.code.trim()) {
        toast.error('Program type name and code are required');
        return;
      }
      
      const response = await fetch('/api/programtypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Program type added successfully');
        setShowAddProgramTypeForm(false);
        setNewProgramType({ name: "", code: "" });
        fetchProgramTypes();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add program type');
      }
    } catch (error) {
      console.error('Error adding program type:', error);
      toast.error('Failed to add program type');
    }
  };
  
  const handleUpdateProgramType = async (data: any) => {
    try {
      // Validate input
      if (!data.name.trim() || !data.code.trim()) {
        toast.error('Program type name and code are required');
        return;
      }
      
      const response = await fetch('/api/programtypes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Program type updated successfully');
        setEditingProgramType(null);
        fetchProgramTypes();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update program type');
      }
    } catch (error) {
      console.error('Error updating program type:', error);
      toast.error('Failed to update program type');
    }
  };
  
  const handleDeleteProgramType = async (id: string) => {
    try {
      const response = await fetch(`/api/programtypes?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Program type deleted successfully');
        fetchProgramTypes();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete program type');
      }
    } catch (error) {
      console.error('Error deleting program type:', error);
      toast.error('Failed to delete program type');
    }
  };
  
  const handleAddFundingSource = async (data: any) => {
    try {
      const response = await fetch('/api/fundsources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Funding source added successfully');
        setFundingSourceModal(false);
        fetchFundingSources();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add funding source');
      }
    } catch (error) {
      console.error('Error adding funding source:', error);
      toast.error('Failed to add funding source');
    }
  };
  
  const handleUpdateFundingSource = async (data: any) => {
    try {
      // Validate input
      if (!data.name.trim() || !data.code.trim()) {
        toast.error('Funding source name and code are required');
        return;
      }
      
      const response = await fetch('/api/fundsources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Funding source updated successfully');
        setEditingFundingSource(null);
        fetchFundingSources();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update funding source');
      }
    } catch (error) {
      console.error('Error updating funding source:', error);
      toast.error('Failed to update funding source');
    }
  };
  
  const handleDeleteFundingSource = async (id: string) => {
    try {
      const response = await fetch(`/api/fundsources?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Funding source deleted successfully');
        fetchFundingSources();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete funding source');
      }
    } catch (error) {
      console.error('Error deleting funding source:', error);
      toast.error('Failed to delete funding source');
    }
  };
  
  // Helper functions for modals
  const openAddModal = (type: string) => {
    setEditMode(false);
    setCurrentItem(null);
    
    switch (type) {
      case 'fiscalYear':
        setFiscalYearModal(true);
        break;
      case 'ward':
        setWardModal(true);
        break;
      case 'programType':
        setProgramTypeModal(true);
        break;
      case 'fundingSource':
        setFundingSourceModal(true);
        break;
    }
  };
  
  const openEditModal = (type: string, item: any) => {
    setEditMode(true);
    setCurrentItem(item);
    
    switch (type) {
      case 'fiscalYear':
        setFiscalYearModal(true);
        break;
      case 'ward':
        setWardModal(true);
        break;
      case 'programType':
        setProgramTypeModal(true);
        break;
      case 'fundingSource':
        setFundingSourceModal(true);
        break;
    }
  };
  
  const openDeleteModal = (type: string, id: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteModal(true);
  };
  
  // Helper functions for inline delete
  const confirmDelete = (type: string, id: string) => {
    switch (type) {
      case 'fiscalYear':
        setDeletingFiscalYear(id);
        break;
      case 'ward':
        setDeletingWard(id);
        break;
      case 'programType':
        setDeletingProgramType(id);
        break;
      case 'fundingSource':
        setDeletingFundingSource(id);
        break;
    }
  };
  
  const cancelDelete = () => {
    setDeletingFiscalYear(null);
    setDeletingWard(null);
    setDeletingProgramType(null);
    setDeletingFundingSource(null);
  };
  
  const handleDelete = () => {
    switch (deleteType) {
      case 'fiscalYear':
        handleDeleteFiscalYear(deleteId);
        break;
      case 'ward':
        handleDeleteWard(deleteId);
        break;
      case 'programType':
        handleDeleteProgramType(deleteId);
        break;
      case 'fundingSource':
        handleDeleteFundingSource(deleteId);
        break;
    }
  };
  
  const handleSubmit = (type: string, data: any) => {
    if (editMode) {
      switch (type) {
        case 'fiscalYear':
          handleUpdateFiscalYear(data);
          break;
        case 'ward':
          handleUpdateWard(data);
          break;
        case 'programType':
          handleUpdateProgramType(data);
          break;
        case 'fundingSource':
          handleUpdateFundingSource(data);
          break;
      }
    } else {
      switch (type) {
        case 'fiscalYear':
          handleAddFiscalYear(data);
          break;
        case 'ward':
          handleAddWard(data);
          break;
        case 'programType':
          handleAddProgramType(data);
          break;
        case 'fundingSource':
          handleAddFundingSource(data);
          break;
      }
    }
  };
  
  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* 1. User & Role Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" /> User & Role Management</div>
            <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs text-white"><UserPlus className="h-3 w-3" /> Add User</motion.button>
          </div>
          <div className="p-4">
            <div className="mb-3 rounded-xl border">
              {[{name: "Alex Parker", role: "Admin"},{name: "Sam Kim", role: "Ward Secretary"},{name: "Riya Mehta", role: "Planning Officer"},{name: "CAO Office", role: "CAO"}].map((u) => (
                <div key={u.name} className="flex items-center justify-between border-b p-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">Role: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="rounded-lg border px-2 py-1"><Edit3 className="mr-1 inline h-3 w-3" /> Edit</button>
                    <button className="rounded-lg border px-2 py-1 text-rose-600"><Trash2 className="mr-1 inline h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Assign Role</div>
                <div className="rounded-xl border p-3 text-xs">
                  <ul className="space-y-2">
                    <li><strong>CAO</strong>: status change, approvals, edit powers</li>
                    <li><strong>Admin/IT Officer</strong>: manage programs, user access</li>
                    <li><strong>Ward Secretary</strong>: committee docs, monitoring, payments</li>
                    <li><strong>Planning Officer</strong>: approvals, contracts, monitoring</li>
                    <li><strong>Technical Head</strong>: estimations, verify docs</li>
                  </ul>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Ward-level Access Control</div>
                <div className="rounded-xl border p-3 text-xs">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" /> Restrict users to their ward's programs</label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Workflow Configurations */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><GitCompare className="h-4 w-4" /> Workflow Configurations</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4">
            <div>
              <div className="mb-1 text-xs text-gray-500">Approval Flow</div>
              <div className="rounded-xl border p-3 text-sm">
                Ward Secretary → Planning Officer → CAO
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {["Program","Payments","Contracts"].map((module) => (
                <div key={module} className="rounded-xl border p-3 text-xs">
                  <div className="mb-2 font-medium">{module} Approvers</div>
                  <div className="flex items-center gap-2">
                    <select className="w-full rounded-xl border bg-white px-3 py-2"><option>Ward Secretary</option><option>Planning Officer</option><option>CAO</option></select>
                    <select className="w-full rounded-xl border bg-white px-3 py-2"><option>Planning Officer</option><option>CAO</option></select>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2"><input type="checkbox" /> Re-upload allowed on rejection</label>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 3. Status Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" /> Status Management (CAO-only)</div>
          </div>
          <div className="p-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="mb-2 text-xs text-gray-500">Change Program Status</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <select className="rounded-xl border bg-white px-3 py-2 text-sm"><option>Active</option><option>Completed</option><option>Archived</option></select>
                <input placeholder="Reason (required)" className="rounded-xl border px-3 py-2 text-sm" />
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white">Update Status</motion.button>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs"><input type="checkbox" /> Lock completed files (read-only)</label>
            </div>
          </div>
        </Card>

        {/* 4. Document & Upload Settings */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><FileCog className="h-4 w-4" /> Document & Upload Settings</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Allowed file types</div>
                <input defaultValue="PDF, JPG, PNG, MP4" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              </div>
              <div>
                <div className="text-xs text-gray-500">File size limit (MB)</div>
                <input defaultValue="200" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked /> Allow multiple uploads per field</label>
            <div>
              <div className="text-xs text-gray-500">Mandatory uploads per step</div>
              <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                {["Program","Verification","Payments","Contracts"].map((s) => (
                  <label key={s} className="inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
                    <span>{s}</span>
                    <select className="rounded-lg border bg-white px-2 py-1 text-xs"><option>Optional</option><option>Required</option></select>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 5. System Config / Admin Tools */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Wrench className="h-4 w-4" /> System Config / Admin Tools</div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Audit Log Access</div>
              <button className="rounded-lg border px-3 py-2 text-xs">Open Logs</button>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Backup & Restore</div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-lg border px-3 py-2">Download Backup</button>
                <button className="rounded-lg border px-3 py-2">Restore</button>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Print/Export Settings</div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-lg border px-3 py-2">PDF</button>
                <button className="rounded-lg border px-3 py-2">Excel</button>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 text-xs font-semibold text-gray-500">Fiscal Year & Budget Cycle</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input placeholder="Current Fiscal Year" className="rounded-xl border px-3 py-2 text-sm" />
                <select className="rounded-xl border bg-white px-3 py-2 text-sm"><option>Annual</option><option>Quarterly</option></select>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Dynamic Configuration Management */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4" /> Dynamic Configuration</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            
            {/* Fiscal Years */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Fiscal Years</span>
                </div>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddFiscalYearForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>
              <div className="space-y-2">
                {showAddFiscalYearForm && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <Input 
                          type="text" 
                          placeholder="Enter fiscal year (e.g. 2023/24)" 
                          className="h-8 text-sm"
                          value={newFiscalYear.year}
                          onChange={(e) => setNewFiscalYear({...newFiscalYear, year: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Switch 
                            id="fiscal-year-active" 
                            checked={newFiscalYear.isActive}
                            onCheckedChange={(checked) => setNewFiscalYear({...newFiscalYear, isActive: checked})}
                          />
                          <Label htmlFor="fiscal-year-active" className="text-xs">Active</Label>
                        </div>
                        <button 
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          onClick={() => handleAddFiscalYear(newFiscalYear)}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          onClick={() => {
                            setShowAddFiscalYearForm(false);
                            setNewFiscalYear({ year: "", isActive: false });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {fiscalYears.length === 0 && !showAddFiscalYearForm ? (
                  <div className="text-center py-3 text-sm text-gray-500">No fiscal years found</div>
                ) : (
                  fiscalYears.map((fy) => (
                    <div key={fy.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingFiscalYear === fy.id ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm text-rose-600">Are you sure you want to delete this fiscal year?</div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-rose-100 rounded text-rose-600"
                              onClick={() => {
                                handleDeleteFiscalYear(fy.id);
                                setDeletingFiscalYear(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={cancelDelete}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingFiscalYear && editingFiscalYear.id === fy.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input 
                              type="text" 
                              placeholder="Fiscal year" 
                              className="h-8 text-sm"
                              value={editingFiscalYear.year}
                              onChange={(e) => setEditingFiscalYear({...editingFiscalYear, year: e.target.value})}
                            />
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${fy.id}`} className="text-xs">Active</Label>
                              <Switch 
                                id={`active-${fy.id}`}
                                checked={editingFiscalYear.isActive}
                                onCheckedChange={(checked) => setEditingFiscalYear({...editingFiscalYear, isActive: checked})}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              onClick={() => handleUpdateFiscalYear(editingFiscalYear)}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={() => setEditingFiscalYear(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{fy.year}</span>
                            {fy.isActive && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                <Check className="mr-1 h-3 w-3" /> Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingFiscalYear(fy)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-rose-600"
                              onClick={() => confirmDelete('fiscalYear', fy.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Wards */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Wards</span>
                </div>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddWardForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>
              <div className="space-y-2">
                {showAddWardForm && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input 
                          type="text" 
                          placeholder="Ward code (e.g. W1)" 
                          className="h-8 text-sm"
                          value={newWard.code}
                          onChange={(e) => setNewWard({...newWard, code: e.target.value})}
                        />
                        <Input 
                          type="text" 
                          placeholder="Ward name" 
                          className="h-8 text-sm"
                          value={newWard.name}
                          onChange={(e) => setNewWard({...newWard, name: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          onClick={() => handleAddWard(newWard)}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          onClick={() => {
                            setShowAddWardForm(false);
                            setNewWard({ name: "", code: "" });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {wards.length === 0 && !showAddWardForm ? (
                  <div className="text-center py-3 text-sm text-gray-500">No wards found</div>
                ) : (
                  wards.map((ward) => (
                    <div key={ward.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingWard === ward.id ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm text-rose-600">Are you sure you want to delete this ward?</div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-rose-100 rounded text-rose-600"
                              onClick={() => {
                                handleDeleteWard(ward.id);
                                setDeletingWard(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={cancelDelete}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingWard && editingWard.id === ward.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input 
                              type="text" 
                              placeholder="Ward code" 
                              className="h-8 text-sm"
                              value={editingWard.code}
                              onChange={(e) => setEditingWard({...editingWard, code: e.target.value})}
                            />
                            <Input 
                              type="text" 
                              placeholder="Ward name" 
                              className="h-8 text-sm"
                              value={editingWard.name}
                              onChange={(e) => setEditingWard({...editingWard, name: e.target.value})}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              onClick={() => handleUpdateWard(editingWard)}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={() => setEditingWard(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                          <div>
                            <span className="text-sm font-medium">Ward {ward.code}</span>
                            <span className="text-xs text-gray-500 ml-2">- {ward.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingWard(ward)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-rose-600"
                              onClick={() => confirmDelete('ward', ward.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Program Types */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Program Types</span>
                </div>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddProgramTypeForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>
              <div className="space-y-2">
                {showAddProgramTypeForm && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input 
                          type="text" 
                          placeholder="Program type code" 
                          className="h-8 text-sm"
                          value={newProgramType.code}
                          onChange={(e) => setNewProgramType({...newProgramType, code: e.target.value})}
                        />
                        <Input 
                          type="text" 
                          placeholder="Program type name" 
                          className="h-8 text-sm"
                          value={newProgramType.name}
                          onChange={(e) => setNewProgramType({...newProgramType, name: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          onClick={() => handleAddProgramType(newProgramType)}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          onClick={() => {
                            setShowAddProgramTypeForm(false);
                            setNewProgramType({ name: "", code: "" });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {programTypes.length === 0 && !showAddProgramTypeForm ? (
                  <div className="text-center py-3 text-sm text-gray-500">No program types found</div>
                ) : (
                  programTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingProgramType === type.id ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm text-rose-600">Are you sure you want to delete this program type?</div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-rose-100 rounded text-rose-600"
                              onClick={() => {
                                handleDeleteProgramType(type.id);
                                setDeletingProgramType(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={cancelDelete}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingProgramType && editingProgramType.id === type.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input 
                              type="text" 
                              placeholder="Program type code" 
                              className="h-8 text-sm"
                              value={editingProgramType.code}
                              onChange={(e) => setEditingProgramType({...editingProgramType, code: e.target.value})}
                            />
                            <Input 
                              type="text" 
                              placeholder="Program type name" 
                              className="h-8 text-sm"
                              value={editingProgramType.name}
                              onChange={(e) => setEditingProgramType({...editingProgramType, name: e.target.value})}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              onClick={() => handleUpdateProgramType(editingProgramType)}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={() => setEditingProgramType(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                          <div>
                            <span className="text-sm font-medium">{type.name}</span>
                            {type.code && <span className="text-xs text-gray-500 ml-2">- {type.code}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingProgramType(type)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-rose-600"
                              onClick={() => confirmDelete('programType', type.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Funding Sources */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Funding Sources</span>
                </div>
                <motion.button 
                  whileHover={{ y: -1 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  onClick={() => setShowAddFundingSourceForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add
                </motion.button>
              </div>
              <div className="space-y-2">
                {showAddFundingSourceForm && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input 
                          type="text" 
                          placeholder="Funding source code" 
                          className="h-8 text-sm"
                          value={newFundingSource.code}
                          onChange={(e) => setNewFundingSource({...newFundingSource, code: e.target.value})}
                        />
                        <Input 
                          type="text" 
                          placeholder="Funding source name" 
                          className="h-8 text-sm"
                          value={newFundingSource.name}
                          onChange={(e) => setNewFundingSource({...newFundingSource, name: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          onClick={() => handleAddFundingSource(newFundingSource)}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          onClick={() => {
                            setShowAddFundingSourceForm(false);
                            setNewFundingSource({ name: "", code: "" });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {fundingSources.length === 0 && !showAddFundingSourceForm ? (
                  <div className="text-center py-3 text-sm text-gray-500">No funding sources found</div>
                ) : (
                  fundingSources.map((source) => (
                    <div key={source.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      {deletingFundingSource === source.id ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm text-rose-600">Are you sure you want to delete this funding source?</div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-rose-100 rounded text-rose-600"
                              onClick={() => {
                                handleDeleteFundingSource(source.id);
                                setDeletingFundingSource(null);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={cancelDelete}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : editingFundingSource && editingFundingSource.id === source.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input 
                              type="text" 
                              placeholder="Funding source code" 
                              className="h-8 text-sm"
                              value={editingFundingSource.code}
                              onChange={(e) => setEditingFundingSource({...editingFundingSource, code: e.target.value})}
                            />
                            <Input 
                              type="text" 
                              placeholder="Funding source name" 
                              className="h-8 text-sm"
                              value={editingFundingSource.name}
                              onChange={(e) => setEditingFundingSource({...editingFundingSource, name: e.target.value})}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              onClick={() => handleUpdateFundingSource(editingFundingSource)}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              onClick={() => setEditingFundingSource(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                          <div>
                            <span className="text-sm font-medium">{source.name}</span>
                            {source.code && <span className="text-xs text-gray-500 ml-2">- {source.code}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingFundingSource(source)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded text-rose-600"
                              onClick={() => confirmDelete('fundingSource', source.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>

          </div>
        </Card>

        {/* 7. Miscellaneous */}
        <Card>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4" /> Miscellaneous</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Language</div>
                <select className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"><option>English</option><option>Nepali</option></select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Theme / Branding</div>
                <div className="flex items-center gap-2">
                  <input placeholder="Header text" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
                  <button className="mt-1 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><ImageIcon className="h-4 w-4" /> Logo</button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
