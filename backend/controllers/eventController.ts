import { Response } from 'express';
import { query, execute } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createAndSendNotification, broadcastToEventAttendees } from '../services/websocketService.js';

export async function getAllEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      q,
      category,
      date,
      status,
      sort = 'asc',
      organizer_id,
      upcoming_only,
    } = req.query;

    const currentUserId = req.user?.id || 0;
    const currentUserRole = req.user?.role;

    let sql = `
      SELECT 
        e.*,
        c.name AS category_name,
        u.name AS organizer_name,
        u.email AS organizer_email,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    `;

    if (currentUserId > 0) {
      sql += `,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.student_id = ? AND r.status = 'confirmed') AS is_registered,
        (SELECT r.id FROM registrations r WHERE r.event_id = e.id AND r.student_id = ? AND r.status = 'confirmed' LIMIT 1) AS user_registration_id
      `;
    } else {
      sql += `,
        0 AS is_registered,
        NULL AS user_registration_id
      `;
    }

    sql += `
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (currentUserId > 0) {
      params.push(currentUserId, currentUserId);
    }

    // Role-based status filter:
    // If ordinary user or not logged in, only show approved events unless organizer querying their own events
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    } else if (currentUserRole !== 'admin' && !organizer_id) {
      sql += " AND e.status = 'approved'";
    }

    if (organizer_id) {
      sql += ' AND e.organizer_id = ?';
      params.push(organizer_id);
    }

    if (category) {
      sql += ' AND (e.category_id = ? OR LOWER(c.name) = LOWER(?))';
      params.push(category, category);
    }

    if (date) {
      sql += ' AND e.date = ?';
      params.push(date);
    }

    if (upcoming_only === 'true') {
      const today = new Date().toISOString().split('T')[0];
      sql += ' AND e.date >= ?';
      params.push(today);
    }

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.venue) LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const sortOrder = String(sort).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY e.date ${sortOrder}, e.start_time ASC`;

    const events = await query(sql, params);

    // Calculate available seats
    const enrichedEvents = events.map(e => ({
      ...e,
      is_registered: Boolean(e.is_registered > 0),
      seats_left: Math.max(0, e.max_participants - (e.registered_count || 0)),
      is_full: (e.registered_count || 0) >= e.max_participants,
    }));

    return res.json({ success: true, count: enrichedEvents.length, events: enrichedEvents });
  } catch (error: any) {
    console.error('[Get Events Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
}

export async function getEventById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || 0;

    let sql = `
      SELECT 
        e.*,
        c.name AS category_name,
        c.description AS category_description,
        u.name AS organizer_name,
        u.email AS organizer_email,
        u.phone AS organizer_phone,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    `;

    if (currentUserId > 0) {
      sql += `,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.student_id = ? AND r.status = 'confirmed') AS is_registered,
        (SELECT r.id FROM registrations r WHERE r.event_id = e.id AND r.student_id = ? AND r.status = 'confirmed' LIMIT 1) AS user_registration_id,
        (SELECT r.attendance_status FROM registrations r WHERE r.event_id = e.id AND r.student_id = ? AND r.status = 'confirmed' LIMIT 1) AS my_attendance
      `;
    } else {
      sql += `,
        0 AS is_registered,
        NULL AS user_registration_id,
        NULL AS my_attendance
      `;
    }

    sql += `
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `;

    const params: any[] = [];
    if (currentUserId > 0) {
      params.push(currentUserId, currentUserId, currentUserId);
    }
    params.push(id);

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = rows[0];
    const seats_left = Math.max(0, event.max_participants - (event.registered_count || 0));

    return res.json({
      success: true,
      event: {
        ...event,
        is_registered: Boolean(event.is_registered > 0),
        seats_left,
        is_full: seats_left <= 0,
      }
    });
  } catch (error: any) {
    console.error('[Get Event By ID Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event details.' });
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      title,
      description,
      category_id,
      date,
      start_time,
      end_time,
      venue,
      max_participants = 50,
      registration_deadline,
      image = '',
      google_form_url = '',
      status = 'approved',
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Event description is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Event date is required.' });
    }
    if (!start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Start and end times are required.' });
    }
    if (!venue || !venue.trim()) {
      return res.status(400).json({ success: false, message: 'Venue is required.' });
    }
    if (!registration_deadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline is required.' });
    }

    const participantsNum = Number(max_participants);
    if (isNaN(participantsNum) || participantsNum <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum participants must be a positive number.' });
    }

    // Date validation: deadline cannot be after the event date
    if (new Date(registration_deadline) > new Date(date)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be after the event date.'
      });
    }

    // Verify category exists
    const catRows = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (catRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Default image if empty
    const defaultImage = image && image.trim() 
      ? image.trim() 
      : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';

    const cleanedGoogleFormUrl = google_form_url && typeof google_form_url === 'string' && google_form_url.trim()
      ? google_form_url.trim()
      : null;

    // Insert event
    const organizerId = req.user.id;
    const initialStatus = req.user.role === 'admin' ? (status || 'approved') : 'approved';

    const insertResult = await execute(`
      INSERT INTO events (
        title, description, category_id, organizer_id, date, 
        start_time, end_time, venue, max_participants, 
        registration_deadline, image, google_form_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description.trim(),
      category_id,
      organizerId,
      date,
      start_time.trim(),
      end_time.trim(),
      venue.trim(),
      participantsNum,
      registration_deadline,
      defaultImage,
      cleanedGoogleFormUrl,
      initialStatus
    ]);

    const created = await query('SELECT * FROM events WHERE id = ?', [insertResult.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: created[0],
    });
  } catch (error: any) {
    console.error('[Create Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const existing = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = existing[0];

    // Authorization: only the organizer who created it or admin can edit
    if (req.user.role !== 'admin' && Number(event.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own events.' });
    }

    const {
      title,
      description,
      category_id,
      date,
      start_time,
      end_time,
      venue,
      max_participants,
      registration_deadline,
      image,
      google_form_url,
      status,
    } = req.body;

    const newDate = date || event.date;
    const newDeadline = registration_deadline || event.registration_deadline;

    if (new Date(newDeadline) > new Date(newDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline cannot be after the event date.'
      });
    }

    const updatedTitle = title !== undefined ? title.trim() : event.title;
    const updatedDesc = description !== undefined ? description.trim() : event.description;
    const updatedCategory = category_id !== undefined ? category_id : event.category_id;
    const updatedStartTime = start_time !== undefined ? start_time.trim() : event.start_time;
    const updatedEndTime = end_time !== undefined ? end_time.trim() : event.end_time;
    const updatedVenue = venue !== undefined ? venue.trim() : event.venue;
    const updatedMax = max_participants !== undefined ? Number(max_participants) : event.max_participants;
    const updatedImage = image !== undefined ? image.trim() : event.image;
    const updatedGoogleFormUrl = google_form_url !== undefined
      ? (google_form_url && typeof google_form_url === 'string' && google_form_url.trim() ? google_form_url.trim() : null)
      : event.google_form_url;
    const updatedStatus = status !== undefined ? status : event.status;

    await execute(`
      UPDATE events SET
        title = ?,
        description = ?,
        category_id = ?,
        date = ?,
        start_time = ?,
        end_time = ?,
        venue = ?,
        max_participants = ?,
        registration_deadline = ?,
        image = ?,
        google_form_url = ?,
        status = ?
      WHERE id = ?
    `, [
      updatedTitle,
      updatedDesc,
      updatedCategory,
      newDate,
      updatedStartTime,
      updatedEndTime,
      updatedVenue,
      updatedMax,
      newDeadline,
      updatedImage,
      updatedGoogleFormUrl,
      updatedStatus,
      id
    ]);

    const updated = await query('SELECT * FROM events WHERE id = ?', [id]);

    // If status or date/venue changed, broadcast to registered students
    if (updated.length > 0 && (status !== event.status || newDate !== event.date || updatedVenue !== event.venue)) {
      const isCancelled = updatedStatus === 'cancelled';
      broadcastToEventAttendees(Number(id), {
        type: isCancelled ? 'event_update' : 'event_update',
        title: isCancelled ? `⚠️ Event Cancelled: ${updatedTitle}` : `Schedule Update: ${updatedTitle}`,
        message: isCancelled 
          ? `The event "${updatedTitle}" has been cancelled by the organizer.`
          : `The event schedule has been updated: Date: ${newDate}, Time: ${updatedStartTime}, Venue: ${updatedVenue}.`,
      }).catch((err) => console.error('[Event Update Notification Error]:', err));
    }

    return res.json({
      success: true,
      message: 'Event updated successfully.',
      event: updated[0],
    });
  } catch (error: any) {
    console.error('[Update Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const existing = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = existing[0];
    if (req.user.role !== 'admin' && Number(event.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete your own events.' });
    }

    await execute('DELETE FROM events WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('[Delete Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
}

export async function getEventParticipants(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const existing = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = existing[0];
    if (req.user.role !== 'admin' && Number(event.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view participants for this event.' });
    }

    const participants = await query(`
      SELECT 
        r.id AS registration_id,
        r.registration_date,
        r.status AS registration_status,
        r.attendance_status,
        r.google_form_completed,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        u.phone AS student_phone
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.registration_date DESC
    `, [id]);

    const stats = {
      total: participants.length,
      confirmed: participants.filter(p => p.registration_status === 'confirmed').length,
      present: participants.filter(p => p.attendance_status === 'present').length,
      absent: participants.filter(p => p.attendance_status === 'absent').length,
      unmarked: participants.filter(p => p.attendance_status === 'unmarked').length,
      formSubmitted: participants.filter(p => Number(p.google_form_completed) === 1).length,
    };

    return res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        max_participants: event.max_participants,
        google_form_url: event.google_form_url,
      },
      stats,
      participants,
    });
  } catch (error: any) {
    console.error('[Get Event Participants Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event participants.' });
  }
}

export async function updateAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id, registrationId } = req.params;
    const { attendance_status } = req.body;

    const allowed = ['unmarked', 'present', 'absent'];
    if (!allowed.includes(attendance_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status. Must be unmarked, present, or absent.'
      });
    }

    const eventRows = await query('SELECT organizer_id, title FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role !== 'admin' && Number(eventRows[0].organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to mark attendance for this event.' });
    }

    await execute(
      'UPDATE registrations SET attendance_status = ? WHERE id = ? AND event_id = ?',
      [attendance_status, registrationId, id]
    );

    // Notify student in real-time
    const regRows = await query('SELECT student_id FROM registrations WHERE id = ?', [registrationId]);
    if (regRows.length > 0) {
      createAndSendNotification({
        userId: regRows[0].student_id,
        type: 'registration_status',
        title: `Attendance Status: ${attendance_status.toUpperCase()}`,
        message: `Your attendance status for "${eventRows[0].title}" was marked as ${attendance_status}.`,
        eventId: Number(id),
      }).catch((err) => console.error('[Attendance Notification Error]:', err));
    }

    return res.json({
      success: true,
      message: `Attendance marked as ${attendance_status}.`,
      registrationId: Number(registrationId),
      attendance_status
    });
  } catch (error: any) {
    console.error('[Update Attendance Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update attendance.' });
  }
}

export async function verifyTicket(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const { qr_data, registration_id } = req.body;

    let targetRegId: number | null = null;

    if (registration_id) {
      targetRegId = Number(registration_id);
    } else if (qr_data) {
      try {
        const parsed = JSON.parse(qr_data);
        targetRegId = Number(parsed.registration_id || parsed.reg_id || parsed.id);
      } catch {
        const clean = String(qr_data).replace(/[^0-9]/g, '');
        if (clean) targetRegId = Number(clean);
      }
    }

    if (!targetRegId || isNaN(targetRegId)) {
      return res.status(400).json({ success: false, message: 'Could not extract valid registration/ticket ID from QR code.' });
    }

    const eventRows = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const currentEvent = eventRows[0];

    if (req.user.role !== 'admin' && Number(currentEvent.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to verify tickets for this event.' });
    }

    const regRows = await query(`
      SELECT 
        r.id AS registration_id,
        r.registration_date,
        r.status AS registration_status,
        r.attendance_status,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        u.phone AS student_phone,
        e.id AS event_id,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.start_time,
        e.end_time,
        c.name AS category_name
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      JOIN events e ON r.event_id = e.id
      JOIN categories c ON e.category_id = c.id
      WHERE r.id = ?
    `, [targetRegId]);

    if (regRows.length === 0) {
      return res.status(404).json({ success: false, message: `No ticket found with ID #${targetRegId}.` });
    }

    const record = regRows[0];
    const isMatchingEvent = Number(record.event_id) === Number(id);

    return res.json({
      success: true,
      isMatchingEvent,
      ticket: record,
      message: isMatchingEvent 
        ? 'Ticket verified successfully!' 
        : `Warning: This ticket is for "${record.event_title}", not this event.`
    });
  } catch (error: any) {
    console.error('[Verify Ticket Error]:', error);
    return res.status(500).json({ success: false, message: 'Error verifying ticket.' });
  }
}

