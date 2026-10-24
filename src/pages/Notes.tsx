import React, { useState, useMemo } from 'react';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { UserNote } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Tag,
  Link as LinkIcon,
  Search,
} from 'lucide-react';

export const Notes: React.FC = () => {
  const { db } = useGameData();
  const { notes, addNote, updateNote, removeNote } = usePersonalData();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [linkedType, setLinkedType] = useState<string>('none');
  const [linkedId, setLinkedId] = useState<string>('');

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.linkedEntity && n.linkedEntity.name?.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Pinned notes always first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, search]);

  const handleOpenAdd = (note?: UserNote) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setIsPinned(note.isPinned);
      setLinkedType(note.linkedEntity ? note.linkedEntity.type : 'none');
      setLinkedId(note.linkedEntity ? note.linkedEntity.id : '');
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setLinkedType('none');
      setLinkedId('');
    }
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!title.trim() || !content.trim()) return;

    let linkedEntity = undefined;
    if (linkedType !== 'none' && linkedId) {
      let entityName = linkedId;
      if (linkedType === 'enemy') entityName = db?.enemiesMap.get(linkedId)?.name || linkedId;
      if (linkedType === 'item') entityName = db?.itemsMap.get(linkedId)?.name || linkedId;
      if (linkedType === 'location') entityName = db?.locationsMap.get(linkedId)?.name || linkedId;

      linkedEntity = {
        type: linkedType as any,
        id: linkedId,
        name: entityName,
      };
    }

    if (editingNote) {
      updateNote(editingNote.id, {
        title,
        content,
        isPinned,
        linkedEntity,
      });
    } else {
      addNote({
        title,
        content,
        isPinned,
        linkedEntity,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            Sổ tay ghi chép sinh tồn (Notes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Lưu trữ chiến thuật, tọa độ hầm ngầm, mẹo wall-trick và ghi chú gắn liền với từng quái vật, địa điểm.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenAdd()}
        >
          Tạo ghi chú mới
        </Button>
      </div>

      {/* Search Bar */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm ghi chú theo tiêu đề, nội dung hoặc thực thể liên kết..."
      />

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="text-center py-12 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
          <p className="text-sm">Chưa có ghi chú nào phù hợp.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => handleOpenAdd()}
          >
            Tạo ghi chú đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              highlight={note.isPinned ? 'amber' : 'none'}
              className="flex flex-col justify-between p-4 space-y-3 relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {note.isPinned && (
                      <Pin className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    <h3 className="font-bold text-slate-100 text-sm sm:text-base truncate">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenAdd(note)}
                      className="p-1 text-slate-500 hover:text-slate-200"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="p-1 text-slate-500 hover:text-red-400"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Linked Entity Tag */}
                {note.linkedEntity && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Badge variant="charcoal" size="sm">
                      <LinkIcon className="w-3 h-3 text-amber-500" />
                      {note.linkedEntity.type}: {note.linkedEntity.name || note.linkedEntity.id}
                    </Badge>
                  </div>
                )}

                {/* Content preview */}
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {note.content}
                </p>
              </div>

              {/* Timestamp */}
              <div className="pt-2 border-t border-charcoal-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Cập nhật: {new Date(note.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Note */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú sinh tồn mới'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Tiêu đề ghi chú:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Mẹo hạ Frenzied Giant không tốn súng..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          {/* Linked Entity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Liên kết với loại thực thể:
              </label>
              <select
                value={linkedType}
                onChange={(e) => {
                  setLinkedType(e.target.value);
                  setLinkedId('');
                }}
                className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="none">Không liên kết</option>
                <option value="enemy">Xác sống / Trùm (Enemy)</option>
                <option value="item">Vũ khí / Trang bị (Item)</option>
                <option value="location">Địa điểm (Location)</option>
              </select>
            </div>

            {linkedType !== 'none' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Chọn mục tiêu:
                </label>
                <select
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- Chọn một đối tượng --</option>
                  {linkedType === 'enemy' &&
                    db?.enemies.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  {linkedType === 'item' &&
                    db?.items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  {linkedType === 'location' &&
                    db?.locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Nội dung ghi chú:
            </label>
            <textarea
              rows={6}
              placeholder="Nhập nội dung chiến thuật hoặc mẹo sinh tồn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-charcoal-700 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-300 font-medium">Ghim lên đầu trang (Pin to top)</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!title.trim() || !content.trim()}
              onClick={handleSaveNote}
            >
              Lưu ghi chú
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
