"""
Middleware para capturar automaticamente ações de auditoria
"""
from django.utils.deprecation import MiddlewareMixin
from .audit_models import AuditLog
import json


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware que registra ações importantes automaticamente
    """
    
    AUDITABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    AUDITABLE_PATHS = [
        '/api/apiarios/',
        '/api/colmeias/',
        '/api/inspecoes/',
        '/api/producoes/',
        '/api/tratamentos/',
        '/api/custos/',
        '/api/receitas/',
        '/api/usuarios/',
    ]
    
    def process_response(self, request, response):
        # Só audita se usuário estiver autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # Só audita métodos específicos
        if request.method not in self.AUDITABLE_METHODS:
            return response
        
        # Só audita paths específicos
        if not any(request.path.startswith(path) for path in self.AUDITABLE_PATHS):
            return response
        
        # Só audita se a resposta for bem-sucedida
        if not (200 <= response.status_code < 300):
            return response
        
        try:
            # Determina a ação
            action_map = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE',
            }
            action = action_map.get(request.method, 'VIEW')
            
            # Extrai informações do path
            path_parts = request.path.strip('/').split('/')
            model_name = path_parts[1] if len(path_parts) > 1 else ''
            object_id = path_parts[2] if len(path_parts) > 2 else ''
            
            # Tenta obter dados da requisição
            changes = {}
            try:
                if request.body:
                    body_data = json.loads(request.body)
                    # Não loga senhas
                    if 'password' in body_data:
                        body_data['password'] = '***'
                    changes = {'data': body_data}
            except:
                pass
            
            # Cria log
            AuditLog.log_action(
                user=request.user,
                action=action,
                model_name=model_name,
                object_id=object_id,
                changes=changes,
                description=f"{action} via API: {request.path}",
                severity='MEDIUM' if action == 'DELETE' else 'LOW',
                ip_address=AuditLog.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
        
        except Exception as e:
            # Não queremos que erros de auditoria quebrem a aplicação
            print(f"Erro ao criar log de auditoria: {e}")
        
        return response
