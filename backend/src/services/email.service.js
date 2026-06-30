import nodemailer from "nodemailer";
import { EmailConfig } from "../models/EmailConfig.model.js";
import { AppError } from "../utils/AppError.js";

// ── Transporter cache (one per company) ──────────────────────

const transporterCache = new Map();

function buildTransporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass,
    },
    tls: { rejectUnauthorized: cfg.tlsRejectUnauthorized ?? false },
  });
}

export async function getTransporter(companyId) {
  const cfg = await EmailConfig.findOne({ company: companyId }).lean();
  if (!cfg || !cfg.isActive) {
    throw new AppError("Email is not configured for this company", 400, "EMAIL_NOT_CONFIGURED");
  }
  if (!cfg.smtpHost || !cfg.smtpUser) {
    throw new AppError("SMTP settings are incomplete", 400, "EMAIL_NOT_CONFIGURED");
  }

  const cacheKey = String(companyId);
  const cached = transporterCache.get(cacheKey);
  if (cached && cached.updatedAt === cfg.updatedAt?.toISOString()) {
    return { transporter: cached.transporter, cfg };
  }

  const transporter = buildTransporter(cfg);
  transporterCache.set(cacheKey, {
    transporter,
    updatedAt: cfg.updatedAt?.toISOString(),
  });
  return { transporter, cfg };
}

export function buildTransporterFromRaw(smtpConfig) {
  return buildTransporter(smtpConfig);
}

export function invalidateCache(companyId) {
  transporterCache.delete(String(companyId));
}

// ── Send mail ────────────────────────────────────────────────

export async function sendMail(companyId, { to, subject, html, text, cc, bcc, replyTo, attachments }) {
  const { transporter, cfg } = await getTransporter(companyId);
  const from = cfg.fromName
    ? `"${cfg.fromName}" <${cfg.fromEmail}>`
    : cfg.fromEmail;

  const mailOptions = {
    from,
    to,
    subject,
    ...(html && { html }),
    ...(text && { text }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(replyTo || cfg.replyTo ? { replyTo: replyTo || cfg.replyTo } : {}),
    ...(attachments && { attachments }),
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

// ── Built-in email templates ─────────────────────────────────

const TEMPLATES = {
  welcome: {
    subject: "Welcome to {{appName}}!",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:0;">
        <div style="background:#197dfa;padding:24px 28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Welcome to {{appName}}</h1>
        </div>
        <div style="padding:28px;background:#ffffff;">
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">
            Hi <strong>{{userName}}</strong>,
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">
            Your account has been created successfully. You can now log in and start using the platform.
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">
            <strong>Username:</strong> {{loginId}}<br/>
          </p>
          <p style="font-size:13px;color:#94a3b8;margin:24px 0 0;">
            This is an automated message from {{appName}}. Please do not reply directly.
          </p>
        </div>
        <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;">
          © {{year}} {{appName}}. All rights reserved.
        </div>
      </div>`,
  },

  otp: {
    subject: "Your OTP for {{appName}}",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:0;">
        <div style="background:#197dfa;padding:24px 28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">{{appName}}</h1>
        </div>
        <div style="padding:28px;background:#ffffff;text-align:center;">
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 8px;">
            Hi <strong>{{userName}}</strong>, your one-time password is:
          </p>
          <div style="display:inline-block;background:#f0f7ff;border:2px solid #197dfa;border-radius:8px;padding:16px 36px;margin:16px 0;">
            <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0046d2;">{{otp}}</span>
          </div>
          <p style="font-size:13px;color:#64748b;margin:16px 0 0;">
            This OTP is valid for <strong>{{expiryMinutes}} minutes</strong>. Do not share it with anyone.
          </p>
        </div>
        <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;">
          © {{year}} {{appName}}. All rights reserved.
        </div>
      </div>`,
  },

  status_change: {
    subject: "{{appName}} — {{entityType}} Status Updated",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:0;">
        <div style="background:#197dfa;padding:24px 28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">{{appName}}</h1>
        </div>
        <div style="padding:28px;background:#ffffff;">
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">
            Hi <strong>{{userName}}</strong>,
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px;">
            Your <strong>{{entityType}}</strong> status has been updated:
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr>
              <td style="padding:10px 14px;background:#f1f5f9;font-size:14px;color:#64748b;border:1px solid #e2e8f0;">Previous Status</td>
              <td style="padding:10px 14px;background:#ffffff;font-size:14px;font-weight:600;color:#334155;border:1px solid #e2e8f0;">{{oldStatus}}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#f1f5f9;font-size:14px;color:#64748b;border:1px solid #e2e8f0;">New Status</td>
              <td style="padding:10px 14px;background:#ffffff;font-size:14px;font-weight:700;color:#197dfa;border:1px solid #e2e8f0;">{{newStatus}}</td>
            </tr>
          </table>
          {{#if remarks}}
          <p style="font-size:14px;color:#334155;line-height:1.6;margin:12px 0 0;">
            <strong>Remarks:</strong> {{remarks}}
          </p>
          {{/if}}
        </div>
        <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;">
          © {{year}} {{appName}}. All rights reserved.
        </div>
      </div>`,
  },

  test: {
    subject: "Test Email from {{appName}}",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f8fafc;padding:0;">
        <div style="background:#009696;padding:24px 28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">SMTP Test Successful</h1>
        </div>
        <div style="padding:28px;background:#ffffff;text-align:center;">
          <div style="font-size:48px;margin:12px 0;">✅</div>
          <p style="font-size:16px;color:#334155;font-weight:600;margin:0 0 8px;">
            Your SMTP configuration is working correctly!
          </p>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px;">
            This test email was sent from <strong>{{appName}}</strong> at {{timestamp}}.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;text-align:left;">
            <tr>
              <td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">SMTP Host</td>
              <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{smtpHost}}</td>
            </tr>
            <tr>
              <td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">Port</td>
              <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{smtpPort}}</td>
            </tr>
            <tr>
              <td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">From</td>
              <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{fromEmail}}</td>
            </tr>
          </table>
        </div>
        <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;">
          © {{year}} {{appName}}
        </div>
      </div>`,
  },
};

/**
 * Simple Mustache-style template renderer.
 * Supports {{variable}} and {{#if variable}}...{{/if}} blocks.
 */
export function renderTemplate(templateStr, data) {
  let result = templateStr;

  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return data[key] ? content : "";
  });

  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : "";
  });

  return result;
}

/**
 * Send a templated email.
 * @param {string} companyId
 * @param {string} templateName - one of: welcome, otp, status_change, test
 * @param {object} variables - template variables
 * @param {object} mailOpts - { to, cc, bcc, attachments }
 */
export async function sendTemplatedMail(companyId, templateName, variables, mailOpts) {
  const tpl = TEMPLATES[templateName];
  if (!tpl) throw new AppError(`Unknown email template: ${templateName}`, 400, "INVALID_TEMPLATE");

  const year = new Date().getFullYear();
  const vars = { year, appName: "Procurement Management System", ...variables };

  const subject = renderTemplate(tpl.subject, vars);
  const html = renderTemplate(tpl.html, vars);

  return sendMail(companyId, { ...mailOpts, subject, html });
}

/** List available template names */
export function listTemplates() {
  return Object.keys(TEMPLATES).map((key) => ({
    name: key,
    subject: TEMPLATES[key].subject,
  }));
}
