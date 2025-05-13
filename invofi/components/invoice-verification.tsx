import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';

interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
}

interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high';
  details: string[];
}

const mockVerificationSteps: VerificationStep[] = [
  { id: '1', name: 'Document Format Validation', status: 'pending' },
  { id: '2', name: 'Digital Signature Check', status: 'pending' },
  { id: '3', name: 'Amount Verification', status: 'pending' },
  { id: '4', name: 'Counterparty Verification', status: 'pending' },
  { id: '5', name: 'Historical Data Analysis', status: 'pending' },
];

const mockRiskScore: RiskScore = {
  score: 75,
  level: 'low',
  details: [
    'Valid document format',
    'Digital signature verified',
    'Amount matches historical patterns',
    'Counterparty has good standing',
    'No suspicious patterns detected'
  ]
};

export function InvoiceVerification({ onComplete }: { onComplete: () => void }) {
  const [steps, setSteps] = useState<VerificationStep[]>(mockVerificationSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [isManualVerification, setIsManualVerification] = useState(false);

  useEffect(() => {
    const runVerification = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'running' } : step
        ));

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed' } : step
        ));
      }

      // Set final risk score
      setRiskScore(mockRiskScore);
      
      // Start manual verification
      setIsManualVerification(true);
      
      // Simulate manual verification delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      onComplete();
    };

    runVerification();
  }, []);

  const getStatusIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">Invoice Verification Process</h2>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            {getStatusIcon(step.status)}
            <div className="flex-1">
              <h3 className="font-medium">{step.name}</h3>
              {step.details && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{step.details}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {riskScore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-medium mb-2">Risk Assessment</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Risk Score</span>
              <span className="font-medium">{riskScore.score}/100</span>
            </div>
            <Progress value={riskScore.score} className="h-2" />
            <div className="mt-2">
              <h4 className="font-medium mb-1">Risk Level: {riskScore.level}</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                {riskScore.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {isManualVerification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-medium">Manual Verification in Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Our team is reviewing your invoice. This can take up to 24 hours. See the status of your invoice in the <a href="/dashboard" className="text-blue-500 hover:underline">Dashboard</a> page.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 