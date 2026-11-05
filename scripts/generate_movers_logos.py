#!/usr/bin/env python3
"""
Generate crisp, professional company logos (128x128 PNG) for Indian stocks
matching Groww, INDmoney, and Tapetide design standards.
"""
import os
from PIL import Image, ImageDraw, ImageFont

MOVERS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "movers")
os.makedirs(MOVERS_DIR, exist_ok=True)

# List of companies with their filename, initials, primary bg color, text color, and style
COMPANIES = [
    # Largecaps / Nifty 50
    {"file": "reliance.png", "text": "RIL", "bg": (0, 45, 98), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "tcs.png", "text": "TCS", "bg": (15, 23, 42), "fg": (56, 189, 248), "shape": "rect"},
    {"file": "hdfc-bank.png", "text": "HDFC", "bg": (0, 76, 143), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "airtel.png", "text": "airtel", "bg": (228, 0, 0), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "icici-bank.png", "text": "ICICI", "bg": (185, 28, 28), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "infosys.png", "text": "INFY", "bg": (0, 114, 206), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "itc.png", "text": "ITC", "bg": (180, 83, 9), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "lt.png", "text": "L&T", "bg": (217, 119, 6), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "bajaj-finance.png", "text": "BFL", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "sun-pharma.png", "text": "SUN", "bg": (234, 88, 12), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "adani-ports.png", "text": "APSEZ", "bg": (124, 58, 237), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "coal-india.png", "text": "CIL", "bg": (30, 41, 59), "fg": (245, 158, 11), "shape": "rect"},
    {"file": "ultratech.png", "text": "UTC", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "tata-steel.png", "text": "TATA", "bg": (37, 99, 235), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "wipro.png", "text": "WIPRO", "bg": (13, 148, 136), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "cipla.png", "text": "CIPLA", "bg": (16, 185, 129), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "trent.png", "text": "TRENT", "bg": (15, 23, 42), "fg": (236, 72, 153), "shape": "rect"},
    {"file": "maruti.png", "text": "MSIL", "bg": (30, 58, 138), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "titan.png", "text": "TITAN", "bg": (15, 23, 42), "fg": (245, 158, 11), "shape": "rect"},
    {"file": "kotak-bank.png", "text": "KOTAK", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "axis-bank.png", "text": "AXIS", "bg": (159, 18, 57), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "ntpc.png", "text": "NTPC", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "ongc.png", "text": "ONGC", "bg": (180, 83, 9), "fg": (255, 255, 255), "shape": "circle"},

    # Momentum / Nifty Next 50 Stars
    {"file": "jio-fin.png", "text": "JIO", "bg": (30, 58, 138), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "irfc.png", "text": "IRFC", "bg": (22, 101, 52), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "rvnl.png", "text": "RVNL", "bg": (30, 64, 175), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "suzlon.png", "text": "SUZLON", "bg": (5, 150, 105), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "hal.png", "text": "HAL", "bg": (30, 41, 59), "fg": (56, 189, 248), "shape": "rect"},
    {"file": "mazdock.png", "text": "MDL", "bg": (15, 76, 129), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "cochin-shipyard.png", "text": "CSL", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "bhel.png", "text": "BHEL", "bg": (194, 65, 12), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "rec.png", "text": "REC", "bg": (21, 128, 61), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "pfc.png", "text": "PFC", "bg": (180, 83, 9), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "tata-power.png", "text": "POWER", "bg": (37, 99, 235), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "adani-power.png", "text": "ADANI", "bg": (109, 40, 217), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "adani-green.png", "text": "AGEL", "bg": (16, 185, 129), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "dlf.png", "text": "DLF", "bg": (30, 41, 59), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "polycab.png", "text": "POLYCAB", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "havells.png", "text": "HAVELLS", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "dixon.png", "text": "DIXON", "bg": (15, 23, 42), "fg": (56, 189, 248), "shape": "rect"},
    {"file": "cdsl.png", "text": "CDSL", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "angel-one.png", "text": "ANGEL", "bg": (249, 115, 22), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "mcx.png", "text": "MCX", "bg": (180, 83, 9), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "dmart.png", "text": "DMart", "bg": (22, 163, 74), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "zomato.png", "text": "zomato", "bg": (203, 32, 45), "fg": (255, 255, 255), "shape": "circle"},

    # Primary Market Debuts & Recent IPOs
    {"file": "waaree.png", "text": "WAAREE", "bg": (245, 158, 11), "fg": (15, 23, 42), "shape": "circle"},
    {"file": "swiggy.png", "text": "SWIGGY", "bg": (252, 128, 25), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "hyundai.png", "text": "HYUNDAI", "bg": (0, 44, 95), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "premier-energies.png", "text": "PREMIER", "bg": (16, 185, 129), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "bajaj-housing.png", "text": "BHFL", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "ola-electric.png", "text": "OLA", "bg": (17, 24, 39), "fg": (74, 222, 128), "shape": "circle"},
    {"file": "ntpc-green.png", "text": "NGEL", "bg": (16, 185, 129), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "firstcry.png", "text": "FIRSTCRY", "bg": (244, 63, 94), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "unicommerce.png", "text": "UNI", "bg": (79, 70, 229), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "krn.png", "text": "KRN", "bg": (14, 165, 233), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "manba.png", "text": "MANBA", "bg": (180, 83, 9), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "orient-tech.png", "text": "ORIENT", "bg": (37, 99, 235), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "tata-tech.png", "text": "TECH", "bg": (30, 58, 138), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "kaynes.png", "text": "KAYNES", "bg": (15, 23, 42), "fg": (245, 158, 11), "shape": "rect"},
    {"file": "tejas.png", "text": "TEJAS", "bg": (2, 132, 199), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "jyoti-cnc.png", "text": "JYOTI", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},
    {"file": "exide.png", "text": "EXIDE", "bg": (220, 38, 38), "fg": (255, 255, 255), "shape": "rect"},

    # Active & Upcoming IPOs
    {"file": "antala.png", "text": "ANTALA", "bg": (30, 58, 138), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "vedant.png", "text": "VEDANT", "bg": (5, 150, 105), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "zepto.png", "text": "zepto", "bg": (124, 58, 237), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "razorpay.png", "text": "RAZOR", "bg": (14, 165, 233), "fg": (255, 255, 255), "shape": "circle"},
    {"file": "haldiram.png", "text": "HALDIRAM", "bg": (220, 38, 38), "fg": (254, 240, 138), "shape": "rect"},
    {"file": "flipkart.png", "text": "FLIPKART", "bg": (40, 116, 240), "fg": (255, 234, 0), "shape": "rect"},
    {"file": "phonepe.png", "text": "PHONEPE", "bg": (103, 58, 183), "fg": (255, 255, 255), "shape": "circle"},
]

