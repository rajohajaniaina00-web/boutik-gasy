# Boutik Gasy — E-commerce Web Application

**Boutik Gasy** est une application web de commerce électronique développée avec Django REST Framework et React. Elle permet aux utilisateurs de consulter un catalogue de produits, d'effectuer des recherches, de gérer leur panier et de créer des commandes.

Le projet a pour objectif de mettre en pratique le développement full-stack, la conception d'une API REST et l'intégration entre un backend et un frontend moderne.

## Table of Contents

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Endpoints de l'API](#endpoints-de-lapi)
- [Compétences techniques](#compétences-techniques)
- [Améliorations prévues](#améliorations-prévues)
- [Auteur](#auteur)

## Présentation

Boutik Gasy est une application e-commerce organisée en deux parties indépendantes :

- **Backend :** API REST développée avec Django et Django REST Framework.
- **Frontend :** interface utilisateur développée avec React et Vite.

Cette architecture facilite la séparation des responsabilités et l'évolution indépendante des deux parties de l'application.

## Fonctionnalités

- Consultation du catalogue de produits.
- Navigation par catégories.
- Recherche de produits.
- Affichage des images des produits.
- Inscription et authentification des utilisateurs.
- Gestion du panier.
- Création de commandes.
- Échange de données entre le frontend et le backend via une API REST.

## Technologies

| Domaine | Technologies |
|---|---|
| Langage backend | Python |
| Framework backend | Django |
| API | Django REST Framework |
| Interface utilisateur | React |
| Langage frontend | JavaScript |
| Outil de développement frontend | Vite |
| Base de données locale | SQLite |
| Versionnement | Git et GitHub |

## Architecture du projet

```text
boutik-gasy/
├── backend/
│   ├── accounts/
│   ├── products/
│   ├── orders/
│   ├── config/
│   └── manage.py
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## Installation

### Prérequis

- Python 3.13 ou une version compatible avec les dépendances du projet.
- Node.js et npm.
- Git.

### 1. Cloner le dépôt

```bash
git clone https://github.com/rajohajaniaina00-web/boutik-gasy.git
cd boutik-gasy
```

### 2. Installer et configurer le backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Le backend sera disponible à l'adresse suivante :

`http://127.0.0.1:8000/`

L'API est accessible sous le préfixe `/api/`.

### 3. Installer et lancer le frontend

Dans un deuxième terminal, depuis le dossier racine du projet :

```bash
cd frontend
npm install
npm run dev
```

L'interface sera généralement accessible à l'adresse :

`http://localhost:5173/`

Les deux serveurs doivent rester actifs pendant le développement local.

## Endpoints de l'API

| Méthode HTTP | Endpoint | Description |
|---|---|---|
| GET | `/api/products/` | Récupérer la liste des produits |
| GET | `/api/categories/` | Récupérer les catégories |
| POST | `/api/auth/register/` | Créer un compte utilisateur |
| POST | `/api/auth/login/` | Authentifier un utilisateur |
| POST | `/api/auth/logout/` | Déconnecter un utilisateur |
| GET | `/api/auth/profile/` | Récupérer le profil utilisateur |
| POST | `/api/orders/` | Créer une commande |

## Compétences techniques

Ce projet permet de mettre en pratique les compétences suivantes :

- Développement d'une API REST avec Django REST Framework.
- Création d'interfaces web avec React.
- Intégration d'un frontend avec un backend.
- Gestion de l'authentification des utilisateurs.
- Modélisation des données et interactions avec une base de données relationnelle.
- Gestion d'un panier et traitement des commandes.
- Organisation d'un projet full-stack.
- Utilisation de Git et
