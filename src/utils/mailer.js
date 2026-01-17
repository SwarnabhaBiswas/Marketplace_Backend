const nodemailer = require('nodemailer');
const mjml2html = require('mjml');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls:{
    rejectUnauthorized:false,
  }
});

transporter.verify((error,success)=>{
  if(error){
    console.error("SMTP connection",error);
  }
  else{
    console.error("server ready");
  }
}

)

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

// Send notification for dealer or bulk (from DealerApplication collection)
async function sendDealerOrBulkNotification(to, data) {
  const isBulk = (data?.enquiryType === 'bulk');
  const subject = isBulk
    ? `Bulk Buying Inquiry — ${data.companyName || data.contactName || data.email}`
    : `New Dealer Registration — ${data.companyName || data.contactName || data.email}`;
  const html = isBulk
    ? (() => {
        const qty = data?.volumeBand ? String(data.volumeBand) : '—';
        const msg = data?.message ? String(data.message) : '—';
        const mjml = `
        <mjml>
          <mj-body>
            <mj-section background-color="#0f1724" padding="20px">
              <mj-column>
                <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — Bulk Buying Inquiry</mj-text>
              </mj-column>
            </mj-section>
            <mj-section padding="20px">
              <mj-column>
                <mj-text font-size="16px"><strong>Name:</strong> ${data.contactName || '—'}</mj-text>
                <mj-text><strong>Email:</strong> ${data.email || '—'} | <strong>Phone:</strong> ${data.phone || '—'}</mj-text>
                <mj-text><strong>Company:</strong> ${data.companyName || '—'}</mj-text>
                <mj-divider />
                <mj-text font-size="16px"><strong>Quantity:</strong> ${qty}</mj-text>
                <mj-text><strong>Message:</strong> ${msg}</mj-text>
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
      })()
    : dealerTemplate(data);

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
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

function contactTemplate(data) {
  const mjml = `
  <mjml>
    <mj-body>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — New Contact Message</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="20px">
        <mj-column>
          <mj-text font-size="16px" font-weight="600">From: ${data.name}</mj-text>
          <mj-text>Email: ${data.email} | Phone: ${data.phone || '—'}</mj-text>
          <mj-text>Message:</mj-text>
          <mj-text>${data.message || '—'}</mj-text>
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

async function sendContactNotification(to, data) {
  const html = contactTemplate(data);
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `New Contact — ${data.name}`,
    html
  });
}

async function sendDealerStatusEmail(to, data, status, notes) {
  const subject = status === 'Approved' ? 'Your dealer application has been approved' : 'Your dealer application status update';
  const msg = status === 'Approved'
    ? 'We are delighted to inform you that your application has been approved. Our team will contact you with next steps.'
    : 'We appreciate your interest. At this time, your application was not approved. You may reply to this email for any clarification.';
  const safeNotes = notes ? `<mj-text font-size="14px"><strong>Notes from team:</strong> ${notes}</mj-text>` : '';
  const mjml = `
  <mjml>
    <mj-body>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — Dealer Application</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="20px">
        <mj-column>
          <mj-text font-size="18px" font-weight="700">Hello ${data.contactName || data.companyName || 'Applicant'},</mj-text>
          <mj-text>${msg}</mj-text>
          ${safeNotes}
          <mj-divider />
          <mj-text font-size="14px">Application reference: ${String(data._id)}</mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="12px">© ${new Date().getFullYear()} Swasti</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`;
  const html = mjml2html(mjml).html;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendDealerTerminationEmail(to, data) {
  const mjml = `
  <mjml>
    <mj-body>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="20px" font-weight="700">Swasti — Notice of Discontinuation</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="20px">
        <mj-column>
          <mj-text font-size="18px" font-weight="700">Hello ${data.contactName || data.companyName || 'Dealer'},</mj-text>
          <mj-text>
          This is to inform you that the dealership arrangement will stand discontinued. You are requested to cease representing us in any capacity and to refrain from using any associated name, branding, or materials with immediate effect.
          </mj-text>
          <mj-text>
          Any pending administrative or operational matters, if applicable, may be completed at the earliest.
          We acknowledge the association and wish you well in your future endeavors.
          </mj-text>
          <mj-text>
          Yours sincerely,
          </mj-text>
          <mj-text>
          Swasti India Pvt. Ltd.
          </mj-text>
          <mj-divider />
          <mj-text font-size="14px">Reference: ${String(data._id)}</mj-text>
        </mj-column>
      </mj-section>
      <mj-section background-color="#0f1724" padding="20px">
        <mj-column>
          <mj-text color="#fff" font-size="12px">© ${new Date().getFullYear()} Swasti India Pvt. Ltd.</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>`;
  const html = mjml2html(mjml).html;
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Dealership Termination Notice',
    html,
  });
}

module.exports = { sendDealerNotification, sendBulkNotification, sendContactNotification, sendDealerStatusEmail, sendDealerOrBulkNotification, sendDealerTerminationEmail, transporter };
