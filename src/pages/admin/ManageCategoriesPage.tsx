import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/api';
import { Category } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setAlertInfo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setAlertInfo(null);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setModalLoading(true);
      if (editingCategory) {
        const res = await categoryService.update(editingCategory.id, {
          name: name.trim(),
          description: description.trim(),
        });
        if (res.success) {
          setAlertInfo({ type: 'success', message: 'Category updated successfully.' });
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? res.category : c))
          );
          setModalOpen(false);
        }
      } else {
        const res = await categoryService.create({
          name: name.trim(),
          description: description.trim(),
        });
        if (res.success) {
          setAlertInfo({ type: 'success', message: 'New category created.' });
          setCategories((prev) => [...prev, { ...res.category, event_count: 0 }]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to save category.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await categoryService.delete(deleteTarget.id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Category removed successfully.' });
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to delete category.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Event Categories Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Organize college activities by discipline (Technical, Cultural, Sports, Hackathons, Workshops).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs self-start"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Category</span>
        </button>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="academic-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{cat.name}</h3>
                  <span className="text-xs text-slate-500 tabular-nums font-medium">
                    {cat.event_count || 0} events
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-[8px] transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robotics & Hardware"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the event theme..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-[10px] focus:outline-none focus:ring-[3px] focus:ring-indigo-600/20 focus:border-indigo-600 text-slate-900 shadow-xs transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs h-9"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="btn-primary text-xs h-9"
            >
              {modalLoading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              className="btn-secondary text-xs h-9"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="btn-danger text-xs h-9"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Category'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Are you sure you want to delete category <strong className="text-slate-900">{deleteTarget.name}</strong>?
            </p>
            <p className="text-slate-500">
              Note: Categories linked to active events cannot be deleted due to relational database integrity constraints.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};
