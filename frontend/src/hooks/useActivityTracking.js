import { useCallback } from 'react';
import activityService from '../services/activity.service';
import { useSelector } from 'react-redux';
import { selectSelectedBranch } from '../store/slices/branch.slice';

export const useActivityTracking = () => {
  const selectedBranch = useSelector(selectSelectedBranch);

  const trackActivity = useCallback(async (data) => {
    try {
      await activityService.recordActivity({
        ...data,
        branchId: selectedBranch?._id,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }, [selectedBranch]);

  const trackPageView = useCallback((page, metadata = {}) => {
    return trackActivity({
      type: 'view',
      title: `Viewed ${page}`,
      description: `Accessed the ${page} page`,
      category: 'navigation',
      metadata: {
        page,
        ...metadata
      }
    });
  }, [trackActivity]);

  const trackRoomAction = useCallback((action, room, details = {}) => {
    return trackActivity({
      type: action,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} room ${room.roomNumber}`,
      description: details.description || `${action.charAt(0).toUpperCase() + action.slice(1)}d room ${room.roomNumber}`,
      category: 'room',
      entityType: 'room',
      entityId: room._id,
      entityName: `Room ${room.roomNumber}`,
      metadata: {
        roomId: room._id,
        roomNumber: room.roomNumber,
        action,
        ...details
      }
    });
  }, [trackActivity]);

  const trackResidentAction = useCallback((action, resident, details = {}) => {
    return trackActivity({
      type: action,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} resident ${resident.firstName} ${resident.lastName}`,
      description: details.description || `${action.charAt(0).toUpperCase() + action.slice(1)}d resident ${resident.firstName} ${resident.lastName}`,
      category: 'resident',
      entityType: 'resident',
      entityId: resident._id,
      entityName: `${resident.firstName} ${resident.lastName}`,
      metadata: {
        residentId: resident._id,
        residentName: `${resident.firstName} ${resident.lastName}`,
        action,
        ...details
      }
    });
  }, [trackActivity]);

  const trackPaymentAction = useCallback((action, payment, details = {}) => {
    return trackActivity({
      type: action,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} payment ${payment.paymentId}`,
      description: details.description || `${action.charAt(0).toUpperCase() + action.slice(1)}d payment ${payment.paymentId}`,
      category: 'payment',
      entityType: 'payment',
      entityId: payment._id,
      entityName: `Payment ${payment.paymentId}`,
      metadata: {
        paymentId: payment._id,
        paymentNumber: payment.paymentId,
        amount: payment.amount,
        action,
        ...details
      }
    });
  }, [trackActivity]);

  const trackSettingsAction = useCallback((action, settings, details = {}) => {
    return trackActivity({
      type: action,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} settings`,
      description: details.description || `${action.charAt(0).toUpperCase() + action.slice(1)}d settings configuration`,
      category: 'settings',
      metadata: {
        settingsType: settings.type,
        action,
        ...details
      }
    });
  }, [trackActivity]);

  const trackError = useCallback((error, context, metadata = {}) => {
    return trackActivity({
      type: 'error',
      title: `Error: ${context}`,
      description: error.message || 'An error occurred',
      category: 'error',
      priority: 'high',
      status: 'failed',
      metadata: {
        error: error.toString(),
        stack: error.stack,
        context,
        ...metadata
      }
    });
  }, [trackActivity]);

  return {
    trackActivity,
    trackPageView,
    trackRoomAction,
    trackResidentAction,
    trackPaymentAction,
    trackSettingsAction,
    trackError
  };
};
