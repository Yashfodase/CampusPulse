import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CollegeEvent } from '../../types';
import { Calendar, MapPin, Clock, CheckCircle2, Users, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: CollegeEvent;
  onRegisterClick?: (event: CollegeEvent) => void;
  showAdminActions?: boolean;
  onStatusChange?: (eventId: number, status: any) => void;
  onDeleteClick?: (eventId: number) => void;
  animationDelay?: number;
}

// Blue-toned category fallback banners
const getCategoryColor = (categoryName: string = '') => {
  const cat = categoryName.toLowerCase();
  if (cat.includes('tech') || cat.includes('hack') || cat.includes('code')) {
    return { bg: 'from-blue-900 via-indigo-950 to-slate-900', badge: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30' };
  }
  if (cat.includes('cultur') || cat.includes('music') || cat.includes('fest')) {
    return { bg: 'from-indigo-950 via-slate-900 to-blue-950', badge: 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30' };
  }
  if (cat.includes('sport') || cat.includes('fit') || cat.includes('game')) {
    return { bg: 'from-teal-950 via-slate-900 to-blue-950', badge: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' };
  }
  if (cat.includes('work') || cat.includes('seminar') || cat.includes('lecture')) {
    return { bg: 'from-blue-950 via-slate-900 to-indigo-950', badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' };
  }
  return { bg: 'from-blue-950 via-slate-900 to-slate-950', badge: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30' };
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegisterClick,
  showAdminActions = false,
  onStatusChange,
  onDeleteClick,
  animationDelay = 0,
}) => {
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const eventDateObj = new Date(event.date);
  const formattedDate = eventDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isFull = event.registered_count >= event.max_participants;
  const isPast = eventDateObj < new Date(new Date().setHours(0, 0, 0, 0));
  const capacityPercent = Math.min(100, Math.round((event.registered_count / event.max_participants) * 100));
  const isFewSeats = !isFull && !isPast && (event.seats_left <= 5 || capacityPercent >= 85);
  const categoryTheme = getCategoryColor(event.category_name);

  useEffect(() => {
    if (isPast) {
      setTimeLeft('Past Event');
      return;
    }

    const calcTime = () => {
      const now = new Date().getTime();
      const target = eventDateObj.getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Today');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    calcTime();
    const timer = setInterval(calcTime, 60000);
    return () => clearInterval(timer);
  }, [event.date, isPast]);

  return (
    <div
      style={{ animationDelay: `${animationDelay}ms` }}
      className="academic-card group overflow-hidden flex flex-col h-full animate-page-enter"
    >
      {/* Cover Image / Blue-toned Category Banner */}
      <div className="relative aspect-[16/9] w-full bg-[#0D1526] border-b border-[#1F2D4A] overflow-hidden">
        {!imageError && event.image ? (
          <img
            src={event.image}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${categoryTheme.bg} flex flex-col items-center justify-center p-4 text-center text-[#F1F5F9] relative`}>
            <div className="w-11 h-11 rounded-xl bg-[#16223B]/80 backdrop-blur-xs flex items-center justify-center mb-1.5 border border-[#1F2D4A]">
              <Calendar className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-[#CBD5E1]">
              {event.category_name || 'Campus Event'}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#16223B]/90 text-[#3B82F6] border border-[#1F2D4A] shadow-sm backdrop-blur-xs">
            {event.category_name}
          </span>

          <div className="flex items-center gap-1.5">
            {event.is_registered && (
              <span className="bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enrolled</span>
              </span>
            )}

            {isPast ? (
              <span className="bg-[#7C8BA8]/15 text-[#7C8BA8] border border-[#7C8BA8]/30 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                Completed
              </span>
            ) : isFull ? (
              <span className="bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                Full
              </span>
            ) : isFewSeats ? (
              <span className="bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                Few seats left
              </span>
            ) : (
              <span className="bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                Open
              </span>
            )}
          </div>
        </div>

        {/* Countdown Pill */}
        {timeLeft && !isPast && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-semibold text-[#CBD5E1] bg-[#0B1220]/90 px-2 py-0.5 rounded-md border border-[#1F2D4A] backdrop-blur-xs shadow-sm">
            <Clock className="w-3 h-3 text-[#3B82F6]" />
            <span className="tabular-nums">{timeLeft}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs text-[#7C8BA8]">
            <Calendar className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
            <span className="tabular-nums font-semibold text-[#CBD5E1]">{formattedDate}</span>
            <span aria-hidden="true" className="text-[#1F2D4A]">·</span>
            <span className="tabular-nums font-medium text-[#7C8BA8]">{event.start_time}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-[#F1F5F9] line-clamp-2 leading-snug group-hover:text-[#3B82F6] transition-colors">
            <Link to={`/events/${event.id}`}>
              {event.title}
            </Link>
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-[#7C8BA8] line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Venue & Capacity */}
        <div className="pt-2.5 border-t border-[#1F2D4A] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#CBD5E1] truncate">
            <MapPin className="w-3.5 h-3.5 text-[#7C8BA8] shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#7C8BA8] flex items-center gap-1">
                <Users className="w-3 h-3 text-[#7C8BA8]" />
                <strong className="text-[#F1F5F9] tabular-nums">{event.registered_count}</strong> / {event.max_participants} enrolled
              </span>
              <span className={`font-semibold tabular-nums ${isFull ? 'text-[#EF4444]' : isFewSeats ? 'text-[#F59E0B]' : 'text-[#7C8BA8]'}`}>
                {isFull ? 'Full' : `${event.seats_left} seats left`}
              </span>
            </div>
            
            {/* Seats-filled progress bar */}
            <div className="w-full bg-[#16223B] h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${capacityPercent}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFull
                    ? 'bg-[#EF4444]'
                    : isFewSeats
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#3B82F6]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-1 flex items-center gap-2">
          <Link
            to={`/events/${event.id}`}
            className="btn-secondary flex-1 text-xs h-9"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 ml-1 opacity-70" />
          </Link>

          {onRegisterClick && !event.is_registered && !isPast && !isFull && (
            <button
              onClick={() => onRegisterClick(event)}
              className="btn-primary flex-1 text-xs h-9"
            >
              Register
            </button>
          )}

          {event.is_registered && (
            <Link
              to="/student/registrations"
              className="flex-1 text-center py-2 px-3 text-xs font-semibold text-[#22C55E] bg-[#22C55E]/15 hover:bg-[#22C55E]/25 rounded-[10px] transition-colors border border-[#22C55E]/30"
            >
              My Ticket
            </Link>
          )}
        </div>

        {/* Admin Quick Action Controls */}
        {showAdminActions && (
          <div className="pt-2 border-t border-[#1F2D4A] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {onStatusChange && event.status !== 'approved' && (
                <button
                  onClick={() => onStatusChange(event.id, 'approved')}
                  className="px-2 py-0.5 bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 hover:bg-[#22C55E]/25 rounded text-[11px] font-semibold transition-colors"
                >
                  Approve
                </button>
              )}
              {onStatusChange && event.status !== 'rejected' && (
                <button
                  onClick={() => onStatusChange(event.id, 'rejected')}
                  className="px-2 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 rounded text-[11px] font-semibold transition-colors"
                >
                  Reject
                </button>
              )}
            </div>
            {onDeleteClick && (
              <button
                onClick={() => onDeleteClick(event.id)}
                className="text-[#EF4444] hover:text-[#DC2626] font-semibold text-[11px] transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
