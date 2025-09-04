const nodemailer = require('nodemailer');
const mjml2html = require('mjml');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function dealerTemplate(data) {
  const mjml = `
  <mjml>
    <mj-body>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — New Dealer Registration</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="20px">
        <mj-column>
          <mj-text font-size="16px" font-weight="600">Company: ${data.companyName}</mj-text>
          <mj-text>Email: ${data.email} | Phone: ${data.phone}</mj-text>
          <mj-text>Org Type: ${data.orgType}</mj-text>
          <mj-text>Expected Volume: ${data.volumeBand}</mj-text>
          <mj-text>Message: ${data.message || '—'}</mj-text>
          <mj-divider />
          <mj-text font-size="14px">View full application in the admin dashboard.</mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="12px">© ${new Date().getFullYear()} Swasti</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`;
  return mjml2html(mjml).html;
}

function bulkTemplate(data) {
  const mjml = `
  <mjml>
    <mj-body>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — Bulk Purchase Inquiry</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="20px">
        <mj-column>
          <mj-text font-size="16px" font-weight="600">Organization: ${data.orgName || data.companyName}</mj-text>
          <mj-text>Email: ${data.email} | Phone: ${data.phone}</mj-text>
          <mj-text>Items:</mj-text>
          <mj-text>${(data.items||[]).map(it => `${it.name} — ${it.qty}`).join('<br/>')}</mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="12px">© ${new Date().getFullYear()} Swasti</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`;
  return mjml2html(mjml).html;
}

async function sendDealerNotification(to, data) {
  const html = dealerTemplate(data);
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `New Dealer Registration — ${data.companyName}`,
    html
  });
}

async function sendBulkNotification(to, data) {
  const html = bulkTemplate(data);
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `New Bulk Inquiry — ${data.orgName || data.companyName}`,
    html
  });
}

module.exports = { sendDealerNotification, sendBulkNotification, transporter };
