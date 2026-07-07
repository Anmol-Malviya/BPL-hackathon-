import os
import sys
import subprocess

def main():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        from PIL import Image, ImageDraw

    output_dir = "./extansion"
    os.makedirs(output_dir, exist_ok=True)

    sizes = [16, 48, 128]
    for size in sizes:
        # Create a transparent image
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Coordinates scale factor
        s = size / 128.0

        # Shield outline coordinates
        # Top-center, top-right, mid-right, bottom-center, mid-left, top-left
        poly = [
            (64 * s, 10 * s),
            (114 * s, 25 * s),
            (114 * s, 75 * s),
            (64 * s, 118 * s),
            (14 * s, 75 * s),
            (14 * s, 25 * s)
        ]

        # Draw outer shield shadow (subtle dark purple blur glow simulated)
        draw.polygon(poly, fill=(139, 92, 246, 255)) # Purple shield body

        # Draw inner shield (smaller to create a border effect)
        inner_poly = [
            (64 * s, 18 * s),
            (104 * s, 30 * s),
            (104 * s, 70 * s),
            (64 * s, 106 * s),
            (24 * s, 70 * s),
            (24 * s, 30 * s)
        ]
        draw.polygon(inner_poly, fill=(12, 9, 32, 255)) # Deep surface dark color

        # Draw a security checkmark or lock inside
        # We draw a checkmark: start at (44, 64) -> (58, 78) -> (84, 52)
        check_points = [
            (44 * s, 64 * s),
            (58 * s, 78 * s),
            (84 * s, 50 * s)
        ]
        
        # Draw checkmark using lines
        # Determine thickness based on size
        thick = max(1, int(6 * s))
        
        # Drawing smooth lines for checkmark
        # Draw a line from pt1 to pt2, and pt2 to pt3
        draw.line([check_points[0], check_points[1]], fill=(6, 182, 212, 255), width=thick) # Cyan check
        draw.line([check_points[1], check_points[2]], fill=(6, 182, 212, 255), width=thick)

        # Draw a nice accent dot at top center
        draw.ellipse([(60 * s, 28 * s), (68 * s, 36 * s)], fill=(6, 182, 212, 255))

        # Save image
        output_path = os.path.join(output_dir, f"icon{size}.png")
        img.save(output_path)
        print(f"Generated extension icon: {output_path}")

    # Generate a matching logo.svg for vector use
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a78bfa" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <!-- Outer Shield -->
  <polygon points="64,10 114,25 114,75 64,118 14,75 14,25" fill="url(#shieldGrad)" />
  <!-- Inner Shield -->
  <polygon points="64,18 104,30 104,70 64,106 24,70 24,30" fill="#0c0920" />
  <!-- Cyan Security Check -->
  <path d="M44,64 L58,78 L84,50" fill="none" stroke="url(#checkGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Accent lock/circle -->
  <circle cx="64" cy="32" r="4" fill="#06b6d4" />
</svg>"""
    
    svg_path = os.path.join(output_dir, "logo.svg")
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"Generated vector logo.svg: {svg_path}")

if __name__ == "__main__":
    main()
