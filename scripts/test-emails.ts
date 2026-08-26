import { renderNotificationEmail } from "../lib/email-templates";

const testCases = [
  {
    type: "DOCUMENT_SUBMITTED_COORDINATOR" as const,
    templateName: "coordinator-review-alert",
    subject: "SASDMS: Document Awaiting Your Signature (Step 2 of 4) - SAS-2026-ALM-00042",
    recipientEmail: "jdoe@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
      uploaderName: "Maria Santos",
      stepOrder: 2,
      totalSteps: 4,
    },
  },
  {
    type: "DOCUMENT_APPROVED_ALL" as const,
    templateName: "document-approved",
    subject: "SASDMS: Document Fully Approved & Sealed - SAS-2026-ALM-00042",
    recipientEmail: "msantos@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
    },
  },
  {
    type: "DOCUMENT_RETURNED_STAFF" as const,
    templateName: "document-returned",
    subject: "SASDMS: Document Returned for Revision - SAS-2026-ALM-00042",
    recipientEmail: "msantos@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
      comments: "Please revise Section 4.2 regarding the budget allocation and attach the approved venue quote.",
      rejectionCount: 1,
      isEscalated: false,
    },
  },
  {
    type: "DOCUMENT_ESCALATED_DIRECTOR" as const,
    templateName: "director-escalation-alert",
    subject: "SASDMS: Auto-Escalation Alert (2x Rejection) - SAS-2026-ALM-00042",
    recipientEmail: "director@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
      unitName: "Alumni Affairs Unit",
      rejectionCount: 2,
    },
  },
  {
    type: "DOCUMENT_CLOSED" as const,
    templateName: "document-closed",
    subject: "SASDMS: Document Terminated & Closed - SAS-2026-ALM-00042",
    recipientEmail: "msantos@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
      comments: "Superseded by newly updated event agreement.",
    },
  },
  {
    type: "DOCUMENT_EXPIRY_WARNING" as const,
    templateName: "document-expiry-alert",
    subject: "SASDMS Reminder: Document Expiry in 30 Days (SAS-2026-ALM-00042)",
    recipientEmail: "msantos@firstasia.edu.ph",
    payload: {
      documentId: "11111111-2222-3333-4444-555555555555",
      trackingNumber: "SAS-2026-ALM-00042",
      title: "Annual Alumni Homecoming MOA 2026",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 30,
    },
  },
  {
    type: "REGISTRATION_REQUEST_ADMIN" as const,
    templateName: "admin-registration-alert",
    subject: "SASDMS: New Registration Pending Approval - Carlos Garcia",
    recipientEmail: "admin@firstasia.edu.ph",
    payload: {
      applicantName: "Carlos Garcia",
      applicantEmail: "cgarcia@firstasia.edu.ph",
      unitName: "Career Services & Placement",
      applicantId: "22222222-3333-4444-5555-666666666666",
    },
  },
  {
    type: "ACCOUNT_APPROVED" as const,
    templateName: "account-approved",
    subject: "SASDMS: Your Account Registration has been Approved",
    recipientEmail: "cgarcia@firstasia.edu.ph",
    payload: {
      userName: "Carlos Garcia",
      role: "COORDINATOR",
      unitName: "Career Services & Placement",
    },
  },
  {
    type: "ACCOUNT_REJECTED" as const,
    templateName: "account-rejected",
    subject: "SASDMS: Account Registration Status Update",
    recipientEmail: "cgarcia@firstasia.edu.ph",
    payload: {
      userName: "Carlos Garcia",
      reason: "Institutional ID could not be validated against HR database.",
    },
  },
];

console.log(`Starting validation of ${testCases.length} email templates...`);

for (const tc of testCases) {
  const result = renderNotificationEmail({
    type: tc.type,
    templateName: tc.templateName,
    subject: tc.subject,
    payload: tc.payload,
    recipientEmail: tc.recipientEmail,
  });

  if (!result.html || !result.text || !result.subject) {
    throw new Error(`Failed to render template ${tc.templateName}`);
  }

  if (!result.html.includes("FAITH Colleges") || !result.html.includes("Student &amp; Alumni Services")) {
    throw new Error(`Institutional branding missing in template ${tc.templateName}`);
  }

  console.log(`✓ Template "${tc.templateName}" rendered successfully (HTML: ${result.html.length} bytes, Text: ${result.text.length} bytes)`);
}

console.log("\nAll 9 notification email templates verified successfully!");
