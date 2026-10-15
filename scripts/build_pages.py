"""Regenerate the seven static HTML5 pages. Python standard library only."""
from pathlib import Path
import json
from html import escape
import modern_sections as modern
import about_sections as about
import mobile_sections as mobile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist' if (ROOT / 'dist').is_dir() else ROOT
C = json.loads((ROOT / 'scripts/components.json').read_text())
YT = 'https://www.youtube.com/@Apostleschurchofchristdubai'
FB = 'https://www.facebook.com/apostlesdubai/'
IG = about.INSTAGRAM
MAP = 'https://www.google.com/maps/search/?api=1&query=Bank+Melliran+Building+Al+Mankhool+Bur+Dubai'
PAGES = [('Our Church', 'index.html'), ('Live', 'live.html'), ('Sermons', 'sermons.html'), ('Prayer', 'prayer.html'), ('Donate', 'donate.html'), ('About', 'about.html'), ('Visit Us', 'visit.html')]

def nav(current, include_visit=True):
    return ''.join(f'<a href="{url}"'+(' aria-current="page"' if name == current else '')+f'>{name}</a>' for name,url in PAGES if include_visit or name != "Visit Us")

def logo():
    return '<a class="brand" href="index.html" aria-label="Apostles Church of Christ Dubai home"><img src="assets/logo.png" width="54" height="58" alt="Apostles Church of Christ logo"><span>APOSTLES<span class="brand-small">CHURCH OF CHRIST <b>DUBAI</b></span></span></a>'

def header(current):
    return f'''<div class="topline"><span>Christ’s ambassadors. A church for the nations.</span><a href="visit.html">Sunday &amp; Thursday · 8 PM <span aria-hidden="true">↗</span></a></div>
    <header class="header"><div class="header-brand">{logo()}</div><button class="menu-toggle" aria-controls="navigation" aria-expanded="false" aria-label="Open menu"><span></span><span></span></button><nav id="navigation" aria-label="Main navigation">{nav(current, False)}{mobile.navigation(current, PAGES)}</nav><a class="header-visit" href="visit.html"{(' aria-current="page"' if current == 'Visit Us' else '')}><span class="pin-icon" aria-hidden="true">⌖</span> Visit Us <span aria-hidden="true">↗</span></a></header>'''

def footer():
    return f'''<footer class="footer-new"><div class="wrap"><div class="footer-grid"><div class="footer-brand">{logo()}<p>Preparing a people<br>for the Lord.</p><a class="footer-scripture" href="about.html#our-vision">Our Vision · Luke 1:17</a><div class="footer-flags" aria-label="United Arab Emirates and Burundi"><img src="assets/flag-uae.svg" width="25" height="15" alt="United Arab Emirates flag" title="United Arab Emirates"><img src="assets/flag-burundi.svg" width="25" height="15" alt="Burundi flag" title="Burundi"></div></div><div class="footer-column"><h2>Visit our church</h2><address><strong>Hall 601 · 6th Floor</strong><br>Bank Melliran Building<br>Al Mankhool, Bur Dubai<br>Dubai, United Arab Emirates</address><a class="footer-map" href="{MAP}" target="_blank" rel="noopener noreferrer">Near Sharaf DG Metro<br>Get directions</a></div><div class="footer-column"><h2>Explore</h2>{nav(None)}</div><div class="footer-column"><h2>Contact</h2><a href="{FB}" target="_blank" rel="noopener noreferrer">Message the church</a><a href="prayer.html">Prayer requests</a><a href="visit.html">Plan your visit</a><a class="configured-email" hidden></a><a class="configured-phone" href="tel:+971524373611">+971 52 437 3611</a><p>Reach us through our<br>official Facebook page.</p></div><div class="footer-column"><h2>Stay connected</h2><a class="social-pill" href="{YT}" target="_blank" rel="noopener noreferrer">YouTube</a><a class="social-pill" href="{FB}" target="_blank" rel="noopener noreferrer">Facebook</a><a class="social-pill" href="{IG}" target="_blank" rel="noopener noreferrer">Instagram</a></div></div>{mobile.compact_footer(PAGES)}<div class="footer-bottom"><span>© <span id="year">2026</span> Apostles Church of Christ Dubai</span><span>Faith. Fellowship. Hope.</span><button class="subtle-link" id="privacy-open">Privacy</button><a href="#top">Back to top</a></div></div></footer>'''

