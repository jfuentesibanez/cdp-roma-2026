"""Generates the fillable team worksheet. One page per act / exercise.
Usage: python ficha.py OUTPUT.pdf   (needs reportlab)
"""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT = sys.argv[1]
W, H = A4
M = 40
INK = HexColor("#2E3B48")
GREEN = HexColor("#00924A")
GREY = HexColor("#6E7B87")
FILL = HexColor("#F3F5F7")
LINE = HexColor("#D0D7DE")

ACTS = [("ACT 1", "Activity 1 · Task map"),
        ("ACT 2", "Activity 2 · Resistance map"),
        ("ACT 3", "Activity 3 · Adoption slide")]

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Adoption Plan - team worksheet")
c.setAuthor("Javier Fuentes Ibáñez")
form = c.acroForm
fid = [0]


def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if stringWidth(t, font, size) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(x, y, text, size=9, font="Helvetica", color=GREY, width=None):
    width = width or (W - 2 * M)
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in wrap(text, font, size, width):
        c.drawString(x, y, ln)
        y -= size * 1.35
    return y


def field(x, y_top, w, h, name, tip, multiline=True):
    fid[0] += 1
    form.textfield(name=f"{fid[0]:02d}_{name}", tooltip=tip, x=x, y=y_top - h, width=w, height=h,
                   borderColor=LINE, fillColor=FILL, textColor=INK, borderWidth=0.8,
                   fontName="Helvetica", fontSize=9 if multiline else 10,
                   fieldFlags="multiline" if multiline else "", forceBorder=True)
    return y_top - h


def header(page):
    """Dark title bar, then the breadcrumb: three acts, the current one filled."""
    c.setFillColor(INK)
    c.rect(0, H - 50, W, 50, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(M, H - 24, "AI changes the work. Who changes the people?")
    c.setFont("Helvetica", 8.5)
    c.drawString(M, H - 39, "Team worksheet · type directly in the boxes and save · one page per act")
    c.drawRightString(W - M, H - 39, f"{page} / 3")
    gap = 8
    cw = (W - 2 * M - 2 * gap) / 3
    y = H - 84
    for i, (act, name) in enumerate(ACTS):
        x = M + i * (cw + gap)
        on = (i + 1 == page)
        c.setStrokeColor(GREEN if on else LINE)
        c.setFillColor(GREEN if on else white)
        c.roundRect(x, y, cw, 24, 4, fill=1, stroke=1)
        c.setFillColor(white if on else GREY)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 9, y + 9, act)
        c.setFont("Helvetica-Bold" if on else "Helvetica", 8.5)
        c.drawString(x + 44, y + 9, name)
    return y - 22


def step(y, num, title, sub):
    c.setFillColor(GREEN)
    c.circle(M + 9, y - 5, 9, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(M + 9, y - 8.5, str(num))
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(M + 26, y - 9, title)
    return para(M + 26, y - 24, sub, size=8.5, width=W - 2 * M - 26) - 6


def label(x, y, text, w=None):
    return para(x, y, text, size=8.5, font="Helvetica-Bold", color=INK, width=w) - 2


FULL = W - 2 * M
cw = (FULL - 12) / 2

# ---------------- PAGE 1 · ACT 1 · Exercise 1 ----------------
y = header(1)
c.setFont("Helvetica-Bold", 9); c.setFillColor(INK)
c.drawString(M, y, "Team"); field(M + 40, y + 11, 70, 17, "team", "Team number", False)
c.drawString(M + 125, y, "MVP"); field(M + 158, y + 11, FULL - 158, 17, "mvp", "MVP name", False)
y -= 24
c.drawString(M, y, "Members"); field(M + 52, y + 11, FULL - 52, 17, "members", "Team members", False)
y -= 34

y = step(y, 1, "Whose job does your MVP change?",
         "Pick ONE real person, by role, who will work with your MVP every week. Not 'the company', not 'users'.")
label(M, y, "Role and team"); label(M + cw + 12, y, "What they do today, without the tool")
y = field(M, y - 12, cw, 80, "user_role", "Role and team")
field(M + cw + 12, y + 80, cw, 80, "user_today", "Current work")
y -= 26

y = step(y, 2, "Task map", "Split that person's work into four boxes. The fourth is never empty, and its tasks may land on someone else.")
boxes = [("The AI does it", "Alone, with spot checks"),
         ("The AI proposes, the person decides", "Draft, ranking, flag"),
         ("Stays human", "Judgement, relationships, signature"),
         ("NEW tasks that appear, and who does them", "For this person or for someone else: IT, compliance, a manager")]
bh = 128
for i, (t, s) in enumerate(boxes):
    x = M + (i % 2) * (cw + 12)
    yy = y - (i // 2) * (bh + 32)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 9); c.drawString(x, yy, t)
    c.setFillColor(GREY); c.setFont("Helvetica", 8); c.drawString(x, yy - 11, s)
    field(x, yy - 15, cw, bh, f"task_{i+1}", t)
y -= 2 * (bh + 32) + 6
label(M, y, "In one sentence: what changes in this person's job?")
field(M, y - 12, FULL, 46, "role_change", "What changes")
c.showPage()

# ---------------- PAGE 2 · ACT 2 · Exercise 2 ----------------
y = header(2)
y = step(y, 3, "Resistance map",
         "Who will resist your MVP, and why? Typical reasons: my job, my status, looking incompetent, "
         "my signature, more work, no trust.")
cols = [("Who (a role)", 0.22), ("The real reason", 0.39), ("Our answer", 0.39)]
tw = FULL - 16
x = M
for t, f in cols:
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 8.5); c.drawString(x, y, t); x += tw * f + 8
y -= 6
for r in range(3):
    x = M
    for j, (t, f) in enumerate(cols):
        field(x, y, tw * f, 52, f"resist_{r+1}_{j+1}", t); x += tw * f + 8
    y -= 58
y -= 14

y = step(y, 4, "ADKAR check",
         "For the person from step 1: give each question a score. 1 = not at all, 5 = yes, fully. "
         "Then write what you will do about the lowest scores.")
c.setFillColor(INK); c.setFont("Helvetica-Bold", 8.5)
c.drawCentredString(M + 205, y, "Score 1-5"); c.drawString(M + 240, y, "What we will do about it")
y -= 8
adkar = [("Awareness", "Do they know why this is changing?"),
         ("Desire", "What is in it for them?"),
         ("Knowledge", "Do they know how to use it, and when not to?"),
         ("Ability", "Do they have the time to do it?"),
         ("Reinforcement", "What stops them going back to the old way?")]
for t, q in adkar:
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 9); c.drawString(M, y - 13, t)
    c.setFillColor(GREY); c.setFont("Helvetica", 7.5); c.drawString(M, y - 23, q)
    field(M + 185, y, 40, 30, f"adkar_{t}_score", f"{t} score 1-5", False)
    field(M + 240, y, FULL - 240, 30, f"adkar_{t}_action", f"{t} action")
    y -= 36
