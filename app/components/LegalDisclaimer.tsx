import { Link } from "@remix-run/react";

interface LegalDisclaimerProps {
  variant?: "footer" | "banner" | "modal" | "inline";
  className?: string;
}

/**
 * Legal Disclaimer Component
 * 
 * Displays disclaimers that this service is:
 * - NOT professional mental health advice
 * - NOT a substitute for therapy or counseling
 * - NOT provided by trained professionals
 * - Just a "rent a friend" companionship service
 */
export function LegalDisclaimer({ variant = "footer", className = "" }: LegalDisclaimerProps) {
  const baseClasses = "text-sm text-gray-600 dark:text-gray-400";
  
  if (variant === "banner") {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className={baseClasses}>
              <strong className="font-semibold text-yellow-800 dark:text-yellow-200">
                Important Notice:
              </strong>{" "}
              This service provides companionship and friendly conversation only. It is{" "}
              <strong>not</strong> a substitute for professional mental health services, therapy, or counseling. 
              Our companions are <strong>not</strong> licensed mental health professionals, medical professionals, 
              or trained therapists. If you are experiencing a mental health crisis, please contact emergency 
              services or a licensed professional.{" "}
              <Link to="/safety" className="underline hover:text-yellow-900 dark:hover:text-yellow-100">
                Learn more
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Important Disclaimer
        </h3>
        <div className={`space-y-2 ${baseClasses}`}>
          <p>
            <strong>This service is for companionship only.</strong> PositiveNRG is a "rent a friend" 
            service that connects you with companions for friendly conversation and support.
          </p>
          <p>
            <strong>Not Professional Advice:</strong> Our companions are not licensed mental health 
            professionals, therapists, counselors, or medical professionals. They are not trained or 
            qualified to provide mental health advice, therapy, or medical guidance.
          </p>
          <p>
            <strong>Not a Substitute:</strong> This service is not a substitute for professional mental 
            health services, therapy, counseling, or medical treatment. If you are experiencing a mental 
            health crisis, suicidal thoughts, or need professional help, please contact:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Emergency services: 999 (UK) or 911 (US)</li>
            <li>Samaritans (UK): 116 123</li>
            <li>National Suicide Prevention Lifeline (US): 988</li>
            <li>A licensed mental health professional</li>
          </ul>
          <p>
            <strong>No Guarantees:</strong> We do not guarantee any specific outcomes, improvements, 
            or results from using this service. Your use of this service is at your own discretion.
          </p>
          <p>
            By using this service, you acknowledge that you understand and agree to these terms. 
            Please read our{" "}
            <Link to="/terms" className="underline hover:text-gray-900 dark:hover:text-gray-100">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-gray-900 dark:hover:text-gray-100">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`${baseClasses} ${className}`}>
        <p>
          <strong>Disclaimer:</strong> This service provides companionship only and is not professional 
          mental health advice. Our companions are not licensed professionals.{" "}
          <Link to="/safety" className="underline hover:text-gray-800 dark:hover:text-gray-200">
            Learn more
          </Link>
        </p>
      </div>
    );
  }

  // Default: footer variant
  return (
    <div className={`${baseClasses} ${className}`}>
      <p className="text-xs">
        <strong>Disclaimer:</strong> PositiveNRG is a companionship service only. We are{" "}
        <strong>not</strong> a mental health service, therapy platform, or medical service. Our 
        companions are <strong>not</strong> licensed mental health professionals, therapists, or 
        medical professionals. This service is not a substitute for professional mental health care. 
        If you are in crisis, please contact emergency services or a licensed professional.{" "}
        <Link to="/terms" className="underline hover:text-gray-800 dark:hover:text-gray-200">
          Terms
        </Link>{" "}
        |{" "}
        <Link to="/safety" className="underline hover:text-gray-800 dark:hover:text-gray-200">
          Safety
        </Link>
      </p>
    </div>
  );
}

/**
 * Crisis Resources Component
 * Displayed when crisis is detected or on safety page
 */
export function CrisisResources() {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 my-4">
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
        Need Immediate Help?
      </h3>
      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
        If you are experiencing a mental health crisis or having thoughts of self-harm, please contact 
        emergency services or a crisis hotline immediately.
      </p>
      <div className="space-y-2 text-sm">
        <div>
          <strong className="text-red-900 dark:text-red-100">Emergency Services:</strong>
          <ul className="list-disc list-inside ml-4 text-red-800 dark:text-red-200">
            <li>UK: 999</li>
            <li>US: 911</li>
          </ul>
        </div>
        <div>
          <strong className="text-red-900 dark:text-red-100">Crisis Hotlines:</strong>
          <ul className="list-disc list-inside ml-4 text-red-800 dark:text-red-200">
            <li>Samaritans (UK): <a href="tel:116123" className="underline">116 123</a></li>
            <li>National Suicide Prevention Lifeline (US): <a href="tel:988" className="underline">988</a></li>
            <li>Crisis Text Line: Text HOME to <a href="sms:741741" className="underline">741741</a></li>
          </ul>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300 mt-3">
          Please seek help from licensed mental health professionals. This service cannot provide 
          crisis intervention or professional mental health support.
        </p>
      </div>
    </div>
  );
}

