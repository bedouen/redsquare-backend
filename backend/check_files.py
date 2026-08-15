import os
import sys

def check_file_for_null_bytes(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            if b'\x00' in content:
                print(f"❌ Fichier corrompu: {filepath}")
                return True
        return False
    except Exception as e:
        print(f"⚠️ Erreur: {filepath} - {e}")
        return False

def find_corrupted_files(directory):
    corrupted = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if check_file_for_null_bytes(filepath):
                    corrupted.append(filepath)
    return corrupted

if __name__ == "__main__":
    print("🔍 Recherche des fichiers Python corrompus...")
    corrupted = find_corrupted_files('.')
    
    if corrupted:
        print(f"\n❌ {len(corrupted)} fichiers corrompus trouvés:")
        for file in corrupted:
            print(f"  - {file}")
            # Proposer de supprimer le fichier
            # os.remove(file)
    else:
        print("✅ Aucun fichier corrompu trouvé.")