y -= 14

bh = y - 46
c.setFillColor(FILL); c.setStrokeColor(LINE)
c.roundRect(M, y - bh, FULL, bh, 6, fill=1, stroke=1)
yy = y - 20
c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 11); c.drawString(M + 12, yy, "Sceptic swap")
yy = para(M + 12, yy - 16, "One of you joins the next team as the sceptical boss who has to live with their MVP. "
          "Your job: knock their plan down. Hosts: write down the best objection.",
          size=8.5, color=INK, width=FULL - 24)
yy = para(M + 12, yy - 4, "Optional, with Copilot:", size=8.5, font="Helvetica-Bold", color=INK)
prompt = ("You are the head of [department] at a large Italian state-owned company. Your team has been told to start "
          "using [tool, in one sentence] next month. You are experienced, busy and sceptical. List the five "
          "objections you would raise in the meeting, in order of how hard they are to answer, and for each one say "
          "what would actually convince you.")
c.setFont("Courier", 8); c.setFillColor(INK)
for ln in wrap(prompt, "Courier", 8, FULL - 30):
    c.drawString(M + 16, yy, ln); yy -= 10.5
yy -= 8
label(M + 12, yy, "The best objection we heard, and our answer")
field(M + 12, yy - 12, FULL - 24, yy - 12 - (y - bh) - 12, "best_objection", "Best objection")
c.showPage()

# ---------------- PAGE 3 · ACT 3 · Exercise 3 ----------------
y = header(3)
y = step(y, 5, "First 90 days", "Small and concrete. Plan for the MVP you have built, not the one you imagine.")
pw = (FULL - 16) / 3
for i, p in enumerate(["Days 1-30", "Days 31-60", "Days 61-90"]):
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 9); c.drawString(M + i * (pw + 8), y, p)
    field(M + i * (pw + 8), y - 5, pw, 96, f"plan_{i+1}", p)
y -= 120
for i, (t, n) in enumerate([("How we will know it is being used", "metric"), ("Target at day 90", "target"),
                            ("Owner (a name)", "owner")]):
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 9); c.drawString(M + i * (pw + 8), y, t)
    field(M + i * (pw + 8), y - 5, pw, 26, f"kpi_{n}", t, False)
y -= 62

y = step(y, 6, "Your slide for tomorrow: Adoption & next steps",
         "Four lines, plain words. Copy them into your presentation. If you cannot fill one, that is your next step.")
lines = [("Who uses it, and what changes for them", "from steps 1-2"),
         ("The resistance we expect, and our answer", "from step 3"),
         ("The first 90 days", "from step 5"),
         ("How we will know it is being used", "metric, target, owner")]
lh = (y - 60 - 4 * 24) / 4
for i, (t, s) in enumerate(lines):
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10); c.drawString(M, y, t)
    c.setFillColor(GREY); c.setFont("Helvetica", 8); c.drawRightString(W - M, y, s)
    field(M, y - 6, FULL, lh, f"slide_{i+1}", t)
    y -= lh + 24
para(M, 34, "Javier Fuentes Ibáñez · javier@ncompany.es", size=8, color=GREY)
c.save()
print("ok", OUT)
