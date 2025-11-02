import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import api from '../../services/api';
import { Mail, Send, Save } from 'lucide-react';

const ExpenseSettings = () => {
  const [settings, setSettings] = useState({
    monthlyReportEmail: '',
    monthlyReportsEnabled: true,
    reportDay: 25
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/expense-settings');
      if (response.data.success) {
        setSettings(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch settings');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/expense-settings', settings);
      if (response.data.success) {
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestReport = async () => {
    if (!settings.monthlyReportEmail) {
      setError('Please enter an email address first');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await api.post('/expense-settings/send-report', {
        year,
        month,
        email: settings.monthlyReportEmail
      });

      if (response.data.success) {
        setSuccess('Test report sent successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to send test report');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send test report');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Expense Report Settings</h2>
        <p className="text-gray-600 text-sm">
          Configure monthly expense report email settings. Reports will be sent automatically on the configured day of each month.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Monthly Report Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email"
              type="email"
              value={settings.monthlyReportEmail}
              onChange={(e) => handleChange('monthlyReportEmail', e.target.value)}
              placeholder="admin@example.com"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">
            Email address where monthly expense reports will be sent
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportDay">Report Day of Month</Label>
          <Input
            id="reportDay"
            type="number"
            min="1"
            max="31"
            value={settings.reportDay}
            onChange={(e) => handleChange('reportDay', parseInt(e.target.value) || 25)}
            placeholder="25"
          />
          <p className="text-xs text-gray-500">
            Day of each month when the expense report will be sent (1-31)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enabled"
            checked={settings.monthlyReportsEnabled}
            onChange={(e) => handleChange('monthlyReportsEnabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <Label htmlFor="enabled" className="cursor-pointer">
            Enable automatic monthly expense reports
          </Label>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button
              variant="outline"
              onClick={handleSendTestReport}
              disabled={sending || !settings.monthlyReportEmail}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Test Report'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use "Send Test Report" to manually trigger a monthly report email for the current month
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How It Works:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Reports are automatically sent on the configured day each month (default: 25th)</li>
            <li>• Each email contains two PDF attachments:</li>
            <li>  - Monthly Expense Report: Detailed breakdown of all expenses for the month</li>
            <li>  - Comparison Report: Comparison with previous month showing increases/decreases</li>
            <li>• Reports are sent for the previous month (the month that just ended)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSettings;

