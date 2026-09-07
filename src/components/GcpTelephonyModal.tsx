import React from 'react';
import { GcpIntegrationModal } from './GcpIntegrationModal';

interface GcpTelephonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

/**
 * GcpTelephonyModal renders the Google Cloud Platform (GCP) Console
 * providing Cloud Run telemetry, Google Cloud Speech (TTS), Cloud Logging,
 * and deployment management for IVAgent.
 */
export const GcpTelephonyModal: React.FC<GcpTelephonyModalProps> = (props) => {
  return <GcpIntegrationModal {...props} />;
};

export default GcpTelephonyModal;

