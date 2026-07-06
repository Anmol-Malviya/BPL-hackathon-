import sys
import os
import subprocess

# Auto-install python-pptx if not present
try:
    import pptx
except ImportError:
    print("python-pptx library not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx"])
    import pptx

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    
    # Set slide dimensions to widescreen (16:9)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Theme Colors
    DARK_NAVY = RGBColor(15, 23, 42)      # #0f172a
    LIGHT_BG = RGBColor(248, 250, 252)    # #f8fafc
    WHITE = RGBColor(255, 255, 255)
    PRIMARY_BLUE = RGBColor(37, 99, 235)  # #2563eb
    TEXT_DARK = RGBColor(30, 41, 59)      # #1e293b
    TEXT_LIGHT = RGBColor(148, 163, 184)  # #94a3b8
    ACCENT_GREEN = RGBColor(16, 185, 129) # #10b981
    ACCENT_RED = RGBColor(239, 68, 68)    # #ef4444
    
    # Helper to apply background color
    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    # Helper to add standard header to content slides
    def add_slide_header(slide, title_text):
        # Draw a subtle top accent bar
        top_bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0), Inches(0), Inches(13.333), Inches(0.15)
        )
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = PRIMARY_BLUE
        top_bar.line.fill.background()

        # Add Title Box
        title_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.4), Inches(11.833), Inches(0.8))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Trebuchet MS"
        p.font.size = Pt(32)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_BLUE

    # ----------------------------------------------------
    # SLIDE 1: Title Slide (Dark Theme)
    # ----------------------------------------------------
    slide_layout = prs.slide_layouts[6] # Blank slide
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, DARK_NAVY)
    
    # Add decorative colored shape
    accent_box = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.75), Inches(2.2), Inches(0.12), Inches(3.2)
    )
    accent_box.fill.solid()
    accent_box.fill.fore_color.rgb = PRIMARY_BLUE
    accent_box.line.fill.background()
    
    # Text Frame
    text_box = slide.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(11.0), Inches(3.5))
    tf = text_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    # Main Title
    p_title = tf.paragraphs[0]
    p_title.text = "SECURE OS"
    p_title.font.name = "Trebuchet MS"
    p_title.font.size = Pt(64)
    p_title.font.bold = True
    p_title.font.color.rgb = WHITE
    p_title.space_after = Pt(8)
    
    # Subtitle
    p_sub = tf.add_paragraph()
    p_sub.text = "Stopping Phishing and Cyber Scams in Real Time—Before You Click"
    p_sub.font.name = "Calibri"
    p_sub.font.size = Pt(22)
    p_sub.font.color.rgb = ACCENT_GREEN
    p_sub.space_after = Pt(45)
    
    # Team Details
    p_team = tf.add_paragraph()
    p_team.text = "Team Name: Secure OS Solutions"
    p_team.font.name = "Calibri"
    p_team.font.size = Pt(18)
    p_team.font.bold = True
    p_team.font.color.rgb = WHITE
    
    p_members = tf.add_paragraph()
    p_members.text = "Team Members: Anmol Malviya (Leader), Sachin Yaduwanshi, Saanvi Gupta, Tanay Agrawal, Shailendra Singh"
    p_members.font.name = "Calibri"
    p_members.font.size = Pt(15)
    p_members.font.color.rgb = TEXT_LIGHT
    
    # ----------------------------------------------------
    # SLIDE 2: Problem Statement (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "The Cybersecurity Crisis We Face")
    
    # Left Column: Problem description
    left_col = slide.shapes.add_textbox(Inches(0.75), Inches(1.5), Inches(5.5), Inches(5.0))
    tf_left = left_col.text_frame
    tf_left.word_wrap = True
    tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
    
    p_prob_hdr = tf_left.paragraphs[0]
    p_prob_hdr.text = "Why Traditional Security Fails Us"
    p_prob_hdr.font.name = "Trebuchet MS"
    p_prob_hdr.font.size = Pt(22)
    p_prob_hdr.font.bold = True
    p_prob_hdr.font.color.rgb = TEXT_DARK
    p_prob_hdr.space_after = Pt(15)
    
    bullet_points = [
        "Over 80% of cyberattacks start with a simple phishing link, costing people their hard-earned money and identities.",
        "Scam websites pop up and vanish in under 24 hours, completely bypassing standard browser blocklists.",
        "QR code scams ('Quishing') are on the rise, tricking users into scanning malicious links in public spaces.",
        "Fake characters (like Cyrillic look-alikes) make fraudulent links look identical to trusted brands."
    ]
    for pt in bullet_points:
        p = tf_left.add_paragraph()
        p.text = "• " + pt
        p.font.name = "Calibri"
        p.font.size = Pt(16)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(12)
        
    # Right Column: Visual Callout Box
    right_bg = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.3)
    )
    right_bg.fill.solid()
    right_bg.fill.fore_color.rgb = RGBColor(254, 242, 242) # light red
    right_bg.line.color.rgb = ACCENT_RED
    right_bg.line.width = Pt(1.5)
    
    right_col = slide.shapes.add_textbox(Inches(7.1), Inches(2.1), Inches(5.1), Inches(3.7))
    tf_right = right_col.text_frame
    tf_right.word_wrap = True
    tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
    
    p_stat_title = tf_right.paragraphs[0]
    p_stat_title.text = "THE DANGEROUS SECURITY GAP"
    p_stat_title.font.name = "Trebuchet MS"
    p_stat_title.font.size = Pt(18)
    p_stat_title.font.bold = True
    p_stat_title.font.color.rgb = ACCENT_RED
    p_stat_title.space_after = Pt(14)
    
    gaps = [
        "Regular citizens have no safe way to inspect a link before clicking it.",
        "Email headers hold the key to spotting spoofs, but they are completely unreadable to the average person.",
        "Existing mobile security apps drain your battery and won't work without internet."
    ]
    for gap in gaps:
        p = tf_right.add_paragraph()
        p.text = "⚠️ " + gap
        p.font.name = "Calibri"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(14)

    # ----------------------------------------------------
    # SLIDE 3: Proposed Solution (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "Meet Secure OS: Your Digital Shield")
    
    # Intro Subtitle
    intro_box = slide.shapes.add_textbox(Inches(0.75), Inches(1.3), Inches(11.833), Inches(0.6))
    p_intro = intro_box.text_frame.paragraphs[0]
    p_intro.text = "A smart, multi-layered defense system that stops scams on your phone and in the cloud."
    p_intro.font.name = "Calibri"
    p_intro.font.size = Pt(18)
    p_intro.font.italic = True
    p_intro.font.color.rgb = TEXT_DARK
    
    # 3 Pillars (Shapes/Cards)
    pillar_data = [
        {
            "title": "1. Instant Mobile Protection",
            "desc": "A lightweight, offline AI running on your phone to scan links instantly with zero delay—saving your battery and working without internet.",
            "color": RGBColor(239, 246, 255), # light blue
            "border": PRIMARY_BLUE,
            "x": 0.75
        },
        {
            "title": "2. Cloud Deep-Scan API",
            "desc": "An advanced server that digs deeper—verifying website domains, checking SSL certificates, and inspecting page code for hidden credential thieves.",
            "color": RGBColor(240, 253, 250), # light teal
            "border": ACCENT_GREEN,
            "x": 4.85
        },
        {
            "title": "3. Safe View Sandbox",
            "desc": "A secure, isolated preview window that lets you look inside a website safely without downloading malware or trackers.",
            "color": RGBColor(255, 251, 235), # light yellow
            "border": RGBColor(217, 119, 6), # amber
            "x": 8.95
        }
    ]
    
    for pillar in pillar_data:
        # Background card shape
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(pillar["x"]), Inches(2.2), Inches(3.63), Inches(4.3)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = pillar["color"]
        card.line.color.rgb = pillar["border"]
        card.line.width = Pt(1.5)
        
        # Content box
        c_box = slide.shapes.add_textbox(
            Inches(pillar["x"] + 0.2), Inches(2.4), Inches(3.23), Inches(3.9)
        )
        tf_card = c_box.text_frame
        tf_card.word_wrap = True
        tf_card.margin_left = tf_card.margin_top = tf_card.margin_right = tf_card.margin_bottom = 0
        
        p_c_title = tf_card.paragraphs[0]
        p_c_title.text = pillar["title"]
        p_c_title.font.name = "Trebuchet MS"
        p_c_title.font.size = Pt(20)
        p_c_title.font.bold = True
        p_c_title.font.color.rgb = TEXT_DARK
        p_c_title.space_after = Pt(14)
        
        p_c_desc = tf_card.add_paragraph()
        p_c_desc.text = pillar["desc"]
        p_c_desc.font.name = "Calibri"
        p_c_desc.font.size = Pt(15)
        p_c_desc.font.color.rgb = TEXT_DARK
        p_c_desc.space_after = Pt(10)

    # ----------------------------------------------------
    # SLIDE 4: How the Solution Works (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "How It Works: Step-by-Step Defense")
    
    # Draw horizontal pipeline steps
    steps = [
        {"num": "1", "name": "Scan or Paste", "desc": "You copy a link, scan a physical QR code, or paste an email header."},
        {"num": "2", "name": "Instant Text Check", "desc": "The app instantly looks for look-alike brand names, fake characters, and random letter patterns."},
        {"num": "3", "name": "Offline AI Analysis", "desc": "A lightweight machine learning model runs right on your phone to give you an immediate safety score."},
        {"num": "4", "name": "Deep Cloud Inspection", "desc": "If something looks off, our servers audit the website's registration details and inspect the code for scams."}
    ]
    
    for i, step in enumerate(steps):
        left_pos = Inches(0.75 + (i * 2.95))
        
        # Step Number Bubble
        bubble = slide.shapes.add_shape(
            MSO_SHAPE.OVAL,
            left_pos + Inches(1.1), Inches(1.7), Inches(0.75), Inches(0.75)
        )
        bubble.fill.solid()
        bubble.fill.fore_color.rgb = PRIMARY_BLUE
        bubble.line.fill.background()
        p_num = bubble.text_frame.paragraphs[0]
        p_num.text = step["num"]
        p_num.alignment = PP_ALIGN.CENTER
        p_num.font.name = "Trebuchet MS"
        p_num.font.size = Pt(20)
        p_num.font.bold = True
        p_num.font.color.rgb = WHITE
        
        # Card Background
        step_card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            left_pos, Inches(2.6), Inches(2.8), Inches(3.9)
        )
        step_card.fill.solid()
        step_card.fill.fore_color.rgb = WHITE
        step_card.line.color.rgb = RGBColor(226, 232, 240)
        
        # Card Text
        card_box = slide.shapes.add_textbox(
            left_pos + Inches(0.15), Inches(2.75), Inches(2.5), Inches(3.6)
        )
        tf_step = card_box.text_frame
        tf_step.word_wrap = True
        tf_step.margin_left = tf_step.margin_top = tf_step.margin_right = tf_step.margin_bottom = 0
        
        p_s_name = tf_step.paragraphs[0]
        p_s_name.text = step["name"]
        p_s_name.alignment = PP_ALIGN.CENTER
        p_s_name.font.name = "Trebuchet MS"
        p_s_name.font.size = Pt(16)
        p_s_name.font.bold = True
        p_s_name.font.color.rgb = TEXT_DARK
        p_s_name.space_after = Pt(12)
        
        p_s_desc = tf_step.add_paragraph()
        p_s_desc.text = step["desc"]
        p_s_desc.alignment = PP_ALIGN.CENTER
        p_s_desc.font.name = "Calibri"
        p_s_desc.font.size = Pt(13)
        p_s_desc.font.color.rgb = TEXT_DARK

    # ----------------------------------------------------
    # SLIDE 5: Major Components in the System (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "The Secure OS Ecosystem")
    
    # 2x2 grid style representation
    comps = [
        ("Native Android App", 
         "Scans links automatically from your clipboard, decodes QR codes safely, and runs offline AI checks directly on your device with zero latency."),
        ("Web Security Hub", 
         "A beautiful Next.js dashboard to manually check suspicious links, view detailed scan histories, and learn cybersecurity basics."),
        ("Deep-Scan Servers", 
         "A powerful backend API that investigates domains, checks SSL certification validity, and analyzes page HTML structure."),
        ("Safe View & Email Auditor", 
         "Renders dangerous pages inside a script-disabled visual sandbox and breaks down confusing email headers into plain English.")
    ]
    
    for idx, (title, desc) in enumerate(comps):
        row = idx // 2
        col = idx % 2
        left_pos = Inches(0.75 + (col * 6.0))
        top_pos = Inches(1.7 + (row * 2.7))
        
        # Draw component container
        comp_shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            left_pos, top_pos, Inches(5.7), Inches(2.3)
        )
        comp_shape.fill.solid()
        comp_shape.fill.fore_color.rgb = WHITE
        comp_shape.line.color.rgb = RGBColor(226, 232, 240)
        comp_shape.line.width = Pt(1.5)
        
        # Indicator bar on left edge of the rectangle
        ind_bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            left_pos, top_pos, Inches(0.12), Inches(2.3)
        )
        ind_bar.fill.solid()
        ind_bar.fill.fore_color.rgb = PRIMARY_BLUE if idx % 2 == 0 else ACCENT_GREEN
        ind_bar.line.fill.background()
        
        # Text block
        tb = slide.shapes.add_textbox(left_pos + Inches(0.3), top_pos + Inches(0.2), Inches(5.1), Inches(1.9))
        tf_comp = tb.text_frame
        tf_comp.word_wrap = True
        tf_comp.margin_left = tf_comp.margin_top = tf_comp.margin_right = tf_comp.margin_bottom = 0
        
        p_c_title = tf_comp.paragraphs[0]
        p_c_title.text = title
        p_c_title.font.name = "Trebuchet MS"
        p_c_title.font.size = Pt(18)
        p_c_title.font.bold = True
        p_c_title.font.color.rgb = TEXT_DARK
        p_c_title.space_after = Pt(6)
        
        p_c_desc = tf_comp.add_paragraph()
        p_c_desc.text = desc
        p_c_desc.font.name = "Calibri"
        p_c_desc.font.size = Pt(14)
        p_c_desc.font.color.rgb = TEXT_DARK

    # ----------------------------------------------------
    # SLIDE 6: Technical Tech Stack (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "Our Tech Stack & Core Algorithms")
    
    # Left Column: Technologies
    left_tb = slide.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(5.5), Inches(5.0))
    tf_left = left_tb.text_frame
    tf_left.word_wrap = True
    tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
    
    p_tech_hdr = tf_left.paragraphs[0]
    p_tech_hdr.text = "The Technology Behind Secure OS"
    p_tech_hdr.font.name = "Trebuchet MS"
    p_tech_hdr.font.size = Pt(22)
    p_tech_hdr.font.bold = True
    p_tech_hdr.font.color.rgb = TEXT_DARK
    p_tech_hdr.space_after = Pt(15)
    
    techs = [
        ("Mobile App", "Native Kotlin, Android SDK, and offline heuristics"),
        ("Web Dashboard", "Next.js 16 (React), Vanilla CSS with premium glassmorphism styles"),
        ("Cloud API", "Next.js serverless API routes running on Node.js"),
        ("Utilities", "HTML5 QR-code reader and secure Web Cryptography"),
        ("Data Pipeline", "Python scripts for dataset processing and model weights translation")
    ]
    for label, desc in techs:
        p = tf_left.add_paragraph()
        p.text = f"💻 {label}: "
        p.font.bold = True
        p.font.size = Pt(15)
        p.font.color.rgb = PRIMARY_BLUE
        
        p_desc = tf_left.add_paragraph()
        p_desc.text = "   " + desc
        p_desc.font.size = Pt(14)
        p_desc.font.color.rgb = TEXT_DARK
        p_desc.space_after = Pt(8)

    # Right Column: Key Algorithms
    right_tb = slide.shapes.add_textbox(Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.0))
    tf_right = right_tb.text_frame
    tf_right.word_wrap = True
    tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
    
    p_algo_hdr = tf_right.paragraphs[0]
    p_algo_hdr.text = "The Algorithms Keeping You Safe"
    p_algo_hdr.font.name = "Trebuchet MS"
    p_algo_hdr.font.size = Pt(22)
    p_algo_hdr.font.bold = True
    p_algo_hdr.font.color.rgb = TEXT_DARK
    p_algo_hdr.space_after = Pt(15)
    
    algos = [
        ("Typosquatting Checker (Levenshtein)", "Calculates text similarity to catch links mimicking popular brand names (like `paypa1.com`)."),
        ("Threat Classifier (Logistic Regression)", "Analyzes structural features of a URL to calculate an instant probability score."),
        ("Randomness Detector (Shannon Entropy)", "Detects randomly generated domains frequently used by botnets and automated spammers."),
        ("Homograph Decoder (Punycode)", "Exposes scams using foreign characters that mimic standard English letters.")
    ]
    for name, desc in algos:
        p = tf_right.add_paragraph()
        p.text = f"⚙️ {name}: "
        p.font.bold = True
        p.font.size = Pt(15)
        p.font.color.rgb = ACCENT_GREEN
        
        p_desc = tf_right.add_paragraph()
        p_desc.text = "   " + desc
        p_desc.font.size = Pt(14)
        p_desc.font.color.rgb = TEXT_DARK
        p_desc.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 7: Impact on Cybersecurity (Light Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "Making a Real-World Impact")
    
    # 4 grid blocks for impacts
    impacts = [
        ("Preventing Scams, Not Just Reporting Them", "While traditional browsers warn you after a site is already flagged, Secure OS analyzes site structure instantly to block brand-new (zero-day) attacks."),
        ("The QR Code (Quishing) Shield", "Protects citizens from physical scams—like fake parking ticket stickers or public poster codes—by decoding links safely and previewing them first."),
        ("Making Email Security Simple", "Takes the technical jargon out of email headers, showing a clear, understandable rating on whether the sender is authentic."),
        ("Training the Human Layer", "Builds lasting digital safety habits using interactive, gamified quizzes to teach citizens how to spot phishing flags on their own.")
    ]
    
    for idx, (title, desc) in enumerate(impacts):
        row = idx // 2
        col = idx % 2
        left_pos = Inches(0.75 + (col * 6.0))
        top_pos = Inches(1.8 + (row * 2.6))
        
        # Container shape
        container = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            left_pos, top_pos, Inches(5.7), Inches(2.2)
        )
        container.fill.solid()
        container.fill.fore_color.rgb = WHITE
        container.line.color.rgb = RGBColor(226, 232, 240)
        
        tb = slide.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.2), Inches(5.3), Inches(1.8))
        tf_imp = tb.text_frame
        tf_imp.word_wrap = True
        tf_imp.margin_left = tf_imp.margin_top = tf_imp.margin_right = tf_imp.margin_bottom = 0
        
        p_t = tf_imp.paragraphs[0]
        p_t.text = "🎯 " + title
        p_t.font.name = "Trebuchet MS"
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = PRIMARY_BLUE
        p_t.space_after = Pt(6)
        
        p_d = tf_imp.add_paragraph()
        p_d.text = desc
        p_d.font.name = "Calibri"
        p_d.font.size = Pt(14)
        p_d.font.color.rgb = TEXT_DARK

    # ----------------------------------------------------
    # SLIDE 8: Working Prototype & Live Demo (Light Theme with Image)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, LIGHT_BG)
    add_slide_header(slide, "Our Live Working Prototype")
    
    # Left Column: Demo highlights
    left_tb = slide.shapes.add_textbox(Inches(0.75), Inches(1.8), Inches(6.0), Inches(4.5))
    tf_left = left_tb.text_frame
    tf_left.word_wrap = True
    tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
    
    p_demo_hdr = tf_left.paragraphs[0]
    p_demo_hdr.text = "Experience Secure OS in Action"
    p_demo_hdr.font.name = "Trebuchet MS"
    p_demo_hdr.font.size = Pt(22)
    p_demo_hdr.font.bold = True
    p_demo_hdr.font.color.rgb = TEXT_DARK
    p_demo_hdr.space_after = Pt(20)
    
    demo_bullets = [
        "Interactive Dashboard: A real-time web interface running at localhost:3000 to scan and preview links safely.",
        "Live QR Scanner: Instant, webcam-integrated scanning to parse and analyze physical codes.",
        "Cloud-Based Audits: A live backend that triggers DNS lookups and certificate validation on the fly.",
        "Native Mobile Diagnostics: Offline Kotlin engine checking links on the go directly in the Android app."
    ]
    for db in demo_bullets:
        p = tf_left.add_paragraph()
        p.text = "⚡ " + db
        p.font.name = "Calibri"
        p.font.size = Pt(15)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(14)

    # Right Column: App image
    script_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(script_dir, "image.png")
    if os.path.exists(img_path):
        slide.shapes.add_picture(img_path, Inches(7.2), Inches(1.6), width=Inches(5.3))
    else:
        # Fallback card if the image is missing
        right_card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(7.2), Inches(1.8), Inches(5.3), Inches(4.2)
        )
        right_card.fill.solid()
        right_card.fill.fore_color.rgb = PRIMARY_BLUE
        right_card.line.fill.background()

    # ----------------------------------------------------
    # SLIDE 9: Conclusion (Dark Theme)
    # ----------------------------------------------------
    slide = prs.slides.add_slide(slide_layout)
    set_slide_background(slide, DARK_NAVY)
    
    # Add decorative colored shape
    accent_box = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.75), Inches(2.2), Inches(0.12), Inches(3.2)
    )
    accent_box.fill.solid()
    accent_box.fill.fore_color.rgb = PRIMARY_BLUE
    accent_box.line.fill.background()
    
    # Text Frame
    text_box = slide.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(11.0), Inches(3.5))
    tf = text_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p_title = tf.paragraphs[0]
    p_title.text = "SECURE OS"
    p_title.font.name = "Trebuchet MS"
    p_title.font.size = Pt(64)
    p_title.font.bold = True
    p_title.font.color.rgb = WHITE
    p_title.space_after = Pt(8)
    
    p_sub = tf.add_paragraph()
    p_sub.text = "Shielding Citizens from Cyber Scams"
    p_sub.font.name = "Calibri"
    p_sub.font.size = Pt(22)
    p_sub.font.color.rgb = ACCENT_GREEN
    p_sub.space_after = Pt(45)
    
    p_ty = tf.add_paragraph()
    p_ty.text = "Thank You! Any Questions?"
    p_ty.font.name = "Trebuchet MS"
    p_ty.font.size = Pt(28)
    p_ty.font.bold = True
    p_ty.font.color.rgb = WHITE

    # Save presentation
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.join(script_dir, "Secure_OS_Presentation.pptx")
    prs.save(output_filename)
    print(f"Presentation created successfully at {output_filename}!")

if __name__ == "__main__":
    create_presentation()
