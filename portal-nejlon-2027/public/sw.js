/* NEJLON 2027: serviço de notificações sem armazenamento de páginas privadas */
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('push',event=>{
 let data={title:'NEJLON 2027',body:'Você recebeu uma atualização.',url:'/painel'};
 try{if(event.data)data={...data,...event.data.json()};}catch{}
 const path=typeof data.url==='string'&&data.url.startsWith('/')&&!data.url.startsWith('//')?data.url:'/painel';
 event.waitUntil(self.registration.showNotification(data.title,{
  body:data.body,icon:'/icon',badge:'/icon',tag:data.tag||undefined,
  data:{path},renotify:false
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL(event.notification.data?.path||'/painel',self.location.origin);
 if(url.origin!==self.location.origin)return;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  for(const client of clients){if(new URL(client.url).origin===url.origin){await client.navigate(url.href);return client.focus();}}
  return self.clients.openWindow(url.href);
 }));
});
