import React, { useRef, useState } from 'react';
import {
  Archive,
  Download,
  ExternalLink,
  Moon,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { ThemeMode, useTheme } from '../context/ThemeContext';
import { INITIAL_REFERENCE_SOURCES, storageService } from '../services/storageService';
import { ReferenceSource } from '../types';
import { Button, IconButton } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Field, Textarea, TextInput } from '../components/common/Field';
import { FormModal } from '../components/common/FormModal';
import { Modal } from '../components/common/Modal';
import { Callout, PageHeader, Section, Stat, StatGrid } from '../components/common/Layout';

const THEMES: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
  { id: 'dark', label: 'Tối', icon: <Moon /> },
  { id: 'light', label: 'Sáng', icon: <Sun /> },
];

const download = (content: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const today = () => new Date().toISOString().slice(0, 10);

type Notice = { tone: 'ok' | 'danger'; text: string };

export const Settings: React.FC = () => {
  const { db, reload } = useGameData();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sources, setSources] = useState<ReferenceSource[]>(() => storageService.getReferenceSources());
  const [editingSource, setEditingSource] = useState<ReferenceSource | null>(null);

  const [importPreview, setImportPreview] = useState<ReturnType<typeof storageService.validateAndImportWiki>['preview'] | null>(null);
  const [importData, setImportData] = useState<unknown>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const [notice, setNotice] = useState<Notice | null>(null);

  const say = (text: string, tone: Notice['tone'] = 'ok') => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const refreshSources = () => setSources(storageService.getReferenceSources());

  const saveSource = () => {
    if (!editingSource?.name.trim() || !editingSource.url.trim()) return;
    storageService.saveReferenceSource({ ...editingSource, name: editingSource.name.trim(), url: editingSource.url.trim() });
    refreshSources();
    setEditingSource(null);
    say('Đã lưu nguồn tham khảo.');
  };

  const exportWiki = () => {
    if (!db) return;
    try {
      const json = storageService.exportMergedWikiData({
        items: db.items,
        enemies: db.enemies,
        recipes: db.recipes,
        locations: db.locations,
        quests: db.quests,
        locationStructures: db.locationStructures,
        pointSystems: db.pointSystems,
        enemyPointRules: db.enemyPointRules,
      });
      download(json, `ldoe_wiki_${today()}.json`);
      say('Đã xuất dữ liệu bách khoa.');
    } catch (err: any) {
      say(`Không xuất được tệp: ${err?.message ?? 'lỗi không xác định'}`, 'danger');
    }
  };

  const legacyJson = storageService.exportLegacyPersonalData();

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const res = storageService.validateAndImportWiki(String(reader.result ?? ''));
      setImportError(res.valid ? null : res.error ?? 'Tệp không hợp lệ.');
      setImportPreview(res.valid ? res.preview : null);
      setImportData(res.valid ? res.parsedData : null);
      setIsImportOpen(true);
    };
    reader.onerror = () => say('Không đọc được tệp đã chọn.', 'danger');
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importData) return;
    storageService.applyImportedOverrides(importData, importMode);
    await reload();
    setIsImportOpen(false);
    say('Đã nhập dữ liệu bách khoa.');
  };

  const counts: Array<[string, number]> = db
    ? [
        ['Vật phẩm', db.items.length],
        ['Quái vật', db.enemies.length],
        ['Công thức', db.recipes.length],
        ['Địa điểm', db.locations.length],
        ['Nhiệm vụ', db.quests.length],
        ['Công trình', db.locationStructures.length],
      ]
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Cài đặt & dữ liệu" description="Giao diện, sao lưu dữ liệu và các nguồn tham khảo." icon={<SettingsIcon />} />

      {notice && (
        <div className="mb-4" role="status">
          <Callout tone={notice.tone}>{notice.text}</Callout>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <Section title="Giao diện">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={theme === t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors [&>svg]:h-5 [&>svg]:w-5 ${
                    theme === t.id ? 'border-accent-solid bg-accent-soft text-accent' : 'border-line text-muted hover:text-fg'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </Section>
        </Card>

        <Card className="space-y-5">
          <Section title="Dữ liệu bách khoa" description="Chỉnh sửa của bạn được lưu trong trình duyệt này, không ghi đè dữ liệu gốc.">
            {counts.length > 0 && (
              <StatGrid cols={3}>
                {counts.map(([label, value]) => (
                  <Stat key={label} label={label} value={value} />
                ))}
              </StatGrid>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" icon={<Download />} onClick={exportWiki}>
                Xuất JSON
              </Button>
              <Button variant="secondary" icon={<Upload />} onClick={() => fileInputRef.current?.click()}>
                Nhập JSON
              </Button>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileChosen} className="hidden" />
            </div>
          </Section>

        </Card>

        <Card>
          <Section
            title="Nguồn tham khảo"
            description="Trang web đáng tin cậy để đối chiếu thông số."
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus />}
                onClick={() => setEditingSource({ id: `source_${Date.now()}`, name: '', url: '', description: '' })}
              >
                Thêm
              </Button>
            }
          >
            <ul className="divide-y divide-line rounded-lg border border-line">
              {sources.map((src) => (
                <li key={src.id} className="flex items-start justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent"
                    >
                      {src.name}
                      <ExternalLink className="h-3.5 w-3.5 text-faint" />
                    </a>
                    {src.description && <p className="mt-0.5 text-xs text-muted">{src.description}</p>}
                  </div>
                  <div className="flex shrink-0">
                    <IconButton label="Sửa nguồn" onClick={() => setEditingSource({ ...src })}>
                      <Pencil />
                    </IconButton>
                    <IconButton
                      label="Xóa nguồn"
                      className="hover:bg-danger-soft hover:text-danger"
                      onClick={() => {
                        storageService.deleteReferenceSource(src.id);
                        refreshSources();
                      }}
                    >
                      <Trash2 />
                    </IconButton>
                  </div>
                </li>
              ))}
              {sources.length === 0 && (
                <li className="flex items-center justify-between gap-3 px-3 py-3 text-sm text-muted">
                  Danh sách trống.
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      INITIAL_REFERENCE_SOURCES.forEach((s) => storageService.saveReferenceSource(s));
                      refreshSources();
                    }}
                  >
                    Khôi phục mặc định
                  </Button>
                </li>
              )}
            </ul>
          </Section>
        </Card>

        {legacyJson && (
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Archive className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold">Dữ liệu cá nhân từ phiên bản cũ</h3>
                  <p className="text-sm text-muted">Kho đồ, mục tiêu và ghi chú cũ vẫn còn trong trình duyệt. Tải về để lưu giữ.</p>
                </div>
              </div>
              <Button
                variant="secondary"
                icon={<Download />}
                onClick={() => {
                  download(legacyJson, `ldoe_legacy_backup_${today()}.json`);
                  say('Đã tải bản sao lưu dữ liệu cũ.');
                }}
              >
                Tải sao lưu
              </Button>
            </div>
          </Card>
        )}
      </div>

      <FormModal
        isOpen={Boolean(editingSource)}
        title={editingSource && sources.some((s) => s.id === editingSource.id) ? 'Sửa nguồn' : 'Thêm nguồn'}
        onClose={() => setEditingSource(null)}
        onSave={saveSource}
        saveDisabled={!editingSource?.name.trim() || !editingSource?.url.trim()}
        maxWidth="md"
      >
        {editingSource && (
          <>
            <Field label="Tên nguồn">
              <TextInput
                autoFocus
                placeholder="Kefir Devblog"
                value={editingSource.name}
                onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
              />
            </Field>
            <Field label="Địa chỉ URL">
              <TextInput
                type="url"
                placeholder="https://..."
                value={editingSource.url}
                onChange={(e) => setEditingSource({ ...editingSource, url: e.target.value })}
              />
            </Field>
            <Field label="Mô tả">
              <Textarea
                rows={2}
                value={editingSource.description ?? ''}
                onChange={(e) => setEditingSource({ ...editingSource, description: e.target.value })}
              />
            </Field>
          </>
        )}
      </FormModal>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Nhập dữ liệu bách khoa"
        maxWidth="md"
        footer={
          importError ? (
            <Button variant="secondary" onClick={() => setIsImportOpen(false)}>
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsImportOpen(false)}>
                Hủy
              </Button>
              <Button variant={importMode === 'replace' ? 'danger' : 'primary'} onClick={confirmImport}>
                {importMode === 'replace' ? 'Ghi đè và nhập' : 'Hợp nhất và nhập'}
              </Button>
            </>
          )
        }
      >
        {importError ? (
          <Callout tone="danger">{importError}</Callout>
        ) : (
          <div className="space-y-4">
            {importPreview && (
              <StatGrid cols={3}>
                <Stat label="Vật phẩm" value={importPreview.itemCount} />
                <Stat label="Quái vật" value={importPreview.enemyCount} />
                <Stat label="Công thức" value={importPreview.recipeCount} />
                <Stat label="Địa điểm" value={importPreview.locationCount} />
                <Stat label="Nhiệm vụ" value={importPreview.questCount} />
                <Stat label="Công trình" value={importPreview.structureCount} />
                <Stat label="Sự kiện điểm" value={importPreview.pointSystemCount} />
                <Stat label="Quy tắc điểm" value={importPreview.enemyPointRuleCount} />
              </StatGrid>
            )}
            <div role="radiogroup" aria-label="Cách nhập" className="grid grid-cols-2 gap-2">
              {(
                [
                  ['merge', 'Hợp nhất', 'Giữ chỉnh sửa hiện có, thêm hoặc cập nhật mục trong tệp.'],
                  ['replace', 'Ghi đè', 'Xóa chỉnh sửa hiện có và chỉ dùng nội dung của tệp.'],
                ] as const
              ).map(([mode, label, hint]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={importMode === mode}
                  onClick={() => setImportMode(mode)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    importMode === mode
                      ? mode === 'replace'
                        ? 'border-danger bg-danger-soft'
                        : 'border-accent-solid bg-accent-soft'
                      : 'border-line hover:bg-subtle'
                  }`}
                >
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