def generate_logo(item):
    path = os.path.join(MOVERS_DIR, item["file"])
    # Do not overwrite if valid custom PNG already exists
    if os.path.exists(path) and os.path.getsize(path) > 3000:
        return

    size = (128, 128)
    img = Image.new("RGBA", size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    bg_color = item["bg"]
    fg_color = item["fg"]
    shape = item.get("shape", "rect")

    # Draw rounded background
    if shape == "circle":
        draw.ellipse([4, 4, 124, 124], fill=bg_color)
    else:
        draw.rounded_rectangle([4, 4, 124, 124], radius=24, fill=bg_color)

    # Inner subtle border
    draw.rounded_rectangle([5, 5, 123, 123], radius=23, outline=(255, 255, 255, 40), width=2)

    # Determine font size based on text length
    text = item["text"]
    tlen = len(text)
    if tlen <= 3:
        font_size = 46
    elif tlen <= 5:
        font_size = 32
    elif tlen <= 7:
        font_size = 25
    else:
        font_size = 20

    # Try system fonts
    font = None
    for font_name in [
        "/System/Library/Fonts/SFCompact-Bold.otf",
        "/System/Library/Fonts/SFProText-Bold.otf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
        "/Library/Fonts/Arial.ttf"
    ]:
        if os.path.exists(font_name):
            try:
                font = ImageFont.truetype(font_name, font_size)
                break
            except Exception:
                continue

    if not font:
        font = ImageFont.load_default()

    # Center text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (128 - text_w) / 2 - bbox[0]
    y = (128 - text_h) / 2 - bbox[1]

    draw.text((x, y), text, fill=fg_color, font=font)
    img.save(path, "PNG", optimize=True)
    print(f"Generated logo: {item['file']}")

def main():
    print(f"Generating {len(COMPANIES)} company logos in {MOVERS_DIR}...")
    for item in COMPANIES:
        generate_logo(item)
    print("Done!")

if __name__ == "__main__":
    main()
