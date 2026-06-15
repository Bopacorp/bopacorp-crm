import type { ConnectivityDetailFormValues } from './ConnectivityDetailFields.js';
import { ConnectivityDetailFields } from './ConnectivityDetailFields.js';
import type { DeviceDetailFormValues } from './DeviceDetailFields.js';
import { DeviceDetailFields } from './DeviceDetailFields.js';
import type { DigitalDetailFormValues } from './DigitalDetailFields.js';
import { DigitalDetailFields } from './DigitalDetailFields.js';
import type { RoamingDetailFormValues } from './RoamingDetailFields.js';
import { RoamingDetailFields } from './RoamingDetailFields.js';
import type { VoiceDetailFormValues } from './VoiceDetailFields.js';
import { VoiceDetailFields } from './VoiceDetailFields.js';

export interface DetailValues {
  voiceDetails: VoiceDetailFormValues | null;
  connectivityDetails: ConnectivityDetailFormValues | null;
  digitalDetails: DigitalDetailFormValues | null;
  roamingDetails: RoamingDetailFormValues | null;
  deviceDetails: DeviceDetailFormValues | null;
}

interface TypeSpecificFieldsProps {
  itemTypeCode: string | null;
  values: DetailValues;
  onChange: <K extends keyof DetailValues>(key: K, val: DetailValues[K]) => void;
}

export function TypeSpecificFields({ itemTypeCode, values, onChange }: TypeSpecificFieldsProps) {
  switch (itemTypeCode) {
    case 'voice':
      return values.voiceDetails ? (
        <VoiceDetailFields
          values={values.voiceDetails}
          onChange={(v) => onChange('voiceDetails', v)}
        />
      ) : null;
    case 'connectivity':
      return values.connectivityDetails ? (
        <ConnectivityDetailFields
          values={values.connectivityDetails}
          onChange={(v) => onChange('connectivityDetails', v)}
        />
      ) : null;
    case 'digital':
      return values.digitalDetails ? (
        <DigitalDetailFields
          values={values.digitalDetails}
          onChange={(v) => onChange('digitalDetails', v)}
        />
      ) : null;
    case 'roaming':
      return values.roamingDetails ? (
        <RoamingDetailFields
          values={values.roamingDetails}
          onChange={(v) => onChange('roamingDetails', v)}
        />
      ) : null;
    case 'device':
      return values.deviceDetails ? (
        <DeviceDetailFields
          values={values.deviceDetails}
          onChange={(v) => onChange('deviceDetails', v)}
        />
      ) : null;
    default:
      return null;
  }
}
