const CONFIG = Object.freeze({
  restaurantEmail: '52south.au@gmail.com',
  ccEmail: '52southbookings@gmail.com',
  timezone: 'Australia/Hobart',
  website: 'https://52south.au',
  phone: '0492 144 209',
  maxSpinsPerWeek: 2,
  spinInviteDays: 14,
  prizeExpiryHours: 24
});
const BOOKING_HEADERS = Object.freeze(['Received (Hobart)','Booking date','Booking time','Guests','First name','Last name','Mobile','Email','Dietary / occasion','Terms accepted','Source','Status','Reference','Delivery']);
const MEMBER_HEADERS = Object.freeze(['Joined (Hobart)','Member ID','Status','Full name','Mobile','Email','Date of birth','Consent','Source','Email normalized','Mobile normalized','Delivery','Mobile last 9','Surname normalized','DOB normalized']);
const SPIN_ACCESS_HEADERS = Object.freeze(['Created (Hobart)','Member ID','Token hash','Status','Expires (Hobart)','Used (Hobart)','Prize code']);
const PRIZE_HEADERS = Object.freeze(['Awarded (Hobart)','Member ID','Prize','Code','Expires (Hobart)','Status','Redeemed (Hobart)']);
const PRIZES = Object.freeze([
  Object.freeze({name:'10% discount', weight:31}),
  Object.freeze({name:'Free soft drink', weight:26}),
  Object.freeze({name:'Free coffee', weight:20}),
  Object.freeze({name:'Free milkshake', weight:12}),
  Object.freeze({name:'Free chicken fried rice', weight:6}),
  Object.freeze({name:'Free chicken kottu', weight:5})
]);

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'spin') return spinPage(p.token);
  if (p.action === 'redeem') return redemptionPage();
  return response('52 South booking service', 'The reservation service is ready. Return to the booking page to request a table.');
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (String(p._honey || '').trim()) return response('Request rejected', 'Please call the restaurant.');
    if (p.form_type === 'membership') return registerMember(p);
    if (p.form_type === 'spin_access') return requestSpinAccess(p);
    if (p.form_type === 'welcome_spin') return performSpin(p);
    if (p.form_type === 'reward_redeem') return redeemPrize(p);
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
  ['full_name','surname','phone','email','date_of_birth','membership_consent'].forEach(key => {
    if (!String(p[key] || '').trim()) throw new Error('Missing required membership information.');
  });
  const email = normalizeEmail(p.email);
  const phone = normalizePhone(p.phone);
  const phoneLast9 = phone.slice(-9);
  const surname = normalizeSurname(p.surname);
  const dob = validateBirthDate(p.date_of_birth);
  validateMemberAge(dob);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let sheet, row, memberId, spinToken;
  try {
    sheet = memberSheet();
    if (memberExists(sheet, email, phoneLast9, surname, dob)) return memberResponse('Membership already exists', 'We found an existing membership using this email, mobile number, or surname and date of birth. Please contact 52 South if you need help.');
    memberId = makeMemberId();
    row = appendMemberRow(sheet, p, memberId, email, phone, phoneLast9, surname, dob);
    spinToken = createSpinAccess(memberId);
  } finally { lock.releaseLock(); }

  const spinLink = memberWheelUrl(spinToken);
  try {
    MailApp.sendEmail({
      to: CONFIG.restaurantEmail,
      subject: 'New 52 South Rewards member — ' + memberId,
      body: 'Member ID: '+memberId+'\nName: '+clean(p.full_name)+' '+clean(p.surname)+'\nMobile: '+clean(p.phone)+'\nEmail: '+email+'\n\nThe complete record is stored in the private Members sheet.',
      replyTo: email,
      name: '52 South Website Memberships'
    });
    MailApp.sendEmail({
      to: email,
      subject: 'Welcome to 52 South Rewards — ' + memberId,
      body: wheelEmailText(memberId, spinLink),
      htmlBody: wheelEmailHtml(memberId, spinLink),
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

function requestSpinAccess(p) {
  const started = Date.parse(p.form_started_at || '');
  if (!Number.isFinite(started) || Date.now() - started < 2500) return memberResponse('Please try again', 'Return to the member page and review your details before sending.');
  ['surname','phone','email','date_of_birth'].forEach(key => {
    if (!String(p[key] || '').trim()) throw new Error('Enter all four member identity details.');
  });
  const email = normalizeEmail(p.email);
  const phoneLast9 = normalizePhone(p.phone).slice(-9);
  const surname = normalizeSurname(p.surname);
  const dob = validateBirthDate(p.date_of_birth);
  validateMemberAge(dob);

  const genericMessage = 'If all details match an eligible membership, we have emailed a private Welcome Wheel link to the address already on that membership.';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let memberId = '', storedEmail = '', spinToken = '';
  try {
    const sheet = memberSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const values = sheet.getRange(2, 1, lastRow - 1, MEMBER_HEADERS.length).getDisplayValues();
      const match = values.find(row => row[2] === 'Active' && row[9] === email && row[12] === phoneLast9 && row[13] === surname && row[14] === dob);
      if (match) {
        memberId = match[1];
        storedEmail = match[9];
        spinToken = createSpinAccess(memberId);
      }
    }
  } finally { lock.releaseLock(); }

  if (spinToken && storedEmail) {
    const spinLink = memberWheelUrl(spinToken);
    MailApp.sendEmail({
      to: storedEmail,
      subject: 'Your private 52 South Welcome Wheel link',
      body: wheelEmailText(memberId, spinLink),
      htmlBody: wheelEmailHtml(memberId, spinLink),
      replyTo: CONFIG.restaurantEmail,
      name: '52 South Cafe & Restaurant'
    });
  }
  return memberResponse('Check your email', genericMessage);
}

function validateMemberAge(dob) {
  const today = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd');
  const cutoff = String(Number(today.slice(0, 4)) - 21) + today.slice(4);
  if (dob > cutoff) throw new Error('52 South Rewards Welcome Wheel is available only to members aged 21 or older.');
}

function serviceUrl() {
  return ScriptApp.getService().getUrl() || 'https://script.google.com/macros/s/AKfycbymxZXbLhodJ1XmhGSfgvXKavn_S_ANsou_E3l2t2dxdguPboGiJidkAUo_Wke9Cys6sQ/exec';
}

function memberWheelUrl(token) {
  return CONFIG.website + '/welcome-wheel/#' + encodeURIComponent(token);
}

function workbook() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('BOOKING_SHEET_ID');
  if (!id) {
    bookingSheet();
    id = properties.getProperty('BOOKING_SHEET_ID');
  }
  const spreadsheet = SpreadsheetApp.openById(id);
  spreadsheet.setSpreadsheetTimeZone(CONFIG.timezone);
  return spreadsheet;
}

function managedSheet(name, headers) {
  const spreadsheet = workbook();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function spinAccessSheet() { return managedSheet('Spin Access', SPIN_ACCESS_HEADERS); }
function prizeSheet() { return managedSheet('Prize Wins', PRIZE_HEADERS); }

function createSpinAccess(memberId) {
  const sheet = spinAccessSheet();
  if (spinsThisWeek(memberId) >= CONFIG.maxSpinsPerWeek) return '';
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, SPIN_ACCESS_HEADERS.length).getDisplayValues();
    values.forEach((row, index) => {
      if (row[1] === memberId && row[3] === 'ACTIVE') sheet.getRange(index + 2, 4).setValue('REPLACED');
    });
  }
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const expires = new Date(Date.now() + CONFIG.spinInviteDays * 86400000);
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, SPIN_ACCESS_HEADERS.length).setNumberFormat('@');
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(row, 5).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(row, 1, 1, SPIN_ACCESS_HEADERS.length).setValues([[new Date(), memberId, hashValue(token), 'ACTIVE', expires, '', '']]);
  return token;
}