def dialogs(include_bible=False, include_vision=False):
    credits=(modern.verse_credits() if include_bible else "") + (about.vision_credits() if include_vision else "")
    return f'''<div class="toast" id="toast" role="status" aria-live="polite"></div><dialog id="video-dialog" class="video-dialog" aria-labelledby="video-dialog-title"><div class="dialog-bar"><h2 id="video-dialog-title">Worship Vibe</h2><button class="close-dialog" aria-label="Close video">✕</button></div><div id="dialog-player"></div><p>Having trouble playing? <a href="https://www.youtube.com/watch?v=G9IpNCJlAVc" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></p></dialog><dialog id="privacy-dialog" class="privacy-dialog" aria-labelledby="privacy-title"><div class="dialog-bar"><h2 id="privacy-title">Your privacy</h2><button class="close-dialog" aria-label="Close privacy notice">✕</button></div><p>This website does not use analytics, advertising cookies or accounts. Prayer drafts stay in this page’s memory and are cleared when you leave or reload. They are not sent or stored by this website. A temporary browser-tab flag remembers that you have seen the welcome animation; it contains no personal information.</p><p>A prayer request is shared only when you copy it and choose to send it yourself through the church’s Facebook page. The daily NIV verse connects to Bible Gateway automatically. Any configured donation checkout belongs to its external provider; this website does not process payments.</p><p>YouTube connects only after you choose to play a YouTube video or open a YouTube link. YouTube, Facebook and payment providers use their own privacy policies. The church introduction, images and fonts are hosted with this website.</p>{credits}</dialog>'''

def welcome_intro():
    return '<div class="welcome-intro" id="welcome-intro" role="dialog" aria-modal="true" aria-labelledby="welcome-title" hidden><div class="welcome-glow" aria-hidden="true"></div><div class="welcome-inner"><div class="welcome-logo"><span class="welcome-ring" aria-hidden="true"></span><img src="assets/logo.png" width="180" height="192" alt=""></div><p class="welcome-eyebrow">APOSTLES CHURCH OF CHRIST · DUBAI</p><h2 id="welcome-title">Welcome to<br><em>Our Church</em></h2><p class="welcome-tagline">Faith. Fellowship. Hope.</p><span class="welcome-progress" aria-hidden="true"></span><button id="welcome-skip" type="button">Enter the website <span aria-hidden="true">→</span></button></div></div>'

