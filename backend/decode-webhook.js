const webhookData = 'eyJhY2NvdW50X2lkIjoiYWNjX1JWQ1d6VmI0QmlFQW9TIiwiY29udGFpbnMiOlsicGF5bWVudC5kb3dudGltZSJdLCJjcmVhdGVkX2F0IjoxNzYxMjI2OTI1LCJlbnRpdHkiOiJldmVudCIsImV2ZW50IjoicGF5bWVudC5kb3dudGltZS5zdGFydGVkIiwicGF5bG9hZCI6eyJwYXltZW50LmRvd250aW1lIjp7ImVudGl0eSI6eyJiZWdpbiI6MTc2MTIyNjkyNSwiY3JlYXRlZF9hdCI6MTc2MTIyNjkyNSwiZW5kIjpudWxsLCJlbnRpdHkiOiJwYXltZW50LmRvd250aW1lIiwiaWQiOiJSV3dPdXR5REpzVENqOTAiLCJpbnN0cnVtZW50Ijp7InZwYV9oYW5kbGUiOiJwdHllcyJ9LCJpbnN0cnVtZW50X3NjaGVtYSI6WyJ2cGFfaGFuZGxlIl0sIm1ldGhvZCI6InVwaSIsInNjaGVkdWxlZCI6ZmFsc2UsInNldmVyaXR5IjoiSElHSCIsInN0YXR1cyI6InN0YXJ0ZWQiLCJ1cGRhdGVkX2F0IjoxNzYxMjI2OTI1fX19fQ==';

try {
  const decoded = Buffer.from(webhookData, 'base64').toString('utf8');
  const parsed = JSON.parse(decoded);

  console.log('🔍 Latest Webhook Event Details:');
  console.log('📅 Event:', parsed.event);
  console.log('⏰ Created At:', new Date(parsed.created_at * 1000).toLocaleString());
  console.log('🔧 Entity:', parsed.entity);
  console.log('📊 Payload Summary:', JSON.stringify({
    downtimeId: parsed.payload?.payment?.downtime?.entity?.id,
    status: parsed.payload?.payment?.downtime?.entity?.status,
    begin: parsed.payload?.payment?.downtime?.entity?.begin ? new Date(parsed.payload?.payment?.downtime?.entity?.begin * 1000).toLocaleString() : null,
    end: parsed.payload?.payment?.downtime?.entity?.end ? new Date(parsed.payload?.payment?.downtime?.entity?.end * 1000).toLocaleString() : null
  }, null, 2));

} catch (error) {
  console.error('❌ Error decoding webhook:', error.message);
}
