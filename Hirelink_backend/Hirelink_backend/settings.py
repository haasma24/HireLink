"""
Django settings for Hirelink_backend project.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv 

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')



SECRET_KEY = 'django-insecure-rvt_jxcn)xd5(sj5%i*4($_ye=fs$-8dqtg4qxyp1_&^ib5@v)'

DEBUG = True

ALLOWED_HOSTS = ['*']  # Allow all for development

INSTALLED_APPS = [
    'jobs', 
    'users',
    'django_filters',
    'rest_framework',
    'rest_framework_simplejwt',  # ADD THIS


    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt.token_blacklist',
    'applications',
    'ai_resume'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be high
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',  # KEEP COMMENTED OUT
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Hirelink_backend.urls'

# Add this to TEMPLATES if not present
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            # Make sure media path is accessible
            os.path.join(BASE_DIR, 'media'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                # Make sure these are included:
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Hirelink_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'hirelink_db',
        'USER': 'root',           
        'PASSWORD': 'root',    
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4'
        },
    }
}



AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True



STATIC_URL = 'static/'
# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============ CORS SETTINGS ============
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins for development
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "http://localhost:3001",  # Remix dev server
    "http://127.0.0.1:3001",
    "http://localhost:8000",  # Add this for media files

      
]

CORS_ALLOW_CREDENTIALS = True
AUTH_USER_MODEL = 'users.CustomUser'

AUTH_USER_MODEL = 'users.CustomUser'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'hammamiasma52@gmail.com'
EMAIL_HOST_PASSWORD = 'qwwe cnix jbsy jlka'
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = 'HireLink <hammamiasma52@gmail.com>'

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

FRONTEND_URL = "http://localhost:3000"