def page(current, title, description, body):
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{title} — Apostles Church of Christ Dubai</title><meta name="description" content="{description}"><meta name="theme-color" content="#f9f7f2"><meta property="og:title" content="{title} — Apostles Church of Christ Dubai"><meta property="og:description" content="{description}"><meta property="og:type" content="website"><link rel="icon" href="assets/logo.png"><link rel="stylesheet" href="assets/fonts.css"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="mobile.css?v=20261015-3"><script src="config.js?v=20261015-4" defer></script>{('<script src="assets/hls.min.js" defer></script>' if current == 'Live' else '')}<script src="welcome.js" defer></script><script src="live-status.js" defer></script><script src="app.js?v=20261015-4" defer></script><script src="schedule.js" defer></script><script src="church.js?v=20261015-3" defer></script><script src="gallery.js" defer></script><script src="mobile.js?v=20261015-3" defer></script></head><body id="top" data-page="{current.lower().replace(' ', '-')}">{welcome_intro()}<a class="skip-link" href="#main">Skip to content</a>{header(current)}<main id="main">{body}</main>{footer()}{dialogs(current in ["Our Church", "Prayer"], current in ["Our Church", "About"])}<noscript><div class="noscript">The video controls and prayer draft need JavaScript. You can still read our church information and visit <a href="{YT}">YouTube</a> or <a href="{FB}">Facebook</a>.</div></noscript></body></html>'''
    html = mobile.decorate(html)
    output = next(url for name,url in PAGES if name == current)
    # Plain link labels and authentic church branding: no decorative arrows or stars.
    import re
    html = re.sub(r'<span\b[^>]*>\s*[↗↑↓→←✦♡⌖⧉]+\s*</span>', '', html)
    html = html.translate(str.maketrans('', '', '↗↑↓→←✦♡⌖⧉'))
    html = html.replace('>✕</button>', '>Close</button>')
    (DIST / output).write_text(html)

def page_intro(label, title, text):
    return f'<section class="page-intro wrap"><p class="eyebrow">{label}</p><h1>{title}</h1><p class="page-description">{text}</p></section>'

def identity():
    return '''<section class="identity-section section" id="our-calling"><div class="identity-bg" aria-hidden="true"><img class="rotating-logo" src="assets/logo.png" alt="" width="180" height="192"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="orbit-star">✦</span></div><div class="wrap identity-grid"><div><p class="eyebrow">OUR CALLING</p><h2>Christ’s ambassadors.<br><em>Hope for the nations.</em></h2><p>Many stories, one faith. We gather to worship Jesus, grow in His Word, and share His message of reconciliation.</p><a class="text-link" href="about.html">Discover our church <span>↗</span></a></div><div class="identity-video"><video id="brand-loop" data-src="assets/intro.mp4" muted loop autoplay playsinline preload="none" poster="assets/intro-poster.jpg" aria-label="Animated church logo"></video><div class="identity-video-caption"><span>APOSTLES CHURCH OF CHRIST</span><button id="pause-brand" aria-label="Pause logo animation">Pause animation Ⅱ</button></div></div></div></section>'''



home_cta = '''<section class="pathways wrap section"><div class="section-heading"><div><p class="eyebrow">TAKE YOUR NEXT STEP</p><h2>Faith is a journey.<br><em>Walk it together.</em></h2></div><p>Join a gathering, reach out for prayer,<br>or discover how to support the church.</p></div><div class="pathway-grid"><a href="prayer.html" class="pathway"><span class="pathway-number">01 / PRAYER</span><span class="pathway-symbol" aria-hidden="true">✦</span><h3>You’re not alone.</h3><p>Share a prayer request and connect with our church community.</p><span class="text-link">Let’s pray together <span>↗</span></span></a><a href="donate.html" class="pathway"><span class="pathway-number">02 / GENEROSITY</span><span class="pathway-symbol" aria-hidden="true">♡</span><h3>A generous heart.</h3><p>Ask the church how you can support its ministry and message.</p><span class="text-link">Explore giving <span>↗</span></span></a><a href="visit.html" class="pathway"><span class="pathway-number">03 / COMMUNITY</span><span class="pathway-symbol" aria-hidden="true">⌖</span><h3>A place for you.</h3><p>Get to know the church and plan a visit to our gathering in Dubai.</p><span class="text-link">Come visit us <span>↗</span></span></a></div></section>'''

gallery_items = json.loads((ROOT / 'scripts/gallery.json').read_text())
gallery = about.gallery_section(gallery_items)
original_vision = about.vision_section

def responsive_vision():
    html = original_vision()
    detail = '<details class="mobile-only mobile-vision-details"><summary>Our Vision · Luke 1:17</summary><blockquote>' + escape(about.VISION_TEXT) + '</blockquote></details>'
    # Details summary only supplements Home; other pages show the complete scripture.
    return html.replace('</section>', detail + '</section>')

page('Our Church', 'Our Church', 'A place to belong. A faith to live. Meet Apostles Church of Christ Dubai, worship online, and connect with our community.', modern.hero() + mobile.quick_links() + modern.schedule_section() + modern.welcome_section() + responsive_vision() + modern.verse_section() + modern.recent_section() + mobile.events() + gallery + mobile.location() + mobile.contact() + home_cta)

page('Live', 'Church Online', 'Watch our church broadcasts, listen to available audio, and explore worship and messages from Apostles Church of Christ Dubai.', C['live'].replace('<h2>One church.<br><em>Wherever you are.</em></h2>', '<h1>One church.<br><em>Wherever you are.</em></h1>').replace('02 / CHURCH ONLINE', 'CHURCH ONLINE'))

prayer_body = '''<section class="prayer-layout wrap section"><div class="prayer-editor"><p class="eyebrow">YOUR PRAYER REQUEST</p><h2>What’s on<br><em>your heart?</em></h2><p class="form-intro">Write a request, then copy it and send it to the church through our Facebook page.</p><form id="prayer-form"><label for="prayer-name">Your name <span>(optional)</span></label><input id="prayer-name" name="name" maxlength="100" autocomplete="given-name" placeholder="How should we address you?"><label for="prayer-topic">Prayer focus</label><select id="prayer-topic" name="topic"><option>General prayer</option><option>Family & relationships</option><option>Health & healing</option><option>Guidance & decisions</option><option>Thanksgiving</option><option>Other</option></select><label for="prayer-message">Your request <span>(required)</span></label><textarea id="prayer-message" name="message" rows="5" maxlength="2000" required placeholder="Share what you would like prayer for…"></textarea><div class="form-footer"><span id="prayer-count">0 / 2000</span><span>Your draft stays on this page.</span></div><button class="button" type="submit">Prepare my request <span>→</span></button></form><div id="prayer-preview" class="prayer-preview" hidden><p class="eyebrow">READY TO SHARE</p><h3>Your prayer request</h3><p id="prayer-draft"></p><button id="copy-prayer" class="button">Copy request <span>⧉</span></button><a id="prayer-send" class="text-link" href="https://www.facebook.com/apostlesdubai/" target="_blank" rel="noopener noreferrer">Open church Facebook page <span>↗</span></a><p class="sharing-note">Paste your request into a message and send it yourself. Preparing or copying a request does not send it to the church.</p></div></div><aside class="prayer-aside"><div class="prayer-verse"><span aria-hidden="true">“</span><blockquote>Come unto me,<br>all ye that labour<br>and are heavy laden,<br><em>and I will give<br>you rest.</em></blockquote><p>MATTHEW 11:28 · KJV</p></div><div class="prayer-direct"><p class="eyebrow">A PERSONAL CONNECTION</p><h3>Prefer to reach<br>out directly?</h3><p>Message the church through our official Facebook page. You can also speak with the church in person when you visit.</p><a class="text-link" href="https://www.facebook.com/apostlesdubai/" target="_blank" rel="noopener noreferrer">Message our church <span>↗</span></a></div></aside></section>'''
page('Prayer', 'Prayer', 'Prepare a prayer request or contact Apostles Church of Christ Dubai through our official Facebook page.', page_intro('LET’S PRAY TOGETHER', 'You don’t have to<br><em>walk alone.</em>', 'In every season, there is room to pause, pray and reach out.') + prayer_body + modern.verse_section())

accounts = json.loads((ROOT / "scripts/donation_accounts.json").read_text())
accounts["ibanFormatted"] = " ".join(accounts["iban"][i:i+4] for i in range(0, len(accounts["iban"]), 4))
donate_body = (ROOT / "scripts/donate_section.html").read_text().format(**{k: escape(v) for k,v in accounts.items()})
page('Donate', 'Giving', 'Find bank transfer, PayPal, BOTIM Pay and Western Union giving details for Apostles Church of Christ Dubai.', page_intro('A GENEROUS HEART', 'Give in faith.<br><em>Share in hope.</em>', 'Support our church using the giving details shared by our community.') + donate_body)

page('About', 'About Us', 'Meet Apostles Church of Christ Dubai. Our values, mission and vision from Luke 1:17: preparing a people for the Lord.', about.about_page(gallery) + identity())
page('Sermons', 'Sermons and Recordings', 'Explore worship and recent sermon recordings from Apostles Church of Christ Dubai.', page_intro('WORSHIP &amp; THE WORD', 'A word for<br><em>your week.</em>', 'Explore the messages and worship recordings shared by our church.') + modern.sermons_body())
page('Visit Us', 'Plan Your Visit', 'Join Apostles Church of Christ Dubai on Sunday and Thursday, 8–11 PM, and Saturday, 3–6 AM. All times are Dubai time.', page_intro('YOU ARE WELCOME HERE', 'Your next step<br><em>could be here.</em>', 'Come as you are. We’d love to welcome you into our community.') + modern.schedule_section() + C['visit'])
from html.parser import HTMLParser

class MarkupAudit(HTMLParser):
    """Reject broken nesting and stray text around page sections/dialogs."""
    void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    blocks = {'article','aside','blockquote','div','footer','form','h1','h2','h3','header','main','nav','ol','p','section','ul'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]
    def handle_starttag(self, tag, attrs):
        names=[key for key,_ in attrs]
        assert len(names)==len(set(names)), f'Duplicate attribute on {tag}'
        assert not (self.stack and self.stack[-1]=='p' and tag in self.blocks), f'Block {tag} nested inside a paragraph'
        if tag not in self.void:self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.void:return
        assert self.stack and self.stack[-1]==tag, f'Unbalanced closing {tag}; context {self.stack[-4:]}'
        self.stack.pop()
    def handle_data(self, text):
        if self.stack and self.stack[-1] in {'body','main','dialog'}:
            assert not text.strip(), f'Stray page text: {text[:60]!r}'

for _, filename in PAGES:
    audit=MarkupAudit()
    audit.feed((DIST/filename).read_text())
    audit.close()
    assert not audit.stack, f'Unclosed elements in {filename}: {audit.stack}'
print('Generated and structurally verified 7 HTML5 pages with current service times and daily NIV verse support.')