export async function confirmCheckIn(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id, registrationId } = req.params;

    const eventRows = await query('SELECT organizer_id, title FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role !== 'admin' && Number(eventRows[0].organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to admit attendees for this event.' });
    }

    const regRows = await query(`
      SELECT r.*, u.name as student_name 
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      WHERE r.id = ? AND r.event_id = ?
    `, [registrationId, id]);

    if (regRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found for this event.' });
    }

    const reg = regRows[0];
    if (reg.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot admit student: Registration was cancelled.' });
    }

    await execute(
      "UPDATE registrations SET attendance_status = 'present' WHERE id = ? AND event_id = ?",
      [registrationId, id]
    );

    // Notify student in real-time
    createAndSendNotification({
      userId: reg.student_id,
      type: 'registration_status',
      title: 'Check-In Verified ✅',
      message: `Entry verified! You have been checked in for "${eventRows[0].title}" as Present. Enjoy the event!`,
      eventId: Number(id),
    }).catch((err) => console.error('[Checkin Notification Error]:', err));

    return res.json({
      success: true,
      message: `Entry verified and confirmed! ${reg.student_name} is marked present.`,
      registrationId: Number(registrationId),
      student_name: reg.student_name,
      attendance_status: 'present'
    });
  } catch (error: any) {
    console.error('[Confirm Checkin Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm check-in.' });
  }
}

