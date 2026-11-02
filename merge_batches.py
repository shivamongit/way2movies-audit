import json
import subprocess
import sys
from pathlib import Path

# Minimal scraper probe expression executed in page context via playwright-less approach:
# Agent fills audit.json using browser CDP batches.

print("Use browser-driven audit; see README.md", file=sys.stderr)
