const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM;

function safe(v) {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s;
}

function serializeError(e) {
  const o = {
    name: e?.name,
    message: e?.message,
    statusCode: e?.statusCode,
    code: e?.code,
  };
  const respErr =
    e?.response?.data?.error?.message ||
    e?.response?.data?.message ||
    e?.response?.data;
  if (respErr) o.response = respErr;
  return o;
}

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  if (!FROM) throw new Error("Missing RESEND_FROM");
  const toVal = Array.isArray(to) ? to.filter(Boolean) : (to ? String(to).trim() : "");
  const subjVal = subject ? String(subject).trim() : "";
  const htmlVal = html ? String(html) : "";
  if (!toVal || (Array.isArray(toVal) && toVal.length === 0)) throw new Error("Missing recipient");
  if (!subjVal) throw new Error("Missing subject");
  if (!htmlVal) throw new Error("Missing html");
  try {
    console.info("[email] send attempt", JSON.stringify({ to: toVal, subject: subjVal }));
    const result = await resend.emails.send({ from: FROM, to: toVal, subject: subjVal, html: htmlVal });
    console.info("[email] send success", JSON.stringify({ id: result?.data?.id || null }));
    return result;
  } catch (e) {
    console.error("[email] send error", JSON.stringify({ to: toVal, subject: subjVal, error: serializeError(e) }));
    throw e;
  }
}

async function sendAdminDealerSubmission(to, data) {
  const who = safe(data.companyName) || safe(data.contactName) || safe(data.email) || "Applicant";
  const subject = `New Dealer Application — ${who}`;
  const html = [
    `<p>New dealer application received.</p>`,
    `<p><strong>Company:</strong> ${safe(data.companyName)}</p>`,
    `<p><strong>Contact:</strong> ${safe(data.contactName)}</p>`,
    `<p><strong>Email:</strong> ${safe(data.email)}</p>`,
    `<p><strong>Phone:</strong> ${safe(data.phone)}</p>`,
    `<p><strong>Org Type:</strong> ${safe(data.orgType)}</p>`,
    `<p><strong>Volume:</strong> ${safe(data.volumeBand)}</p>`,
    `<p><strong>City:</strong> ${safe(data.city)} ${safe(data.state)} ${safe(data.pincode)}</p>`,
    `<p><strong>Message:</strong> ${safe(data.message)}</p>`,
    `<p><strong>Reference:</strong> ${String(data._id)}</p>`,
  ].join("");
  return sendEmail(to, subject, html);
}

async function sendApplicantStatusEmail(to, data, status, notes) {
  const subject = status === "Approved" ? "Dealer Application Approved" : "Dealer Application Update";
  const msg =
    status === "Approved"
      ? "Your application has been approved. Our team will contact you with next steps."
      : "Your application was not approved at this time.";
  const html = [
    `<p>Hello ${safe(data.contactName) || safe(data.companyName) || "Applicant"},</p>`,
    `<p>${msg}</p>`,
    notes ? `<p><strong>Notes:</strong> ${safe(notes)}</p>` : "",
    `<p><strong>Reference:</strong> ${String(data._id)}</p>`,
  ].join("");
  return sendEmail(to, subject, html);
}

async function sendApplicantTerminationEmail(to, data) {
  const subject = "Dealership Termination Notice";
  const html = [
    `<p>Hello ${safe(data.contactName) || safe(data.companyName) || "Dealer"},</p>`,
    `<p>This is to inform you that the dealership arrangement stands terminated with immediate effect.</p>`,
    `<p>Please cease representing us and refrain from using any associated name, branding, or materials.</p>`,
    `<p><strong>Reference:</strong> ${String(data._id)}</p>`,
  ].join("");
  return sendEmail(to, subject, html);
}

module.exports = {
  sendAdminDealerSubmission,
  sendApplicantStatusEmail,
  sendApplicantTerminationEmail,
};
