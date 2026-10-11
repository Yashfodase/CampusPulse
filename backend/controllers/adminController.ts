import { Response } from 'express';
import { query, execute } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { broadcastToEventAttendees } from '../services/websocketService.js';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Basic Counts
    const [
      studentCount,
      organizerCount,
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      attendedCount,
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role = 'student'"),
      query("SELECT COUNT(*) as count FROM users WHERE role = 'organizer'"),
      query("SELECT COUNT(*) as count FROM events"),
      query("SELECT COUNT(*) as count FROM events WHERE date >= ?", [today]),
      query("SELECT COUNT(*) as count FROM registrations WHERE status = 'confirmed'"),
      query("SELECT COUNT(*) as count FROM registrations WHERE attendance_status = 'present'"),
    ]);

    // Attendance Breakdown
    const attendanceStats = await query(`
      SELECT attendance_status, COUNT(*) as count 
      FROM registrations 
      WHERE status = 'confirmed'
      GROUP BY attendance_status
    `);

    // Category Distribution
    const categoryStats = await query(`
      SELECT c.name, COUNT(e.id) as count
      FROM categories c
      LEFT JOIN events e ON e.category_id = c.id
      GROUP BY c.id
      ORDER BY count DESC
    `);

    // Events by Status
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM events
      GROUP BY status
    `);

    // Recent 5 Registrations
    const recentRegistrations = await query(`
      SELECT 
        r.id,
        r.registration_date,
        r.status,
        r.attendance_status,
        u.name as student_name,
        u.email as student_email,
        e.title as event_title,
        e.date as event_date
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registration_date DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      stats: {
        totalStudents: studentCount[0]?.count || 0,
        totalOrganizers: organizerCount[0]?.count || 0,
        totalEvents: totalEvents[0]?.count || 0,
        upcomingEvents: upcomingEvents[0]?.count || 0,
        totalRegistrations: totalRegistrations[0]?.count || 0,
        attendedCount: attendedCount[0]?.count || 0,
        attendanceStats,
        categoryStats,
        statusStats,
        recentRegistrations,
      }
    });
  } catch (error: any) {
    console.error('[Admin Dashboard Stats Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin dashboard stats.' });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, q } = req.query;

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.created_at,
        (CASE 
          WHEN u.role = 'student' THEN (SELECT COUNT(*) FROM registrations r WHERE r.student_id = u.id AND r.status = 'confirmed')
          WHEN u.role = 'organizer' THEN (SELECT COUNT(*) FROM events e WHERE e.organizer_id = u.id)
          ELSE 0
        END) AS activity_count
      FROM users u
      WHERE 1=1
    `;

    const params: any[] = [];
    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    if (q && typeof q === 'string' && q.trim()) {
      const term = `%${q.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ?)';
      params.push(term, term, term);
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await query(sql, params);
    return res.json({ success: true, count: users.length, users });
  } catch (error: any) {
    console.error('[Admin Get Users Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (Number(id) === req.user?.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own admin status.' });
    }

    await execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    return res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (error: any) {
    console.error('[Admin Update User Role Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (Number(id) === req.user?.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const existing = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await execute('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'User account and associated records deleted.' });
  } catch (error: any) {
    console.error('[Admin Delete User Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

export async function updateEventStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const existing = await query('SELECT id, title, status FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const prevStatus = existing[0].status;
    await execute('UPDATE events SET status = ? WHERE id = ?', [status, id]);

    if (prevStatus !== status) {
      const isCancelled = status === 'cancelled' || status === 'rejected';
      broadcastToEventAttendees(Number(id), {
        type: 'event_update',
        title: isCancelled ? `⚠️ Event ${status.toUpperCase()}: ${existing[0].title}` : `Event Status: ${status.toUpperCase()}`,
        message: isCancelled 
          ? `The event "${existing[0].title}" has been updated to ${status} by campus administration.`
          : `The event "${existing[0].title}" has been ${status}. Check the event page for details.`,
      }).catch((err) => console.error('[Admin Event Update Broadcast Error]:', err));
    }

    return res.json({ success: true, message: `Event status updated to ${status}.` });
  } catch (error: any) {
    console.error('[Admin Update Event Status Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event status.' });
  }
}

export async function getAllRegistrations(req: AuthenticatedRequest, res: Response) {
  try {
    const { event_id, status, attendance_status } = req.query;

    let sql = `
      SELECT 
        r.id AS registration_id,
        r.registration_date,
        r.status AS registration_status,
        r.attendance_status,
        r.google_form_completed,
        u.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        u.phone AS student_phone,
        e.id AS event_id,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.google_form_url,
        c.name AS category_name
      FROM registrations r
      JOIN users u ON r.student_id = u.id
      JOIN events e ON r.event_id = e.id
      JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (event_id) {
      sql += ' AND r.event_id = ?';
      params.push(event_id);
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (attendance_status) {
      sql += ' AND r.attendance_status = ?';
      params.push(attendance_status);
    }

    sql += ' ORDER BY r.registration_date DESC';

    const registrations = await query(sql, params);
    return res.json({ success: true, count: registrations.length, registrations });
  } catch (error: any) {
    console.error('[Admin Get All Registrations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
}