export async function getOrganizerAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const organizerId = req.user.id;

    // 1. Event capacity & fill comparison
    const eventComparison = await query(`
      SELECT 
        e.id, 
        e.title, 
        e.date,
        e.max_participants as capacity,
        c.name as category_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as registered,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.attendance_status = 'present') as attended
      FROM events e
      JOIN categories c ON e.category_id = c.id
      WHERE e.organizer_id = ?
      ORDER BY e.date ASC
    `, [organizerId]);

    // 2. Daily Registration Trends
    const dailyRows = await query(`
      SELECT 
        SUBSTR(r.registration_date, 1, 10) as date,
        COUNT(r.id) as registrations
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE e.organizer_id = ? AND r.status = 'confirmed'
      GROUP BY SUBSTR(r.registration_date, 1, 10)
      ORDER BY date ASC
    `, [organizerId]);

    // 3. Category distribution
    const categoryRows = await query(`
      SELECT 
        c.name as category,
        COUNT(r.id) as total_registrations,
        COUNT(DISTINCT e.id) as event_count
      FROM events e
      JOIN categories c ON e.category_id = c.id
      LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'
      WHERE e.organizer_id = ?
      GROUP BY c.id
      ORDER BY total_registrations DESC
    `, [organizerId]);

    // 4. Overall Attendance Breakdown
    const attendanceRows = await query(`
      SELECT 
        r.attendance_status,
        COUNT(r.id) as count
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE e.organizer_id = ? AND r.status = 'confirmed'
      GROUP BY r.attendance_status
    `, [organizerId]);

    // Summary totals
    const totalEvents = eventComparison.length;
    const totalCapacity = eventComparison.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const totalRegistered = eventComparison.reduce((acc, curr) => acc + (curr.registered || 0), 0);
    const totalAttended = eventComparison.reduce((acc, curr) => acc + (curr.attended || 0), 0);
    const overallFillRate = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;
    const turnoutRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

    return res.json({
      success: true,
      analytics: {
        summary: {
          totalEvents,
          totalCapacity,
          totalRegistered,
          totalAttended,
          overallFillRate,
          turnoutRate,
        },
        dailyTrend: dailyRows.length > 0 ? dailyRows : [
          { date: new Date().toISOString().split('T')[0], registrations: totalRegistered }
        ],
        eventComparison: eventComparison.map(ev => ({
          ...ev,
          shortTitle: ev.title.length > 18 ? ev.title.substring(0, 18) + '...' : ev.title,
          fillRate: ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0,
        })),
        categoryDistribution: categoryRows,
        attendanceBreakdown: attendanceRows,
      }
    });
  } catch (error: any) {
    console.error('[Organizer Analytics Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics.' });
  }
}