function hashValue(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(byte => ('0' + (byte & 255).toString(16)).slice(-2)).join('');
}

function findSpinAccess(token) {
  if (!/^[a-f0-9]{64}$/i.test(String(token || ''))) return null;
  const hash = hashValue(token);
  const sheet = spinAccessSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, SPIN_ACCESS_HEADERS.length).getValues();
  for (let index = values.length - 1; index >= 0; index--) {
    if (String(values[index][2]) === hash) return {sheet:sheet, row:index + 2, values:values[index]};
  }
  return null;
}

function mondayDate(now) {
  const date = now || new Date();
  const localDate = Utilities.formatDate(date, CONFIG.timezone, 'yyyy-MM-dd');
  const day = Utilities.formatDate(date, CONFIG.timezone, 'EEE');
  const dayOffset = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(day);
  const localNoon = Utilities.parseDate(localDate + ' 12:00', CONFIG.timezone, 'yyyy-MM-dd HH:mm');
  return Utilities.formatDate(new Date(localNoon.getTime() - Math.max(dayOffset, 0) * 86400000), CONFIG.timezone, 'yyyy-MM-dd');
}

function spinsThisWeek(memberId, now) {
  const sheet = prizeSheet();
  if (sheet.getLastRow() < 2) return 0;
  const weekStart = mondayDate(now);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, PRIZE_HEADERS.length).getValues();
  return values.filter(row => row[1] === memberId && row[0] instanceof Date && Utilities.formatDate(row[0], CONFIG.timezone, 'yyyy-MM-dd') >= weekStart).length;
}

