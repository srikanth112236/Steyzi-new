import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Bed, Building2 } from 'lucide-react';
import subscriptionService from '../../../services/subscription.service';

const SubscriptionCalculator = ({
  baseBedCount,
  basePrice,
  topUpPricePerBed,
  billingCycle,
  annualDiscount = 0,
  allowMultipleBranches = false,
  branchCount = 1,
  bedsPerBranch = null,
  costPerBranch = 0
}) => {
  const [bedCount, setBedCount] = useState(baseBedCount);
  const [branchCountInput, setBranchCountInput] = useState(1);
  
  const calculateCost = () => {
    const extraBeds = Math.max(0, bedCount - baseBedCount);
    const topUpCost = extraBeds * topUpPricePerBed;

    // Calculate branch costs
    const extraBranches = Math.max(0, branchCountInput - 1);
    const branchCost = extraBranches * costPerBranch;

    const totalMonthly = basePrice + topUpCost + branchCost;

    let totalAnnual = totalMonthly * 12;
    if (billingCycle === 'annual' && annualDiscount > 0) {
      const discount = (totalAnnual * annualDiscount) / 100;
      totalAnnual = totalAnnual - discount;
    }

    return {
      extraBeds,
      topUpCost,
      extraBranches,
      branchCost,
      totalMonthly,
      totalAnnual,
      effectiveMonthly: totalAnnual / 12,
      savingsAnnual: billingCycle === 'annual' && annualDiscount > 0
        ? (totalMonthly * 12 * annualDiscount) / 100
        : 0
    };
  };

  const cost = calculateCost();

  return (
    <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calculator className="h-5 w-5 text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-900">Price Calculator</h4>
      </div>

      {/* Bed Count Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Beds
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setBedCount(Math.max(1, bedCount - 1))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            value={bedCount}
            onChange={(e) => setBedCount(parseInt(e.target.value) || 1)}
            className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setBedCount(bedCount + 1)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Branch Count Input (only show if multiple branches allowed) */}
      {allowMultipleBranches && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Branches
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setBranchCountInput(Math.max(1, branchCountInput - 1))}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={branchCount}
              value={branchCountInput}
              onChange={(e) => setBranchCountInput(Math.min(branchCount, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setBranchCountInput(Math.min(branchCount, branchCountInput + 1))}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              +
            </button>
            <span className="text-sm text-gray-500">Max: {branchCount}</span>
          </div>
        </div>
      )}

      {/* Calculation Breakdown */}
      <div className="space-y-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
        {/* Base Price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Bed className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700">
              Base ({baseBedCount} beds)
            </span>
          </div>
          <span className="font-semibold text-gray-900">
            {subscriptionService.formatCurrency(basePrice)}
          </span>
        </div>

        {/* Top-up */}
        {cost.extraBeds > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">
                Top-up ({cost.extraBeds} extra beds)
              </span>
            </div>
            <span className="font-semibold text-gray-900">
              {subscriptionService.formatCurrency(cost.topUpCost)}
            </span>
          </div>
        )}

        {/* Branch Cost */}
        {allowMultipleBranches && cost.extraBranches > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              <span className="text-gray-700">
                Branch cost ({cost.extraBranches} extra branches)
              </span>
            </div>
            <span className="font-semibold text-gray-900">
              {subscriptionService.formatCurrency(cost.branchCost)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-purple-200 my-2"></div>

        {/* Monthly Total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Monthly Total</span>
          </div>
          <span className="text-xl font-bold text-purple-600">
            {subscriptionService.formatCurrency(cost.totalMonthly)}
          </span>
        </div>

        {/* Annual Information */}
        {billingCycle === 'annual' && (
          <>
            <div className="border-t border-purple-200 my-2"></div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Annual Total</span>
                <span className="font-semibold text-gray-900">
                  {subscriptionService.formatCurrency(cost.totalAnnual)}
                </span>
              </div>

              {annualDiscount > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Annual Savings</span>
                    <span className="font-semibold text-green-600">
                      - {subscriptionService.formatCurrency(cost.savingsAnnual)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Effective Monthly</span>
                    <span className="font-semibold text-purple-600">
                      {subscriptionService.formatCurrency(cost.effectiveMonthly)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Info Message */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Pricing Formula:</strong> Base Price + (Extra Beds × Top-up Price)
          {allowMultipleBranches && (
            <span> + (Extra Branches × Branch Cost)</span>
          )}
          {billingCycle === 'annual' && annualDiscount > 0 && (
            <span> with {annualDiscount}% annual discount</span>
          )}
        </p>
        {allowMultipleBranches && (
          <p className="text-xs text-blue-800 mt-1">
            🏢 <strong>Branch Pricing:</strong> First branch included in base price. Each additional branch costs ₹{costPerBranch}/month.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCalculator;
