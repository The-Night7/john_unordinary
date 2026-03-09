import csv
import json

capacites = []

# Ouvre ton fichier CSV
with open('scripts/unodex - unodex.csv', mode='r', encoding='utf-8') as fichier_csv:
    lecteur = csv.DictReader(fichier_csv)
    
    id_counter = 1
    for ligne in lecteur:
        try:
            # On ignore ceux sans pouvoir
            if ligne['Ability'] == 'Aucune' or ligne['Ability'] == '':
                continue
                
            # Les stats de base extraites
            stats = {
                "power": float(ligne['Power'].replace(',', '.')),
                "speed": float(ligne['Speed'].replace(',', '.')),
                "trick": float(ligne['Trick'].replace(',', '.')),
                "recovery": float(ligne['Recovery'].replace(',', '.')),
                "defense": float(ligne['Defense'].replace(',', '.'))
            }
            
            niveau = float(ligne['Level'].replace(',', '.'))
            nature = ligne.get('Nature', '').strip()
            type_capacite = ligne.get('Type', '').strip() # <-- NOUVEAU : Récupération du Type
            
            # Identifier la stat principale (hors trick)
            stats_sans_trick = {k: v for k, v in stats.items() if k != 'trick'}
            valeur_max = max(stats_sans_trick.values())
            
            # Trouver toutes les stats qui ont cette valeur maximale
            candidats = [k for k, v in stats_sans_trick.items() if v == valeur_max]
            
            # Par défaut on prend la première stat max trouvée
            stat_principale = candidats[0]
            
            # S'il y a égalité sur la stat la plus haute, on utilise la Nature pour départager
            if len(candidats) > 1:
                correspondances_nature = {
                    'Attaque': 'power',
                    'Defense': 'defense',
                    'Support': 'recovery',
                    'Vivacité': 'speed'
                }
                stat_liee_nature = correspondances_nature.get(nature)
                # Si la stat correspondant à la nature fait partie des stats max, elle devient la principale
                if stat_liee_nature in candidats:
                    stat_principale = stat_liee_nature
            
            # Calcul des rapports stats/niveau pour réadapter la stat plus tard
            ratios = {}
            for cle, valeur in stats.items():
                ratios[cle] = valeur / niveau if niveau > 0 else 0
            
            # Déterminer si la capacité est copiable (les capacités mentales et meta ne le sont pas)
            type_lower = type_capacite.lower()
            est_copiable = type_lower not in ['mental', 'meta']
            
            capacites.append({
                "id": id_counter,
                "nom_personnage": ligne['Name'],
                "nom_capacite": ligne['Ability'],
                "niveau": niveau,
                "tier": ligne.get('Tier', ''),
                "nature": nature,
                "type": type_capacite, 
                "copiable": est_copiable,
                "stat_principale": stat_principale,
                "stats_de_base": stats,
                "ratios_stats": ratios
            })
            id_counter += 1
        except ValueError:
            continue

# Sauvegarde en JSON
with open('./src/capacites.json', 'w', encoding='utf-8') as f:
    json.dump(capacites, f, indent=4, ensure_ascii=False)

print(f"Génération terminée : {len(capacites)} capacités exportées.")