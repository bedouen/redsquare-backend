#!/usr/bin/env python
"""
Script pour visualiser la structure du projet Django
Usage: python view_structure.py
"""

import os
from pathlib import Path

def list_files(startpath, exclude_dirs=['venv', '__pycache__', '.git', 'migrations']):
    for root, dirs, files in os.walk(startpath):
        # Exclure les dossiers
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if not f.endswith('.pyc'):
                print(f'{subindent}{f}')

if __name__ == '__main__':
    print("\n📁 Structure du projet backend/\n")
    list_files('.')