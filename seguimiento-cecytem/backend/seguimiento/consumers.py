from channels.generic.websocket import AsyncWebsocketConsumer
import json


class SalaConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('sala', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('sala', self.channel_name)

    async def sala_update(self, event):
        # event['payload'] expected to be JSON-serializable
        payload = event.get('payload', {})
        await self.send(text_data=json.dumps(payload))
