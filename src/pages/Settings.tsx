import React, { useState, useRef } from 'react';
import { storageService } from '../services/storageService';
import { usePersonalData } from '../hooks/usePersonalData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { data, refresh } = usePersonalData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importData, setImportData] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Export data as downloadable JSON
  const handleExport = () => {
    try {
      const jsonStr = storageService.exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ldoe_companion_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Đã xuất thành công tệp sao lưu dữ liệu cá nhân!');
    } catch (err: any) {
      alert('Lỗi xuất tệp: ' + err?.message);
    }
  };

  // Trigger file browser for Import
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  // Handle uploaded JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = storageService.validateImportData(content);

      if (!validation.valid) {
        setImportError(validation.error || 'Tệp sao lưu không hợp lệ.');
        setImportPreview(null);
        setImportData(null);
      } else {
        setImportError(null);
        setImportPreview(validation.preview);
        setImportData(validation.parsedData);
      }
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    // Reset input so same file can be picked again if needed
    e.target.value = '';
  };

  // Confirm and apply import
  const handleConfirmImport = () => {
    if (!importData) return;
    storageService.applyImport(importData);
    setIsImportModalOpen(false);
    refresh();
    showNotification('Khôi phục dữ liệu từ tệp sao lưu thành công!');
  };

  // Confirm Reset to Defaults
  const handleConfirmReset = () => {
    storageService.resetToDefaults();
    refresh();
    showNotification('Đã đặt lại dữ liệu cá nhân về mặc định ban đầu.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-6 h-6 text-amber-500" />
          Sao lưu & Quản lý dữ liệu (Backup & Settings)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Xuất tệp sao lưu JSON để di chuyển giữa các thiết bị hoặc khôi phục dữ liệu tiến độ cá nhân.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-100 text-base">Xuất bản sao lưu (Export JSON)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tải về toàn bộ kho đồ, danh sách vũ khí cá nhân, tiến độ nhiệm vụ, mục tiêu và ghi chú dưới định dạng tệp JSON.
            </p>

            <div className="mt-4 p-3 rounded bg-charcoal-950 border border-charcoal-800 text-xs font-mono space-y-1 text-slate-400">
              <div>Vật phẩm trong kho: <b className="text-slate-200">{Object.keys(data.inventory).length}</b></div>
              <div>Vũ khí theo dõi độ bền: <b className="text-slate-200">{data.weaponInstances.length}</b></div>
              <div>Mục tiêu cá nhân: <b className="text-slate-200">{data.goals.length}</b></div>
              <div>Ghi chú chiến thuật: <b className="text-slate-200">{data.notes.length}</b></div>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            className="w-full justify-center"
          >
            Tải về tệp sao lưu (.json)
          </Button>
        </Card>

        {/* Import Card */}
        <Card className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-100 text-base">Khôi phục dữ liệu (Import JSON)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhập tệp sao lưu từ máy tính để khôi phục tiến độ. Hệ thống sẽ kiểm tra tính hợp lệ và hiển thị xem trước trước khi ghi đè.
            </p>

            <div className="mt-4 p-3 rounded bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 space-y-1">
              <span className="font-bold block">🛡️ An toàn dữ liệu:</span>
              Tệp import sẽ được phân tích cú pháp và kiểm tra cấu trúc schema trước khi bạn xác nhận.
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<Upload className="w-4 h-4" />}
            onClick={handleTriggerImport}
            className="w-full justify-center"
          >
            Chọn tệp để khôi phục (.json)
          </Button>
        </Card>
      </div>

      {/* Danger Zone: Reset to Defaults */}
      <Card highlight="hazard" className="p-5 border-red-900/50 bg-red-950/10 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-red-400 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> VÙNG NGUY HIỂM: ĐẶT LẠI DỮ LIỆU
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ kho đồ, mục tiêu cá nhân, ghi chú và đặt lại dữ liệu mẫu ban đầu.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={() => setIsResetConfirmOpen(true)}
          >
            Đặt lại mặc định
          </Button>
        </div>
      </Card>

      {/* Import Preview Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Xem trước tệp sao lưu"
        maxWidth="md"
      >
        <div className="space-y-4">
          {importError ? (
            <div className="p-3 bg-red-950/60 border border-red-700 rounded-lg text-red-300 text-xs font-mono">
              ⚠️ {importError}
            </div>
          ) : (
            importPreview && (
              <div className="space-y-3 text-xs font-mono">
                <p className="text-slate-300 font-sans">
                  Tệp sao lưu hợp lệ. Vui lòng kiểm tra các mục dữ liệu sẽ được khôi phục:
                </p>

                <div className="bg-charcoal-950 p-3 rounded-lg border border-charcoal-800 space-y-1.5 text-slate-300">
                  {importPreview.exportedAt && (
                    <div className="text-slate-500">
                      Thời điểm xuất: {new Date(importPreview.exportedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                  <div>• Vật phẩm kho: <b className="text-amber-400">{importPreview.inventoryCount}</b> loại</div>
                  <div>• Vũ khí cá nhân: <b className="text-amber-400">{importPreview.weaponCount}</b> khẩu</div>
                  <div>• Mục tiêu cá nhân: <b className="text-amber-400">{importPreview.goalCount}</b> mục</div>
                  <div>• Ghi chú chiến thuật: <b className="text-amber-400">{importPreview.noteCount}</b> ghi chú</div>
                  <div>• Nhiệm vụ đã lưu: <b className="text-amber-400">{importPreview.questCount}</b> nhiệm vụ</div>
                </div>

                <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-300 text-[11px] font-sans">
                  ⚠️ Lưu ý: Hành động này sẽ thay thế dữ liệu cá nhân hiện tại của bạn trên trình duyệt này bằng nội dung từ tệp sao lưu.
                </div>
              </div>
            )
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              Hủy
            </Button>
            {!importError && (
              <Button variant="primary" onClick={handleConfirmImport}>
                Xác nhận khôi phục
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Xác nhận đặt lại toàn bộ dữ liệu?"
        message="Hành động này sẽ xóa sạch kho đồ, mục tiêu và ghi chú của bạn để trở về dữ liệu mặc định. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Đồng ý xóa & đặt lại"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
