import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categoryService, eventService } from '../../services/api';
import { Category } from '../../types';
import { Alert } from '../../components/common/Alert';
import { ImageUploadDropzone } from '../../components/common/ImageUploadDropzone';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ExternalLink,
  Eye,
} from 'lucide-react';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [venue, setVenue] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('60');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [image, setImage] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoryService.getAll();
        if (res.success && res.categories.length > 0) {
          setCategories(res.categories);
          setCategoryId(String(res.categories[0].id));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !venue.trim() || !date || !registrationDeadline) {
      setAlertInfo({ type: 'error', message: 'Please complete all required fields.' });
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
      setLoading(true);
      setAlertInfo(null);

      const res = await eventService.create({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        date,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        venue: venue.trim(),
        max_participants: participantsNum,
        registration_deadline: registrationDeadline,
        image: image.trim() || '',
        google_form_url: googleFormUrl.trim() || null,
        status: 'approved',
      });

      if (res.success) {
        if (image.trim() && res.event?.id) {
          eventService.uploadMedia(res.event.id, {
            media_type: 'banner',
            image_url: image.trim(),
            caption: `${title.trim()} Hero Banner`,
            aspect_ratio: '16:9',
            set_as_banner: true,
          }).catch((e) => console.warn('[Banner Media Save Error]:', e));
        }

        setAlertInfo({ type: 'success', message: 'Event successfully created and published.' });
        setTimeout(() => {
          navigate('/organizer/events');
        }, 1000);
      }
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Failed to create event.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = categories.find((c) => String(c.id) === categoryId)?.name || 'General';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
      
      {/* Header with back button */}
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C8BA8] hover:text-[#3B82F6] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <h1 className="text-[32px] font-bold tracking-tight text-[#F1F5F9]">
          Create & Publish Event
        </h1>
        <p className="text-[13px] text-[#7C8BA8] mt-1">
          Set up event details, schedule timings, venue capacity, and review how it appears to students.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} />}

      {/* Two Column Layout: Left Form (7 cols), Right Live Student Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7 academic-card p-6 sm:p-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">1</span>
                  Basic Information
                </h2>
                <span className="text-xs text-[#7C8BA8]">Required</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Annual Hackathon 2026 or Spring Career Fair"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base w-full"
                />
                <p className="text-xs text-[#7C8BA8] mt-1">A descriptive and clear title for attendees</p>
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
                <p className="text-xs text-[#7C8BA8] mt-1">Helps students discover this event in category filters</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Description & Agenda *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide event overview, schedule highlights, eligibility, and what participants should bring..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-[10px] border border-[#1F2D4A] bg-[#0F1829] p-3 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/25 transition-all placeholder:text-[#7C8BA8]"
                />
              </div>
            </div>

            {/* Section 2: Date & Time */}
            <div className="space-y-4 pt-4 border-t border-[#1F2D4A]">
              <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">2</span>
                  Date & Time
                </h2>
                <span className="text-xs text-[#7C8BA8]">Schedule</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (!registrationDeadline) setRegistrationDeadline(e.target.value);
                    }}
                    className="input-base w-full text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Start Time *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-[#7C8BA8] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="09:30 AM"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-base w-full pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    End Time *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-[#7C8BA8] absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="04:30 PM"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-base w-full pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Venue & Seats */}
            <div className="space-y-4 pt-4 border-t border-[#1F2D4A]">
              <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">3</span>
                  Venue & Capacity
                </h2>
                <span className="text-xs text-[#7C8BA8]">Logistics</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Location / Venue *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#7C8BA8]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Auditorium Hall B or Tech Lab 3"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="input-base w-full pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Total Seats / Max Capacity *
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

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Registration Deadline *
                </label>
                <div className="relative max-w-sm">
                  <Calendar className="w-4 h-4 text-[#7C8BA8] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="input-base w-full pl-9 text-xs sm:text-sm"
                  />
                </div>
                <p className="text-xs text-[#7C8BA8] mt-1">Registrations will automatically close after this date</p>
              </div>
            </div>

            {/* Section 4: Media & Additional Options */}
            <div className="space-y-4 pt-4 border-t border-[#1F2D4A]">
              <div className="pb-2 border-b border-[#1F2D4A] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-[11px] font-bold">4</span>
                  Media & Questionnaire Options
                </h2>
                <span className="text-xs text-[#7C8BA8]">Settings</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#CBD5E1]">
                    Google Form Link (Optional Questionnaire)
                  </label>
                  {googleFormUrl.trim() && (
                    <a
                      href={googleFormUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:text-[#2563EB] underline"
                    >
                      <span>Test Form Link</span>
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
                <p className="text-xs text-[#7C8BA8] mt-1">If provided, registrants will see this Google Form questionnaire link</p>
              </div>

              <div>
                <ImageUploadDropzone
                  value={image}
                  targetRatio="16:9"
                  label="Event Banner Image (Optional 16:9)"
                  helperText="Upload event hero art. Client-side compressed for optimal delivery."
                  onChange={(dataUrl) => setImage(dataUrl)}
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-4 border-t border-[#1F2D4A] flex items-center justify-end gap-3">
              <Link
                to="/organizer/events"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Publishing Event...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Card Preview (5 Cols Sticky) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#CBD5E1]">
              <Eye className="w-4 h-4 text-[#3B82F6]" />
              <span>Live Card Preview</span>
            </div>
            <span className="text-[11px] text-[#7C8BA8]">Updates as you type</span>
          </div>

          <div className="academic-card overflow-hidden">
            {/* Visual Header */}
            <div className="aspect-[16/9] w-full bg-[#16223B] relative overflow-hidden">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#16223B] to-[#0F1829] text-[#7C8BA8]">
                  <div className="w-10 h-10 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center mb-1 text-[#3B82F6]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#CBD5E1]">{selectedCategoryName}</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#111A2E]/90 text-[#22D3EE] border border-[#1F2D4A] shadow-xs">
                  {selectedCategoryName}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#7C8BA8] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span className="font-semibold text-[#CBD5E1]">
                  {date || 'Upcoming Date'}
                </span>
                <span>·</span>
                <span>{startTime} - {endTime}</span>
              </div>

              <h3 className="text-base font-bold text-[#F1F5F9] line-clamp-2 leading-snug">
                {title.trim() || 'Untitled Event'}
              </h3>

              <p className="text-xs text-[#CBD5E1] line-clamp-2 leading-relaxed">
                {description.trim() || 'Event guidelines, eligibility, and agenda will appear here for attending students...'}
              </p>

              <div className="pt-3 border-t border-[#1F2D4A] text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                  <MapPin className="w-3.5 h-3.5 text-[#7C8BA8] flex-shrink-0" />
                  <span className="truncate">{venue || 'Venue to be confirmed'}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#7C8BA8] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#7C8BA8]" />
                    0 / {maxParticipants} registered
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E] font-semibold text-[11px] border border-[#22C55E]/30">
                    {maxParticipants} seats available
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="btn-primary w-full opacity-90 cursor-default pointer-events-none">
                  View Details & Register
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
