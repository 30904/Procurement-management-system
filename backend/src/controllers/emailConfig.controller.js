import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { EmailConfig } from "../models/EmailConfig.model.js";
import {
  buildTransporterFromRaw,
  invalidateCache,
  renderTemplate,
  listTemplates,
  sendTemplatedMail,
} from "../services/email.service.js";

export const getConfig = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) throw new AppError("Super Admin required", 403, "FORBIDDEN");
  const companyId = req.rbac.companyId;

  let doc = await EmailConfig.findOne({ company: companyId }).lean();
  if (doc) {
    doc = { ...doc, smtpPass: doc.smtpPass ? "••••••••" : "" };
  }
  res.status(200).json({ success: true, data: doc });
});

export const saveConfig = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) throw new AppError("Super Admin required", 403, "FORBIDDEN");
  const companyId = req.rbac.companyId;
  const body = req.body ?? {};

  const fields = {
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort,
    smtpSecure: body.smtpSecure,
    smtpUser: body.smtpUser,
    fromName: body.fromName,
    fromEmail: body.fromEmail,
    replyTo: body.replyTo,
    tlsRejectUnauthorized: body.tlsRejectUnauthorized,
    isActive: body.isActive,
  };

  if (body.smtpPass && body.smtpPass !== "••••••••") {
    fields.smtpPass = body.smtpPass;
  }

  const doc = await EmailConfig.findOneAndUpdate(
    { company: companyId },
    { $set: { company: companyId, ...fields } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  invalidateCache(companyId);

  const safe = doc.toObject();
  safe.smtpPass = safe.smtpPass ? "••••••••" : "";
  res.status(200).json({ success: true, data: safe });
});

export const testEmail = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) throw new AppError("Super Admin required", 403, "FORBIDDEN");

  const { to, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName, fromEmail, tlsRejectUnauthorized } = req.body ?? {};

  if (!to) throw new AppError("Recipient email (to) is required", 400, "VALIDATION_ERROR");
  if (!smtpHost || !smtpUser) throw new AppError("SMTP host and user are required", 400, "VALIDATION_ERROR");

  let actualPass = smtpPass;
  if (!actualPass || actualPass === "••••••••") {
    const existing = await EmailConfig.findOne({ company: req.rbac.companyId }).lean();
    actualPass = existing?.smtpPass || "";
  }

  const transporter = buildTransporterFromRaw({
    smtpHost,
    smtpPort: smtpPort || 465,
    smtpSecure: smtpSecure !== false,
    smtpUser,
    smtpPass: actualPass,
    tlsRejectUnauthorized: tlsRejectUnauthorized ?? false,
  });

  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const testTpl = {
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
            <tr><td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">SMTP Host</td>
                <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{smtpHost}}</td></tr>
            <tr><td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">Port</td>
                <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{smtpPort}}</td></tr>
            <tr><td style="padding:8px 14px;background:#f1f5f9;font-size:13px;color:#64748b;border:1px solid #e2e8f0;">From</td>
                <td style="padding:8px 14px;font-size:13px;color:#334155;border:1px solid #e2e8f0;">{{fromEmail}}</td></tr>
          </table>
        </div>
        <div style="background:#f1f5f9;padding:14px 28px;text-align:center;font-size:12px;color:#94a3b8;">
          © {{year}} {{appName}}
        </div>
      </div>`,
  };

  const vars = {
    appName: "Procurement Management System",
    timestamp,
    smtpHost,
    smtpPort: smtpPort || 465,
    fromEmail: fromEmail || smtpUser,
    year: new Date().getFullYear(),
  };

  const subject = renderTemplate(testTpl.subject, vars);
  const html = renderTemplate(testTpl.html, vars);

  const from = fromName
    ? `"${fromName}" <${fromEmail || smtpUser}>`
    : fromEmail || smtpUser;

  const info = await transporter.sendMail({ from, to, subject, html });

  res.status(200).json({
    success: true,
    data: {
      message: "Test email sent successfully",
      messageId: info.messageId,
      accepted: info.accepted,
    },
  });
});

export const getTemplates = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: listTemplates() });
});

export const sendTemplate = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { templateName, variables, to, cc, bcc } = req.body ?? {};
  if (!templateName) throw new AppError("templateName is required", 400, "VALIDATION_ERROR");
  if (!to) throw new AppError("to is required", 400, "VALIDATION_ERROR");

  const result = await sendTemplatedMail(companyId, templateName, variables || {}, { to, cc, bcc });
  res.status(200).json({ success: true, data: result });
});
