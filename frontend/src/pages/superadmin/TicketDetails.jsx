import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertCircle, 
  XCircle, 
  Users, 
  AlertTriangle, 
  Send, 
  MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';

// Shadcn UI Components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "../../components/ui/select";
// Using simple HTML elements instead of UI library components

/**
 * TicketDetails
 * Superadmin-focused ticket details page that consolidates:
 * - Overview (read-only details and timeline link placeholder)
 * - Assign to support staff (fetches support staff list and assigns)
 * - Priority update (set Low, Medium, High, Urgent)
 * Includes a back button to the tickets list.
 */
const TicketDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [supportStaff, setSupportStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [priorityLevels, setPriorityLevels] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  const activeSection = useMemo(() => searchParams.get('section') || 'overview', [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [ticketRes, prioRes] = await Promise.all([
          ticketService.getTicketById(id),
          ticketService.getPriorityLevels()
        ]);

        if (isMounted) {
          if (ticketRes?.success) {
            setTicket(ticketRes.data);
            setSelectedPriority(ticketRes.data?.priority || '');
            setSelectedStaffId(ticketRes.data?.assignedTo?._id || '');
          }
          setPriorityLevels(prioRes?.data || []);
        }
      } catch (error) {
        toast.error('Failed to load ticket');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load support staff only when Assign tab is active
  useEffect(() => {
    if (activeSection !== 'assign') return;
    let isMounted = true;
    const loadStaff = async () => {
      try {
        setStaffLoading(true);
        const res = await ticketService.getSupportStaff();
        if (isMounted && res?.success) {
          setSupportStaff(res.data || []);
        }
      } catch (e) {
        toast.error('Failed to fetch support staff');
      } finally {
        if (isMounted) setStaffLoading(false);
      }
    };
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [activeSection]);

  const handleBack = () => navigate('/superadmin/tickets');

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast.error('Select a support staff member');
      return;
    }
    try {
      setSaving(true);
      const res = await ticketService.assignTicket(id, selectedStaffId);
      if (res?.success) {
        toast.success('Ticket assigned');
        setTicket(res.data);
        setSearchParams({ section: 'overview' });
      } else {
        toast.error(res?.message || 'Failed to assign ticket');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedPriority) return;
    try {
      setSaving(true);
      const res = await ticketService.updateTicket(id, { priority: selectedPriority });
      if (res?.success) {
        toast.success('Priority updated');
        setTicket(res.data);
        setSearchParams({ section: 'overview' });
      } else {
        toast.error(res?.message || 'Failed to update priority');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update priority');
    } finally {
      setSaving(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening');
      return;
    }
    try {
      setSaving(true);
      const res = await ticketService.reopenTicket(id, reopenReason.trim());
      if (res?.success) {
        toast.success('Ticket reopened successfully');
        // Navigate to the new reopened ticket
        navigate(`/superadmin/tickets/${res.data._id}`);
      } else {
        toast.error(res?.message || 'Failed to reopen ticket');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to reopen ticket');
    } finally {
      setSaving(false);
      setShowReopenDialog(false);
      setReopenReason('');
    }
  };

  const getStatusIcon = (status) => {
    const map = {
      open: <AlertCircle className="h-4 w-4 text-blue-600" />,
      in_progress: <Clock className="h-4 w-4 text-yellow-600" />,
      resolved: <CheckCircle className="h-4 w-4 text-green-600" />,
      closed: <CheckCircle className="h-4 w-4 text-gray-600" />,
      cancelled: <XCircle className="h-4 w-4 text-red-600" />
    };
    return map[status] || <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Ticket not found</p>
        <button onClick={handleBack} className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket?._id?.slice(-6)}</h1>
            <p className="text-gray-600">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {getStatusIcon(ticket.status)}
            <span className="ml-1.5 capitalize">{(ticket.status || '').replace('_', ' ')}</span>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-current mr-2" />{ticket.priority}
          </span>
          {ticket.status === 'closed' && (
            <button
              onClick={() => setShowReopenDialog(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              🔄 Reopen Ticket
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 pt-4">
          <div className="flex items-center space-x-2">
            {['overview', 'assign', 'priority'].map((s) => (
              <button
                key={s}
                onClick={() => setSearchParams({ section: s })}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${activeSection === s ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {s === 'overview' && 'Overview'}
                {s === 'assign' && 'Assign'}
                {s === 'priority' && 'Priority'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-1"><Calendar className="h-4 w-4 mr-2 text-green-600" />Created</div>
                  <div className="text-sm font-semibold">{new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-1"><Users className="h-4 w-4 mr-2 text-purple-600" />Created By</div>
                  <div className="text-sm font-semibold">{ticket.user?.firstName} {ticket.user?.lastName}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-gray-700 mb-1"><MapPin className="h-4 w-4 mr-2 text-orange-600" />PG</div>
                  <div className="text-sm font-semibold">{ticket.pg?.name || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold">DESCRIPTION</p>
                <p className="mt-1 text-sm text-blue-900 leading-relaxed">{ticket.description}</p>
              </div>

              {ticket.assignedTo && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs text-green-600 font-semibold">ASSIGNED TO</p>
                  <p className="mt-1 text-sm text-green-900 font-bold">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</p>
                </div>
              )}

              {/* Comments Thread */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center mb-3">
                  <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Comments</h3>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(ticket.comments || []).length === 0 ? (
                    <div className="text-sm text-gray-500">No comments yet.</div>
                  ) : (
                    ticket.comments
                      .slice()
                      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((c, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-800">
                              {c.author?.firstName} {c.author?.lastName}
                              <span className="ml-2 text-xs text-gray-500 uppercase">{c.authorRole}</span>
                            </div>
                            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.message}</p>
                        </div>
                      ))
                  )}
                </div>
                <div className="mt-4 flex items-end space-x-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <button
                    onClick={async () => {
                      if (!newComment.trim()) return;
                      try {
                        setSaving(true);
                        const res = await ticketService.addComment(id, newComment.trim());
                        if (res?.success) {
                          setTicket(res.data);
                          setNewComment('');
                          toast.success('Comment added');
                        } else {
                          toast.error(res?.message || 'Failed to add comment');
                        }
                      } catch (e) {
                        toast.error(e.message || 'Failed to add comment');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !newComment.trim()}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" /> Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'assign' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">Assign this ticket to an active support staff member.</div>
              {staffLoading ? (
                <div className="py-6 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-3 text-gray-600">Loading staff...</p>
                </div>
              ) : supportStaff.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No active support staff available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select
                    value={selectedStaffId}
                    onValueChange={(value) => setSelectedStaffId(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Support Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Support Staff</SelectLabel>
                        {supportStaff.map((u) => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAssign}
                      disabled={saving || !selectedStaffId}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Users className="h-4 w-4 mr-2" /> Assign Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'priority' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">Set a new priority level for this ticket.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorityLevels.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPriority(p.value)}
                    className={`flex items-start p-4 rounded-lg border text-left transition-colors ${selectedPriority === p.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <AlertTriangle className={`h-5 w-5 mr-3 ${p.value === 'low' ? 'text-green-600' : p.value === 'medium' ? 'text-yellow-600' : p.value === 'high' ? 'text-orange-600' : 'text-red-600'}`} />
                    <div>
                      <div className="font-semibold capitalize">{p.label || p.value}</div>
                      <div className="text-xs text-gray-600">{p.description || ''}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePriorityUpdate}
                  disabled={saving || !selectedPriority}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" /> Update Priority
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reopen Ticket Modal */}
      {showReopenDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Reopen Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will create a new ticket with the same details. The original ticket will remain closed for reference.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reopening <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={4}
                placeholder="Please provide a detailed reason for reopening this ticket..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReopenDialog(false);
                  setReopenReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleReopenTicket}
                disabled={saving || !reopenReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Reopening...' : 'Reopen Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;


