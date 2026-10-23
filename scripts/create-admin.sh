#!/usr/bin/env bash
# Crée le premier administrateur sur la base de données de production (sans données de démonstration).
# Les valeurs sont demandées une à une et ne sont écrites dans aucun fichier.
set -e
cd "$(dirname "$0")/.."

echo "Création du premier administrateur de Genies Vote."
echo "(Ce que vous tapez n'est enregistré nulle part. Rien ne s'affiche pour les champs secrets.)"
echo
read -r -s -p "Adresse de la base de données (« External Database URL » de Render) : " DB; echo
read -r -p "E-mail de l'administrateur : " EMAIL
read -r -s -p "Mot de passe (8+ caractères, majuscule, minuscule, chiffre, symbole) : " PW; echo
read -r -s -p "Confirmez le mot de passe : " PW2; echo

[ "$PW" = "$PW2" ] || { echo "ERREUR : les deux mots de passe ne sont pas identiques."; exit 1; }
case "$DB" in
  postgres://*|postgresql://*) ;;
  *) echo "ERREUR : l'adresse doit commencer par postgresql://"; exit 1 ;;
esac

HOST=$(printf '%s' "$DB" | sed -E 's#^[a-z]+://[^@]+@([^/:?]+).*#\1#')
case "$HOST" in
  dpg-*)
    case "$HOST" in
      *.*) ;;
      *) echo "ERREUR : c'est l'adresse INTERNE de Render (elle ne marche que depuis Render)."
         echo "Dans Render : base de données > Connect > onglet « External » > copiez « External Database URL »."
         exit 1 ;;
    esac ;;
esac

# Les bases Render exigent une connexion chiffrée.
case "$HOST" in
  localhost|127.0.0.1) ;;
  *) case "$DB" in
       *sslmode=*) ;;
       *\?*) DB="$DB&sslmode=require" ;;
       *) DB="$DB?sslmode=require" ;;
     esac ;;
esac

echo
echo "Installation et compilation (1 à 2 minutes)..."
npm install --silent >/dev/null 2>&1
npm run build --workspace=backend >/dev/null
echo "Création du compte..."
NODE_ENV=production DATABASE_URL="$DB" ADMIN_EMAIL="$EMAIL" ADMIN_PASSWORD="$PW" npm run admin:create --workspace=backend 2>&1 | grep -vE "^(>|$|npm error|prisma:query)"
