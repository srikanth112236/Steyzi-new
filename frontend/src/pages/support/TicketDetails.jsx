import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Send, Play, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const SupportTicketDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [statusToSet, setStatusToSet] = useState('in_progress');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ticketService.getTicketById(id);
        if (res?.success) setTicket(res.data);
      } catch (e) {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBack = () => navigate('/support/tickets');

  const postComment = async () => {
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
  };

  const updateStatus = async () => {
    if (!statusToSet) return;
    try {
      setSaving(true);
      const res = await ticketService.updateTicketStatus(id, statusToSet, feedback);
      if (res?.success) {
        setTicket(res.data);
        toast.success('Status updated');
      } else {
        toast.error(res?.message || 'Failed to update status');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
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
        <button onClick={handleBack} className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket._id?.slice(-6)}</h1>
            <p className="text-gray-600">{ticket.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {(ticket.status === 'open' && <AlertCircle className="h-4 w-4 mr-1" />) ||
             (ticket.status === 'in_progress' && <Clock className="h-4 w-4 mr-1" />) ||
             (ticket.status === 'resolved' && <CheckCircle className="h-4 w-4 mr-1" />) ||
             (ticket.status === 'closed' && <XCircle className="h-4 w-4 mr-1" />)}
            <span className="capitalize">{ticket.status?.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Overview + Comments */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-700 mb-1"><Calendar className="h-4 w-4 mr-2 text-green-600" />Created</div>
                <div className="text-sm font-semibold">{new Date(ticket?.createdAt).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-700 mb-1">Category</div>
                    <div className="text-sm font-semibold capitalize">{ticket?.category}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-700 mb-1">Priority</div>
                <div className="text-sm font-semibold capitalize">{ticket?.priority}</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{ticket?.description}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Comments</h3>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(ticket?.comments || []).length === 0 ? (
                <div className="text-sm text-gray-500">No comments yet.</div>
              ) : (
                ticket?.comments
                  ?.slice()
                  .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((c, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-800">
                          {c?.author?.firstName} {c?.author?.lastName}
                          <span className="ml-2 text-xs text-gray-500 uppercase">{c.authorRole}</span>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(c?.createdAt).toLocaleString()}</div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c?.message}</p>
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
              <button onClick={postComment} disabled={saving || !newComment.trim()} className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Send className="h-4 w-4 mr-2" /> Post
              </button>
            </div>
          </div>
        </div>

        {/* Right: Status Update */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
          <h3 className="font-semibold mb-3">Update Status</h3>
          {(ticket?.status === 'resolved' || ticket?.status === 'closed') ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm mb-3">
              Cannot change status. Ticket is {ticket.status.replace('_', ' ')}.
            </div>
          ) : (
            <Select value={statusToSet} onValueChange={setStatusToSet}>
              <SelectTrigger className="w-full mb-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {/* Only show valid status transitions */}
                {ticket?.status === 'open' && (
                  <SelectItem value="in_progress">In Progress - Start working</SelectItem>
                )}
                {(ticket?.status === 'open' || ticket?.status === 'in_progress') && (
                  <>
                    <SelectItem value="resolved">Resolved - Work completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
            placeholder="Feedback / Work details (required for resolved/closed)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
          />
          <div className="flex justify-end">
            {(ticket?.status === 'resolved' || ticket?.status === 'closed') ? (
              <div className="text-sm text-gray-600 text-center py-2">
                This ticket cannot be updated. Contact admin to reopen if needed.
              </div>
            ) : (
              <button onClick={updateStatus} disabled={saving || !statusToSet} className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {statusToSet === 'in_progress' ? <Play className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetails;


