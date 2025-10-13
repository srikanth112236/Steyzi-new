import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPlan, selectRestrictions, selectCurrentUsage } from '../store/slices/subscription.slice';
import { selectUser } from '../store/slices/authSlice';
import api from '../services/api';

/**
 * Custom hook to check bed limits before adding beds/rooms
 * @returns {Object} Bed limit check functions and state
 */
export const useBedLimitCheck = () => {
  const currentPlan = useSelector(selectCurrentPlan);
  const restrictions = useSelector(selectRestrictions);
  const currentUsage = useSelector(selectCurrentUsage);
  const user = useSelector(selectUser);

  // Check if user is in onboarding mode or has trial subscription
  // Allow unlimited access during onboarding (no subscription) or during trial period
  const isInOnboarding = !user?.subscription?.status ||
                        user?.subscription?.billingCycle === 'trial' ||
                        !currentPlan;

  const [showExceededModal, setShowExceededModal] = useState(false);
  const [exceededData, setExceededData] = useState(null);

  /**
   * Get current bed limit
   */
  const getCurrentBedLimit = useCallback(() => {
    // During onboarding, allow unlimited beds (use a high number)
    if (isInOnboarding) return 9999;

    if (!currentPlan) return 0;

    // Check if there's custom pricing with increased beds
    const customMaxBeds = currentPlan.customPricing?.maxBedsAllowed;
    if (customMaxBeds) return customMaxBeds;

    // Otherwise use plan's max beds or base bed count
    return restrictions.maxBeds || currentPlan.baseBedCount || 0;
  }, [currentPlan, restrictions.maxBeds, isInOnboarding]);

  /**
   * Get current beds used
   */
  const getCurrentBedsUsed = useCallback(() => {
    // During onboarding, beds used is 0
    if (isInOnboarding) return 0;

    return currentUsage.bedsUsed || 0;
  }, [currentUsage.bedsUsed, isInOnboarding]);

  /**
   * Get remaining beds available
   */
  const getRemainingBeds = useCallback(() => {
    // During onboarding, return unlimited beds
    if (isInOnboarding) return 9999;

    const limit = getCurrentBedLimit();
    const used = getCurrentBedsUsed();
    return Math.max(0, limit - used);
  }, [getCurrentBedLimit, getCurrentBedsUsed, isInOnboarding]);

  /**
   * Check if adding beds would exceed limit
   * @param {number} bedsToAdd - Number of beds to add
   * @returns {Object} Check result
   */
  const checkBedLimit = useCallback((bedsToAdd = 1) => {
    // During onboarding, always allow
    if (isInOnboarding) {
      return {
        canAdd: true,
        exceeded: false,
        limit: 9999,
        used: 0,
        bedsToAdd,
        newTotal: bedsToAdd,
        remaining: 9999,
        bedsNeeded: 0
      };
    }

    const limit = getCurrentBedLimit();
    const used = getCurrentBedsUsed();
    const newTotal = used + bedsToAdd;
    const exceeded = newTotal > limit;

    return {
      canAdd: !exceeded,
      exceeded,
      limit,
      used,
      bedsToAdd,
      newTotal,
      remaining: Math.max(0, limit - used),
      bedsNeeded: exceeded ? newTotal - limit : 0
    };
  }, [getCurrentBedLimit, getCurrentBedsUsed, isInOnboarding]);

  /**
   * Check bed limit and show modal if exceeded
   * @param {number} bedsToAdd - Number of beds to add
   * @returns {Promise<boolean>} True if can proceed, false if exceeded
   */
  const checkAndShowModal = useCallback(async (bedsToAdd = 1) => {
    // During onboarding, always allow without showing modal
    if (isInOnboarding) {
      return true;
    }

    const check = checkBedLimit(bedsToAdd);

    if (check.exceeded) {
      setExceededData({
        requestedBeds: bedsToAdd,
        currentBedsUsed: check.used,
        maxBeds: check.limit,
        bedsNeeded: check.bedsNeeded
      });
      setShowExceededModal(true);
      return false;
    }

    return true;
  }, [checkBedLimit, isInOnboarding]);

  /**
   * Calculate beds from room configuration
   * @param {Object} roomData - Room data with bed numbers
   * @returns {number} Total beds count
   */
  const calculateBedsFromRooms = useCallback((roomData) => {
    if (Array.isArray(roomData)) {
      // Array of rooms (bulk upload)
      return roomData.reduce((total, room) => {
        return total + (parseInt(room.bedNumber) || parseInt(room.beds) || 0);
      }, 0);
    } else if (typeof roomData === 'object') {
      // Single room object
      return parseInt(roomData.bedNumber) || parseInt(roomData.beds) || 0;
    }
    return 0;
  }, []);

  /**
   * Check bed limit for room addition
   * @param {Object|Array} roomData - Room data (single or array)
   * @returns {Promise<boolean>} True if can proceed
   */
  const checkRoomAddition = useCallback(async (roomData) => {
    const bedsToAdd = calculateBedsFromRooms(roomData);
    return await checkAndShowModal(bedsToAdd);
  }, [calculateBedsFromRooms, checkAndShowModal]);

  /**
   * Close exceeded modal
   */
  const closeExceededModal = useCallback(() => {
    setShowExceededModal(false);
    setExceededData(null);
  }, []);

  /**
   * Update beds used (after successful addition)
   * @param {number} bedsAdded - Number of beds added
   */
  const updateBedsUsed = useCallback(async (bedsAdded) => {
    try {
      const newBedsUsed = getCurrentBedsUsed() + bedsAdded;
      await api.put('/api/users/subscription-usage', {
        bedsUsed: newBedsUsed
      });
    } catch (error) {
      console.error('Failed to update beds used:', error);
    }
  }, [getCurrentBedsUsed]);

  return {
    // State
    showExceededModal,
    exceededData,
    
    // Getters
    getCurrentBedLimit,
    getCurrentBedsUsed,
    getRemainingBeds,
    
    // Checkers
    checkBedLimit,
    checkAndShowModal,
    checkRoomAddition,
    calculateBedsFromRooms,
    
    // Actions
    closeExceededModal,
    updateBedsUsed
  };
};

export default useBedLimitCheck;
