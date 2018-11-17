#!/usr/bin/env python3
# Generate a list of text message files.

import json
from pathlib import Path

root = Path(__file__).parent.parent
text_dir = root / 'public' / 'game_files' / 'text'
paths = []
for text_path in text_dir.glob('*/*.json'):
    paths.append(str(text_path.relative_to(text_dir)))
with open(text_dir / 'list.json', 'w') as f:
    json.dump(paths, f)