/**
 * Get all media assets (banner and past gallery images) for an event
 */
export async function getEventMedia(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const mediaRows = await query(`
      SELECT 
        m.*,
        u.name AS uploader_name
      FROM event_media m
      JOIN users u ON m.uploaded_by = u.id
      WHERE m.event_id = ?
      ORDER BY m.media_type ASC, m.created_at DESC
    `, [id]);

    const banner = mediaRows.find((m: any) => m.media_type === 'banner') || null;
    const gallery = mediaRows.filter((m: any) => m.media_type === 'gallery');

    return res.json({
      success: true,
      count: mediaRows.length,
      banner,
      gallery,
      media: mediaRows,
    });
  } catch (error: any) {
    console.error('[Get Event Media Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event media.' });
  }
}

/**
 * Upload a custom event banner or past event gallery photo
 */
export async function uploadEventMedia(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id } = req.params;
    const {
      media_type = 'gallery',
      image_url,
      caption = '',
      aspect_ratio = '16:9',
      file_size = 0,
      width = 0,
      height = 0,
      set_as_banner = false,
    } = req.body;

    if (!image_url || typeof image_url !== 'string') {
      return res.status(400).json({ success: false, message: 'Image data or URL is required.' });
    }

    // Verify event exists and organizer has permission
    const eventRows = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventRows[0];
    if (req.user.role !== 'admin' && Number(event.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to upload media for this event.' });
    }

    const finalType = (set_as_banner || media_type === 'banner') ? 'banner' : 'gallery';

    // Insert media record
    const insertResult = await execute(`
      INSERT INTO event_media (
        event_id, media_type, image_url, caption, aspect_ratio, file_size, width, height, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      finalType,
      image_url,
      caption ? caption.trim() : '',
      aspect_ratio,
      Number(file_size) || 0,
      Number(width) || 0,
      Number(height) || 0,
      req.user.id,
    ]);

    // If marked as banner, update the primary event image
    if (finalType === 'banner' || set_as_banner) {
      await execute('UPDATE events SET image = ? WHERE id = ?', [image_url, id]);
    }

    const createdRows = await query('SELECT * FROM event_media WHERE id = ?', [insertResult.insertId]);

    return res.status(201).json({
      success: true,
      message: `${finalType === 'banner' ? 'Event banner' : 'Gallery photo'} uploaded successfully.`,
      media: createdRows[0],
    });
  } catch (error: any) {
    console.error('[Upload Event Media Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload event media.' });
  }
}

/**
 * Delete a media item
 */
export async function deleteEventMedia(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id, mediaId } = req.params;

    const mediaRows = await query(`
      SELECT m.*, e.organizer_id 
      FROM event_media m
      JOIN events e ON m.event_id = e.id
      WHERE m.id = ? AND m.event_id = ?
    `, [mediaId, id]);

    if (mediaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    const mediaItem = mediaRows[0];
    if (req.user.role !== 'admin' && Number(mediaItem.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this media item.' });
    }

    await execute('DELETE FROM event_media WHERE id = ?', [mediaId]);

    return res.json({ success: true, message: 'Media item deleted successfully.' });
  } catch (error: any) {
    console.error('[Delete Event Media Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event media.' });
  }
}

/**
 * Promote an existing media photo to primary event banner
 */
export async function setPrimaryBanner(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { id, mediaId } = req.params;

    const mediaRows = await query(`
      SELECT m.*, e.organizer_id 
      FROM event_media m
      JOIN events e ON m.event_id = e.id
      WHERE m.id = ? AND m.event_id = ?
    `, [mediaId, id]);

    if (mediaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    const mediaItem = mediaRows[0];
    if (req.user.role !== 'admin' && Number(mediaItem.organizer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to set banner for this event.' });
    }

    // Update event image
    await execute('UPDATE events SET image = ? WHERE id = ?', [mediaItem.image_url, id]);

    // Update media_type in event_media
    await execute("UPDATE event_media SET media_type = 'banner' WHERE id = ?", [mediaId]);

    return res.json({
      success: true,
      message: 'Event banner updated successfully.',
      bannerUrl: mediaItem.image_url,
    });
  } catch (error: any) {
    console.error('[Set Primary Banner Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event banner.' });
  }
}



