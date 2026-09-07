import { AvailableSlot, StructuredCallReport, EnquiryBrief } from '../types';

export function createGoogleCalendarUrl(
  slot: AvailableSlot,
  businessName: string,
  serviceNeeded: string,
  userNotes?: string,
  businessAddress?: string
): string {
  // Parse date and time e.g. "2026-09-02" and "10:30 AM"
  const startIso = parseSlotToIso(slot.date, slot.time);
  const endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startFormatted = new Date(startIso).toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = encodeURIComponent(`${serviceNeeded} - ${businessName}`);
  const details = encodeURIComponent(
    `Appointment booked on your behalf by AI Call Agent.\n\nProvider/Staff: ${slot.practitionerOrStaff || 'Assigned Specialist'}\nEstimated Fee: ${slot.priceEstimate || 'Standard rate'}\nNotes: ${userNotes || slot.notes || 'Confirmed via phone enquiry'}`
  );
  const location = encodeURIComponent(businessAddress || businessName);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endIso}&details=${details}&location=${location}`;
}

export function generateIcsFile(
  slot: AvailableSlot,
  businessName: string,
  serviceNeeded: string,
  report?: StructuredCallReport,
  brief?: EnquiryBrief
): void {
  const startIso = parseSlotToIso(slot.date, slot.time);
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `${serviceNeeded} - ${businessName}`;
  const description = [
    `Appointment booked via Autonomous Call Agent.`,
    `Service: ${serviceNeeded}`,
    `Provider: ${slot.practitionerOrStaff || 'Specialist'}`,
    brief?.user?.fullName ? `Patient / Client: ${brief.user.fullName}` : '',
    brief?.business?.phone ? `Phone: ${brief.business.phone}` : '',
    `Notes: ${slot.notes || 'Phone verified'}`,
    report?.policyNotes?.cancellationPolicy ? `Cancellation Policy: ${report.policyNotes.cancellationPolicy}` : '',
    report?.policyNotes?.arrivalInstructions ? `Arrival Instructions: ${report.policyNotes.arrivalInstructions}` : ''
  ]
    .filter(Boolean)
    .join('\\n');

  const location = brief?.business?.address || businessName;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI Appointment Caller Agent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).substring(2, 9)}@callagent.ai`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appointment-${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function generateSmsSummary(report: StructuredCallReport): string {
  const slot = report.bookedSlot || report.availableSlots[0];
  const slotText = slot ? `${slot.date} at ${slot.time} (${slot.practitionerOrStaff || 'Specialist'})` : 'No open slot confirmed';
  
  return `📞 Call Report: ${report.businessName}
Status: ${report.callOutcome.toUpperCase().replace('_', ' ')}
Slot: ${slotText}
Summary: ${report.executiveSummary}
${report.policyNotes?.cancellationPolicy ? `Policy: ${report.policyNotes.cancellationPolicy}` : ''}`.trim();
}

function parseSlotToIso(dateStr: string, timeStr: string): string {
  try {
    const today = new Date();
    let targetYear = today.getFullYear();
    let targetMonth = today.getMonth();
    let targetDay = today.getDate();

    // Check if dateStr is YYYY-MM-DD or contains words
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      targetYear = y;
      targetMonth = m - 1;
      targetDay = d;
    } else {
      // Try to parse relative or formatted date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        targetYear = parsed.getFullYear();
        targetMonth = parsed.getMonth();
        targetDay = parsed.getDate();
      }
    }

    // Parse time e.g. "10:30 AM" or "2:00 PM"
    let hours = 10;
    let minutes = 0;
    const timeMatch = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPm = timeMatch[3] && timeMatch[3].toUpperCase() === 'PM';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && timeMatch[3] && hours === 12) hours = 0;
    }

    const d = new Date(targetYear, targetMonth, targetDay, hours, minutes);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
