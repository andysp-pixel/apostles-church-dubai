#!/usr/bin/env python3
"""Regenerate responsive church photos without changing the source images.

Run from either the source checkout (with dist/assets) or the flat GitHub
export (with assets): python3 scripts/mobile_images.py
Requires Pillow: python3 -m pip install Pillow
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps


WIDTHS = (360, 640, 960)


def web_root(project_root: Path) -> Path:
    for candidate in (project_root / "dist", project_root):
        if (candidate / "assets").is_dir():
            return candidate
    raise FileNotFoundError(f"No assets directory found in {project_root} or dist/")


def generate(project_root: Path) -> dict:
    public_root = web_root(project_root)
    gallery_path = project_root / "scripts" / "gallery.json"
    gallery = json.loads(gallery_path.read_text(encoding="utf-8"))
    sources = [item["src"] for item in gallery]
    sources.extend(("assets/pastor.webp", "assets/intro-poster.jpg"))
    destination = public_root / "assets" / "mobile"
    destination.mkdir(parents=True, exist_ok=True)

    manifest = {
        "version": 1,
        "format": "webp",
        "quality": 80,
        "resize": "proportional; no crop or upscaling",
        "images": {},
    }
    for source in dict.fromkeys(sources):
        source_path = public_root / source
        original_bytes = source_path.read_bytes()
        original_hash = hashlib.sha256(original_bytes).hexdigest()
        with Image.open(source_path) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
        width, height = image.size
        target_widths = [target for target in WIDTHS if target <= width]
        # Small source images get their native size as the largest option.
        if width < WIDTHS[-1] and width not in target_widths:
            target_widths.append(width)
        record = {
            "width": width,
            "height": height,
            "bytes": len(original_bytes),
            "sha256": original_hash,
            "variants": [],
        }
        for target_width in target_widths:
            target_height = max(1, round(height * target_width / width))
            resized = image.resize(
                (target_width, target_height), Image.Resampling.LANCZOS
            )
            filename = f"{source_path.stem}-{target_width}.webp"
            output_path = destination / filename
            resized.save(output_path, format="WEBP", quality=80, method=6)
            record["variants"].append(
                {
                    "src": output_path.relative_to(public_root).as_posix(),
                    "width": target_width,
                    "height": target_height,
                    "bytes": output_path.stat().st_size,
                }
            )
        # A build must never rewrite the supplied church originals.
        if hashlib.sha256(source_path.read_bytes()).hexdigest() != original_hash:
            raise RuntimeError(f"Source image unexpectedly changed: {source}")
        manifest["images"][source] = record

    manifest_path = project_root / "scripts" / "mobile_images.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    arguments = parser.parse_args()
    manifest = generate(arguments.root.resolve())
    images = manifest["images"]
    count = sum(len(item["variants"]) for item in images.values())
    print(f"Generated {count} WebP variants for {len(images)} images.")
    print("Manifest: scripts/mobile_images.json")


if __name__ == "__main__":
    main()
