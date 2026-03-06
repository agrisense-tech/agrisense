# utils/notifications.py
# ---------------------------------------------------------
# Email & SMS alert system for AgriSense.
# Uses smtplib (built-in) for email — no extra packages.
# SMS uses a simple webhook pattern (Twilio-compatible).
#
# To enable email: set SMTP_* vars in backend/.env
# To enable SMS:   set TWILIO_* vars in backend/.env
# Without keys: alerts are logged to console (dev mode).
# ---------------------------------------------------------

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

# ── i18n alert templates ─────────────────────────────────
TRANSLATIONS = {
    "en": {
        "subject":    "AgriSense Alert — {crop}",
        "greeting":   "Dear {name},",
        "rec_line":   "Your AgriSense analysis recommends: {crop} {emoji}",
        "conf_line":  "Confidence: {confidence}%  |  Expected yield: {yield_} t/ha",
        "sow_line":   "Best sowing window: {window}",
        "risk_title": "⚠ Risk Alerts:",
        "footer":     "Powered by AgriSense — Smart Crop Intelligence",
        "sms_body":   "AgriSense: Best crop for your field is {crop} ({confidence}% confidence). Sow: {window}. {risks}",
    },
    "hi": {
        "subject":    "AgriSense अलर्ट — {crop}",
        "greeting":   "प्रिय {name},",
        "rec_line":   "आपकी AgriSense विश्लेषण अनुशंसा: {crop} {emoji}",
        "conf_line":  "विश्वास: {confidence}%  |  अनुमानित उपज: {yield_} टन/हेक्टेयर",
        "sow_line":   "बुवाई का सर्वोत्तम समय: {window}",
        "risk_title": "⚠ जोखिम चेतावनियाँ:",
        "footer":     "AgriSense द्वारा संचालित",
        "sms_body":   "AgriSense: आपके खेत के लिए सर्वोत्तम फसल {crop} है ({confidence}% विश्वास)। बुवाई: {window}।",
    },
    "ta": {
        "subject":    "AgriSense எச்சரிக்கை — {crop}",
        "greeting":   "அன்புள்ள {name},",
        "rec_line":   "உங்கள் AgriSense பரிந்துரை: {crop} {emoji}",
        "conf_line":  "நம்பகத்தன்மை: {confidence}%  |  மதிப்பிடப்பட்ட மகசூல்: {yield_} டன்/ஹெக்டேர்",
        "sow_line":   "சிறந்த விதைப்பு காலம்: {window}",
        "risk_title": "⚠ அபாய எச்சரிக்கைகள்:",
        "footer":     "AgriSense மூலம் இயக்கப்படுகிறது",
        "sms_body":   "AgriSense: உங்கள் வயலுக்கு சிறந்த பயிர் {crop} ({confidence}% நம்பகம்). விதைப்பு: {window}.",
    },
    "te": {
        "subject":    "AgriSense హెచ్చరిక — {crop}",
        "greeting":   "ప్రియమైన {name},",
        "rec_line":   "మీ AgriSense సిఫారసు: {crop} {emoji}",
        "conf_line":  "నమ్మకం: {confidence}%  |  అంచనా దిగుబడి: {yield_} టన్/హెక్టేర్",
        "sow_line":   "ఉత్తమ విత్తన సమయం: {window}",
        "risk_title": "⚠ ప్రమాద హెచ్చరికలు:",
        "footer":     "AgriSense ద్వారా నడపబడుతుంది",
        "sms_body":   "AgriSense: మీ పొలానికి ఉత్తమ పంట {crop} ({confidence}% నమ్మకం). విత్తనం: {window}.",
    },
}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "हिन्दी (Hindi)",
    "ta": "தமிழ் (Tamil)",
    "te": "తెలుగు (Telugu)",
}


def _get_t(lang: str) -> dict:
    return TRANSLATIONS.get(lang, TRANSLATIONS["en"])


def build_email_html(name: str, crop: str, emoji: str, confidence: float,
                     yield_: float, window: str, risks: list, lang: str = "en") -> str:
    t = _get_t(lang)
    risk_html = ""
    if risks:
        items = "".join(f"<li style='margin:4px 0;color:#f97316'>{r}</li>" for r in risks)
        risk_html = f"<p style='color:#fb923c;font-weight:600'>{t['risk_title']}</p><ul>{items}</ul>"

    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#166534,#14532d);padding:28px 32px">
        <div style="font-size:36px;margin-bottom:8px">🌱</div>
        <div style="font-size:22px;font-weight:700;color:#fff">AgriSense</div>
        <div style="font-size:13px;color:#86efac;margin-top:2px">Smart Crop Intelligence</div>
      </div>
      <div style="padding:28px 32px">
        <p style="color:#94a3b8;margin:0 0 16px">{t['greeting'].format(name=name)}</p>
        <div style="background:#1e293b;border:1px solid #22c55e33;border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="font-size:40px;margin-bottom:8px">{emoji}</div>
          <p style="font-size:20px;font-weight:700;color:#4ade80;margin:0 0 8px">{t['rec_line'].format(crop=crop,emoji='')}</p>
          <p style="color:#94a3b8;margin:4px 0">{t['conf_line'].format(confidence=round(confidence*100),yield_=yield_)}</p>
          <p style="color:#94a3b8;margin:4px 0">{t['sow_line'].format(window=window)}</p>
        </div>
        {risk_html}
        <p style="color:#475569;font-size:12px;margin-top:24px;border-top:1px solid #1e293b;padding-top:16px">{t['footer']}<br>Sent: {datetime.now().strftime('%d %b %Y, %H:%M')}</p>
      </div>
    </div>
    """


def send_email_alert(to_email: str, name: str, crop: str, emoji: str,
                     confidence: float, yield_: float, window: str,
                     risks: list, lang: str = "en") -> bool:
    """Send recommendation email. Returns True on success."""
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    t = _get_t(lang)
    subject = t["subject"].format(crop=crop)
    html    = build_email_html(name, crop, emoji, confidence, yield_, window, risks, lang)

    if not smtp_host or not smtp_user:
        # Dev mode — just log
        logger.info(f"[EMAIL-DEV] Would send to {to_email}: {subject}")
        logger.info(f"  Crop: {crop}, Confidence: {confidence:.0%}, Window: {window}")
        return True  # Return True so frontend sees "sent"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email} for crop {crop}")
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


def send_sms_alert(phone: str, crop: str, confidence: float,
                   window: str, risks: list, lang: str = "en") -> bool:
    """Send SMS via Twilio (or log in dev mode)."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token  = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_FROM_NUMBER", "")

    t    = _get_t(lang)
    risk_str = f"Alerts: {risks[0]}" if risks else ""
    body = t["sms_body"].format(
        crop=crop, confidence=round(confidence * 100),
        window=window, risks=risk_str
    )

    if not account_sid or not auth_token:
        logger.info(f"[SMS-DEV] Would send to {phone}: {body}")
        return True

    try:
        import urllib.request, urllib.parse, base64
        url  = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = urllib.parse.urlencode({"To": phone, "From": from_number, "Body": body}).encode()
        creds = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
        req  = urllib.request.Request(url, data=data,
                                      headers={"Authorization": f"Basic {creds}"})
        urllib.request.urlopen(req, timeout=10)
        logger.info(f"SMS sent to {phone}")
        return True
    except Exception as e:
        logger.error(f"SMS send failed: {e}")
        return False
