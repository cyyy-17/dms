import { NotificationType } from "@prisma/client";

interface EmailRenderParams {
  type: NotificationType;
  templateName: string;
  subject: string;
  payload: Record<string, unknown>;
  recipientEmail: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

/**
 * Escapes HTML characters to prevent XSS in email bodies.
 */
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Institutional HTML & Plaintext Email Renderer for SASDMS
 */
export function renderNotificationEmail(params: EmailRenderParams): RenderedEmail {
  const { templateName, subject, payload, recipientEmail } = params;
  const baseUrl = getBaseUrl();
  const currentYear = new Date().getFullYear();

  // Content variables
  let badgeText = "Official Notice";
  let badgeBg = "#0F2962";
  let badgeColor = "#FFFFFF";
  let headline = "SAS Document Management Notification";
  let leadText = "You have received an update regarding a document or account workflow.";
  let bodyHtml = "";
  let ctaText: string | null = null;
  let ctaUrl: string | null = null;
  let calloutHtml = "";
  let plainDetails = "";

  const docId = payload.documentId ? String(payload.documentId) : null;
  const trackingNumber = payload.trackingNumber ? String(payload.trackingNumber) : null;
  const title = payload.title ? String(payload.title) : null;
  const uploaderName = payload.uploaderName ? String(payload.uploaderName) : null;

  switch (templateName) {
    case "coordinator-review-alert": {
      const stepOrder = payload.stepOrder ? Number(payload.stepOrder) : null;
      const totalSteps = payload.totalSteps ? Number(payload.totalSteps) : null;

      badgeText = stepOrder && totalSteps
        ? `Step ${stepOrder} of ${totalSteps} • Action Required`
        : "Sequential Review • Action Required";
      badgeBg = "#0F2962";
      badgeColor = "#FFFFFF";

      headline = "Document Awaiting Your Review & Sign-Off";
      leadText = `A document has been assigned to you in the sequential approval pipeline and requires your review and formal signature.`;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${escapeHtml(title || "Document")}</td>
          </tr>
          ${uploaderName ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600;">Submitted By</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; font-weight: 600;">${escapeHtml(uploaderName)}</td>
          </tr>` : ""}
        </table>
      `;

      ctaText = "Review & Sign Document";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/approvals`;

      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title}\nSubmitted By: ${uploaderName || "N/A"}\nAction URL: ${ctaUrl}`;
      break;
    }

    case "document-approved": {
      const requestorName = payload.requestorName ? String(payload.requestorName) : null;
      const unitName = payload.unitName ? String(payload.unitName) : null;
      const totalSignatories = payload.totalSignatories ? Number(payload.totalSignatories) : null;

      badgeText = "All Signatories Completed • Sealed & Approved";
      badgeBg = "#059669";
      badgeColor = "#FFFFFF";

      headline = "Document Fully Approved & Sealed in Digital Vault";
      leadText = requestorName
        ? `Hello ${escapeHtml(requestorName)}, your document submission has successfully completed all assigned approvals and electronic signatory steps. The sealed document is now archived in the vault.`
        : "Your document submission has successfully completed all assigned approvals and electronic signatory steps. The sealed document is now archived in the vault.";

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; border-bottom: 1px solid #BBF7D0; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #14532D; border-bottom: 1px solid #BBF7D0; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; border-bottom: 1px solid #BBF7D0; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #14532D; border-bottom: 1px solid #BBF7D0; font-weight: 600;">${escapeHtml(title || "Document")}</td>
          </tr>
          ${unitName ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; border-bottom: 1px solid #BBF7D0; font-weight: 600;">Department Unit</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #14532D; border-bottom: 1px solid #BBF7D0; font-weight: 600;">${escapeHtml(unitName)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; font-weight: 600;">Signatory Chain Status</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #047857; font-weight: 700;">✓ All ${totalSignatories ? `${totalSignatories} Steps` : "Signatories"} Completed &amp; Cryptographically Sealed</td>
          </tr>
        </table>
      `;

      ctaText = "Access Approved Document in Vault";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/documents`;
      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title}\nUnit: ${unitName || "N/A"}\nStatus: All Signatories Completed & Sealed\nVault URL: ${ctaUrl}`;
      break;
    }

    case "document-returned": {
      const comments = payload.comments ? String(payload.comments) : "No specific remarks provided.";
      const rejectionCount = payload.rejectionCount ? Number(payload.rejectionCount) : 1;
      const isEscalated = !!payload.isEscalated;
      const reviewerName = payload.reviewerName ? String(payload.reviewerName) : null;
      const reviewerRole = payload.reviewerRole ? String(payload.reviewerRole) : null;

      badgeText = isEscalated ? "Revision Required • Escalated to Director" : "Revision Required • Action Needed";
      badgeBg = "#D97706";
      badgeColor = "#FFFFFF";

      headline = "Document Returned for Revision";
      leadText = reviewerName
        ? `Your document submission was reviewed by ${escapeHtml(reviewerName)}${reviewerRole ? ` (${escapeHtml(reviewerRole)})` : ""} and returned with revision remarks. Please inspect the feedback below and upload a revised version (v2+).`
        : `Your document submission was reviewed and returned with revision remarks. Please inspect the feedback below and upload a revised version (v2+).`;

      calloutHtml = `
        <div style="margin: 20px 0; padding: 18px 22px; background-color: #FFFBEB; border-left: 5px solid #F59E0B; border-radius: 6px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #B45309;">
            Reviewer Remarks &amp; Required Adjustments
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350F; font-style: italic; font-weight: 500;">
            &ldquo;${escapeHtml(comments)}&rdquo;
          </p>
          ${reviewerName ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #92400E; font-weight: 700;">— Stated by ${escapeHtml(reviewerName)}${reviewerRole ? ` (${escapeHtml(reviewerRole)})` : ""}</p>` : ""}
          ${isEscalated ? `<p style="margin: 12px 0 0 0; font-size: 11px; color: #DC2626; font-weight: 800; border-top: 1px dashed #FCD34D; pt: 8px;">⚠️ Escalation Notice: This document has undergone ${rejectionCount} revision rounds and has been flagged for Executive Director oversight.</p>` : ""}
        </div>
      `;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0; border-collapse: collapse; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          ${title ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${escapeHtml(title)}</td>
          </tr>` : ""}
          ${reviewerName ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Returned By</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${escapeHtml(reviewerName)}${reviewerRole ? ` (${escapeHtml(reviewerRole)})` : ""}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600;">Revision Cycle</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #D97706; font-weight: 700;">Revision Round #${rejectionCount}</td>
          </tr>
        </table>
      `;

      ctaText = "Upload Revised Version (v2+)";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/documents`;
      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title || "N/A"}\nReturned By: ${reviewerName || "Reviewer"}\nRemarks: ${comments}\nRevision Round: #${rejectionCount}\nAction URL: ${ctaUrl}`;
      break;
    }

    case "director-escalation-alert": {
      const unitName = payload.unitName ? String(payload.unitName) : "Unit";
      const rejectionCount = payload.rejectionCount ? Number(payload.rejectionCount) : 2;

      badgeText = "Auto-Escalation Alert";
      badgeBg = "#DC2626";
      badgeColor = "#FFFFFF";

      headline = "Document Escalated to Director Review";
      leadText = `A document in ${escapeHtml(unitName)} has accumulated ${rejectionCount} returns/rejections and has been auto-escalated for Executive Director oversight.`;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #991B1B; border-bottom: 1px solid #FECACA; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #7F1D1D; border-bottom: 1px solid #FECACA; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #991B1B; border-bottom: 1px solid #FECACA; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #7F1D1D; border-bottom: 1px solid #FECACA; font-weight: 600;">${escapeHtml(title || "Document")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #991B1B; font-weight: 600;">Department Unit</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #7F1D1D; font-weight: 600;">${escapeHtml(unitName)}</td>
          </tr>
        </table>
      `;

      ctaText = "Inspect Escalated Document";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/approvals`;
      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title}\nUnit: ${unitName}\nThreshold: ${rejectionCount} rejections\nURL: ${ctaUrl}`;
      break;
    }

    case "document-closed": {
      const comments = payload.comments ? String(payload.comments) : "No closing remarks provided.";
      const closedByName = payload.closedByName ? String(payload.closedByName) : null;
      const closedByRole = payload.closedByRole ? String(payload.closedByRole) : null;

      badgeText = "Terminally Closed & Rejected";
      badgeBg = "#DC2626";
      badgeColor = "#FFFFFF";

      headline = "Document Terminated & Closed";
      leadText = closedByName
        ? `The following document workflow has been terminally rejected and closed by ${escapeHtml(closedByName)}${closedByRole ? ` (${escapeHtml(closedByRole)})` : ""}.`
        : "The following document workflow has been terminated and permanently closed.";

      calloutHtml = `
        <div style="margin: 20px 0; padding: 18px 22px; background-color: #FEF2F2; border-left: 5px solid #DC2626; border-radius: 6px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #991B1B;">
            Mandatory Cancellation Reason
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F1D1D; font-weight: 600;">
            &ldquo;${escapeHtml(comments)}&rdquo;
          </p>
          ${closedByName ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #991B1B; font-weight: 700;">— Closed by ${escapeHtml(closedByName)}${closedByRole ? ` (${escapeHtml(closedByRole)})` : ""}</p>` : ""}
        </div>
      `;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0; border-collapse: collapse; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          ${title ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${escapeHtml(title)}</td>
          </tr>` : ""}
          ${closedByName ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600;">Closed By</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #DC2626; font-weight: 600;">${escapeHtml(closedByName)}${closedByRole ? ` (${escapeHtml(closedByRole)})` : ""}</td>
          </tr>` : ""}
        </table>
      `;

      ctaText = "View Document Audit History";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/documents`;
      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title || "N/A"}\nClosed By: ${closedByName || "Admin/Reviewer"}\nReason: ${comments}\nURL: ${ctaUrl}`;
      break;
    }

    case "document-expiry-alert": {
      const daysRemaining = payload.daysRemaining ? Number(payload.daysRemaining) : 30;
      const expiryDate = payload.expiryDate ? new Date(String(payload.expiryDate)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Approaching Soon";

      badgeText = `Expiry Warning • ${daysRemaining} Days Left`;
      badgeBg = "#EA580C";
      badgeColor = "#FFFFFF";

      headline = "Document Expiration Warning";
      leadText = `An approved document in your unit is set to expire in ${daysRemaining} days. Please initiate the renewal or compliance extension process if needed.`;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #9A3412; border-bottom: 1px solid #FED7AA; font-weight: 600; width: 35%;">Tracking Number</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #7C2D12; border-bottom: 1px solid #FED7AA; font-weight: 700; font-family: monospace;">${escapeHtml(trackingNumber || "N/A")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #9A3412; border-bottom: 1px solid #FED7AA; font-weight: 600;">Document Title</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #7C2D12; border-bottom: 1px solid #FED7AA; font-weight: 600;">${escapeHtml(title || "Document")}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #9A3412; font-weight: 600;">Expiry Date</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #C2410C; font-weight: 700;">${escapeHtml(expiryDate)}</td>
          </tr>
        </table>
      `;

      ctaText = "Manage Document & Renew";
      ctaUrl = docId ? `${baseUrl}/dashboard/documents/${docId}` : `${baseUrl}/dashboard/documents`;
      plainDetails = `Tracking Number: ${trackingNumber}\nTitle: ${title}\nExpiry Date: ${expiryDate}\nDays Remaining: ${daysRemaining}\nURL: ${ctaUrl}`;
      break;
    }

    case "admin-registration-alert": {
      const applicantName = payload.applicantName ? String(payload.applicantName) : "New User";
      const applicantEmail = payload.applicantEmail ? String(payload.applicantEmail) : "";
      const unitName = payload.unitName ? String(payload.unitName) : "Assigned Unit";
      const employeeId = payload.employeeId ? String(payload.employeeId) : null;

      badgeText = "Admin Review Required • Account Pending Approval";
      badgeBg = "#0F2962";
      badgeColor = "#FFFFFF";

      headline = "New Employee Account Pending Approval";
      leadText = `A new employee registration has been submitted and requires Administrator review, role assignment, and institutional activation.`;

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600; width: 35%;">Applicant Name</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 700;">${escapeHtml(applicantName)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Institutional Email</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 600; font-family: monospace;">${escapeHtml(applicantEmail)}</td>
          </tr>
          ${employeeId ? `
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Employee ID</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; border-bottom: 1px solid #E2E8F0; font-weight: 700; font-family: monospace;">${escapeHtml(employeeId)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600;">Department Unit</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; font-weight: 600;">${escapeHtml(unitName)}</td>
          </tr>
        </table>
      `;

      ctaText = "Review User in Admin Console";
      ctaUrl = `${baseUrl}/dashboard/admin/users`;
      plainDetails = `Applicant: ${applicantName}\nEmail: ${applicantEmail}\nEmployee ID: ${employeeId || "N/A"}\nUnit: ${unitName}\nAdmin Console URL: ${ctaUrl}`;
      break;
    }

    case "account-approved": {
      const userName = payload.userName ? String(payload.userName) : "User";
      const role = payload.role ? String(payload.role) : "STAFF";
      const unitName = payload.unitName ? String(payload.unitName) : "Student & Alumni Services";

      badgeText = "Account Approved";
      badgeBg = "#059669";
      badgeColor = "#FFFFFF";

      headline = `Welcome, ${escapeHtml(userName)}!`;
      leadText = "Your registration for the Student & Alumni Services Document Management System (SASDMS) has been approved by the Administrator.";

      bodyHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; border-bottom: 1px solid #BBF7D0; font-weight: 600; width: 35%;">Assigned Role</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #14532D; border-bottom: 1px solid #BBF7D0; font-weight: 700;">${escapeHtml(role)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 18px; font-size: 13px; color: #166534; font-weight: 600;">Department Unit</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #14532D; font-weight: 600;">${escapeHtml(unitName)}</td>
          </tr>
        </table>
      `;

      ctaText = "Sign In to SASDMS Portal";
      ctaUrl = `${baseUrl}/auth/login`;
      plainDetails = `Welcome, ${userName}!\nYour account has been approved as ${role} in ${unitName}.\nLogin URL: ${ctaUrl}`;
      break;
    }

    case "account-rejected": {
      const userName = payload.userName ? String(payload.userName) : "User";
      const reason = payload.reason ? String(payload.reason) : "Account details could not be verified with official institutional records.";

      badgeText = "Registration Status";
      badgeBg = "#DC2626";
      badgeColor = "#FFFFFF";

      headline = "Registration Application Update";
      leadText = `Dear ${escapeHtml(userName)}, your registration application for SASDMS could not be approved at this time.`;

      calloutHtml = `
        <div style="margin: 20px 0; padding: 16px 20px; background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #991B1B;">Reason for Decision</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #7F1D1D;">${escapeHtml(reason)}</p>
        </div>
      `;

      bodyHtml = `
        <p style="font-size: 13px; line-height: 1.6; color: #64748B; margin: 15px 0;">
          If you believe this decision was made in error, please coordinate directly with the Student &amp; Alumni Services Office or the System Administrator.
        </p>
      `;

      plainDetails = `Dear ${userName},\nYour registration could not be approved. Reason: ${reason}`;
      break;
    }

    case "password-reset-request": {
      const resetUrl = payload.resetUrl ? String(payload.resetUrl) : `${baseUrl}/reset-password`;
      const recipientName = payload.recipientName ? String(payload.recipientName) : "Employee";
      const expirationMinutes = payload.expirationMinutes ? Number(payload.expirationMinutes) : 15;

      badgeText = "Security Alert • Password Reset";
      badgeBg = "#0F2962";
      badgeColor = "#FFFFFF";

      headline = "Institutional Password Reset Request";
      leadText = `Hello ${escapeHtml(recipientName)}, a password reset was requested for your official @firstasia.edu.ph institutional account.`;

      calloutHtml = `
        <div style="margin: 20px 0; padding: 16px 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #92400E;">Security Advisory</p>
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #78350F;">
            This password recovery link is strictly confidential and will expire in <strong>${expirationMinutes} minutes</strong>. If you did not initiate this request, no action is needed; your password remains secure.
          </p>
        </div>
      `;

      bodyHtml = `
        <p style="font-size: 13px; line-height: 1.6; color: #64748B; margin: 15px 0;">
          Click the button below to securely set a new password for your SASDMS account:
        </p>
      `;

      ctaText = "Reset Institutional Password";
      ctaUrl = resetUrl;
      plainDetails = `A password reset request was initiated for ${recipientEmail}.\nReset Link (valid for ${expirationMinutes} mins): ${resetUrl}\nIf you did not request this, please disregard this email.`;
      break;
    }

    default: {
      headline = subject;
      leadText = "Please log in to the SAS Document Management System to view details and take action.";
      plainDetails = `Subject: ${subject}\nPortal URL: ${baseUrl}/dashboard`;
      ctaText = "Open SASDMS Portal";
      ctaUrl = `${baseUrl}/dashboard`;
    }
  }

  // Generate responsive HTML wrapper
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner (FAITH Colleges Navy & Gold) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F2962 0%, #1E40AF 100%); background-color: #0F2962; padding: 28px 32px; text-align: left; border-bottom: 3px solid #F59E0B;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #93C5FD;">First Asia Institute of Technology and Humanities</p>
                    <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF;">Student &amp; Alumni Services</h1>
                    <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 500; color: #CBD5E1;">Document Management &amp; Electronic Signature System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <!-- Status Pill Badge -->
              <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 5px 12px; border-radius: 9999px; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${badgeText}
                </span>
              </div>

              <!-- Main Headline & Lead -->
              <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                ${headline}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${leadText}
              </p>

              <!-- Callout Box (Remarks / Warnings if present) -->
              ${calloutHtml}

              <!-- Body Specification / Key-Value Details -->
              ${bodyHtml}

              <!-- Call to Action Button -->
              ${ctaText && ctaUrl ? `
              <div style="margin: 28px 0 12px 0; text-align: center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#0F2962">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${escapeHtml(ctaText)}</center>
                </v:roundrect>
                <![endif]-->
                <a href="${ctaUrl}" target="_blank" style="background-color: #0F2962; border: 1px solid #0A1C44; border-radius: 10px; color: #FFFFFF; display: inline-block; font-size: 14px; font-weight: 700; line-height: 46px; text-align: center; text-decoration: none; width: auto; min-width: 220px; padding: 0 28px; box-shadow: 0 2px 4px rgba(15, 41, 98, 0.2); -webkit-text-size-adjust: none;">
                  ${escapeHtml(ctaText)} &rarr;
                </a>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 11px; text-align: center; color: #94A3B8;">
                Direct link: <a href="${ctaUrl}" style="color: #1E40AF; text-decoration: underline; word-break: break-all;">${ctaUrl}</a>
              </p>
              ` : ""}
            </td>
          </tr>

          <!-- Compliance & Institutional Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #64748B;">
                First Asia Institute of Technology and Humanities (FAITH Colleges)
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #94A3B8;">
                Student &amp; Alumni Services • Document Management System (SASDMS)
              </p>
              <div style="height: 1px; background-color: #E2E8F0; margin: 12px auto; max-width: 80%;"></div>
              <p style="margin: 0; font-size: 10px; line-height: 1.5; color: #94A3B8;">
                <strong>Confidentiality Notice &amp; Compliance:</strong> This automated email transmission is intended solely for the authorized FAITH Colleges faculty, staff, or signatory. It may contain privileged records governed under Republic Act No. 10173 (Data Privacy Act of 2012). If you received this transmission in error, please notify <a href="mailto:sasdms-notifications@firstasia.edu.ph" style="color: #64748B;">sasdms-notifications@firstasia.edu.ph</a> and delete this message.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #CBD5E1;">
                &copy; ${currentYear} FAITH Colleges. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
================================================================================
FIRST ASIA INSTITUTE OF TECHNOLOGY AND HUMANITIES (FAITH COLLEGES)
Student & Alumni Services - Document Management System (SASDMS)
================================================================================

[ ${badgeText} ]

${headline}

${leadText}

${plainDetails}

--------------------------------------------------------------------------------
CONFIDENTIALITY NOTICE & COMPLIANCE:
This transmission is generated automatically by SASDMS for authorized recipients.
Information herein may be privileged and protected under RA 10173 (Data Privacy Act).
If received in error, please discard immediately.

© ${currentYear} FAITH Colleges. All rights reserved.
================================================================================
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
