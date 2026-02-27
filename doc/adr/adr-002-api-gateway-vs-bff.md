# ADR: API Gateway vs BFF

- Statut: Proposé
- Date: 2026-02-26
- Décideurs: Tristan, Jeremy, Paul

## Contexte

Dans la refonte, nous voulons:
- Découpler le frontend des services internes.
- Centraliser les préoccupations transverses (auth, logs, limites de débit).
- Simplifier l’intégration côté frontend (moins d’appels, contrats stables).
Nous devons choisir entre un **API Gateway**, un **BFF**, ou les deux.

## Options

### A. API Gateway seul

- **Avantages**: point d’entrée unique, auth, rate limiting, observabilité, routage.
- **Inconvénients**: difficile de faire des réponses sur mesure pour chaque frontend, risque de logique métier dans le gateway.

### B. BFF seul

- **Avantages**: API adaptée à chaque frontend, agrégation des appels, meilleure DX frontend.
- **Inconvénients**: pas de point unique pour les concerns transverses, duplication potentielle entre BFF.

## Décision

Nous retenons **l’option A: API Gateway seul**:

- Un **API Gateway** comme point d’entrée unique:
  - Gère l’authentification/autorisation
  - Centralise logs, metrics et traçabilité.
  - Route les requêtes vers les services backend.

## Conséquences

### Positives

- Point d’entrée unique pour tous les clients.
- Centralisation claire des concerns transverses (auth, rate limiting, observabilité, routage).
- Alignement naturel avec l’infra (ingress, reverse proxy, API management).
- Simplicité d’architecture côté backend (les services restent focalisés sur le métier).

### Négatives

- Plus difficile d’adapter finement les réponses à chaque frontend.
- Risque de dérive si on commence à mettre de la logique métier dans le gateway.
- Les frontends peuvent devoir orchestrer plusieurs appels et gérer des formats de données plus “bruts”.

## Actions de suivi

- Définir précisément:
  - Rôle de l’API Gateway.
  - Rôle des services métier.
- Choisir la technologie d’API Gateway (ou configuration d’ingress/API management) et la standardiser.
- Mettre à jour les schémas d’architecture dans la documentation.