function spinPage(token) {
  const access = findSpinAccess(token);
  if (!access || access.values[3] !== 'ACTIVE') return privatePage('Welcome Wheel unavailable', 'This private link is invalid or has already been used.');
  if (new Date(access.values[4]).getTime() < Date.now()) return privatePage('Invitation expired', 'This Welcome Wheel invitation has expired. Please contact 52 South if you need help.');
  if (spinsThisWeek(access.values[1]) >= CONFIG.maxSpinsPerWeek) return privatePage('Weekly spins used', 'You have used both Welcome Wheel spins for this week. Your allowance resets every Monday in Hobart.');
  const safeToken = escapeHtml(token);
  const segments = PRIZES.map(prize => '<span>'+escapeHtml(prize.name)+'</span>').join('');
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>52 South Welcome Wheel</title><style>'+wheelCss()+'</style></head><body><main class="card"><div class="brand">52 SOUTH · REWARDS</div><h1>Your Welcome Wheel</h1><p>Members can spin twice each week. Every spin wins and each prize must be used within 24 hours.</p><div class="pointer">▼</div><div class="wheel">'+segments+'</div><form method="post" action="'+escapeHtml(serviceUrl())+'"><input type="hidden" name="form_type" value="welcome_spin"><input type="hidden" name="token" value="'+safeToken+'"><button type="submit">Spin my wheel</button></form><small>Members 21+ · Weekly allowance resets Monday · <a href="'+CONFIG.website+'/rewards-terms/" target="_blank" rel="noopener">Terms</a></small></main></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function performSpin(p) {
  const token = String(p.token || '');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let prize, code, expires;
  try {
    const access = findSpinAccess(token);
    if (!access || access.values[3] !== 'ACTIVE') return privatePage('Spin unavailable', 'This link is invalid or has already been used.');
    if (new Date(access.values[4]).getTime() < Date.now()) return privatePage('Invitation expired', 'This Welcome Wheel invitation has expired.');
    if (spinsThisWeek(access.values[1]) >= CONFIG.maxSpinsPerWeek) return privatePage('Weekly spins used', 'You have used both Welcome Wheel spins for this week. Your allowance resets every Monday in Hobart.');
    prize = choosePrize();
    code = makePrizeCode();
    expires = new Date(Date.now() + CONFIG.prizeExpiryHours * 3600000);
    const wins = prizeSheet();
    const winRow = wins.getLastRow() + 1;
    wins.getRange(winRow, 1, 1, PRIZE_HEADERS.length).setNumberFormat('@');
    wins.getRange(winRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    wins.getRange(winRow, 5).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    wins.getRange(winRow, 1, 1, PRIZE_HEADERS.length).setValues([[new Date(), access.values[1], prize.name, code, expires, 'ACTIVE', '']]);
    access.sheet.getRange(access.row, 4).setValue('SPUN');
    access.sheet.getRange(access.row, 6, 1, 2).setValues([[new Date(), code]]);
  } finally { lock.releaseLock(); }
  const expiryText = Utilities.formatDate(expires, CONFIG.timezone, 'EEE d MMM, h:mm a');
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>You won · 52 South</title><style>'+wheelCss()+' .wheel{animation:spin 3.2s cubic-bezier(.12,.72,.16,1) forwards}@keyframes spin{to{transform:rotate(1780deg)}}.code{font:700 clamp(2.6rem,12vw,5rem)/1 monospace;letter-spacing:.12em;color:#f2d989;margin:.25em 0}</style></head><body><main class="card"><div class="brand">52 SOUTH · REWARDS</div><h1>You won</h1><div class="wheel mini"></div><h2>'+escapeHtml(prize.name)+'</h2><p>Show this six-digit code to our team:</p><div class="code">'+escapeHtml(code)+'</div><p><strong>Redeem by '+escapeHtml(expiryText)+' Hobart time.</strong></p><small>In person only · One use · No cash value · <a href="'+CONFIG.website+'/rewards-terms/" target="_blank" rel="noopener">Terms</a></small></main></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function choosePrize() {
  let draw = Math.floor(Math.random() * 100) + 1;
  for (let index = 0; index < PRIZES.length; index++) {
    draw -= PRIZES[index].weight;
    if (draw <= 0) return PRIZES[index];
  }
  return PRIZES[0];
}

function makePrizeCode() {
  const sheet = prizeSheet();
  const used = new Set();
  if (sheet.getLastRow() >= 2) sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getDisplayValues().forEach(row => used.add(row[0]));
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    if (!used.has(code)) return code;
  }
  throw new Error('Could not generate a redemption code. Please try again.');
}

function redemptionPage() {
  if (!PropertiesService.getScriptProperties().getProperty('REWARDS_STAFF_PIN_HASH')) return privatePage('Staff redemption is not configured', 'The protected staff PIN must be configured before this screen can be used.');
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>52 South Staff Redemption</title><style>'+wheelCss()+'</style></head><body><main class="card"><div class="brand">52 SOUTH · STAFF</div><h1>Redeem a prize</h1><form method="post" action="'+escapeHtml(serviceUrl())+'"><input type="hidden" name="form_type" value="reward_redeem"><label>Customer code<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><label>Staff PIN<input name="staff_pin" type="password" inputmode="numeric" required></label><button type="submit">Verify and redeem</button></form></main></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function redeemPrize(p) {
  const configuredHash = PropertiesService.getScriptProperties().getProperty('REWARDS_STAFF_PIN_HASH');
  if (!configuredHash || hashValue(p.staff_pin || '') !== configuredHash) return privatePage('Not authorised', 'The staff PIN is incorrect.');
  const code = String(p.code || '').trim();
  if (!/^\d{6}$/.test(code)) return privatePage('Invalid code', 'Enter the customer’s six-digit code.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = prizeSheet();
    if (sheet.getLastRow() < 2) return privatePage('Code not found', 'Check the six-digit code and try again.');
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, PRIZE_HEADERS.length).getValues();
    for (let index = values.length - 1; index >= 0; index--) {
      if (String(values[index][3]).padStart(6, '0') !== code) continue;
      if (values[index][5] !== 'ACTIVE') return privatePage('Already redeemed', 'This prize code has already been used.');
      if (new Date(values[index][4]).getTime() < Date.now()) {
        sheet.getRange(index + 2, 6).setValue('EXPIRED');
        return privatePage('Prize expired', 'This prize passed its 24-hour redemption deadline.');
      }
      sheet.getRange(index + 2, 6, 1, 2).setValues([['REDEEMED', new Date()]]);
      return privatePage('Prize redeemed', values[index][2] + ' has been marked as used.');
    }
    return privatePage('Code not found', 'Check the six-digit code and try again.');
  } finally { lock.releaseLock(); }
}

function wheelCss() {
  return 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 12%,#38260b,#080706 52%);color:#f8f3e7;font:17px system-ui;text-align:center}.card{width:min(92vw,650px);box-sizing:border-box;padding:34px 24px;border:1px solid #6e5426;border-radius:28px;background:rgba(16,13,9,.95);box-shadow:0 30px 90px #000}.brand{color:#e4c272;font-size:.72rem;font-weight:900;letter-spacing:.2em}h1{font:400 clamp(2.7rem,10vw,5rem)/1 Georgia,serif;margin:.28em 0}h2{font:400 2rem Georgia,serif;color:#f2d989}.pointer{position:relative;z-index:2;color:#f2d989;font-size:2rem;margin-bottom:-12px}.wheel{width:min(72vw,390px);aspect-ratio:1;margin:auto;border:9px solid #e4c272;border-radius:50%;background:conic-gradient(#9c2f1c 0 16.666%,#d29a2f 0 33.333%,#174c35 0 50%,#7d2441 0 66.666%,#a9631c 0 83.333%,#28516b 0);box-shadow:inset 0 0 0 6px #171006,0 18px 50px #000}.wheel span{display:none}.wheel.mini{width:120px;border-width:5px;animation:spin 3.2s cubic-bezier(.12,.72,.16,1) forwards}button{width:100%;margin:26px 0 16px;padding:16px;border:0;border-radius:12px;background:#e4c272;color:#171006;font-weight:900;font-size:1rem;cursor:pointer}label{display:block;text-align:left;margin:18px 0 8px;font-weight:800}input{width:100%;box-sizing:border-box;margin-top:7px;padding:15px;border:1px solid #655536;border-radius:10px;background:#090806;color:#fff;font-size:1.1rem}small{display:block;color:#aaa397}a{color:#f2d989}';
}

function privatePage(title, message) {
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+escapeHtml(title)+'</title><style>'+wheelCss()+'</style></head><body><main class="card"><div class="brand">52 SOUTH · REWARDS</div><h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(message)+'</p><p><a href="'+CONFIG.website+'/loyalty/" target="_top">Return to 52 South Rewards</a> · <a href="tel:+61492144209">Call '+CONFIG.phone+'</a></p></main></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function wheelEmailText(memberId, spinLink) {
  return 'Hello,\n\nYour 52 South Rewards access is ready.'+
    (memberId ? '\nMember ID: ' + memberId : '') +
    '\n\nOpen your private Welcome Wheel link:\n' + spinLink +
    '\n\nMembers aged 21+ may spin up to twice each week. The weekly allowance resets every Monday in Hobart. This link is available for 14 days and any prize must be redeemed in person within 24 hours.\n\nPlease do not forward your private link.\nRewards terms: ' + CONFIG.website + '/rewards-terms/' +
    '\n\n52 South Cafe & Restaurant\n52 Marys Hope Road, Rosetta TAS 7010\n' + CONFIG.phone + '\n' + CONFIG.website;
}

function wheelEmailHtml(memberId, spinLink) {
  return '<div style="margin:0;padding:28px;background:#f3efe5;color:#18130b;font:16px Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:32px;border:1px solid #d6c69d;border-radius:18px;background:#fff"><div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#8b681d">52 SOUTH REWARDS</div><h1 style="margin:12px 0;font:32px Georgia,serif">Your rewards access is ready</h1>'+
    (memberId ? '<p><strong>Member ID:</strong> '+escapeHtml(memberId)+'</p>' : '')+
    '<p>Use the button below to open your private Welcome Wheel link.</p><p style="margin:28px 0"><a href="'+escapeHtml(spinLink)+'" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#1b160d;color:#f1d482;text-decoration:none;font-weight:700">Open my Welcome Wheel</a></p><p>Members aged 21+ may spin up to <strong>twice each week</strong>. The allowance resets every Monday in Hobart. This invitation is available for 14 days and each prize must be redeemed in person within 24 hours.</p><p style="color:#6f675b">Please do not forward your private link. Read the <a href="'+CONFIG.website+'/rewards-terms/" style="color:#76530d">Rewards terms</a>.</p><hr style="border:0;border-top:1px solid #e4ded0;margin:28px 0"><p style="font-size:13px;color:#6f675b">52 South Cafe & Restaurant<br>52 Marys Hope Road, Rosetta TAS 7010<br>'+CONFIG.phone+' · <a href="'+CONFIG.website+'">52south.au</a></p></div></div>';
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
  migrateMemberSheet(sheet);
  return sheet;
}

function migrateMemberSheet(sheet) {
  sheet.getRange(1, 1, 1, MEMBER_HEADERS.length).setValues([MEMBER_HEADERS]);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const values = sheet.getRange(2, 1, lastRow - 1, MEMBER_HEADERS.length).getDisplayValues();
  const identityRows = values.map(row => {
    let email = row[9];
    let phone = row[10];
    try { email = email || normalizeEmail(row[5]); } catch (error) { email = ''; }
    try { phone = phone || normalizePhone(row[4]); } catch (error) { phone = ''; }
    let surname = row[13];
    try { surname = surname || normalizeSurname(extractSurname(row[3])); } catch (error) { surname = ''; }
    const dob = row[14] || clean(row[6]);
    return [email, phone, phone ? phone.slice(-9) : '', surname, dob];
  });
  sheet.getRange(2, 10, identityRows.length, 2).setNumberFormat('@').setValues(identityRows.map(row => row.slice(0, 2)));
  sheet.getRange(2, 13, identityRows.length, 3).setNumberFormat('@').setValues(identityRows.map(row => row.slice(2)));
}

function memberExists(sheet, email, phoneLast9, surname, dob) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const values = sheet.getRange(2, 1, lastRow - 1, MEMBER_HEADERS.length).getDisplayValues();
  return values.some(row =>
    row[9] === email ||
    row[12] === phoneLast9 ||
    (row[13] === surname && row[14] === dob)
  );
}

function appendMemberRow(sheet, p, memberId, email, phone, phoneLast9, surname, dob) {
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1, 1, MEMBER_HEADERS.length).setNumberFormat('@');
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange(row, 1, 1, MEMBER_HEADERS.length).setValues([[
    new Date(), memberId, 'Active', clean(p.full_name) + ' ' + clean(p.surname), clean(p.phone), email, dob,
    'Accepted', clean(p.membership_source || '52south.au member benefits page'), email, phone, 'PENDING', phoneLast9, surname, dob
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

function normalizeSurname(value) {
  const surname = clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  if (surname.length < 2) throw new Error('Enter a valid surname.');
  return surname;
}

function extractSurname(value) {
  const parts = clean(value).split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
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
  return dob;
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
