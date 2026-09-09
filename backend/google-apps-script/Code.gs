const CONFIG = Object.freeze({
  restaurantEmail: '52south.au@gmail.com',
  ccEmail: '52southbookings@gmail.com',
  timezone: 'Australia/Hobart',
  website: 'https://52south.au',
  phone: '0492 144 209'
});
const BOOKING_HEADERS = Object.freeze(['Received (Hobart)','Booking date','Booking time','Guests','First name','Last name','Mobile','Email','Dietary / occasion','Terms accepted','Source','Status','Reference','Delivery']);
const MEMBER_HEADERS = Object.freeze(['Joined (Hobart)','Member ID','Status','Full name','Mobile','Email','Date of birth','Consent','Source','Email normalized','Mobile normalized','Delivery']);

function doGet() {
  return response('52 South booking service', 'The reservation service is ready. Return to the booking page to request a table.');
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (String(p._honey || '').trim()) return response('Request rejected', 'Please call the restaurant.');
    if (p.form_type === 'membership') return registerMember(p);
    const started = Date.parse(p.form_started_at || '');
    if (!Number.isFinite(started) || Date.now() - started < 2500) return response('Please try again', 'Return to the booking form and review your details before sending.');

    const required = ['guests','booking_date','booking_time','first_name','last_name','phone','email','terms_accepted'];
    required.forEach(key => { if (!String(p[key] || '').trim()) throw new Error('Missing required booking information.'); });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('Invalid email address.');
    validateAvailability(p.booking_date, p.booking_time);

    const reference = /^52S-[A-Z0-9-]{6,30}$/.test(p.booking_reference || '') ? p.booking_reference : makeReference();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    let sheet, row;
    try {
      sheet = bookingSheet();
      row = appendBookingRow(sheet, p, reference);
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
      sheet.getRange(row, 14).setValue('EMAILS_SENT');
    } catch (mailError) {
      sheet.getRange(row, 14).setValue('EMAIL_FAILED: ' + clean(mailError.message));
      return response('Your request was saved, but email delivery failed', 'Please call ' + CONFIG.phone + ' and quote ' + reference + '.', reference);
    }
    return response('Reservation request received', 'Check your inbox for a receipt. Your table is confirmed only when our team replies.', reference, CONFIG.website + '/booking-confirmed/');
  } catch (error) {
    return response('We could not send this request', clean(error.message) + ' Please return to the form or call ' + CONFIG.phone + '.');
  }
}

function registerMember(p) {
  const started = Date.parse(p.form_started_at || '');
  if (!Number.isFinite(started) || Date.now() - started < 2500) return memberResponse('Please try again', 'Return to the membership form and review your details before sending.');
  ['full_name','phone','email','date_of_birth','membership_consent'].forEach(key => {
    if (!String(p[key] || '').trim()) throw new Error('Missing required membership information.');
  });
  const email = normalizeEmail(p.email);
  const phone = normalizePhone(p.phone);
  validateBirthDate(p.date_of_birth);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let sheet, row, memberId;
  try {
    sheet = memberSheet();
    if (memberExists(sheet, email, phone)) return memberResponse('Membership already exists', 'A membership already uses this email address or mobile number. Please contact 52 South if you need help.');
    memberId = makeMemberId();
    row = appendMemberRow(sheet, p, memberId, email, phone);
  } finally { lock.releaseLock(); }

  try {
    MailApp.sendEmail({
      to: CONFIG.restaurantEmail,
      subject: 'New 52 South Rewards member — ' + memberId,
      body: 'Member ID: '+memberId+'\nName: '+clean(p.full_name)+'\nMobile: '+clean(p.phone)+'\nEmail: '+email+'\n\nThe complete record is stored in the private Members sheet.',
      replyTo: email,
      name: '52 South Website Memberships'
    });
    MailApp.sendEmail({
      to: email,
      subject: 'Welcome to 52 South Rewards — ' + memberId,
      body: 'Welcome to 52 South Rewards.\n\nYour member ID is '+memberId+'.\n\nWe will use your details to administer your membership and send member news and offers. You can unsubscribe at any time by replying to this email.\n\n52 South Cafe & Restaurant\n'+CONFIG.phone,
      replyTo: CONFIG.restaurantEmail,
      name: '52 South Cafe & Restaurant'
    });
    sheet.getRange(row, 12).setValue('EMAILS_SENT');
  } catch (mailError) {
    sheet.getRange(row, 12).setValue('EMAIL_FAILED: ' + clean(mailError.message));
    return memberResponse('Membership saved', 'Your membership was created, but the welcome email could not be sent. Please contact 52 South and quote ' + memberId + '.', memberId);
  }
  return memberResponse('Welcome to 52 South Rewards', 'Your membership has been created. Check your inbox for your member ID.', memberId, CONFIG.website + '/loyalty/?submitted=true');
}

