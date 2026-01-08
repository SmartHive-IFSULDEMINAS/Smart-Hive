"""
Modelo e middleware para logs de auditoria
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

User = get_user_model()


class AuditLog(models.Model):
    """
    Modelo para registrar ações de auditoria no sistema
    """
    
    ACTION_CHOICES = [
        ('CREATE', 'Criar'),
        ('UPDATE', 'Atualizar'),
        ('DELETE', 'Deletar'),
        ('VIEW', 'Visualizar'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Exportar'),
        ('IMPORT', 'Importar'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Baixa'),
        ('MEDIUM', 'Média'),
        ('HIGH', 'Alta'),
        ('CRITICAL', 'Crítica'),
    ]
    
    # Informações da ação
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Usuário'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name='Ação'
    )
    model_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Nome do Model'
    )
    object_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='ID do Objeto'
    )
    object_repr = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Representação do Objeto'
    )
    
    # Detalhes da mudança
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Mudanças',
        help_text='JSON com valores antigos e novos'
    )
    
    # Informações adicionais
    description = models.TextField(
        blank=True,
        verbose_name='Descrição'
    )
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='LOW',
        verbose_name='Severidade'
    )
    
    # Informações de contexto
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='Endereço IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    
    # Timestamp
    timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        verbose_name='Data/Hora'
    )
    
    class Meta:
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        user_str = self.user.username if self.user else 'Anônimo'
        return f"{user_str} - {self.get_action_display()} - {self.model_name} - {self.timestamp}"
    
    @classmethod
    def log_action(cls, user, action, model_name='', object_id='', object_repr='',
                   changes=None, description='', severity='LOW', ip_address=None, user_agent=''):
        """
        Método auxiliar para criar log de auditoria
        """
        return cls.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else '',
            object_repr=object_repr,
            changes=changes or {},
            description=description,
            severity=severity,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def get_client_ip(request):
        """Obtém IP do cliente da requisição"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def get_changes_display(self):
        """Retorna mudanças formatadas para display"""
        if not self.changes:
            return ''
        
        lines = []
        for field, values in self.changes.items():
            old = values.get('old', '')
            new = values.get('new', '')
            lines.append(f"{field}: {old} → {new}")
        
        return '\n'.join(lines)
