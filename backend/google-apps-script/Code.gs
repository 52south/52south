const CONFIG = Object.freeze({
  restaurantEmail: '52south.au@gmail.com',
  ccEmail: '52southbookings@gmail.com',
  timezone: 'Australia/Hobart',
  website: 'https://52south.au',
  phone: '0492 144 209'
});

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (String(p._honey || '').trim()) return response('Request rejected', 'Please call the restaurant.');
    const started = Date.parse(p.form_started_at || '');
    if (!Number.isFinite(started) || Date.now() - started < 2500) return response('Please try again', 'Return to the booking form and review your details before sending.');

    const required = ['guests','booking_date','booking_time','first_name','last_name','phone','email','terms_accepted'];
    required.forEach(key => { if (!String(p[key] || '').trim()) throw new Error('Missing required booking information.'); });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Invalid email address.');
    validateAvailability(p.booking_date, p.booking_time);

    const reference = /^52S-[A-Z0-9-]{6,30}$/.test(p.booking_reference || '') ? p.booking_reference : makeReference();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let sheet;
    try {
      sheet = bookingSheet();
      sheet.appendRow([new Date(), reference, 'RECEIVED', clean(p.booking_date), clean(p.booking_time), clean(p.guests), clean(p.first_name), clean(p.last_name), clean(p.phone), clean(p.email), clean(p.notes), 'Accepted', 'PENDING']);
    } finally { lock.releaseLock(); }

    const details = bookingDetails(p, reference);
    try {
      MailApp.sendEmail({
        to: CONFIG.restaurantEmail, cc: CONFIG.ccEmail,
        subject: 'New 52 South table request — ' + p.booking_date + ' ' + p.booking_time + ' — ' + reference,
        body: details.text, htmlBody: details.html, replyTo: p.email, name: '52 South Website Bookings'
      });
      MailApp.sendEmail({
        to: p.email, subject: 'We received your 52 South reservation request — ' + reference,
        body: customerReceipt(p, reference, false), htmlBody: customerReceipt(p, reference, true),
        replyTo: CONFIG.restaurantEmail, name: '52 South Cafe & Restaurant'
      });
      sheet.getRange(sheet.getLastRow(), 13).setValue('EMAILS_SENT');
    } catch (mailError) {
      sheet.getRange(sheet.getLastRow(), 13).setValue('EMAIL_FAILED: ' + clean(mailError.message));
      return response('Your request was saved, but email delivery failed', 'Please call ' + CONFIG.phone + ' and quote ' + reference + '.', reference);
    }
    return response('Reservation request received', 'Check your inbox for a receipt. Your table is confirmed only when our team replies.', reference, CONFIG.website + '/booking-confirmed/');
  } catch (error) {
    return response('We could not send this request', clean(error.message) + ' Please return to the form or call ' + CONFIG.phone + '.');
  }
}

function validateAvailability(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Invalid date or time.');
  const now = new Date();
  const today = Utilities.formatDate(now, CONFIG.timezone, 'yyyy-MM-dd');
  const max = new Date(now.getTime() + 60 * 86400000);
  const lastDate = Utilities.formatDate(max, CONFIG.timezone, 'yyyy-MM-dd');
  if (date < today || date > lastDate) throw new Error('The selected date is no longer available.');
  const noon = Utilities.parseDate(date + ' 12:00', CONFIG.timezone, 'yyyy-MM-dd HH:mm');
  if (Number(Utilities.formatDate(noon, CONFIG.timezone, 'u')) === 1) throw new Error('The restaurant is closed on Mondays.');
  const minutes = Number(time.slice(0,2)) * 60 + Number(time.slice(3));
  if (minutes < 540 || minutes > 1185 || minutes % 15) throw new Error('The selected arrival time is outside booking hours.');
  if (date === today) {
    const currentMinutes = Number(Utilities.formatDate(now, CONFIG.timezone, 'H')) * 60 + Number(Utilities.formatDate(now, CONFIG.timezone, 'm'));
    if (minutes <= currentMinutes) throw new Error('The selected arrival time has passed.');
  }
}

function bookingSheet() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('BOOKING_SHEET_ID');
  let spreadsheet;
  if (id) spreadsheet = SpreadsheetApp.openById(id);
  else {
    spreadsheet = SpreadsheetApp.create('52 South Website Booking Requests');
    properties.setProperty('BOOKING_SHEET_ID', spreadsheet.getId());
    const sheet = spreadsheet.getSheets()[0];
    sheet.setName('Bookings');
    sheet.appendRow(['Received (Hobart)','Reference','Status','Date','Time','Guests','First name','Last name','Phone','Email','Notes','Terms','Delivery']);
    sheet.setFrozenRows(1);
  }
  return spreadsheet.getSheetByName('Bookings');
}

function makeReference() {
  return '52S-' + Utilities.formatDate(new Date(), CONFIG.timezone, 'yyMMdd') + '-' + Utilities.getUuid().slice(0,5).toUpperCase();
}

function clean(value) { return String(value || '').replace(/[<>]/g, '').trim().slice(0,2000); }
function escapeHtml(value) { return clean(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function bookingDetails(p, reference) {
  const rows = [['Reference',reference],['Date',p.booking_date],['Time',p.booking_time],['Guests',p.guests],['Name',p.first_name+' '+p.last_name],['Phone',p.phone],['Email',p.email],['Notes',p.notes||'None']];
  return {text: rows.map(r=>r[0]+': '+clean(r[1])).join('\n'), html: '<h2>New table request</h2><table>'+rows.map(r=>'<tr><th align="left">'+r[0]+'</th><td>'+escapeHtml(r[1])+'</td></tr>').join('')+'</table><p>This is a request until staff confirm it.</p>'};
}
function customerReceipt(p, reference, html) {
  const text = 'We received your reservation request.\nReference: '+reference+'\nDate: '+clean(p.booking_date)+'\nTime: '+clean(p.booking_time)+'\nGuests: '+clean(p.guests)+'\n\nYour table is not confirmed until our team replies. For same-day help call '+CONFIG.phone+'.';
  return html ? '<h2>We received your request</h2><p><strong>Reference:</strong> '+escapeHtml(reference)+'</p><p><strong>Date:</strong> '+escapeHtml(p.booking_date)+'<br><strong>Time:</strong> '+escapeHtml(p.booking_time)+'<br><strong>Guests:</strong> '+escapeHtml(p.guests)+'</p><p>Your table is not confirmed until our team replies. For same-day help call '+CONFIG.phone+'.</p>' : text;
}
function response(title, message, reference, redirect) {
  const safeTitle = escapeHtml(title), safeMessage = escapeHtml(message), safeReference = escapeHtml(reference || '');
  const next = redirect ? '<meta http-equiv="refresh" content="3;url='+redirect+'">' : '';
  return HtmlService.createHtmlOutput('<!doctype html><meta name="viewport" content="width=device-width"><title>'+safeTitle+'</title>'+next+'<style>body{margin:0;background:#080808;color:#fff;font:18px system-ui;display:grid;place-items:center;min-height:100vh}.card{max-width:650px;margin:20px;padding:36px;border:1px solid #5d5030;border-radius:20px;background:#151515}h1{color:#e2c66d}a{color:#f2d989}</style><main class="card"><h1>'+safeTitle+'</h1><p>'+safeMessage+'</p>'+(safeReference?'<p><strong>Reference:</strong> '+safeReference+'</p>':'')+'<p><a href="'+CONFIG.website+'/book-a-table/">Return to booking page</a> · <a href="tel:+61492144209">Call '+CONFIG.phone+'</a></p></main>');
}
