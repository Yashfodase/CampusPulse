import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { categoryService, eventService } from '../../services/api';
import { Category, CollegeEvent } from '../../types';
import { Alert } from '../../components/common/Alert';
import { ImageUploadDropzone } from '../../components/common/ImageUploadDropzone';
import { EventMediaManager } from '../../components/organizer/EventMediaManager';
import { ArrowLeft, MapPin, Users, FileText, ExternalLink, Calendar, Clock } from 'lucide-react';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('60');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [image, setImage] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [status, setStatus] = useState<string>('approved');

  const [saving, setSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setInitialLoading(true);
        const [catRes, eventRes] = await Promise.all([
          categoryService.getAll(),
          eventService.getById(id),
        ]);

        if (catRes.success) setCategories(catRes.categories);
        if (eventRes.success && eventRes.event) {
          const ev = eventRes.event;
          setTitle(ev.title);
          setDescription(ev.description);
          setCategoryId(String(ev.category_id));
          setDate(ev.date);
          setStartTime(ev.start_time);
          setEndTime(ev.end_time);
          setVenue(ev.venue);
          setMaxParticipants(String(ev.max_participants));
          setRegistrationDeadline(ev.registration_deadline);
          setImage(ev.image || '');
          setGoogleFormUrl(ev.google_form_url || '');
          setStatus(ev.status);
        }
      } catch (err: any) {
        setAlertInfo({ type: 'error', message: 'Failed to load event data.' });
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!title.trim() || !description.trim() || !venue.trim() || !date || !registrationDeadline) {
      setAlertInfo({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    const participantsNum = Number(maxParticipants);
    if (isNaN(participantsNum) || participantsNum <= 0) {
      setAlertInfo({ type: 'error', message: 'Maximum participants must be a positive integer.' });
      return;
    }

    if (new Date(registrationDeadline) > new Date(date)) {
      setAlertInfo({ type: 'error', message: 'Registration deadline cannot be after the event date.' });
      return;
    }

    try {
      setSaving(true);
      setAlertInfo(null);

      const res = await eventService.update(id, {
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        date,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        venue: venue.trim(),
        max_participants: participantsNum,
        registration_deadline: registrationDeadline,
        image: image.trim(),
        google_form_url: googleFormUrl.trim() || null,
        status: status as any,
      });

      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Event updated successfully.' });
        setTimeout(() => {
          navigate('/organizer/events');
        }, 1200);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to update event.' });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-enter">
        <div className="h-64 academic-card skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header */}
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C8BA8] hover:text-[#3B82F6] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F1F5F9]">
          Edit Campus Event
        </h1>
        <p className="text-[13px] text-[#7C8BA8] mt-1">
          Modify event schedule, location, capacity, or event lifecycle status.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Form Card */}
      <div className="academic-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-base w-full cursor-pointer bg-[#0F1829] text-[#F1F5F9]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111A2E] text-[#F1F5F9]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              Event Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[10px] border border-[#1F2D4A] bg-[#0F1829] p-3 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/25 transition-all placeholder:text-[#7C8BA8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-base w-full text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Start Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 10:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                End Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 04:00 PM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-base w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Venue *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="input-base w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Maximum Seats *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                <input
                  type="number"
                  min="1"
                  required
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="input-base w-full pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Registration Deadline *
              </label>
              <input
                type="date"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="input-base w-full text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Event Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-base w-full capitalize cursor-pointer bg-[#0F1829] text-[#F1F5F9]"
              >
                <option value="approved" className="bg-[#111A2E] text-[#F1F5F9]">Approved / Live</option>
                <option value="pending" className="bg-[#111A2E] text-[#F1F5F9]">Pending</option>
                <option value="completed" className="bg-[#111A2E] text-[#F1F5F9]">Completed</option>
                <option value="cancelled" className="bg-[#111A2E] text-[#F1F5F9]">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Google Form Link (Optional) */}
          <div className="pt-4 border-t border-[#1F2D4A] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Google Form Questionnaire Link (Optional)</span>
              </label>
              {googleFormUrl.trim() && (
                <a
                  href={googleFormUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:text-[#2563EB] underline"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <input
              type="url"
              placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
              value={googleFormUrl}
              onChange={(e) => setGoogleFormUrl(e.target.value)}
              className="input-base w-full font-mono text-xs placeholder:font-sans"
            />

            <p className="text-xs text-[#7C8BA8]">
              Attach an external Google Form for questionnaires, team details, or dietary preferences. Students will be prompted to fill this form upon registering.
            </p>
          </div>

          {/* Primary Banner Uploader */}
          <div className="pt-4 border-t border-[#1F2D4A]">
            <ImageUploadDropzone
              value={image}
              targetRatio="16:9"
              label="Primary Event Hero Banner (16:9 Widescreen)"
              helperText="Upload or replace the main event banner. Automatically compressed client-side."
              onChange={(dataUrl) => setImage(dataUrl)}
            />
          </div>

          <div className="pt-4 border-t border-[#1F2D4A] flex items-center justify-end gap-3">
            <Link
              to="/organizer/events"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving Changes...' : 'Save Event Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Event Media & Photo Gallery Manager */}
      {id && (
        <EventMediaManager
          eventId={id}
          eventTitle={title || 'Event'}
          onBannerUpdated={(newBannerUrl) => setImage(newBannerUrl)}
        />
      )}

    </div>
  );
};
