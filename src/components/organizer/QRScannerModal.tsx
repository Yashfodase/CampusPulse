import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { eventService } from '../../services/api';
import { AttendanceStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Alert } from '../common/Alert';
import {
  Camera,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number | string;
  eventTitle: string;
  onAttendeeAdmitted?: (registrationId: number) => void;
}

interface VerifiedTicket {
  registration_id: number;
  registration_date: string;
  registration_status: string;
  attendance_status: AttendanceStatus;
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  event_id: number;
  event_title: string;
  event_date: string;
  event_venue: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onAttendeeAdmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  // Verification states
  const [loading, setLoading] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const [verifiedTicket, setVerifiedTicket] = useState<VerifiedTicket | null>(null);
  const [isMatchingEvent, setIsMatchingEvent] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-viewport';

  // Initialize camera scanner when modal opens and on 'camera' tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !verifiedTicket) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, verifiedTicket]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Frame error callback - ignore routine non-detections
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera initiation notice:', err);
      setCameraError('Camera access unavailable or permission denied. You can verify tickets using Pass ID or QR code.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore stop error
      }
      setIsScanning(false);
    }
  };

  const handleCodeDetected = async (code: string) => {
    stopCamera();
    await verifyCode(code);
  };

  const verifyCode = async (code: string) => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setAlertInfo(null);

      const res = await eventService.verifyTicket(eventId, { qr_data: code.trim() });
      if (res.success && res.ticket) {
        setVerifiedTicket(res.ticket);
        setIsMatchingEvent(res.isMatchingEvent);
        if (!res.isMatchingEvent) {
          setAlertInfo({
            type: 'warning',
            message: `Warning: This ticket is for "${res.ticket.event_title}", not this event!`,
          });
        } else if (res.ticket.attendance_status === 'present') {
          setAlertInfo({
            type: 'warning',
            message: 'Attendee has ALREADY been admitted previously!',
          });
        }
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Invalid ticket code or ticket not found.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyCode(manualCode);
    }
  };

  // Organizer clicks "YES" to confirm entry
  const handleConfirmAdmission = async () => {
    if (!verifiedTicket) return;
    try {
      setAdmitting(true);
      setAlertInfo(null);

      const res = await eventService.confirmCheckIn(eventId, verifiedTicket.registration_id);
      if (res.success) {
        setVerifiedTicket((prev) =>
          prev ? { ...prev, attendance_status: 'present' } : null
        );
        setAlertInfo({
          type: 'success',
          message: `Success! ${verifiedTicket.student_name} is admitted and marked Present in the event database.`,
        });

        if (onAttendeeAdmitted) {
          onAttendeeAdmitted(verifiedTicket.registration_id);
        }
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Check-in confirmation failed.',
      });
    } finally {
      setAdmitting(false);
    }
  };

  const handleResetForNext = () => {
    setVerifiedTicket(null);
    setManualCode('');
    setAlertInfo(null);
    if (activeTab === 'camera') {
      setTimeout(() => startCamera(), 200);
    }
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Entry Gate QR Scanner & Attendee Verification"
      maxWidth="md"
    >
      <div className="space-y-4">
        
        {/* Event Header info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Current Event Gate
          </div>
          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{eventTitle}</div>
        </div>

        {alertInfo && (
          <Alert type={alertInfo.type} message={alertInfo.message} />
        )}

        {/* Verification Result Card */}
        {verifiedTicket ? (
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 shadow-2xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {verifiedTicket.student_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {verifiedTicket.student_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Student ID #{verifiedTicket.student_id} · Pass #{verifiedTicket.registration_id}
                  </div>
                </div>
              </div>

              {isMatchingEvent ? (
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Valid Pass</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Mismatch</span>
                </span>
              )}
            </div>

            {/* Student & Event Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-semibold">EMAIL & CONTACT</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{verifiedTicket.student_email}</div>
                <div className="text-slate-500 dark:text-slate-400">{verifiedTicket.student_phone || 'No phone recorded'}</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-semibold">ATTENDANCE STATUS</div>
                <div className="font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-1 mt-0.5">
                  {verifiedTicket.attendance_status === 'present' ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Present (Admitted)</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">Unmarked (Waiting Entry)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              {isMatchingEvent && verifiedTicket.attendance_status !== 'present' && (
                <button
                  type="button"
                  onClick={handleConfirmAdmission}
                  disabled={admitting}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{admitting ? 'Admitting...' : 'Confirm Entry & Mark Present'}</span>
                </button>
              )}

              {verifiedTicket.attendance_status === 'present' && (
                <div className="w-full sm:flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Attendee Confirmed & Checked In!</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetForNext}
                className="w-full sm:w-auto py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Next Attendee</span>
              </button>
            </div>

          </div>
        ) : (
          /* Scanning Options View */
          <div className="space-y-4">
            
            {/* Tabs for Camera vs Manual Pass ID */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`py-2 px-3 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan with Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-2 px-3 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Enter Pass / QR Code</span>
              </button>
            </div>

            {activeTab === 'camera' ? (
              <div className="space-y-3">
                <div className="relative rounded-md overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 min-h-[260px] flex flex-col items-center justify-center">
                  <div id={qrRegionId} className="w-full max-w-[320px]" />

                  {cameraError && (
                    <div className="p-4 text-center text-xs text-slate-300 space-y-2">
                      <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                      <p>{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium"
                      >
                        Switch to Manual Code Entry
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Point the camera at the student's digital ticket or printed pass to automatically verify details.
                </p>
              </div>
            ) : (
              /* Manual Input View */
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Number, Registration ID, or Scanned QR String
                  </label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 1, 2, or paste scanned QR JSON payload"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Tip: Enter any Registration/Pass ID (e.g., 1 for HackFest attendee) to test verification instantly.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Verifying Ticket...' : 'Verify Attendee Details'}</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </Modal>
  );
};
