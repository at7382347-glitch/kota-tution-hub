import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : import.meta.env.VITE_API_URL;

const FEE_PACKAGES = {
  '1hr-10000': '1 hr — ₹10,000/mo',
  '1.5hr-15000': '1.5 hr — ₹15,000/mo',
  '2hr-20000': '2 hr — ₹20,000/mo',
  // legacy IDs
  '1hr-5000': '1 hr — ₹5,000/mo',
  '1.5hr-8000': '1.5 hr — ₹8,000/mo',
  '2hr-10000': '2 hr — ₹10,000/mo',
};

const BUDGET_PACKAGES = {
  '1hr-10000': '1 hr — ₹10,000/mo',
  '1.5hr-15000': '1.5 hr — ₹15,000/mo',
  '2hr-20000': '2 hr — ₹20,000/mo',
  // legacy IDs
  '1hr-5000': '1 hr — ₹5,000/mo',
  '1.5hr-8000': '1.5 hr — ₹8,000/mo',
  '2hr-10000': '2 hr — ₹10,000/mo',
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for assigning teachers to general requests
  const [editingId, setEditingId] = useState(null);
  const [assignName, setAssignName] = useState('');
  const [assignContact, setAssignContact] = useState('');
  
  // State for demo scheduling
  const [schedulingId, setSchedulingId] = useState(null);
  const [demoDateInput, setDemoDateInput] = useState('');
  const [demoNotesInput, setDemoNotesInput] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, reqsRes, teachersRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`),
        fetch(`${API_BASE}/api/requests`),
        fetch(`${API_BASE}/api/users/teachers`),
        fetch(`${API_BASE}/api/users/students`),
      ]);

      if (!statsRes.ok || !reqsRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const statsData = await statsRes.json();
      const reqsData = await reqsRes.json();
      const teachersData = teachersRes.ok ? await teachersRes.json() : [];
      const studentsData = studentsRes.ok ? await studentsRes.json() : [];

      setStats(statsData);
      setRequests(reqsData);
      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        // Optimistically update local state instead of re-fetching everything
        setRequests(prev => prev.map(r => 
          r._id === requestId ? { ...r, status: newStatus } : r
        ));
        
        // Optionally refresh stats
        fetch(`${API_BASE}/api/admin/stats`)
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(err => console.error("Stats refresh error", err));
          
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Network error while updating status');
    }
  };

  const handleAssignTeacher = async (requestId) => {
    if (!assignName.trim()) {
      alert('Teacher name is required');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacherName: assignName.trim(), 
          teacherContactNumber: assignContact.trim() 
        }),
      });
      
      if (res.ok) {
        setRequests(prev => prev.map(r => 
          r._id === requestId ? { 
            ...r, 
            teacherName: assignName.trim(), 
            teacherContactNumber: assignContact.trim() 
          } : r
        ));
        setEditingId(null);
        setAssignName('');
        setAssignContact('');
      } else {
        alert('Failed to assign teacher');
      }
    } catch (err) {
      console.error('Assign teacher error:', err);
      alert('Network error while assigning teacher');
    }
  };

  const handleDemoUpdate = async (requestId, demoStatus, demoDate = null, demoNotes = null) => {
    try {
      let bodyData = {};
      if (demoStatus) bodyData.demoStatus = demoStatus;
      if (demoDate) bodyData.demoDate = demoDate;
      if (demoNotes !== null) bodyData.demoNotes = demoNotes;

      const res = await fetch(`${API_BASE}/api/admin/requests/${requestId}/demo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      
      if (res.ok) {
        const updatedReq = await res.json();
        setRequests(prev => prev.map(r => r._id === requestId ? updatedReq : r));
        setSchedulingId(null);
        setDemoDateInput('');
        setDemoNotesInput('');
        
        fetch(`${API_BASE}/api/admin/stats`)
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(err => console.error("Stats refresh error", err));
      } else {
        alert('Failed to update demo');
      }
    } catch (err) {
      console.error('Demo update error:', err);
      alert('Network error while updating demo');
    }
  };

  const handleDeleteUser = async (firebaseUid, name, role) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone and they will need to create a new profile if they return.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${firebaseUid}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'User deleted successfully.');
        
        // Remove from local state immediately
        if (role === 'teacher') {
          setTeachers(prev => prev.filter(t => t.firebaseUid !== firebaseUid));
        } else if (role === 'student') {
          setStudents(prev => prev.filter(s => s.firebaseUid !== firebaseUid));
        }
        
        // Refresh stats/requests in background since requests might have been deleted
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Failed to delete user: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Network error while deleting user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sandstone flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-marigold border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sandstone flex items-center justify-center text-maroon font-body">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sandstone py-8 px-4 sm:px-8">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-ink text-2xl font-bold">Admin Dashboard</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('adminLoggedIn');
              navigate('/admin/login', { replace: true });
            }}
            className="text-sm font-body text-ink/60 hover:text-maroon font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard title="Total Teachers" value={stats.totalTeachers} />
            <StatCard title="Total Students" value={stats.totalStudents} />
            <StatCard title="Total Requests" value={stats.totalRequests} />
            <StatCard title="Pending Req" value={stats.statusCounts.pending} color="text-marigold" />
            <StatCard title="Demos Sch." value={stats.demoCounts?.scheduled || 0} color="text-blue-600" />
            <StatCard title="Converted" value={stats.demoCounts?.converted || 0} color="text-sage" />
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 p-1 mb-6 overflow-x-auto">
          {[
            { key: 'requests', label: 'Requests', count: requests.length },
            { key: 'teachers', label: 'Teachers', count: teachers.length },
            { key: 'students', label: 'Students', count: students.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer font-body whitespace-nowrap flex items-center justify-center ${
                activeTab === tab.key
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink/50 hover:text-ink hover:bg-sandstone'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-ink/80 text-white/80' : 'bg-ink/8 text-ink/50'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══ TAB: Requests ═══ */}
        {activeTab === 'requests' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/8">
            <h2 className="font-display text-ink text-lg font-semibold">Tuition Requests</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[1000px]">
              <thead className="bg-sandstone/70 text-ink/50 text-xs uppercase font-medium font-display">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Teacher Requested</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Demo Status</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-ink/40 font-body">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map(req => (
                    <tr key={req._id} className="hover:bg-sandstone/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-ink/50 font-body text-sm">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-ink font-body">
                        {req.studentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-ink/70 text-sm">
                        {req.studentContactNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-ink/70 font-body">
                        {req.requestType === 'general' && !req.teacherName ? (
                          editingId === req._id ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <input 
                                type="text" 
                                placeholder="Teacher Name" 
                                value={assignName}
                                onChange={e => setAssignName(e.target.value)}
                                className="text-xs border border-ink/15 rounded px-2 py-1 focus:ring-1 focus:ring-marigold outline-none font-body text-ink"
                              />
                              <input 
                                type="text" 
                                placeholder="Contact Number (optional)" 
                                value={assignContact}
                                onChange={e => setAssignContact(e.target.value)}
                                className="text-xs border border-ink/15 rounded px-2 py-1 focus:ring-1 focus:ring-marigold outline-none font-mono text-ink"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleAssignTeacher(req._id)}
                                  className="text-[10px] bg-marigold text-ink px-2 py-1 rounded hover:bg-marigold/90 cursor-pointer font-body font-semibold"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingId(null)}
                                  className="text-[10px] bg-ink/10 text-ink/70 px-2 py-1 rounded hover:bg-ink/15 cursor-pointer font-body"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <span className="bg-marigold/15 text-marigold text-[11px] px-2 py-0.5 rounded font-medium font-body">
                                Not assigned - needs matching
                              </span>
                              <button 
                                onClick={() => {
                                  setEditingId(req._id);
                                  setAssignName('');
                                  setAssignContact('');
                                }}
                                className="text-[11px] text-marigold hover:text-marigold/80 font-medium cursor-pointer font-body"
                              >
                                Assign Teacher
                              </button>
                            </div>
                          )
                        ) : (
                          <div>
                            <div className="font-medium text-ink font-body">{req.teacherName || 'Unknown'}</div>
                            {req.teacherContactNumber && (
                              <div className="text-xs font-mono text-ink/50">{req.teacherContactNumber}</div>
                            )}
                            {req.requestType === 'direct' && (
                              <div className="text-[10px] text-blue-600 font-medium mt-0.5">Direct Request</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-marigold/10 text-marigold px-2.5 py-1 rounded-full text-xs font-medium font-body">
                          {req.subject || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {req.demoStatus === 'not_scheduled' && req.teacherName ? (
                          schedulingId === req._id ? (
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              <input 
                                type="datetime-local" 
                                value={demoDateInput}
                                onChange={e => setDemoDateInput(e.target.value)}
                                className="text-xs border border-ink/15 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-marigold font-body text-ink"
                              />
                              <div className="flex gap-1">
                                <button onClick={() => handleDemoUpdate(req._id, 'scheduled', demoDateInput)} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-body">Save</button>
                                <button onClick={() => setSchedulingId(null)} className="text-[10px] bg-ink/10 text-ink/70 px-2 py-1 rounded hover:bg-ink/15 font-body">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setSchedulingId(req._id)} className="text-[11px] font-medium font-body bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200">
                              Schedule Demo
                            </button>
                          )
                        ) : req.demoStatus === 'scheduled' ? (
                          <div className="flex flex-col gap-1 min-w-[160px]">
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                              Sch: {req.demoDate ? new Date(req.demoDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                            </span>
                            {schedulingId === req._id ? (
                              <div className="flex flex-col gap-1 mt-1">
                                <textarea 
                                  placeholder="Notes (optional)" 
                                  value={demoNotesInput}
                                  onChange={e => setDemoNotesInput(e.target.value)}
                                  className="text-xs border rounded p-1 focus:ring-1 focus:ring-marigold outline-none font-body text-ink border-ink/15"
                                />
                                <div className="flex gap-1">
                                  <button onClick={() => handleDemoUpdate(req._id, 'completed', null, demoNotesInput)} className="text-[10px] bg-marigold text-ink font-semibold px-2 py-1 rounded font-body">Mark Completed</button>
                                  <button onClick={() => setSchedulingId(null)} className="text-[10px] bg-ink/10 text-ink/70 px-2 py-1 rounded font-body">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setSchedulingId(req._id); setDemoNotesInput(''); }} className="text-[10px] underline text-ink/40 hover:text-ink/70 w-fit font-body">
                                Update Status
                              </button>
                            )}
                          </div>
                        ) : req.demoStatus === 'completed' ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-marigold bg-marigold/10 px-2 py-0.5 rounded w-fit font-body">Completed</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleDemoUpdate(req._id, 'converted')} className="text-[10px] bg-sage text-white px-2 py-1 rounded hover:bg-sage/90 font-body">Converted</button>
                              <button onClick={() => handleDemoUpdate(req._id, 'not_converted')} className="text-[10px] bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 font-body">Not Converted</button>
                            </div>
                          </div>
                        ) : (
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap
                            ${req.demoStatus === 'converted' ? 'bg-sage/15 text-sage' : ''}
                            ${req.demoStatus === 'not_converted' ? 'bg-red-100 text-red-700' : ''}
                            ${req.demoStatus === 'not_scheduled' ? 'bg-ink/8 text-ink/50' : ''}
                          `}>
                            {req.demoStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                        {req.demoNotes && <div className="text-[10px] text-ink/30 mt-1 truncate max-w-[140px] font-body" title={req.demoNotes}>{req.demoNotes}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border focus:ring-2 focus:outline-none cursor-pointer font-body
                            ${req.status === 'pending' ? 'bg-marigold/10 text-marigold border-marigold/30 focus:ring-marigold' : ''}
                            ${req.status === 'contacted' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' : ''}
                            ${req.status === 'closed' ? 'bg-ink/8 text-ink/50 border-ink/15 focus:ring-ink/30' : ''}
                          `}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* ═══ TAB: Teachers ═══ */}
        {activeTab === 'teachers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-ink text-lg font-semibold">All Teachers</h2>
              <span className="text-sm font-body text-ink/50">Total Teachers: {teachers.length}</span>
            </div>

            {teachers.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 p-8 text-center text-ink/40 font-body">
                No teachers have completed their profile yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachers.map((t) => {
                  const p = t.teacherProfile || {};
                  const photoUrl = p.profilePhoto ? `${API_BASE}${p.profilePhoto}` : null;
                  return (
                      <div key={t.firebaseUid || t._id} className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 p-5 group">
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(t.firebaseUid, t.name || 'this teacher', 'teacher')}
                          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-maroon/60 hover:text-maroon hover:bg-maroon/10 p-2 sm:p-1.5 rounded-lg transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0"
                          title="Delete Teacher"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>

                        {/* Header: photo + name */}
                        <div className="flex gap-4 mb-4 pr-8">
                          {photoUrl ? (
                            <img src={photoUrl} alt={t.name} className="w-16 h-16 rounded-xl object-cover border border-ink/10 flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-marigold/15 flex items-center justify-center text-marigold text-xl font-bold flex-shrink-0 font-display">
                            {(t.name || 'T').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold font-display text-ink truncate">{t.name || 'Unnamed'}</h3>
                          <p className="text-xs font-body text-ink/50">{p.qualification || '—'}</p>
                          <p className="text-xs font-body text-ink/50">{p.experience > 0 ? `${p.experience} yr${p.experience > 1 ? 's' : ''} exp` : 'New teacher'}</p>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Contact</p>
                          <p className="text-ink font-medium text-xs font-mono">{p.contactNumber || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Area</p>
                          <p className="text-ink font-medium text-xs capitalize font-body">{p.area || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Mode</p>
                          <p className="text-ink font-medium text-xs capitalize font-body">{p.mode === 'both' ? 'Offline + Online' : p.mode || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Subjects</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(p.subjects || []).map((s) => (
                              <span key={s} className="bg-marigold/10 text-marigold text-[10px] px-1.5 py-0.5 rounded-full font-body">{s}</span>
                            ))}
                            {(!p.subjects || p.subjects.length === 0) && <span className="text-ink/30 text-xs">—</span>}
                          </div>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Classes</p>
                          <p className="text-ink text-xs font-body">{(p.classLevels || []).join(', ') || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Fee Packages</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(p.feePackages || []).map((pkg) => (
                              <span key={pkg} className="bg-marigold/10 text-marigold text-[10px] px-1.5 py-0.5 rounded-full font-mono">{FEE_PACKAGES[pkg] || pkg}</span>
                            ))}
                            {(!p.feePackages || p.feePackages.length === 0) && <span className="text-ink/30 text-xs">—</span>}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {p.bio && (
                        <div className="mt-3 pt-3 border-t border-ink/8">
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide mb-1">Bio</p>
                          <p className="text-xs text-ink/60 leading-relaxed font-body">{p.bio}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Students ═══ */}
        {activeTab === 'students' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-ink text-lg font-semibold">All Students</h2>
              <span className="text-sm font-body text-ink/50">Total Students: {students.length}</span>
            </div>

            {students.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 p-8 text-center text-ink/40 font-body">
                No students have completed their requirement yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((s) => {
                  const r = s.studentRequirement || {};
                  return (
                    <div key={s.firebaseUid} className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-ink/8 p-5 group">
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(s.firebaseUid, s.name || 'this student', 'student')}
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 text-maroon/60 hover:text-maroon hover:bg-maroon/10 p-2 sm:p-1.5 rounded-lg transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0"
                        title="Delete Student"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4 pr-8">
                        <div className="w-10 h-10 rounded-full bg-sage/15 flex items-center justify-center text-sage text-sm font-bold flex-shrink-0 font-display">
                          {(s.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold font-display text-ink truncate">{s.name || 'Unnamed'}</h3>
                          <p className="text-xs font-body text-ink/50">Class {r.classLevel || '—'}</p>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Contact</p>
                          <p className="text-ink font-medium text-xs font-mono">{r.contactNumber || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Area</p>
                          <p className="text-ink font-medium text-xs capitalize font-body">{r.area || '—'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Mode</p>
                          <p className="text-ink font-medium text-xs capitalize font-body">{r.mode || 'Offline'}</p>
                        </div>
                        <div>
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Subjects Needed</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(r.subjects || []).map((sub) => (
                              <span key={sub} className="bg-marigold/10 text-marigold text-[10px] px-1.5 py-0.5 rounded-full font-body">{sub}</span>
                            ))}
                            {(!r.subjects || r.subjects.length === 0) && <span className="text-ink/30 text-xs">—</span>}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide">Budget Packages</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(r.budgetPackages || []).map((pkg) => (
                              <span key={pkg} className="bg-marigold/10 text-marigold text-[10px] px-1.5 py-0.5 rounded-full font-mono">{BUDGET_PACKAGES[pkg] || pkg}</span>
                            ))}
                            {(!r.budgetPackages || r.budgetPackages.length === 0) && <span className="text-ink/30 text-xs">—</span>}
                          </div>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {r.additionalNotes && (
                        <div className="mt-3 pt-3 border-t border-ink/8">
                          <p className="font-display text-ink/40 text-[10px] uppercase tracking-wide mb-1">Additional Notes</p>
                          <p className="text-xs text-ink/60 leading-relaxed font-body">{r.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color = 'text-ink' }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-ink/8">
      <p className="text-xs font-medium font-display text-ink/40 uppercase tracking-wide">{title}</p>
      <p className={`text-3xl font-bold font-mono mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default AdminDashboard;
