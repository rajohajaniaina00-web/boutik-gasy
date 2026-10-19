
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Sécurité
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-local-development-only-change-me"
)

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Applications
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",

    "products",
    "accounts",
    "orders",
]

# Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Base de données locale
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Validation des mots de passe
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]

# Langue et fuseau horaire
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Indian/Antananarivo"
USE_I18N = True
USE_TZ = True

# Fichiers statiques
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Images et fichiers téléversés
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Clé primaire par défaut
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}

# CORS : autoriser le frontend React en développement local
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
