export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
  activity_count?: number;
  stats?: {
    registrationsCount?: number;
    eventsCreated?: number;
  };
}

export interface Category {
  id: number;
  name: string;
  description: string;
  event_count?: number;
}

export type EventStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface CollegeEvent {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_description?: string;
  organizer_id: number;
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_participants: number;
  registration_deadline: string;
  image?: string;
  google_form_url?: string | null;
  status: EventStatus;
  created_at?: string;
  registered_count: number;
  seats_left: number;
  is_full: boolean;
  is_registered?: boolean;
  user_registration_id?: number | null;
  my_attendance?: 'unmarked' | 'present' | 'absent' | null;
}

export type RegistrationStatus = 'confirmed' | 'cancelled';
export type AttendanceStatus = 'unmarked' | 'present' | 'absent';

export interface Registration {
  registration_id: number;
  registration_date: string;
  registration_status: RegistrationStatus;
  attendance_status: AttendanceStatus;
  google_form_completed?: boolean | number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  event_id: number;
  event_title: string;
  event_date: string;
  event_venue: string;
  start_time?: string;
  end_time?: string;
  category_name?: string;
  organizer_name?: string;
  organizer_email?: string;
  image?: string;
  google_form_url?: string | null;
  event_status?: EventStatus;
}

export interface DashboardStats {
  totalStudents: number;
  totalOrganizers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  attendedCount: number;
  attendanceStats: Array<{ attendance_status: AttendanceStatus; count: number }>;
  categoryStats: Array<{ name: string; count: number }>;
  statusStats: Array<{ status: EventStatus; count: number }>;
  recentRegistrations: Array<{
    id: number;
    registration_date: string;
    status: RegistrationStatus;
    attendance_status: AttendanceStatus;
    student_name: string;
    student_email: string;
    event_title: string;
    event_date: string;
  }>;
}

export type NotificationType = 'reminder' | 'registration_status' | 'event_update' | 'general';

export interface NotificationItem {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  event_id?: number | null;
  event_title?: string;
  event_date?: string;
  event_venue?: string;
  is_read: boolean;
  created_at: string;
}

export type EventMediaType = 'banner' | 'gallery';

export interface EventMedia {
  id: number;
  event_id: number;
  media_type: EventMediaType;
  image_url: string;
  caption?: string;
  aspect_ratio?: string;
  file_size?: number;
  width?: number;
  height?: number;
  uploaded_by: number;
  uploader_name?: string;
  created_at: string;
}

