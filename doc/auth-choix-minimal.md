# Auth : choix d’implémentation minimal

On a mis en place une auth rapide avec **express-session** + **login via .env** (AUTH_USERNAME / AUTH_PASSWORD), sans inscription ni gestion d’utilisateurs multiples, par **manque de temps** et pour rester dans le périmètre phase 7.

Cette approche est **facilement évolutive** : on pourra plus tard remplacer le check .env par un vrai user store, ajouter l’inscription, et basculer sur JWT / OAuth sans tout réécrire — le middleware `requireAuth` et les routes login/logout restent le point d’entrée à adapter.
