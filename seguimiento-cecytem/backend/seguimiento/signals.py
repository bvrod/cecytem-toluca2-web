from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ComputadoraSala, RegistroAccesoSala
from .serializers import ComputadoraSalaSerializer, RegistroAccesoSalaSerializer


def enviar_evento_sala(payload: dict):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)('sala', {'type': 'sala.update', 'payload': payload})


@receiver(post_save, sender=ComputadoraSala)
def computadora_guardada(sender, instance, created, **kwargs):
    data = ComputadoraSalaSerializer(instance).data
    action = 'create' if created else 'update'
    enviar_evento_sala({'action': action, 'computadora': data})


@receiver(post_delete, sender=ComputadoraSala)
def computadora_eliminada(sender, instance, **kwargs):
    enviar_evento_sala({'action': 'delete', 'computadora': {'id': instance.id}})


@receiver(post_save, sender=RegistroAccesoSala)
def registro_guardado(sender, instance, created, **kwargs):
    if not created:
        return
    data = RegistroAccesoSalaSerializer(instance).data
    enviar_evento_sala({'action': 'registro_create', 'registro': data})
