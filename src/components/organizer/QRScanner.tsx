import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { eventService } from '../../services/api';
import { Alert } from '../common/Alert';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UserCheck,
  SwitchCamera,
  History,
  QrCode,
} from 'lucide-react';

export interface CheckInResult {
  registrationId: number;
  studentName: string;
  studentEmail?: string;
  eventTitle?: string;
  timestamp: string;
  status: 'admitted' | 'already_present' | 'invalid';
  message: string;
}

interface QRScannerProps {
  eventId?: number | string;
  eventTitle?: string;
  autoCheckIn?: boolean;
  onCheckInSuccess?: (result: CheckInResult) => void;
  onCheckInError?: (error: string) => void;
  className?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  eventId,
  eventTitle,
  autoCheckIn = true,
  onCheckInSuccess,
  onCheckInError,
  className = '',
}) => {
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan & Check-in States
  const [processing, setProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [scanHistory, setScanHistory] = useState<CheckInResult[]>([]);
  const [manualCode, setManualCode] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const regionElementId = 'qr-camera-viewport';
  const isHandlingScanRef = useRef<boolean>(false);

  // Enumerate cameras on component mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration notice:', err);
      });

    return () => {
      stopCameraScanner();
    };
  }, []);

  // Start or restart camera when camera ID or active toggle changes
  useEffect(() => {
    if (scannerActive && selectedCameraId) {
      startCameraScanner(selectedCameraId);
    } else if (!scannerActive) {
      stopCameraScanner();
    }
  }, [scannerActive, selectedCameraId]);

  const startCameraScanner = async (cameraId: string) => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        await stopCameraScanner();
      }

      const scanner = new Html5Qrcode(regionElementId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          if (!isHandlingScanRef.current) {
            handleCodeScanned(decodedText);
          }
        },
        () => {
          // ignore per-frame non-detections
        }
      );
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraError('Unable to open camera lens. Check permissions or use the manual Pass ID entry below.');
      setScannerActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        // ignore cleanup error
      }
      html5QrCodeRef.current = null;
    }
  };

  const handleCodeScanned = async (code: string) => {
    if (isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;
    setProcessing(true);

    try {
      const targetEventId = eventId || 1;
      const verifyRes = await eventService.verifyTicket(targetEventId, { qr_data: code });

      if (!verifyRes.success || !verifyRes.ticket) {
        throw new Error(verifyRes.message || 'Invalid or unrecognized ticket code.');
      }

      const ticket = verifyRes.ticket;

      if (!verifyRes.isMatchingEvent) {
        const mismatchResult: CheckInResult = {
          registrationId: ticket.registration_id,
          studentName: ticket.student_name,
          studentEmail: ticket.student_email,
          eventTitle: ticket.event_title,
          timestamp: new Date().toLocaleTimeString(),
          status: 'invalid',
          message: `Ticket Mismatch: Valid for "${ticket.event_title}", not this event.`,
        };
        setLastResult(mismatchResult);
        addHistory(mismatchResult);
        if (onCheckInError) onCheckInError(mismatchResult.message);
        return;
      }

      if (ticket.attendance_status === 'present') {
        const alreadyResult: CheckInResult = {
          registrationId: ticket.registration_id,
          studentName: ticket.student_name,
          studentEmail: ticket.student_email,
          eventTitle: ticket.event_title,
          timestamp: new Date().toLocaleTimeString(),
          status: 'already_present',
          message: `Already Admitted: ${ticket.student_name} was previously marked present.`,
        };
        setLastResult(alreadyResult);
        addHistory(alreadyResult);
        return;
      }

      const checkinRes = await eventService.confirmCheckIn(targetEventId, ticket.registration_id);

      if (checkinRes.success) {
        const successResult: CheckInResult = {
          registrationId: ticket.registration_id,
          studentName: ticket.student_name,
          studentEmail: ticket.student_email,
          eventTitle: ticket.event_title,
          timestamp: new Date().toLocaleTimeString(),
          status: 'admitted',
          message: `Verified & Admitted: ${ticket.student_name} is marked Present!`,
        };

        setLastResult(successResult);
        addHistory(successResult);

        if (onCheckInSuccess) {
          onCheckInSuccess(successResult);
        }
      } else {
        throw new Error(checkinRes.message || 'Check-in failed.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Verification failed.';
      const failureResult: CheckInResult = {
        registrationId: 0,
        studentName: 'Unknown Attendee',
        timestamp: new Date().toLocaleTimeString(),
        status: 'invalid',
        message: errorMsg,
      };
      setLastResult(failureResult);
      addHistory(failureResult);
      if (onCheckInError) onCheckInError(errorMsg);
    } finally {
      setProcessing(false);
      setTimeout(() => {
        isHandlingScanRef.current = false;
      }, 1800);
    }
  };

  const addHistory = (item: CheckInResult) => {
    setScanHistory((prev) => [item, ...prev.slice(0, 9)]);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeScanned(manualCode.trim());
      setManualCode('');
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs ${className}`}>
      
      {/* Scanner Header */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-sm">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <span>Device Camera QR Scanner</span>
              {scannerActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Camera Active" />
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {eventTitle ? `Gate Check-in: ${eventTitle}` : 'Point device camera at student ticket QR code'}
            </p>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {cameras.length > 1 && scannerActive && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              title="Switch Camera Lens"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span className="text-[11px]">Switch</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setScannerActive(!scannerActive)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-2xs flex items-center gap-1.5 ${
              scannerActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{scannerActive ? 'Stop Camera' : 'Start Camera'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Camera Viewfinder Area */}
        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col items-center justify-center min-h-[280px]">
          
          {/* HTML5 QR Code Mount Element */}
          <div
            id={regionElementId}
            className={`w-full max-w-[320px] ${!scannerActive ? 'hidden' : 'block'}`}
          />

          {/* Scanner Inactive Overlay */}
          {!scannerActive && !cameraError && (
            <div className="p-6 text-center text-slate-400 space-y-3">
              <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <div className="text-sm font-semibold text-slate-200">Device Camera Offline</div>
                <div className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click "Start Camera" above to activate the camera and scan student tickets.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScannerActive(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
              >
                Activate Camera Scanner
              </button>
            </div>
          )}

          {/* Camera Permission / Error Banner */}
          {cameraError && (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="text-xs text-slate-300 max-w-xs mx-auto">{cameraError}</div>
              <button
                type="button"
                onClick={() => setScannerActive(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-md"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Scanning Reticle Overlay (When active) */}
          {scannerActive && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-4">
              <div className="text-[11px] font-mono text-emerald-400 bg-slate-900/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                {processing ? 'Processing Check-in...' : 'Position QR Code Inside Box'}
              </div>

              {/* Viewfinder Corner Guides - crisp and non-bouncing */}
              <div className="relative w-48 h-48 border-2 border-dashed border-emerald-400/80 rounded-lg" />

              <div className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                Automatic Check-in Enabled
              </div>
            </div>
          )}
        </div>

        {/* Live Scan Result Banner */}
        {lastResult && (
          <div
            className={`p-4 rounded-lg border transition-colors ${
              lastResult.status === 'admitted'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300'
                : lastResult.status === 'already_present'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastResult.status === 'admitted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : lastResult.status === 'already_present' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1 flex-1 text-xs">
                <div className="font-semibold text-sm leading-tight flex items-center justify-between">
                  <span>{lastResult.studentName}</span>
                  <span className="text-[11px] font-mono opacity-70">
                    {lastResult.timestamp}
                  </span>
                </div>

                <div className="font-medium text-xs leading-relaxed">
                  {lastResult.message}
                </div>

                {lastResult.studentEmail && (
                  <div className="text-[11px] opacity-80 pt-0.5">
                    {lastResult.studentEmail} · Pass #{lastResult.registrationId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Pass ID Fallback Input */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Manual Ticket / Pass ID Entry (Backup or Barcode Scanner)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Registration ID (e.g. 1, 4) or paste QR string..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={processing || !manualCode.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{processing ? 'Checking...' : 'Check-In'}</span>
            </button>
          </div>
        </form>

        {/* Live Session Check-in History */}
        {scanHistory.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Session Check-in Activity</span>
              </span>
              <span className="tabular-nums font-mono text-[11px]">
                {scanHistory.filter(h => h.status === 'admitted').length} Admitted
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/40 dark:bg-slate-800/20 text-xs">
              {scanHistory.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    {item.status === 'admitted' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ) : item.status === 'already_present' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    )}
                    <span className="font-semibold text-slate-900 dark:text-white">{item.studentName}</span>
                    {item.registrationId > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">#{item.registrationId}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                      item.status === 'admitted'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : item.status === 'already_present'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {item.status === 'admitted' ? 'Present' : item.status}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
