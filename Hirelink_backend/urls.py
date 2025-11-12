from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def home(request):
    return HttpResponse("""
        <html>
        <head>
            <title>HireLink Backend</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { color: #333; }
                .container { max-width: 800px; margin: 0 auto; }
                .endpoints { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
                code { background: #eee; padding: 2px 5px; border-radius: 3px; }
                .btn { display: inline-block; padding: 10px 20px; margin: 5px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                .btn:hover { background: #0056b3; }
                pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 HireLink Backend</h1>
                <p>Le serveur fonctionne correctement !</p>
                
                <div class="endpoints">
                    <h3>📋 Endpoints disponibles :</h3>
                    <p><strong>Authentication :</strong></p>
                    <ul>
                        <li><code>POST /api/users/register/</code> - Inscription</li>
                        <li><code>POST /api/users/login/</code> - Connexion</li>
                        <li><code>GET /api/users/profile/</code> - Profil utilisateur</li>
                    </ul>
                    
                    <p><strong>Admin :</strong></p>
                    <ul>
                        <li><code>GET /admin/</code> - Interface d'administration</li>
                    </ul>
                </div>
                
                <h3>🔗 Liens rapides :</h3>
                <a href="/admin/" class="btn">🔑 Admin Django</a>
                <a href="/api/users/register/" class="btn">📝 S'inscrire</a>
                <a href="/api/users/login/" class="btn">🔐 Se connecter</a>
                <a href="/api/users/profile/" class="btn">👤 Profil</a>
                
                <h3>🛠️ Test API :</h3>
                <p>Utilisez Postman ou curl pour tester les endpoints :</p>
                <pre><code># Inscription
curl -X POST http://127.0.0.1:8000/api/users/register/ \\
  -H "Content-Type: application/json" \\
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123", "password2": "password123", "role": "candidate", "full_name": "Test User"}'

# Connexion
curl -X POST http://127.0.0.1:8000/api/users/login/ \\
  -H "Content-Type: application/json" \\
  -d '{"username": "testuser", "password": "password123"}'

# Profil (après login)
curl -X GET http://127.0.0.1:8000/api/users/profile/ \\
  -H "Authorization: Token votre_token_ici"
</code></pre>
            </div>
        </body>
        </html>
    """)

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)