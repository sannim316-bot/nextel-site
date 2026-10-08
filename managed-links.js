(() => {
  const endpoint='https://app-link-manager.vercel.app/api/settings?app=jovia';
  const cacheKey='managed-links:jovia:v1';
  const valid = links => {
    if(!links || typeof links!=='object')throw Error('Invalid links');
    const values={};
    for(const key of ['telegram','whatsapp','website','email','phone']){
      if(typeof links[key]!=='string'||links[key].length>1000)throw Error('Invalid field');
      const value=links[key].trim();
      if(['telegram','whatsapp','website'].includes(key)&&value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid URL');}
      if(key==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw Error('Invalid email');
      if(key==='phone'&&value&&!/^[+\d ()-]{3,40}$/.test(value))throw Error('Invalid phone');
      values[key]=value;
    }
    return values;
  };
  function apply(links){
    document.querySelectorAll('[data-managed-link]').forEach(anchor=>{
      const key=anchor.dataset.managedLink,value=links[key];
      // Blank optional settings keep this website's original destination.
      if(!value){anchor.setAttribute('href',anchor.dataset.originalHref);return;}
      anchor.setAttribute('href',key==='email'?'mailto:'+value:key==='phone'?'tel:'+value.replace(/[ ()-]/g,''):value);
    });
    document.querySelectorAll('[data-managed-phone]').forEach(node=>{node.textContent=links.phone||node.dataset.originalText;});
  }
  document.querySelectorAll('[data-managed-link]').forEach(node=>{node.dataset.originalHref=node.getAttribute('href');});
  document.querySelectorAll('[data-managed-phone]').forEach(node=>{node.dataset.originalText=node.textContent;});
  try{const saved=JSON.parse(localStorage.getItem(cacheKey));if(saved?.app_id==='jovia')apply(valid(saved.links));}catch{}
  let busy=false;
  async function refresh(){
    if(busy||document.hidden)return;
    busy=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(endpoint,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('Unavailable');
      const record=await response.json();if(record.app_id!=='jovia')throw Error('Wrong app');
      const links=valid(record.links);apply(links);
      try{localStorage.setItem(cacheKey,JSON.stringify({app_id:'jovia',links}));}catch{}
    }catch{/* Keep the last working links when offline. */}finally{clearTimeout(timeout);busy=false;}
  }
  refresh();setInterval(refresh,30000);
  window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
})();
