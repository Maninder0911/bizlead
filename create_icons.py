from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ICON_DIR = Path("frontend/icons")
ICON_DIR.mkdir(parents=True, exist_ok=True)


def create_icon(size: int) -> None:
    image = Image.new("RGBA", (size, size), "#1f4e79")
    draw = ImageDraw.Draw(image)

    # Rounded-square background
    margin = int(size * 0.04)
    radius = int(size * 0.18)
    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=radius,
        fill="#1f4e79",
    )

    # Large white B
    font_size = int(size * 0.69)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except OSError:
        font = ImageFont.load_default(size=font_size)

    draw.text(
        (int(size * 0.14), int(size * 0.05)),
        "B",
        font=font,
        fill="#ffffff",
        stroke_width=0,
    )

    # Three rising bars
    bar_width = int(size * 0.13)
    base_y = int(size * 0.81)
    gaps = int(size * 0.035)
    heights = [0.16, 0.25, 0.35]
    start_x = int(size * 0.28)

    for index, height in enumerate(heights):
        x1 = start_x + index * (bar_width + gaps)
        y1 = base_y - int(size * height)
        draw.rounded_rectangle(
            (x1, y1, x1 + bar_width, base_y),
            radius=max(2, int(size * 0.025)),
            fill=["#35c4e8", "#209bd0", "#0879b5"][index],
        )

    # Save the PNG
    output = ICON_DIR / f"bizlead-{size}.png"
    image.convert("RGB").save(output, format="PNG")
    print(f"Created: {output} ({size}x{size})")


for icon_size in (192, 512):
    create_icon(icon_size)