function memberSheet() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('BOOKING_SHEET_ID');
  let spreadsheet;
  if (id) spreadsheet = SpreadsheetApp.openById(id);
  else {
    bookingSheet();
    id = properties.getProperty('BOOKING_SHEET_ID');
    spreadsheet = SpreadsheetApp.openById(id);
  }
  spreadsheet.setSpreadsheetTimeZone(CONFIG.timezone);
  let sheet = spreadsheet.getSheetByName('Members');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Members');
    sheet.appendRow(MEMBER_HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(MEMBER_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function memberExists(sheet, email, phone) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const values = sheet.getRange(2, 10, lastRow - 1, 2).getDisplayValues();
  return values.some(row => row[0] === email || row[1] === phone);
}

function appendMemberRow(sheet, p, memberId, email, phone) {
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, 12).setNumberFormat('@');
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(row, 1, 1, 12).setValues([[
    new Date(), memberId, 'Active', clean(p.full_name), clean(p.phone), email, clean(p.date_of_birth),
    'Accepted', clean(p.membership_source || '52south.au member benefits page'), email, phone, 'PENDING'
  ]]);
  return row;
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email address.');
  return email;
}

function normalizePhone(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.indexOf('0') === 0) phone = '61' + phone.slice(1);
  if (!/^61\d{9}$/.test(phone)) throw new Error('Enter a valid Australian mobile number.');
  return phone;
}

function validateBirthDate(value) {
  const dob = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) throw new Error('Invalid date of birth.');
  let parsed;
  try { parsed = Utilities.parseDate(dob, CONFIG.timezone, 'yyyy-MM-dd'); }
  catch (error) { throw new Error('Invalid date of birth.'); }
  if (Utilities.formatDate(parsed, CONFIG.timezone, 'yyyy-MM-dd') !== dob) throw new Error('Invalid date of birth.');
  const today = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd');
  const oldest = String(Number(today.slice(0,4)) - 120) + today.slice(4);
  if (dob > today || dob < oldest) throw new Error('Invalid date of birth.');
}

function makeMemberId() {
  return '52M-' + Utilities.formatDate(new Date(), CONFIG.timezone, 'yyMMdd') + '-' + Utilities.getUuid().slice(0,5).toUpperCase();
}

function validateAvailability(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Invalid date or time.');
  const now = new Date();
  const today = Utilities.formatDate(now, CONFIG.timezone, 'yyyy-MM-dd');
  const max = new Date(now.getTime() + 60 * 86400000);
  const lastDate = Utilities.formatDate(max, CONFIG.timezone, 'yyyy-MM-dd');
  if (date < today || date > lastDate) throw new Error('The selected date is no longer available.');
  const noon = Utilities.parseDate(date + ' 12:00', CONFIG.timezone, 'yyyy-MM-dd HH:mm');
  if (Utilities.formatDate(noon, CONFIG.timezone, 'EEE') === 'Mon') throw new Error('The restaurant is closed on Mondays.');
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
  spreadsheet.setSpreadsheetTimeZone(CONFIG.timezone);
  const sheet = spreadsheet.getSheetByName('Bookings');
  migrateBookingSheet(sheet);
  return sheet;
}

function migrateBookingSheet(sheet) {
  if (!sheet) throw new Error('Booking sheet is unavailable.');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BOOKING_HEADERS);
    sheet.setFrozenRows(1);
    return;
  }
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(1, 1, lastRow, 14).getValues();
  if (values[0][0] !== 'Received (Hobart)' || values[0][1] !== 'Booking date') throw new Error('Unexpected booking sheet structure.');
  sheet.getRange(1, 1, 1, 14).setValues([BOOKING_HEADERS]);
  for (let index = 1; index < values.length; index++) {
    const row = values[index];
    if (/^52S-/.test(String(row[1])) && row[2] === 'RECEIVED') {
      formatBookingRow(sheet, index + 1);
      sheet.getRange(index + 1, 1, 1, 14).setValues([[
        row[0], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11],
        '52south.au reservation page', 'New', row[1], row[12]
      ]]);
    }
  }
  sheet.setFrozenRows(1);
}

function appendBookingRow(sheet, p, reference) {
  const row = sheet.getLastRow() + 1;
  formatBookingRow(sheet, row);
  sheet.getRange(row, 1, 1, 14).setValues([[
    new Date(), clean(p.booking_date), clean(p.booking_time), clean(p.guests), clean(p.first_name), clean(p.last_name),
    clean(p.phone), clean(p.email), clean(p.notes), 'Accepted', clean(p.booking_source || '52south.au reservation page'),
    'New', reference, 'PENDING'
  ]]);
  return row;
}

function formatBookingRow(sheet, row) {
  sheet.getRange(row, 1, 1, 14).setNumberFormat('@');
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
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

function memberResponse(title, message, reference, redirect) {
  const safeTitle = escapeHtml(title), safeMessage = escapeHtml(message), safeReference = escapeHtml(reference || '');
  const next = redirect ? '<meta http-equiv="refresh" content="3;url='+redirect+'">' : '';
  return HtmlService.createHtmlOutput('<!doctype html><meta name="viewport" content="width=device-width"><title>'+safeTitle+'</title>'+next+'<style>body{margin:0;background:#080808;color:#fff;font:18px system-ui;display:grid;place-items:center;min-height:100vh}.card{max-width:650px;margin:20px;padding:36px;border:1px solid #5d5030;border-radius:20px;background:#151515}h1{color:#e2c66d}a{color:#f2d989}</style><main class="card"><h1>'+safeTitle+'</h1><p>'+safeMessage+'</p>'+(safeReference?'<p><strong>Member ID:</strong> '+safeReference+'</p>':'')+'<p><a href="'+CONFIG.website+'/loyalty/">Return to member benefits</a> · <a href="tel:+61492144209">Call '+CONFIG.phone+'</a></p></main>');
}
