import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Users, 
  ClipboardCheck, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Batch, Trainee, AttendanceRecord, AppSettings, AttendanceStatus, PunchType, TrainingSession } from './types';
import { StorageAPI, getTodayDateString } from './utils/storage';
import { Navbar } from './components/Navbar';
import { AttendanceSheet } from './components/AttendanceSheet';
import { TraineeList } from './components/TraineeList';
import { ManageBatchesModal } from './components/ManageBatchesModal';
import { QRScannerModal } from './components/QRScannerModal';
import { TraineeQRBadgeModal } from './components/TraineeQRBadgeModal';
import { BatchBadgesModal } from './components/BatchBadgesModal';
import { ManualCheckInModal } from './components/ManualCheckInModal';

export default function App() {
  // Global State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>('');
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(StorageAPI.getSettings());

  // Navigation, Date and Session state (Minimalist 2-tab view)
  const [activeTab, setActiveTab] = useState<'attendance' | 'trainees'>('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedSession, setSelectedSession] = useState<TrainingSession>('Morning');

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isManageBatchesOpen, setIsManageBatchesOpen] = useState<boolean>(false);
  const [selectedTraineeForQR, setSelectedTraineeForQR] = useState<Trainee | null>(null);
  const [selectedBatchForBadges, setSelectedBatchForBadges] = useState<Batch | null>(null);
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState<boolean>(false);
  const [manualInitialTraineeId, setManualInitialTraineeId] = useState<string | undefined>(undefined);
  
  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const fileImportRef = useRef<HTMLInputElement | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Initial Load from LocalStorage
  useEffect(() => {
    const loadedBatches = StorageAPI.getBatches();
    const activeId = StorageAPI.getActiveBatchId();
    const loadedTrainees = StorageAPI.getTrainees();
    const loadedAttendance = StorageAPI.getAttendanceRecords();
    const loadedSettings = StorageAPI.getSettings();

    setBatches(loadedBatches);
    setActiveBatchId(activeId || (loadedBatches[0]?.id ?? ''));
    setTrainees(loadedTrainees);
    setAttendanceRecords(loadedAttendance);
    setSettings(loadedSettings);
  }, []);

  // Active Batch object
  const activeBatch = batches.find(b => b.id === activeBatchId) || batches[0];
  const activeBatchTrainees = trainees.filter(t => !activeBatch || t.batchId === activeBatch.id);

  // Batch handlers
  const handleCreateBatch = (batchData: Omit<Batch, 'id' | 'createdAt'>) => {
    const newBatch = StorageAPI.createBatch(batchData);
    setBatches(StorageAPI.getBatches());
    setActiveBatchId(newBatch.id);
    showToast(`Batch "${newBatch.title}" created!`);
  };

  const handleUpdateBatch = (batchId: string, updates: Partial<Batch>) => {
    const updated = StorageAPI.updateBatch(batchId, updates);
    setBatches(updated);
    showToast('Batch profile updated!');
  };

  const handleDeleteBatch = (batchId: string) => {
    const res = StorageAPI.deleteBatch(batchId);
    setBatches(res.batches);
    setTrainees(res.trainees);
    setAttendanceRecords(res.attendance);
    setActiveBatchId(StorageAPI.getActiveBatchId());
    showToast('Batch deleted.', 'info');
  };

  const handleSelectBatch = (id: string) => {
    setActiveBatchId(id);
    StorageAPI.setActiveBatchId(id);
  };

  // Trainee handlers
  const handleCreateTrainee = (traineeData: Omit<Trainee, 'id' | 'createdAt'>) => {
    const created = StorageAPI.createTrainee(traineeData);
    setTrainees(StorageAPI.getTrainees());
    showToast(`Trainee "${created.name}" enrolled!`);
  };

  const handleUpdateTrainee = (id: string, updates: Partial<Trainee>) => {
    const updated = StorageAPI.updateTrainee(id, updates);
    setTrainees(updated);
    showToast('Trainee profile updated!');
  };

  const handleDeleteTrainee = (id: string) => {
    const res = StorageAPI.deleteTrainee(id);
    setTrainees(res.trainees);
    setAttendanceRecords(res.attendance);
    showToast('Trainee removed.', 'info');
  };

  // Attendance Punch handlers
  const handleRecordPunch = (params: {
    batchId: string;
    traineeId: string;
    date: string;
    session?: TrainingSession;
    punchType?: PunchType | 'auto';
    timeValue?: string;
    status?: AttendanceStatus;
    scannedVia?: 'qr_scanner' | 'manual' | 'qr_image_upload';
    remarks?: string;
  }) => {
    const result = StorageAPI.recordPunch({
      ...params,
      session: params.session || selectedSession,
    });
    setAttendanceRecords(StorageAPI.getAttendanceRecords());
    return result;
  };

  // Mark all trainees in active batch as present
  const handleMarkAllPresent = (date: string, session: TrainingSession) => {
    if (!activeBatch) return;
    const { count, updatedList } = StorageAPI.markAllAsPresent({
      batchId: activeBatch.id,
      trainees: activeBatchTrainees,
      date,
      session,
    });
    setAttendanceRecords(updatedList);
    showToast(`Marked ${count} trainees as Present for ${session}!`, 'success');
  };

  const handleUpdateAttendanceStatus = (recordId: string, status: AttendanceStatus, remarks?: string) => {
    StorageAPI.updateAttendanceStatus(recordId, status, remarks);
    setAttendanceRecords(StorageAPI.getAttendanceRecords());
    showToast(`Status updated to ${status.toUpperCase()}`);
  };

  const handleDeleteAttendanceRecord = (recordId: string) => {
    StorageAPI.deleteAttendanceRecord(recordId);
    setAttendanceRecords(StorageAPI.getAttendanceRecords());
    showToast('Attendance record cleared.', 'info');
  };

  // Sound settings toggle
  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    StorageAPI.saveSettings(updated);
    showToast(updated.soundEnabled ? 'Scanner sound on' : 'Scanner muted', 'info');
  };

  // Export Full Data JSON backup
  const handleExportData = () => {
    const json = StorageAPI.exportFullDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Backup_${getTodayDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded!');
  };

  // Import Full Data JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageAPI.importFullDataJSON(content);
      if (res.success) {
        setBatches(StorageAPI.getBatches());
        setActiveBatchId(StorageAPI.getActiveBatchId());
        setTrainees(StorageAPI.getTrainees());
        setAttendanceRecords(StorageAPI.getAttendanceRecords());
        setSettings(StorageAPI.getSettings());
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleOpenManualModal = (traineeId?: string) => {
    setManualInitialTraineeId(traineeId);
    setIsManualCheckInOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* App Minimalist Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        batches={batches}
        activeBatchId={activeBatchId}
        onSelectBatch={handleSelectBatch}
        onOpenScanner={() => setIsScannerOpen(true)}
        settings={settings}
        onToggleSound={handleToggleSound}
        onExportData={handleExportData}
        onImportData={() => fileImportRef.current?.click()}
        onOpenManageBatches={() => setIsManageBatchesOpen(true)}
      />

      {/* Hidden file input for backup restore */}
      <input
        ref={fileImportRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportData}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-white border-slate-200 text-slate-700 shadow-slate-200/50'
              : 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-100/50'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-20 sm:pb-8">
        {activeTab === 'attendance' && (
          <AttendanceSheet
            batch={activeBatch}
            trainees={activeBatchTrainees}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            selectedSession={selectedSession}
            onChangeSession={setSelectedSession}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenManualCheckIn={handleOpenManualModal}
            onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
            onRecordPunch={handleRecordPunch}
            onMarkAllPresent={handleMarkAllPresent}
            onDeleteRecord={handleDeleteAttendanceRecord}
            onOpenBatchBadges={(batch) => setSelectedBatchForBadges(batch)}
          />
        )}

        {activeTab === 'trainees' && (
          <TraineeList
            trainees={trainees}
            batches={batches}
            activeBatchId={activeBatchId}
            onSelectTraineeQR={(trainee) => setSelectedTraineeForQR(trainee)}
            onCreateTrainee={handleCreateTrainee}
            onUpdateTrainee={handleUpdateTrainee}
            onDeleteTrainee={handleDeleteTrainee}
            onOpenBatchBadges={(batch) => setSelectedBatchForBadges(batch)}
            onQuickMarkAttendance={(trainee) => {
              if (activeBatch) {
                handleRecordPunch({
                  batchId: trainee.batchId || activeBatch.id,
                  traineeId: trainee.id,
                  date: selectedDate,
                  session: selectedSession,
                  punchType: 'time_in',
                  status: 'present',
                  scannedVia: 'manual',
                });
                showToast(`Recorded Time-In for ${trainee.name}!`);
              }
            }}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Live Camera QR Scanner */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        batches={batches}
        activeBatchId={activeBatchId}
        allTrainees={trainees}
        soundEnabled={settings.soundEnabled}
        hapticsEnabled={settings.hapticsEnabled}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        onChangeSession={setSelectedSession}
        onRecordPunch={handleRecordPunch}
      />

      {/* 2. Manage Batches Modal (Removed from permanent tabs, now accessible seamlessly) */}
      <ManageBatchesModal
        isOpen={isManageBatchesOpen}
        onClose={() => setIsManageBatchesOpen(false)}
        batches={batches}
        activeBatchId={activeBatchId}
        trainees={trainees}
        onCreateBatch={handleCreateBatch}
        onUpdateBatch={handleUpdateBatch}
        onDeleteBatch={handleDeleteBatch}
        onSetActiveBatch={handleSelectBatch}
      />

      {/* 3. Individual Trainee QR Digital Pass Modal */}
      <TraineeQRBadgeModal
        trainee={selectedTraineeForQR}
        batch={batches.find(b => b.id === selectedTraineeForQR?.batchId)}
        onClose={() => setSelectedTraineeForQR(null)}
      />

      {/* 4. Batch Badges Printable Sheet Modal */}
      {selectedBatchForBadges && (
        <BatchBadgesModal
          isOpen={!!selectedBatchForBadges}
          onClose={() => setSelectedBatchForBadges(null)}
          batch={selectedBatchForBadges}
          trainees={trainees.filter(t => t.batchId === selectedBatchForBadges.id)}
        />
      )}

      {/* 5. Manual Check-in Modal */}
      <ManualCheckInModal
        isOpen={isManualCheckInOpen}
        onClose={() => {
          setIsManualCheckInOpen(false);
          setManualInitialTraineeId(undefined);
        }}
        batch={activeBatch}
        trainees={activeBatchTrainees}
        selectedDate={selectedDate}
        selectedSession={selectedSession}
        onChangeSession={setSelectedSession}
        existingAttendance={attendanceRecords.filter(r => r.date === selectedDate)}
        initialTraineeId={manualInitialTraineeId}
        onRecordPunch={handleRecordPunch}
      />

      {/* Mobile Minimalist Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-1.5 sm:hidden flex items-center justify-around z-20 shadow-lg">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-4 rounded-lg cursor-pointer ${
            activeTab === 'attendance' ? 'text-indigo-600 font-bold' : 'text-slate-400'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Attendance</span>
        </button>

        {/* Center Floating QR Scan Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="-mt-5 w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 active:scale-95 transition-transform ring-4 ring-white cursor-pointer"
          title="Scan QR Code"
        >
          <QrCode className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          onClick={() => setActiveTab('trainees')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-4 rounded-lg cursor-pointer ${
            activeTab === 'trainees' ? 'text-indigo-600 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Trainees</span>
        </button>
      </div>
    </div>
  );
}
