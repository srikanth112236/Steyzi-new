import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOnboardingStatus, 
  progressPGCreation, 
  progressBranchSetup, 
  progressPGConfiguration 
} from '../../store/slices/onboardingSlice';

// Import individual step components
import PGCreationForm from './PGCreationForm';
import BranchSetupForm from './BranchSetupForm';
import PGConfigurationForm from './PGConfigurationForm';
import OnboardingSuccessModal from './OnboardingSuccessModal';

// Logging utility
import { logOnboardingEvent } from '../../utils/logging';

const ONBOARDING_STEPS = {
  PG_CREATION: 'pg_creation',
  BRANCH_SETUP: 'branch_setup',
  PG_CONFIGURATION: 'pg_configuration',
  COMPLETED: 'completed'
};

const OnboardingFlow = () => {
  const dispatch = useDispatch();
  const { 
    currentStep, 
    status, 
    error, 
    isLoading 
  } = useSelector(state => state.onboarding);

  // State to manage local form data and show success modal
  const [formData, setFormData] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch initial onboarding status on component mount
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        const result = await dispatch(fetchOnboardingStatus()).unwrap();
        logOnboardingEvent('onboarding_initialized', { currentStep });

        // Check if onboarding is already completed
        if (currentStep === ONBOARDING_STEPS.COMPLETED) {
          setShowSuccessModal(true);
        }
      } catch (err) {
        logOnboardingEvent('onboarding_initialization_failed', { error: err.message });
      }
    };

    initializeOnboarding();
  }, [dispatch, currentStep]);

  // Handle form submission for each step
  const handleStepSubmit = async (stepData) => {
    try {
      logOnboardingEvent(`${currentStep}_step_started`, { stepData });

      let result;
      switch (currentStep) {
        case ONBOARDING_STEPS.PG_CREATION:
          result = await dispatch(progressPGCreation(stepData)).unwrap();
          break;
        case ONBOARDING_STEPS.BRANCH_SETUP:
          result = await dispatch(progressBranchSetup(stepData)).unwrap();
          break;
        case ONBOARDING_STEPS.PG_CONFIGURATION:
          result = await dispatch(progressPGConfiguration(stepData)).unwrap();
          break;
        default:
          throw new Error('Invalid onboarding step');
      }

      logOnboardingEvent(`${currentStep}_step_completed`, { stepData });

      // Check if onboarding is completed
      if (result.currentOnboardingStep === ONBOARDING_STEPS.COMPLETED) {
        setShowSuccessModal(true);
      }
    } catch (err) {
      logOnboardingEvent(`${currentStep}_step_failed`, { 
        error: err.message, 
        stepData 
      });
    }
  };

  // Render appropriate form based on current step
  const renderCurrentStepForm = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.PG_CREATION:
        return (
          <PGCreationForm 
            onSubmit={handleStepSubmit}
            initialData={formData}
          />
        );
      case ONBOARDING_STEPS.BRANCH_SETUP:
        return (
          <BranchSetupForm 
            onSubmit={handleStepSubmit}
            initialData={formData}
          />
        );
      case ONBOARDING_STEPS.PG_CONFIGURATION:
        return (
          <PGConfigurationForm 
            onSubmit={handleStepSubmit}
            initialData={formData}
          />
        );
      default:
        return <ErrorStep error="Invalid onboarding step" />;
    }
  };

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner message="Initializing Onboarding..." />;
  }

  // Render error state
  if (error) {
    return (
      <ErrorStep 
        error={error} 
        onRetry={() => dispatch(fetchOnboardingStatus())} 
      />
    );
  }

  return (
    <div className="onboarding-container">
      {showSuccessModal && <OnboardingSuccessModal />}
      
      <OnboardingProgressTracker 
        currentStep={currentStep}
        steps={Object.values(ONBOARDING_STEPS)}
      />
      {renderCurrentStepForm()}
    </div>
  );
};

// Placeholder components (to be implemented separately)
const OnboardingProgressTracker = ({ currentStep, steps }) => {
  // Implement progress tracker UI
  return (
    <div className="onboarding-progress-tracker">
      {steps.map((step, index) => (
        <div 
          key={step} 
          className={`step ${currentStep === step ? 'active' : ''}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
};

const LoadingSpinner = ({ message }) => (
  <div className="loading-spinner">
    {message || 'Loading...'}
  </div>
);

const ErrorStep = ({ error, onRetry }) => (
  <div className="error-step">
    <h2>Onboarding Error</h2>
    <p>{error}</p>
    {onRetry && (
      <button onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
);

export default OnboardingFlow;
