
const BASE_PRODUCTS = [
 ["Colombiana","kanja",60,150],["Tropicana Cherry","kanja",60,150],["Super Boof","kanja",60,150],["Miami","kanja",60,150],["Runtz Layer Cake","kanja",60,150],["Black Berry Oreoz","kanja",60,150],["Vanila Frosting","kanja",60,150],["Black Cherry Punch","kanja",60,150],["Night Move","kanja",60,150],["Mimosa","kanja",60,150],["King Juice","kanja",60,150],["Mochi","kanja",60,150],["Strawberry Apple","kanja",60,150],["Super Lemon Haze","kanja",60,150],["Permanent Marker","kanja",60,150],["Tropicana Cookies","kanja",60,150],["Cali Mousse 1g","kanja",350,550],
 ["Colombiana 5g","5g",300,600],["Tropicana Cherry 5g","5g",300,600],["Runtz Layer Cake 5g","5g",300,600],["Black Berry Oreoz 5g","5g",300,600],["Rose Gold Pave 5g","5g",300,600],["Super Boof 5g","5g",300,600],["Vanila Frosting 5g","5g",300,600],["Black Cherry Punch 5g","5g",300,600],["Night Move 5g","5g",300,600],["Miami 5g","5g",300,600],["Mimosa 5g","5g",300,600],["King Juice 5g","5g",300,600],["Mochi 5g","5g",300,600],["Strawberry Apple 5g","5g",300,600],["Super Lemon Haze 5g","5g",300,600],["Permanent Marker 5g","5g",300,600],["Tropicana Cookies 5g","5g",300,600],
 ["Colombiana Pre-Roll","preroll",75,150],["Tropicana Cherry Pre-Roll","preroll",75,150],["Super Boof Pre-Roll","preroll",75,150],["Runtz Layer Cake Pre-Roll","preroll",75,150],["Black Berry Oreoz Pre-Roll","preroll",75,150],["Vanila Frosting Pre-Roll","preroll",75,150],["Black Cherry Punch Pre-Roll","preroll",75,150],["Night Move Pre-Roll","preroll",75,150],["Miami Pre-Roll","preroll",75,150],["Mimosa Pre-Roll","preroll",75,150],["King Juice Pre-Roll","preroll",75,150],["Mochi Pre-Roll","preroll",75,150],["Strawberry Apple Pre-Roll","preroll",75,150],["Super Lemon Haze Pre-Roll","preroll",75,150],["Permanent Marker Pre-Roll","preroll",75,150],["Tropicana Cookies Pre-Roll","preroll",75,150],
 ["Gummy 4 Leaf","edible",100,200],
 ["King's Tars 1g","kanja",60,150],["King's Tars Pre-Roll","preroll",75,150],["Rose Gold Pave 1g","kanja",60,150]
].map((p,i)=>({id:"P"+String(i+1).padStart(3,"0"),name:p[0],type:p[1],cost:p[2],retail:p[3]}));

const LAMAI_NAMES = new Set(["Tropicana Cookies","Rose Gold Pave 1g","Black Cherry Punch","Black Berry Oreoz","Super Boof","Permanent Marker","Strawberry Apple","Miami","King Juice","Night Move","Mochi","King's Tars 1g","Super Lemon Haze",
"Colombiana Pre-Roll","Runtz Layer Cake Pre-Roll","Super Boof Pre-Roll","Strawberry Apple Pre-Roll","Miami Pre-Roll","King Juice Pre-Roll","Night Move Pre-Roll","Mochi Pre-Roll","Black Cherry Punch Pre-Roll","Black Berry Oreoz Pre-Roll","Tropicana Cherry Pre-Roll","King's Tars Pre-Roll","Super Lemon Haze Pre-Roll","Tropicana Cookies Pre-Roll","Permanent Marker Pre-Roll"]);

const db = JSON.parse(localStorage.getItem("mdpin-db")||"null") || {products:BASE_PRODUCTS,deliveries:[],weeks:[],stock:{"BM Bangrak":{},"Lamai":{}}};
if(!Array.isArray(db.docketAudit)) db.docketAudit=[];
if(!Array.isArray(db.invoices)) db.invoices=[];
if(!Array.isArray(db.adjustments)) db.adjustments=[];
function save(){localStorage.setItem("mdpin-db",JSON.stringify(db));renderAll()}
function baht(n){return "฿"+Number(n||0).toLocaleString("en-US",{maximumFractionDigits:2})}
function today(){return new Date().toISOString().slice(0,10)}
document.getElementById("delDate").value=today();document.getElementById("weekDate").value=today();document.getElementById("impDate").value=today();

function correctedCanonicalProductName(name){
  let n=cleanProductDisplayName(String(name||""));
  // Known legacy catalogue typos. These are deterministic corrections, not fuzzy guesses.
  n=n.replace(/\bPermanent\s+Maker\b/gi,"Permanent Marker");
  n=n.replace(/\bRuntz\s+Layer\s+(?:Cane|Cank)\b/gi,"Runtz Layer Cake");
  n=n.replace(/\bSuper\s+Haze\s+Lemon\b/gi,"Super Lemon Haze");
  n=n.replace(/\bPre[\s-]?oll\b/gi,"Pre-Roll");
  // Confirmed legacy shop spelling: keep every size/form variant on the same canonical product family.
  n=n.replace(/\bColumbiana\b/gi,"Colombiana");
  n=cleanProductDisplayName(n);
  // Most standard flower products are stored without a redundant 1g suffix.
  // Strip it only when an exact standard-flower base product exists, never by fuzzy similarity.
  if(/\s+1\s*g\.?$/i.test(n) && typeof normalizeProductKey==="function") {
    const without=n.replace(/\s+1\s*g\.?$/i,"").trim();
    if(BASE_PRODUCTS.some(p=>p.type==="kanja" && normalizeProductKey(p.name)===normalizeProductKey(without)))n=without;
  }
  return cleanProductDisplayName(n);
}
function migrateKnownCanonicalDuplicates(){
  ensureProductAliases();
  const products=(db.products||[]).filter(Boolean);
  const groups=new Map();
  products.forEach(p=>{
    if(!p?.id||!p?.name)return;
    const corrected=correctedCanonicalProductName(p.name);
    const key=normalizeProductKey(corrected);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({p,corrected,wasCorrect:normalizeProductKey(p.name)===key && p.name===corrected});
  });
  let changed=false;
  groups.forEach(items=>{
    // Prefer an already-correctly named record; otherwise keep the oldest record so saved references stay stable.
    let chosen=items.find(x=>x.wasCorrect)?.p || items[0].p;
    const canonicalName=items[0].corrected;
    if(chosen.name!==canonicalName){
      db.productAliases[normalizeProductKey(chosen.name)]=chosen.id;
      chosen.name=canonicalName;changed=true;
    }
    items.forEach(({p})=>{
      if(p.id===chosen.id)return;
      // Preserve usable catalogue metadata before merging the duplicate identity.
      if(!(Number(chosen.cost)>0) && Number(p.cost)>0)chosen.cost=Number(p.cost);
      if(!(Number(chosen.retail)>0) && Number(p.retail)>0)chosen.retail=Number(p.retail);
      if((!chosen.type||chosen.type==="kanja") && p.type)chosen.type=p.type;
      db.productAliases[normalizeProductKey(p.name)]=chosen.id;
      reassignProductReferences(p.id,chosen.id);
      changed=true;
    });
    // Both the canonical spelling and every known legacy spelling resolve to one identity.
    db.productAliases[normalizeProductKey(canonicalName)]=chosen.id;
  });
  if(changed){
    const keep=new Set();
    const out=[];
    (db.products||[]).forEach(p=>{
      if(!p?.id)return;
      const corrected=correctedCanonicalProductName(p.name),key=normalizeProductKey(corrected);
      const targetId=db.productAliases[key]||p.id;
      if(p.id!==targetId)return;
      if(keep.has(p.id))return;
      keep.add(p.id);out.push(p);
    });
    db.products=out;
    localStorage.setItem("mdpin-db",JSON.stringify(db));
  }
  return changed;
}

function ensureKnownCatalogueAdditions(){
  ensureProductAliases();
  const additions=["King's Tars 1g","King's Tars Pre-Roll","Rose Gold Pave 1g"];
  let added=0;
  additions.forEach(name=>{
    const key=normalizeProductKey(correctedCanonicalProductName(name));
    const aliasedId=db.productAliases[key];
    if(aliasedId && (db.products||[]).some(p=>p.id===aliasedId))return;
    const existing=(db.products||[]).find(p=>normalizeProductKey(correctedCanonicalProductName(p.name))===key);
    if(existing){db.productAliases[key]=existing.id;return;}
    const ref=BASE_PRODUCTS.find(p=>normalizeProductKey(p.name)===key);
    if(!ref)return;
    let id=ref.id;
    if((db.products||[]).some(p=>p.id===id))id="P"+Date.now()+Math.random().toString(36).slice(2,7);
    db.products.push({...ref,id});db.productAliases[key]=id;added++;
  });
  if(added)localStorage.setItem("mdpin-db",JSON.stringify(db));
  return added;
}




/* Shared mobile keyboard rule — v0.10.8 DEV
   IMPORTANT ARCHITECTURE RULE:
   Magic Dragon pages live inside their own scrollable .section.active container.
   Never use browser-level scrollIntoView() as the primary mobile keyboard fix.
   Instead, move the actual app scroll owner so the focused field sits inside the
   visualViewport-safe area above the iPhone keyboard. */
let keyboardSafeActiveField=null;
let keyboardSafeTimerIds=[];

function clearKeyboardSafeTimers(){
  keyboardSafeTimerIds.forEach(id=>clearTimeout(id));
  keyboardSafeTimerIds=[];
}

function keyboardSafeScrollOwner(el){
  if(!el)return null;

  // Primary Magic Dragon shell: active sections own scrolling.
  const section=el.closest(".section.active");
  if(section)return section;

  // Reusable fallback for future modular screens.
  let node=el.parentElement;
  while(node && node!==document.body){
    const style=getComputedStyle(node);
    const oy=style.overflowY;
    if((oy==="auto"||oy==="scroll") && node.scrollHeight>node.clientHeight+2)return node;
    node=node.parentElement;
  }
  return null;
}

function keyboardSafeBounds(owner){
  const vv=window.visualViewport;
  const ownerRect=owner?.getBoundingClientRect?.() || {top:0,bottom:window.innerHeight||0,height:window.innerHeight||0};
  const viewportTop=vv ? vv.offsetTop : 0;
  const viewportBottom=vv ? vv.offsetTop+vv.height : (window.innerHeight||0);

  // Intersection between app scroll area and what Safari says is actually visible.
  const top=Math.max(ownerRect.top,viewportTop)+14;
  const bottom=Math.min(ownerRect.bottom,viewportBottom)-42;
  return {top,bottom,height:Math.max(0,bottom-top)};
}

function ensureFieldVisibleAboveKeyboard(el,forceCenter=false){
  if(!el || !document.body.contains(el))return;

  // Delivery editor owns its own specialised quantity keyboard positioning.
  if(document.body.classList.contains("deliveryEditMode") && el.closest("#deliveryEditLines"))return;

  const owner=keyboardSafeScrollOwner(el);
  if(!owner)return;

  const bounds=keyboardSafeBounds(owner);
  if(bounds.height<80)return;

  const rect=el.getBoundingClientRect();
  const hiddenAbove=rect.top<bounds.top;
  const hiddenBelow=rect.bottom>bounds.bottom;

  if(forceCenter || hiddenAbove || hiddenBelow){
    // Aim slightly above centre so the field and the row context remain visible.
    const targetTop=bounds.top + Math.max(18,(bounds.height-rect.height)*0.34);
    const delta=rect.top-targetTop;

    if(Math.abs(delta)>2){
      owner.scrollTop += delta;
    }

    // Safari can perform another native focus adjustment after ours.
    requestAnimationFrame(()=>{
      if(!document.body.contains(el))return;
      const b=keyboardSafeBounds(owner);
      const r=el.getBoundingClientRect();

      if(r.top<b.top) owner.scrollTop -= (b.top-r.top)+8;
      else if(r.bottom>b.bottom) owner.scrollTop += (r.bottom-b.bottom)+8;
    });
  }
}

window.mobileKeyboardSafeFocus=(el)=>{
  keyboardSafeActiveField=el;
  el?.classList.add("keyboardSafeTarget","keyboardSafeActive");
  clearKeyboardSafeTimers();

  // iOS keyboard animation is multi-stage. Recalculate against the actual
  // app scroll owner several times, including after Safari's own correction.
  [30,90,170,280,420].forEach((delay,idx)=>{
    keyboardSafeTimerIds.push(setTimeout(()=>{
      ensureFieldVisibleAboveKeyboard(el,idx===2||idx===3);
    },delay));
  });
};

window.mobileKeyboardSafeBlur=(el)=>{
  setTimeout(()=>{
    el?.classList.remove("keyboardSafeActive");
    if(document.activeElement!==el && keyboardSafeActiveField===el)keyboardSafeActiveField=null;
  },120);
};

if(window.visualViewport){
  window.visualViewport.addEventListener("resize",()=>{
    if(keyboardSafeActiveField)ensureFieldVisibleAboveKeyboard(keyboardSafeActiveField,true);
  },{passive:true});
  window.visualViewport.addEventListener("scroll",()=>{
    if(keyboardSafeActiveField)ensureFieldVisibleAboveKeyboard(keyboardSafeActiveField);
  },{passive:true});
}

/* General opt-in:
   - catalogue barcode fields
   - Add Product barcode fields
   - any future input carrying class keyboardSafeInput */
document.addEventListener("focusin",e=>{
  const el=e.target;
  if(!(el instanceof HTMLElement))return;
  if(
    el.matches(".catalogueBarcodeField input") ||
    el.matches(".variantBarcodeRow input") ||
    el.classList.contains("keyboardSafeInput")
  ){
    mobileKeyboardSafeFocus(el);
  }
});

document.addEventListener("focusout",e=>{
  const el=e.target;
  if(!(el instanceof HTMLElement))return;
  if(
    el.matches(".catalogueBarcodeField input") ||
    el.matches(".variantBarcodeRow input") ||
    el.classList.contains("keyboardSafeInput")
  ){
    mobileKeyboardSafeBlur(el);
  }
});

let catalogueMissingBarcodesOnly=false;
function normalizeBarcode(v){return String(v||"").trim()}
function barcodeOwner(barcode,excludeId=""){
  const key=normalizeBarcode(barcode);
  if(!key)return null;
  return (db.products||[]).find(p=>p.id!==excludeId && normalizeBarcode(p.barcode)===key) || null;
}
function saveProductBarcode(id,value){
  const p=(db.products||[]).find(x=>x.id===id);
  if(!p)return false;
  const barcode=normalizeBarcode(value);
  if(barcode){
    const existing=barcodeOwner(barcode,id);
    if(existing){
      alert(`Barcode ${barcode} is already assigned to ${productParentName(existing)} · ${productVariantLabel(existing)}.`);
      renderCatalogue();
      return false;
    }
  }
  if(barcode)p.barcode=barcode; else delete p.barcode;
  save(); renderCatalogue(); renderPinDashboard(); return true;
}
window.saveProductBarcode=saveProductBarcode;
function activeVariantsMissingBarcode(){
  return (db.products||[]).filter(p=>!isProductArchived(p)&&!normalizeBarcode(p.barcode));
}
window.openMissingBarcodes=()=>{
  catalogueMissingBarcodesOnly=true; showArchivedCatalogue=false;
  switchTab("settings");
  const cat=document.getElementById("catalogueDetails"); if(cat)cat.open=true;
  renderCatalogue();
  requestAnimationFrame(()=>document.getElementById("catalogueArchiveStatus")?.scrollIntoView({behavior:"smooth",block:"start"}));
};
window.clearMissingBarcodeFilter=()=>{catalogueMissingBarcodesOnly=false;renderCatalogue();};

let showArchivedCatalogue=false;
function isProductArchived(p){return !!p?.archivedAt}
function activeCatalogueProducts(){return (db.products||[]).filter(p=>!isProductArchived(p))}
window.toggleArchivedCatalogue=()=>{
  showArchivedCatalogue=!showArchivedCatalogue;
  renderCatalogue();
};
window.archiveProductVariant=(id)=>{
  const p=(db.products||[]).find(x=>x.id===id);
  if(!p||isProductArchived(p))return;
  const label=`${productParentName(p)} · ${productVariantLabel(p)}`;
  if(!confirm(`Archive ${label}?\n\nIt will disappear from new delivery selections but remain in all historical records.`))return;
  p.archivedAt=new Date().toISOString();
  save();
  fillProducts();
  renderCatalogue();
};
window.restoreProductVariant=(id)=>{
  const p=(db.products||[]).find(x=>x.id===id);
  if(!p)return;
  delete p.archivedAt;
  save();
  fillProducts();
  renderCatalogue();
};
window.archiveProductFamily=(parentKey)=>{
  const family=(db.products||[]).filter(p=>normalizeProductKey(productParentName(p))===parentKey && !isProductArchived(p));
  if(!family.length)return;
  const parent=productParentName(family[0]);
  if(!confirm(`Archive all active variants of ${parent}?\n\nHistorical dockets, Sunday reports, invoices and audit data will remain untouched.`))return;
  const ts=new Date().toISOString();
  family.forEach(p=>p.archivedAt=ts);
  save();
  fillProducts();
  renderCatalogue();
};
window.restoreProductFamily=(parentKey)=>{
  const family=(db.products||[]).filter(p=>normalizeProductKey(productParentName(p))===parentKey && isProductArchived(p));
  if(!family.length)return;
  family.forEach(p=>delete p.archivedAt);
  save();
  fillProducts();
  renderCatalogue();
};

function canonicalDeliveryProducts(){
  ensureProductAliases();
  const aliasTargets=db.productAliases||{};
  const seenIds=new Set(), seenNames=new Set(), out=[];
  (db.products||[]).forEach(p=>{
    if(!p||!p.id||!p.name||isProductArchived(p))return;
    const key=normalizeProductKey(correctedCanonicalProductName(p.name));
    // If this visible name is now an alias for a different master product, never offer
    // the obsolete/duplicate product record on a delivery docket.
    const mappedId=aliasTargets[key];
    if(mappedId && mappedId!==p.id)return;
    if(seenIds.has(p.id)||seenNames.has(key))return;
    seenIds.add(p.id);seenNames.add(key);
    // Defensive display layer: delivery entry always shows the corrected canonical spelling.
    const canonicalName=correctedCanonicalProductName(p.name);
    out.push(canonicalName===p.name?p:{...p,name:canonicalName});
  });
  return out;
}
function branchProducts(branch){
  const products=canonicalDeliveryProducts();
  if(branch==="BM Bangrak") return products;
  return products.filter(p => {
    const n=p.name.toLowerCase();
    return !p.name.includes("5g") && p.name!=="Gummy 4 Leaf" && p.name!=="Cali Mousse 1g";
  });
}
let currentDelivery=[];
let editingDocketId=null;
let editingSuggestionId=null;
let deliveryEditOriginalSnapshot=null;
let deliveryEditAffectedInvoiceId=null;
let deliveryEditResolutionChoice="";
let activeDeliveryLetter="";
function fillProducts(){
 const s=document.getElementById("delProduct"), b=document.getElementById("delBranch").value,q=norm(document.getElementById("deliveryProductSearch")?.value||"");
 const previous=s.value;
 let products=branchProducts(b).sort((a,b)=>a.name.localeCompare(b.name, "en", {sensitivity:"base", numeric:true}));

 // Typed search keeps its existing narrowing behaviour.
 if(q){
   products=products.filter(p=>norm(p.name).includes(q));
 }

 s.innerHTML=products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
 if(!products.length){
   s.innerHTML='<option value="">No matching product</option>';
   return;
 }

 // A–Z scrubber never filters the catalogue. It simply selects the
 // first product at or after the chosen alphabetical neighbourhood.
 if(!q && activeDeliveryLetter){
   const target=norm(activeDeliveryLetter);
   let jumpIndex=products.findIndex(p=>norm(p.name).charAt(0)>=target);
   if(jumpIndex<0)jumpIndex=products.length-1;
   s.selectedIndex=jumpIndex;
   return;
 }

 if(products.some(p=>p.id===previous))s.value=previous;
}
function normalizeDraftLines(lines){return (lines||[]).map(l=>({productId:String(l.productId||""),qty:Number(l.qty||0)})).filter(l=>l.productId&&l.qty>0);}
function docketDraftChanged(){
 if(!editingDocketId||!deliveryEditOriginalSnapshot)return false;
 const before=normalizeDraftLines(deliveryEditOriginalSnapshot.lines),after=normalizeDraftLines(currentDelivery);
 const branch=document.getElementById("delBranch")?.value||deliveryEditOriginalSnapshot.branch||"";
 const date=document.getElementById("delDate")?.value||deliveryEditOriginalSnapshot.date||"";
 const note=(document.getElementById("delNote")?.value||"").trim();
 return JSON.stringify(before)!==JSON.stringify(after)||branch!==(deliveryEditOriginalSnapshot.branch||"")||date!==(deliveryEditOriginalSnapshot.date||"")||note!==(deliveryEditOriginalSnapshot.note||"");
}
function docketBelongsToInvoiceCycle(d,inv){
 if(!d||!inv)return false;
 const items=wizardReportsForDate(inv.reportDate),prevDates=items.map(x=>x?.rec?.previousDate).filter(Boolean).sort(),prev=prevDates[0]||"";
 const date=String(d.date||""); if(!date||date>String(inv.reportDate||"")||(prev&&date<=prev))return false;
 const branches=new Set((inv.branches||[]).map(b=>canonicalBranchName(b.branch)));
 return !branches.size||branches.has(canonicalBranchName(d.branch||""));
}
function affectedInvoiceForDocket(d){
 if(!d||!d.deliveredAt)return null;
 return [...(db.invoices||[])].filter(inv=>!inv.supersededBy&&inv.status!=="void"&&docketBelongsToInvoiceCycle(d,inv)).sort((a,b)=>String(b.reportDate||"").localeCompare(String(a.reportDate||""))||Number(b.version||1)-Number(a.version||1))[0]||null;
}
function setDeliveryCorrectionChoice(choice){deliveryEditResolutionChoice=choice;updateDocketEditResolutionUI();}
window.setDeliveryCorrectionChoice=setDeliveryCorrectionChoice;
function invoiceIsPaid(inv){return !!inv&&(inv.payment?.status==="paid"||inv.status==="paid");}
function updateDocketEditResolutionUI(){
 const box=document.getElementById("deliveryCorrectionChoice"),saveBtn=document.getElementById("saveDelivery");if(!box||!saveBtn)return;
 if(!editingDocketId||!deliveryEditOriginalSnapshot){box.style.display="none";saveBtn.disabled=false;return;}
 const changed=docketDraftChanged(),wasDelivered=!!deliveryEditOriginalSnapshot.deliveredAt,inv=deliveryEditAffectedInvoiceId?(db.invoices||[]).find(x=>x.id===deliveryEditAffectedInvoiceId):null;
 const needsDecision=changed&&wasDelivered&&!!inv;
 if(!needsDecision){box.style.display="none";saveBtn.disabled=false;if(!changed)deliveryEditResolutionChoice="";return;}
 box.style.display="block";
 if(invoiceIsPaid(inv)){
   deliveryEditResolutionChoice="next_sunday";
   box.innerHTML=`<div class="choiceTitle">Next Sunday’s invoice will be adjusted automatically</div><div class="choiceSub">${escapeHtml(inv.number||"This invoice")} has already been paid, so it will stay unchanged. Any financial difference from this docket correction will be added to or deducted from the next Sunday billing cycle.</div>`;
   saveBtn.disabled=false;
   return;
 }
 box.innerHTML=`<div class="choiceTitle">How should this correction be handled?</div><div class="choiceSub">This delivered docket belongs to ${escapeHtml(inv.number||"the saved invoice")}. Choose one option, then save.</div><div class="deliveryCorrectionOptions"><label class="deliveryCorrectionOption ${deliveryEditResolutionChoice==='update_current'?'selected':''}"><input type="radio" name="deliveryCorrectionResolution" value="update_current" ${deliveryEditResolutionChoice==='update_current'?'checked':''} onchange="setDeliveryCorrectionChoice('update_current')"><div><b>Update this invoice</b><span>Apply the correction to this billing cycle.</span></div></label><label class="deliveryCorrectionOption ${deliveryEditResolutionChoice==='next_sunday'?'selected':''}"><input type="radio" name="deliveryCorrectionResolution" value="next_sunday" ${deliveryEditResolutionChoice==='next_sunday'?'checked':''} onchange="setDeliveryCorrectionChoice('next_sunday')"><div><b>Add to next Sunday’s invoice</b><span>Keep this invoice unchanged and carry the difference automatically.</span></div></label></div>${deliveryEditResolutionChoice?'':`<div class="deliveryCorrectionNeed">Choose one option to enable Save Docket Changes.</div>`}`;
 saveBtn.disabled=!deliveryEditResolutionChoice;
}
function setDeliveryEditAddTools(open){
  const tools=document.getElementById("deliveryEntryTools");
  const btn=document.getElementById("deliveryEditAddToggle");
  const editing=!!(editingDocketId||editingSuggestionId);
  if(tools)tools.style.display=editing?(open?"block":"none"):"block";
  if(btn){
    btn.style.display=editing?"block":"none";
    btn.textContent=open?"− Hide new product tools":"＋ Add another product";
  }
}
window.toggleDeliveryEditAddTools=()=>{
  const tools=document.getElementById("deliveryEntryTools");
  const open=tools?.style.display==="none";
  setDeliveryEditAddTools(open);
  if(open){
    requestAnimationFrame(()=>{
      document.getElementById("deliveryProductSearch")?.focus({preventScroll:true});
    });
  }
};


let deliveryKeyboardBaselineHeight=window.innerHeight||0;
let deliveryKeyboardActiveInput=null;
let deliveryKeyboardRaf=0;

function deliveryKeyboardMetrics(){
  const vv=window.visualViewport;
  if(!vv)return {open:false,height:0,visibleBottom:window.innerHeight||0};
  const layoutH=Math.max(window.innerHeight||0,deliveryKeyboardBaselineHeight||0);
  const keyboardH=Math.max(0,Math.round(layoutH-(vv.height+vv.offsetTop)));
  return {
    open:keyboardH>110,
    height:keyboardH,
    visibleBottom:vv.offsetTop+vv.height
  };
}

function positionActiveDeliveryQty(){
  const input=deliveryKeyboardActiveInput;
  const list=document.getElementById("deliveryEditLines");
  if(!input||!list||!document.body.classList.contains("deliveryEditMode"))return;

  const card=input.closest(".deliveryEditLineCard");
  if(!card)return;

  document.querySelectorAll(".deliveryEditLineCard.keyboardTarget").forEach(el=>{
    if(el!==card)el.classList.remove("keyboardTarget");
  });
  card.classList.add("keyboardTarget");

  // Scroll inside the product list only. Place the active card comfortably
  // below the fixed top zone and above the keyboard.
  const listRect=list.getBoundingClientRect();
  const cardRect=card.getBoundingClientRect();
  const targetTop=listRect.top+Math.max(8,(listRect.height-cardRect.height)*0.32);
  const delta=cardRect.top-targetTop;

  if(Math.abs(delta)>4){
    list.scrollTop+=delta;
  }

  // A second correction after Safari finishes its own focus scrolling.
  requestAnimationFrame(()=>{
    const lr=list.getBoundingClientRect();
    const cr=card.getBoundingClientRect();
    const safeTop=lr.top+6;
    const safeBottom=lr.bottom-8;
    if(cr.bottom>safeBottom)list.scrollTop+=cr.bottom-safeBottom;
    else if(cr.top<safeTop)list.scrollTop-=safeTop-cr.top;
  });
}

function updateDeliveryKeyboardViewport(){
  cancelAnimationFrame(deliveryKeyboardRaf);
  deliveryKeyboardRaf=requestAnimationFrame(()=>{
    if(!document.body.classList.contains("deliveryEditMode")){
      document.body.classList.remove("deliveryKeyboardOpen");
      document.documentElement.style.removeProperty("--md-keyboard-height");
      return;
    }

    const m=deliveryKeyboardMetrics();
    document.body.classList.toggle("deliveryKeyboardOpen",m.open);
    if(m.open){
      document.documentElement.style.setProperty("--md-keyboard-height",`${m.height}px`);
      setTimeout(positionActiveDeliveryQty,40);
    }else{
      document.documentElement.style.removeProperty("--md-keyboard-height");
      document.querySelectorAll(".deliveryEditLineCard.keyboardTarget").forEach(el=>el.classList.remove("keyboardTarget"));
    }
  });
}

window.deliveryQtyFocus=(input)=>{
  deliveryKeyboardActiveInput=input;
  try{input.select()}catch(_){}
  const card=input.closest(".deliveryEditLineCard");
  if(card)card.classList.add("keyboardTarget");

  // Safari's visualViewport changes after focus. Re-run at a few short intervals
  // so the card lands correctly even when the keyboard animation is still running.
  updateDeliveryKeyboardViewport();
  setTimeout(updateDeliveryKeyboardViewport,60);
  setTimeout(updateDeliveryKeyboardViewport,180);
  setTimeout(positionActiveDeliveryQty,240);
};

window.deliveryQtyBlur=(input)=>{
  setTimeout(()=>{
    if(document.activeElement!==input)deliveryKeyboardActiveInput=null;
    updateDeliveryKeyboardViewport();
  },80);
};

if(window.visualViewport){
  window.visualViewport.addEventListener("resize",updateDeliveryKeyboardViewport,{passive:true});
  window.visualViewport.addEventListener("scroll",updateDeliveryKeyboardViewport,{passive:true});
}
window.addEventListener("orientationchange",()=>{
  setTimeout(()=>{
    deliveryKeyboardBaselineHeight=window.innerHeight||deliveryKeyboardBaselineHeight;
    updateDeliveryKeyboardViewport();
  },250);
},{passive:true});

function renderDelivery(){
 const tb=document.getElementById("deliveryLines");
 const editBox=document.getElementById("deliveryEditLines");
 const tableWrap=document.getElementById("deliveryCreateLinesTable");
 const products=canonicalDeliveryProducts().sort((a,b)=>a.name.localeCompare(b.name,"en",{sensitivity:"base",numeric:true}));
 const editing=!!(editingDocketId||editingSuggestionId);

 if(editBox)editBox.style.display=editing?"grid":"none";
 if(tableWrap)tableWrap.style.display=editing?"none":"block";

 if(editing){
   if(tb)tb.innerHTML="";
   if(editBox){
     editBox.innerHTML=currentDelivery.map((l,i)=>{
       const p=resolvedProductById(l.productId);
       if(!p)return `<div class="deliveryEditLineCard">Unknown product record</div>`;
       const prices=validatedProductPrices(p)||{cost:0,retail:0};
       const productOptions=products.map(x=>`<option value="${x.id}" ${x.id===l.productId?'selected':''}>${escapeHtml(x.name)}</option>`).join('');
       return `<div class="deliveryEditLineCard" data-line-index="${i}">
         <div class="deliveryEditLineProduct">
           <label>Product</label>
           <select onchange="editDeliveryLineProduct(${i},this.value)">${productOptions}</select>
         </div>
         <div class="deliveryEditLineBottom">
           <div class="deliveryEditLineMeta">
             Cost <b>${baht(prices.cost)}</b> · Retail <b>${baht(prices.retail)}</b><br>
             Cost total <b>${baht(Number(l.qty||0)*prices.cost)}</b>
           </div>
           <div class="deliveryEditQtyBox">
             <label>Qty</label>
             <input type="number" min="1" inputmode="numeric" value="${Number(l.qty||0)}" onfocus="deliveryQtyFocus(this)" onclick="this.select()" onblur="deliveryQtyBlur(this)" onchange="editDeliveryLineQty(${i},this.value)">
           </div>
           <button class="deliveryEditRemoveBtn" type="button" aria-label="Remove ${escapeHtmlAttr(p.name)}" onclick="removeDel(${i})">×</button>
         </div>
       </div>`;
     }).join("");
   }
 }else{
   if(editBox)editBox.innerHTML="";
   if(tb){
     tb.innerHTML=currentDelivery.map((l,i)=>({l,i})).reverse().map(({l,i})=>{
       const p=resolvedProductById(l.productId);
       if(!p)return `<tr><td colspan="6">Unknown product record</td></tr>`;
       const prices=validatedProductPrices(p)||{cost:0,retail:0};
       return `<tr><td data-label="Product">${escapeHtml(p.name)}</td><td data-label="Qty">${Number(l.qty||0)}</td><td data-label="Cost">${baht(prices.cost)}</td><td data-label="Retail">${baht(prices.retail)}</td><td data-label="Cost total">${baht(Number(l.qty||0)*prices.cost)}</td><td data-label=""><button class="btn alt" onclick="removeDel(${i})">×</button></td></tr>`;
     }).join("");
   }
 }
 const t=currentDelivery.reduce((sum,l)=>{const p=resolvedProductById(l.productId),prices=validatedProductPrices(p);return sum+(prices?Number(l.qty||0)*prices.cost:0)},0);
 document.getElementById("deliveryTotal").textContent=baht(t);
 updateDocketEditResolutionUI();
}
function rerenderDeliveryStable(){
 const section=document.getElementById("docket");
 const sectionTop=section?.scrollTop||0;
 const editLines=document.getElementById("deliveryEditLines");
 const editTop=editLines?.scrollTop||0;
 const scroller=document.querySelector("#deliveryCreatePane .deliveryLinesWrap");
 const st=scroller?.scrollTop||0;
 renderDelivery();
 requestAnimationFrame(()=>{
   const next=document.querySelector("#deliveryCreatePane .deliveryLinesWrap");
   if(next)next.scrollTop=st;
   const nextEdit=document.getElementById("deliveryEditLines");
   if(nextEdit)nextEdit.scrollTop=editTop;
   if(section)section.scrollTop=sectionTop;
 });
}
window.editDeliveryLineProduct=(i,pid)=>{if(!editingDocketId&&!editingSuggestionId)return;const p=resolvedProductById(pid),prices=validatedProductPrices(p);if(!p||!prices)return alert("Choose a valid priced product.");currentDelivery[i].productId=pid;rerenderDeliveryStable();};
window.editDeliveryLineQty=(i,val)=>{if(!editingDocketId&&!editingSuggestionId)return;const q=Number(val||0);if(q<=0){alert("Quantity must be greater than zero.");rerenderDeliveryStable();return;}currentDelivery[i].qty=q;rerenderDeliveryStable();};
window.removeDel=i=>{currentDelivery.splice(i,1);rerenderDeliveryStable()}
document.getElementById("delBranch").onchange=()=>{fillProducts();updateDocketEditResolutionUI();};
document.getElementById("delDate").addEventListener("change",updateDocketEditResolutionUI);
document.getElementById("delNote").addEventListener("input",updateDocketEditResolutionUI);
document.getElementById("addDeliveryLine").onclick=()=>{
 const pid=document.getElementById("delProduct").value, qty=+document.getElementById("delQty").value||0;
 if(!pid)return alert("Choose a product first.");
 if(qty<=0)return alert("Enter a quantity greater than zero.");
 const p=resolvedProductById(pid);
 if(!p)return alert("That product could not be found in Pin's master catalogue. Please refresh the app and try again.");
 const prices=validatedProductPrices(p);
 if(!prices || prices.cost<=0 || prices.retail<=0)return alert(`Price information is missing for ${p.name}. Set its cost and retail price in Settings before adding it to a delivery.`);
 // Persist any high-confidence repaired base prices so the catalogue and docket stay consistent.
 if(!(Number(p.cost)>0))p.cost=prices.cost;if(!(Number(p.retail)>0))p.retail=prices.retail;
 const old=currentDelivery.find(x=>x.productId===pid); if(old)old.qty+=qty;else currentDelivery.push({productId:pid,qty});
 const qtyInput=document.getElementById("delQty"); qtyInput.value=""; qtyInput.blur(); save(); renderDelivery();
 requestAnimationFrame(()=>{if(document.getElementById("deliveryCreatePane")?.style.display!=="none")document.getElementById("docket")?.scrollTo?.(0,0);});
}
document.getElementById("clearDelivery").onclick=()=>{currentDelivery=[];renderDelivery()}
function resetDeliveryEditor(){
 editingDocketId=null; editingSuggestionId=null; currentDelivery=[]; deliveryEditOriginalSnapshot=null; deliveryEditAffectedInvoiceId=null; deliveryEditResolutionChoice="";
 document.getElementById("delNote").value="";
 document.getElementById("delQty").value="";
 document.getElementById("saveDelivery").textContent="Save Delivery + Create Docket";
 document.getElementById("cancelEditDelivery").style.display="none";
 document.getElementById("clearDelivery").textContent="Clear";
 const editBanner=document.getElementById("deliveryEditBanner");
 if(editBanner){editBanner.style.display="none";editBanner.innerHTML='<b>Editing docket.</b> Change product or quantity directly, add/remove lines, then save.';}
 const chip=document.getElementById("deliveryEditChip");if(chip){chip.style.display="none";chip.textContent="Editing docket";}
 const nt=document.getElementById("deliveryNoteToggle");if(nt)nt.open=false;
 document.body.classList.remove("deliveryEditMode","deliveryKeyboardOpen");
 document.documentElement.style.removeProperty("--md-keyboard-height");
 deliveryKeyboardActiveInput=null;
 setDeliveryEditAddTools(true);
 const title=document.getElementById("deliveryEditorTitle");if(title)title.childNodes[0].nodeValue="Create delivery ";
 renderDelivery();
}
document.getElementById("cancelEditDelivery").onclick=()=>{resetDeliveryEditor();openDeliveryArchive()};
function refreshReconciliationViews(){
  try{
    const recs=refreshStoredReconciliations();
    renderArchive();
    renderExcelReconciliation(recs.slice(-4));
    renderSundayWizard();
  }catch(e){console.warn("Could not refresh reconciliation views",e)}
}
document.getElementById("saveDelivery").onclick=()=>{
 if(!currentDelivery.length)return alert("Add at least one product.");
 const lines=[];
 for(const x of currentDelivery){
   const p=resolvedProductById(x.productId),prices=validatedProductPrices(p);
   if(!p||!prices||prices.cost<=0||prices.retail<=0)return alert(`Cannot save this docket because price information is missing for ${p?.name||"a product"}.`);
   lines.push({...x,productName:p.name,cost:prices.cost,retail:prices.retail});
 }
 const branch=document.getElementById("delBranch").value,date=document.getElementById("delDate").value||today(),note=document.getElementById("delNote").value.trim();
 if(editingDocketId){
   const d=db.deliveries.find(x=>x.id===editingDocketId); if(!d)return alert("The delivery docket being edited could not be found.");
   const before=JSON.parse(JSON.stringify(d));
   const changed=docketDraftChanged();
   const affectedInv=deliveryEditAffectedInvoiceId?(db.invoices||[]).find(x=>x.id===deliveryEditAffectedInvoiceId):null;
   if(changed&&before.deliveredAt&&affectedInv&&invoiceIsPaid(affectedInv))deliveryEditResolutionChoice="next_sunday";
   if(changed&&before.deliveredAt&&affectedInv&&!deliveryEditResolutionChoice){updateDocketEditResolutionUI();return alert("Choose whether to update this invoice or add the correction to next Sunday’s invoice.");}
   const editAt=new Date().toISOString();
   const changes=computeDocketLineChanges(before.lines||[],lines,editAt);
   db.docketAudit.push({id:"DA"+Date.now(),action:"edited",at:editAt,docketId:d.id,date:d.date||"",branch:d.branch||"",note:d.note||"",lines:(d.lines||[]).map(l=>({...l})),beforeSnapshot:before,resolutionChoice:deliveryEditResolutionChoice||null,affectedInvoiceId:affectedInv?.id||null});
   if(before.deliveredAt&&changes.length)d.lineChanges=[...(Array.isArray(d.lineChanges)?d.lineChanges:[]),...changes];
   d.branch=branch; d.date=date; d.note=note; d.lines=lines; d.editedAt=editAt;
   if(d.generatedFromSundaySuggestion){
     d.userEditedSuggestedDraft=true;
     d.suggestedRef=d.suggestedRef||suggestedDraftRef(d.sourceSundayDate||date,d.branch);
   }
   if(changed&&before.deliveredAt&&affectedInv){
     if(!Array.isArray(db.pendingCorrections))db.pendingCorrections=[];
     const replacedCorrections=db.pendingCorrections.filter(c=>c.invoiceId===affectedInv.id&&["pending","waiting_reconciliation","queued"].includes(c.status));
     const replacedIds=new Set(replacedCorrections.map(c=>c.id));
     if(replacedIds.size)db.adjustments=(db.adjustments||[]).filter(a=>!(replacedIds.has(a.correctionId)&&a.status==="pending"));
     db.pendingCorrections=db.pendingCorrections.filter(c=>!replacedIds.has(c.id));
     db.pendingCorrections.push({id:"COR"+Date.now(),status:"pending",docketId:d.id,invoiceId:affectedInv.id,sourceDate:affectedInv.reportDate,choice:deliveryEditResolutionChoice,createdAt:editAt,changes:changes.map(c=>({before:c.before?{...c.before}:null,after:c.after?{...c.after}:null})),message:"Waiting for the edited week to reconcile."});
   }
   const savedId=d.id,resolutionChoice=deliveryEditResolutionChoice;
   save();
   refreshReconciliationViews();
   processPendingDocketCorrections();
   resetDeliveryEditor(); renderDocketArchive(savedId); renderMetrics(); renderHistory(); renderAudit(); renderDashboardAlerts();
   openDeliveryArchive(savedId);
   const corr=(db.pendingCorrections||[]).find(c=>c.docketId===savedId&&c.createdAt===editAt);
   if(corr?.status==="waiting_reconciliation")alert("Docket saved. The correction choice is locked in. The app will apply it automatically as soon as this week reconciles again.");
   else if(changed&&before.deliveredAt&&affectedInv)alert(resolutionChoice==="update_current"?"Docket saved. This invoice has been updated automatically.":(invoiceIsPaid(affectedInv)?"Docket saved. The paid invoice remains unchanged. Any financial difference will be added automatically to the next Sunday invoice.":"Docket saved. The correction will be added automatically to the next Sunday invoice."));
   return;
 }
 const d={id:"D"+Date.now(),branch,date,note,lines,deliveredAt:null,lineChanges:[]};
 db.deliveries.push(d); resetDeliveryEditor(); save(); refreshReconciliationViews(); renderDocket(d); renderMetrics(); renderHistory(); renderAudit(); openDeliveryArchive(d.id);
}

function lineKey(l){return String(l.productId||"")+"|"+String(Number(l.qty||0));}
function productLineLabel(l){const p=resolvedProductById(l.productId)||db.products.find(x=>x.id===l.productId);return `${l.productName||p?.name||"Unknown product"} × ${Number(l.qty||0)}`;}
function docketChangeHistoryMarkup(d){
 const changes=Array.isArray(d.lineChanges)?d.lineChanges:[]; if(!changes.length)return "";
 return `<div class="lineHistory"><b>Changes after delivery</b>${changes.map(c=>`<div style="margin-top:7px">${c.before?`<div><del>${escapeHtml(productLineLabel(c.before))}</del></div>`:""}${c.after?`<div class="newValue">${escapeHtml(productLineLabel(c.after))}</div>`:`<div class="newValue">Deleted</div>`}<div class="changeMeta">${escapeHtml(c.at?new Date(c.at).toLocaleString():"")}</div></div>`).join("")}</div>`;
}
function computeDocketLineChanges(beforeLines,afterLines,at){
 const b=new Map((beforeLines||[]).map(l=>[String(l.productId||""),l])),a=new Map((afterLines||[]).map(l=>[String(l.productId||""),l])),out=[],removed=[],added=[];
 b.forEach((old,id)=>{const neu=a.get(id);if(neu){if(Number(old.qty||0)!==Number(neu.qty||0))out.push({at,before:{...old},after:{...neu}});}else removed.push(old);});
 a.forEach((neu,id)=>{if(!b.has(id))added.push(neu);});
 if(removed.length===1&&added.length===1){out.push({at,before:{...removed[0]},after:{...added[0]}});return out;}
 removed.forEach(old=>out.push({at,before:{...old},after:null}));added.forEach(neu=>out.push({at,before:null,after:{...neu}}));return out;
}

/* Reusable Code 128-B module.
   Stores only barcode text in data; graphics are generated on demand. */
const CODE128_PATTERNS=[
"212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
"221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
"221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
"212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
"231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
"231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
"314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
"112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
"111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
"214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
"114131","311141","411131","211412","211214","211232","2331112"
];

function code128Values(text){
  const s=String(text||"");
  if(!s)return null;
  const values=[];
  for(const ch of s){
    const code=ch.charCodeAt(0);
    if(code<32||code>126)return null; // Code 128-B printable ASCII
    values.push(code-32);
  }
  let checksum=104; // Start B
  values.forEach((v,i)=>checksum+=v*(i+1));
  checksum%=103;
  return [104,...values,checksum,106];
}
function code128Modules(text){
  const values=code128Values(text);
  if(!values)return null;
  const widths=[];
  values.forEach(v=>{
    const p=CODE128_PATTERNS[v];
    if(!p)return;
    for(const n of p)widths.push(Number(n));
  });
  return widths;
}
function code128Svg(text){
  const safe=normalizeBarcode(text);
  if(!safe)return "";
  const widths=code128Modules(safe);
  if(!widths)return "";
  const quiet=10;
  const total=widths.reduce((a,b)=>a+b,0)+quiet*2;
  let x=quiet,bar=true,rects="";
  widths.forEach(w=>{
    if(bar)rects+=`<rect x="${x}" y="0" width="${w}" height="28"></rect>`;
    x+=w;bar=!bar;
  });
  return `<svg viewBox="0 0 ${total} 28" preserveAspectRatio="none" role="img" aria-label="Barcode ${escapeHtmlAttr(safe)}"><g fill="#000">${rects}</g></svg>`;
}
function productBarcode(productId){
  return normalizeBarcode((db.products||[]).find(p=>p.id===productId)?.barcode||"");
}
function docketBarcodeMarkup(productId){
  const code=productBarcode(productId);
  if(!code)return `<span class="docketBarcodeBlank">—</span>`;
  const svg=code128Svg(code);
  return svg?`${svg}<span class="docketBarcodeText">${escapeHtml(code)}</span>`:`<span class="docketBarcodeText">${escapeHtml(code)}</span>`;
}

/* PDF barcode painter. Uses the same Code 128-B module widths as HTML/SVG. */
function pdfDrawCode128(commands,text,x,y,w,h){
  const safe=normalizeBarcode(text);
  const widths=code128Modules(safe);
  if(!widths)return false;
  const quiet=10;
  const modules=widths.reduce((a,b)=>a+b,0)+quiet*2;
  const moduleW=w/modules;
  // Refuse to render an impractically narrow barcode. Human-readable text still prints.
  if(moduleW<0.34)return false;
  let cursor=x+quiet*moduleW,bar=true;
  commands.push("q 0 0 0 rg");
  widths.forEach(part=>{
    const pw=part*moduleW;
    if(bar)commands.push(`${cursor.toFixed(2)} ${y.toFixed(2)} ${pw.toFixed(2)} ${h.toFixed(2)} re f`);
    cursor+=pw;bar=!bar;
  });
  commands.push("Q");
  return true;
}

function docketMarkup(d){
 let total=0;
 const rows=(d.lines||[]).map(l=>{
  const p=db.products.find(x=>x.id===l.productId);
  const name=l.productName||p?.name||"Unknown product";
  const cost=Number(l.cost ?? p?.cost ?? 0), retail=Number(l.retail ?? p?.retail ?? 0), amount=Number(l.qty||0)*cost; total+=amount;
  return `<tr>
    <td>${escapeHtml(name)}</td>
    <td>${l.qty||0}</td>
    <td>${baht(cost)}</td>
    <td>${baht(retail)}</td>
    <td>${baht(amount)}</td>
    <td class="docketBarcodeCell">${docketBarcodeMarkup(l.productId)}</td>
  </tr>`;
 }).join("");
 const suggested=isSuggestedDraftDocket(d);
 const ref=d.suggestedRef||suggestedDraftRef(d.sourceSundayDate||d.date,d.branch);
 const statusText=d.deliveredAt
   ? `✓ DELIVERED · ${escapeHtml(String(d.deliveredAt).slice(0,10))}`
   : (suggested?`DRAFT · ${escapeHtml(ref)}`:"NOT DELIVERED");
 return `<div class="docket"><div class="docketHead"><div><b>DELIVERY DOCKET</b><div class="small">Yaowaret</div><div class="docketStatus ${d.deliveredAt?"delivered":"draft"}">${statusText}</div></div><div style="text-align:right"><b>${escapeHtml(displayBranchName(d.branch))}</b><div class="small">${escapeHtml(d.date||"—")}${d.note?` · ${escapeHtml(d.note)}`:""}</div></div></div>
 <table style="min-width:0;table-layout:fixed">
   <colgroup><col style="width:34%"><col style="width:8%"><col style="width:11%"><col style="width:11%"><col style="width:13%"><col style="width:23%"></colgroup>
   <thead><tr><th>Description</th><th>Qty</th><th>Unit cost</th><th>Retail</th><th>Amount</th><th>Barcode</th></tr></thead>
   <tbody>${rows}</tbody>
 </table>
 <div class="totalbar"><span>TOTAL COST ${baht(total)}</span></div>${docketChangeHistoryMarkup(d)}</div>`;
}
function inferLegacyDeliveredDockets(){
 let changed=false;
 (db.deliveries||[]).forEach(d=>{if(d.deliveredAt||d.generatedFromSundaySuggestion)return;const inv=affectedInvoiceForDocket(d);if(inv){d.deliveredAt=(inv.createdAt||(`${d.date||inv.reportDate}T12:00:00`));d.deliveryStatusInferred=true;changed=true;}});
 if(changed)localStorage.setItem("mdpin-db",JSON.stringify(db));
}
let activeDocketArchiveId=null;
function renderDocketArchive(openId){
 const box=document.getElementById("docketArchive"); if(!box)return;
 migrateLegacyDeliverySuggestions();
 const dockets=[...(db.deliveries||[])].sort((a,b)=>
   Number(isSuggestedDraftDocket(b))-Number(isSuggestedDraftDocket(a)) ||
   String(b.date||"").localeCompare(String(a.date||"")) ||
   String(b.id).localeCompare(String(a.id))
 );
 const ids=new Set(dockets.map(x=>x.id));
 if(!dockets.length){
   activeDocketArchiveId=null;
   box.innerHTML=`<div class="notice">No delivery dockets yet.<div style="margin-top:10px"><button class="btn" onclick='openDeliveryCreate()'>Create New Delivery</button></div></div>`;
   return;
 }
 if(openId!==undefined)activeDocketArchiveId=ids.has(openId)?openId:null;
 else if(activeDocketArchiveId&&!ids.has(activeDocketArchiveId))activeDocketArchiveId=null;

 const activeDocket=dockets.find(d=>d.id===activeDocketArchiveId)||null;
 const docketSelectors=dockets.map(d=>{
   const suggested=isSuggestedDraftDocket(d);
   const ref=d.suggestedRef||suggestedDraftRef(d.sourceSundayDate||d.date,d.branch);
   const label=suggested
     ? `<b>${escapeHtml(ref)}</b> · ${escapeHtml(displayBranchName(d.branch))} · ${escapeHtml(recordDateLabel(d.date||d.sourceSundayDate))}`
     : `${escapeHtml(d.date||"No date")} — ${escapeHtml(displayBranchName(d.branch))}`;
   return `<button type="button" class="docketSelector ${suggested?"suggestedSelector":""} ${activeDocket&&activeDocket.id===d.id?"active":""}" onclick='selectDocketArchive("${d.id}")'><span>${label}</span><span class="docketSelectorChevron">${activeDocket&&activeDocket.id===d.id?"⌃":"⌄"}</span></button>`;
 }).join("");

 let viewer=`<div class="docketEmptyState">Tap a delivery above to view it.</div>`;
 if(activeDocket){
   const suggested=isSuggestedDraftDocket(activeDocket);
   viewer=`<div class="docketActivePanel" data-docket-id="${activeDocket.id}">
     <div class="docketActiveScroll">${docketMarkup(activeDocket)}</div>
     <div class="docketActions">
       <button class="btn gold" onclick='editDocket("${activeDocket.id}")'>Edit Docket</button>
       <button class="btn" onclick='toggleDocketDelivered("${activeDocket.id}")'>${activeDocket.deliveredAt?"Mark Not Delivered":"Mark Delivered"}</button>
       <button class="btn danger" onclick='deleteDocket("${activeDocket.id}")'>Delete Docket</button>
       <button class="btn" onclick='printDocket("${activeDocket.id}")'>Create / Share PDF</button>
     </div>
   </div>`;
 }
 box.innerHTML=`<div class="docketSelectorList">${docketSelectors}</div>${viewer}`;
}

window.selectDocketArchive=id=>{
 const box=document.getElementById("docketArchive");
 activeDocketArchiveId=(activeDocketArchiveId===id)?null:id;
 renderDocketArchive(activeDocketArchiveId===null?null:activeDocketArchiveId);
 if(box){requestAnimationFrame(()=>{const panel=box.querySelector('.docketActivePanel');if(panel)panel.scrollIntoView({block:'nearest'});});}
};
function renderDocket(d){ renderDocketArchive(d?.id); }
window.editDocket=id=>{
 const d=db.deliveries.find(x=>x.id===id); if(!d)return alert("Delivery docket not found.");
 editingDocketId=id;
 deliveryEditOriginalSnapshot=JSON.parse(JSON.stringify(d));
 const affectedInvoice=affectedInvoiceForDocket(d); deliveryEditAffectedInvoiceId=affectedInvoice?.id||null; deliveryEditResolutionChoice="";
 currentDelivery=(d.lines||[]).map(l=>({productId:l.productId,qty:Number(l.qty||0)})).filter(l=>l.productId&&l.qty>0);
 openDeliveryCreate(true);
 document.getElementById("delBranch").value=d.branch||"BM Bangrak";
 fillProducts();
 document.getElementById("delDate").value=d.date||today();
 document.getElementById("delNote").value=d.note||"";
 document.getElementById("saveDelivery").textContent="Save Docket Changes";
 document.getElementById("cancelEditDelivery").style.display="inline-block";
 document.getElementById("clearDelivery").textContent="Clear Lines";
 const editBanner=document.getElementById("deliveryEditBanner");if(editBanner){
   editBanner.style.display="block";
   editBanner.innerHTML=d.generatedFromSundaySuggestion
     ? `<b>${escapeHtml(d.suggestedRef||suggestedDraftRef(d.sourceSundayDate||d.date,d.branch))}</b> · Suggested from Sunday sales. Edit this exactly like any other unsent docket.`
     : '<b>Editing docket.</b> Change product or quantity directly, add/remove lines, then save.';
 }
 const chip=document.getElementById("deliveryEditChip");if(chip){
   chip.style.display="inline-block";
   chip.textContent=d.generatedFromSundaySuggestion?(d.suggestedRef||"Suggested draft"):"Editing docket";
 }
 const nt=document.getElementById("deliveryNoteToggle");if(nt)nt.open=!!(d.note||"");
 setDeliveryEditAddTools(false);
 setDeliveryView("create");
 renderDelivery();
 requestAnimationFrame(()=>{
   const section=document.getElementById("docket");
   if(section)section.scrollTop=0;
   const lines=document.getElementById("deliveryEditLines");
   if(lines)lines.scrollTop=0;
 });
};

window.toggleDocketDelivered=id=>{
 const d=db.deliveries.find(x=>x.id===id);if(!d)return;
 if(!d.deliveredAt){
   const date=prompt("Delivery date (YYYY-MM-DD)",d.date||today()); if(date===null)return;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return alert("Enter the delivery date as YYYY-MM-DD.");
   d.deliveredAt=date+"T12:00:00";
   db.docketAudit.push({id:"DA"+Date.now(),action:"marked-delivered",at:new Date().toISOString(),docketId:d.id,date:d.date||"",branch:d.branch||""});
 }else{
   if(affectedInvoiceForDocket(d))return alert("This docket is already part of a completed invoice cycle, so its Delivered status is locked.");
   if((d.lineChanges||[]).length)return alert("This docket has post-delivery changes, so its Delivered status is locked to preserve the record.");
   if(!confirm("Mark this docket Not Delivered again? Only do this if Delivered was selected by mistake."))return;
   d.deliveredAt=null;
   db.docketAudit.push({id:"DA"+Date.now(),action:"marked-not-delivered",at:new Date().toISOString(),docketId:d.id,date:d.date||"",branch:d.branch||""});
 }
 save();renderDocketArchive(id);renderHistory();renderAudit();renderMetrics();
};

window.deleteDocket=id=>{
 const d=db.deliveries.find(x=>x.id===id); if(!d)return;
 const label=`${d.date||"No date"} — ${d.branch||"No branch"}`;
 if(!confirm(`Delete delivery docket ${label}?\n\nThis will remove its quantities from live reconciliation and totals.`))return;
 if(!confirm(`Confirm deletion of ${label}.\n\nA read-only audit snapshot will be kept.`))return;
 db.docketAudit.push({
   id:"DA"+Date.now(), action:"deleted", at:new Date().toISOString(), docketId:d.id,
   date:d.date||"", branch:d.branch||"", note:d.note||"",
   lines:(d.lines||[]).map(l=>({...l})), deletedSnapshot:JSON.parse(JSON.stringify(d))
 });
 db.deliveries=db.deliveries.filter(x=>x.id!==id);
 save(); refreshReconciliationViews(); renderDocketArchive(); renderMetrics(); renderHistory(); renderAudit();
};

function buildDocketPdfBytes(d,includeHistory=false){
  const c=[];
  const esc=t=>pdfEscapeText(pdfAscii(t));
  const txt=(text,x,y,size=10,bold=false,r=.09,g=.13,b=.20)=>c.push(`${r} ${g} ${b} rg BT /F${bold?2:1} ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`);
  const rect=(x,y,w,h,fr,fg,fb,sr=null,sg=null,sb=null,lw=.8)=>{c.push('q');if(fr!==null)c.push(`${fr} ${fg} ${fb} rg`);if(sr!==null)c.push(`${sr} ${sg} ${sb} RG ${lw} w`);c.push(`${x} ${y} ${w} ${h} re ${fr!==null?(sr!==null?'B':'f'):'S'}`);c.push('Q');};
  const line=(x1,y1,x2,y2,r=.86,g=.88,b=.91,w=.7)=>c.push(`q ${r} ${g} ${b} RG ${w} w ${x1} ${y1} m ${x2} ${y2} l S Q`);
  const L=42,R=553,W=511;
  txt('DELIVERY DOCKET',L,790,22,true);
  txt('Issued by Yaowaret',L,767,10,false,.38,.42,.50);
  txt(displayBranchName(d.branch),R-165,790,12,true);
  txt(invoiceDateLabel(d.date||''),R-165,772,10,false,.38,.42,.50);
  if(d.note)txt(pdfAscii(d.note).slice(0,35),R-165,756,8.5,false,.38,.42,.50);
  line(L,744,R,744);
  // Barcode gets the right margin; product remains the widest data column.
  const cols=[L,L+195,L+240,L+295,L+350,L+405,R];
  const headers=['PRODUCT','QTY','COST','RETAIL','LINE COST','BARCODE'];
  rect(L,711,W,28,.965,.972,.982,null,null,null);
  headers.forEach((h,i)=>txt(h,cols[i]+5,722,7.2,true,.38,.42,.50));
  let y=711,total=0;
  const rows=[];
  (d.lines||[]).forEach(l=>{
    const p=db.products.find(x=>x.id===l.productId);
    const name=l.productName||p?.name||'Unknown product';
    const cost=Number(l.cost??p?.cost??0),retail=Number(l.retail??p?.retail??0),qty=Number(l.qty||0),amount=qty*cost;
    total+=amount;rows.push({name,qty,cost,retail,amount,barcode:normalizeBarcode(p?.barcode||"")});
  });
  rows.forEach((r,idx)=>{
    y-=29;if(idx%2===1)rect(L,y,W,29,.988,.99,.994,null,null,null);
    txt(r.name.slice(0,34),cols[0]+5,y+10,8.9,false);
    txt(String(r.qty),cols[1]+7,y+10,9.1,true);
    txt(pdfMoney(r.cost),cols[2]+4,y+10,8.1);
    txt(pdfMoney(r.retail),cols[3]+4,y+10,8.1);
    txt(pdfMoney(r.amount),cols[4]+4,y+10,8.1,true);
    if(r.barcode){
      const bx=cols[5]+4,bw=(cols[6]-cols[5])-8;
      const rendered=pdfDrawCode128(c,r.barcode,bx,y+11,bw,12);
      txt(r.barcode.slice(0,28),bx,y+3,5.3,false,.18,.20,.24);
      if(!rendered)txt('BARCODE TEXT',bx,y+18,5.3,true,.55,.25,.08);
    }
    line(L,y,R,y,.91,.92,.94,.45);
  });
  y-=16;
  // v0.9.69: ink-light docket summary — compact, right-aligned total with outlined status
  line(L,y,R,y,.09,.13,.20,1.35);
  const totalLabel='TOTAL COST VALUE';
  const totalValue=pdfMoney(total);
  txt(totalLabel,R-150,y-18,8.2,true,.38,.42,.50);
  txt(totalValue,R-150,y-39,17,true,.09,.13,.20);
  const statusText=d.deliveredAt?'DELIVERED':'NOT DELIVERED';
  const statusW=d.deliveredAt?72:98;
  rect(L,y-38,statusW,24,null,null,null,d.deliveredAt?.27:.55,d.deliveredAt?.55:.55,d.deliveredAt?.34:.55,.9);
  txt(statusText,L+9,y-30,8.2,true,d.deliveredAt?.18:.42,d.deliveredAt?.46:.42,d.deliveredAt?.26:.42);
  y-=58;
  if(includeHistory&&(d.lineChanges||[]).length){
    txt('POST-DELIVERY CHANGE HISTORY',L,y,9,true,.55,.25,.08);y-=16;
    for(const ch of (d.lineChanges||[]).slice(0,8)){
      const before=ch.before?productLineLabel(ch.before):'';
      const after=ch.after?productLineLabel(ch.after):'Deleted';
      for(const row of pdfWrap(`${before} -> ${after}`,90).slice(0,2)){txt(row,L,y,8.2,false,.30,.33,.39);y-=12;}
      y-=2;if(y<85)break;
    }
  }
  line(L,53,R,53,.90,.91,.93,.7);
  txt('Magic Dragon Pin - Delivery Docket',L,37,7.5,false,.48,.51,.57);
  txt(`${invoiceDateLabel(d.date||'')} - ${displayBranchName(d.branch)}`,365,37,7.5,false,.48,.51,.57);
  const content=c.join('\n'),objs=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
  objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objs[6]=`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`;
  let pdf='%PDF-1.4\n%MDPIN-DOCKET\n',offsets=[0];
  for(let i=1;i<=6;i++){offsets[i]=new TextEncoder().encode(pdf).length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
  const xref=new TextEncoder().encode(pdf).length;pdf+='xref\n0 7\n0000000000 65535 f \n';
  for(let i=1;i<=6;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
function docketPdfDownload(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),120000);
}
function setDocketPdfBusy(id,busy){
  const panel=document.querySelector(`.docketActivePanel[data-docket-id="${id}"]`);
  const btn=panel?.querySelector('.docketActions button:last-child');
  if(!btn)return;
  if(busy){btn.dataset.oldText=btn.textContent;btn.textContent='Preparing PDF…';btn.setAttribute('aria-busy','true');}
  else{btn.textContent=btn.dataset.oldText||'Create / Share PDF';btn.removeAttribute('aria-busy');delete btn.dataset.oldText;}
}
async function generateDocketPdf(id,includeHistory=false){
  const live=db.deliveries.find(x=>x.id===id);if(!live)return alert('Delivery docket not found.');
  const d=JSON.parse(JSON.stringify(live)); // stable snapshot: edits cannot change the record mid-generation
  setDocketPdfBusy(id,true);
  try{
    const bytes=buildDocketPdfBytes(d,includeHistory);
    if(!(bytes instanceof Uint8Array)||bytes.length<500)throw new Error('PDF generation returned incomplete data');
    const head=new TextDecoder().decode(bytes.slice(0,8)),tail=new TextDecoder().decode(bytes.slice(-16));
    if(!head.startsWith('%PDF-')||!tail.includes('%%EOF'))throw new Error('PDF validation failed');
    const blob=new Blob([bytes],{type:'application/pdf'});
    const safeBranch=displayBranchName(d.branch).replace(/[^a-z0-9]+/gi,' ').trim();
    const filename=`Delivery Docket - ${safeBranch} - ${d.date||'undated'}.pdf`;
    let file=null;
    try{file=new File([blob],filename,{type:'application/pdf',lastModified:Date.now()});}catch(e){console.warn('File constructor unavailable; using download fallback',e);}
    if(file&&navigator.share){
      let canShare=true;
      try{if(navigator.canShare)canShare=navigator.canShare({files:[file]});}catch(e){canShare=false;}
      if(canShare){
        try{await navigator.share({files:[file],title:'Delivery Docket'});return;}
        catch(err){
          if(err&&err.name==='AbortError')return;
          console.warn('Native share failed; falling back to direct PDF save',err);
        }
      }
    }
    docketPdfDownload(blob,filename);
  }catch(err){
    console.error('Delivery docket PDF error',err);
    alert('The delivery docket PDF could not be created. Please try again.');
  }finally{setDocketPdfBusy(id,false);}
}
function closeDocketPdfChoice(){document.querySelector('.docketPdfChoiceOverlay')?.remove();}
function chooseDocketPdfVersion(id){
  closeDocketPdfChoice();
  const overlay=document.createElement('div');overlay.className='docketPdfChoiceOverlay';
  overlay.innerHTML=`<div class="docketPdfChoiceCard" role="dialog" aria-modal="true" aria-label="Choose PDF version"><h3>Choose PDF version</h3><p>Use the clean current docket, or include the saved post-delivery change history.</p><div class="docketPdfChoiceButtons"><button class="btn gold" type="button" data-current>Current docket</button><button class="btn" type="button" data-history>Include change history</button></div><button class="docketPdfChoiceCancel" type="button" data-cancel>Cancel</button></div>`;
  overlay.querySelector('[data-current]').onclick=()=>{closeDocketPdfChoice();generateDocketPdf(id,false);};
  overlay.querySelector('[data-history]').onclick=()=>{closeDocketPdfChoice();generateDocketPdf(id,true);};
  overlay.querySelector('[data-cancel]').onclick=closeDocketPdfChoice;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeDocketPdfChoice();});
  document.body.appendChild(overlay);
}
window.printDocket=id=>{
  const d=db.deliveries.find(x=>x.id===id);if(!d)return alert('Delivery docket not found.');
  if((d.lineChanges||[]).length)return chooseDocketPdfVersion(id);
  return generateDocketPdf(id,false);
};

function deliveriesSinceLastWeek(branch,date){
 const previous=db.weeks.filter(w=>w.branch===branch && w.date<date).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 const start=previous?.date||"0000-00-00";
 const map={}; db.deliveries.filter(d=>d.branch===branch && !!d.deliveredAt && d.date>start && d.date<=date).forEach(d=>d.lines.forEach(l=>map[l.productId]=(map[l.productId]||0)+l.qty));
 return map;
}
function loadWeek(){
 const b=document.getElementById("weekBranch").value, date=document.getElementById("weekDate").value||today(), dels=deliveriesSinceLastWeek(b,date);
 const last=db.weeks.filter(w=>w.branch===b && w.date<date).sort((a,c)=>a.date.localeCompare(c.date)).at(-1);
 const rows=branchProducts(b).map(p=>({p,opening:last?.rows?.find(r=>r.productId===p.id)?.closing ?? db.stock[b]?.[p.id] ?? 0,delivered:dels[p.id]||0,takeout:0,closing:""}));
 const tb=document.getElementById("weekRows");
 tb.dataset.branch=b;tb.dataset.date=date;
 tb.innerHTML=rows.map(r=>`<details class="weekProduct ${r.p.type}" data-pid="${r.p.id}" data-opening="${r.opening}" data-delivered="${r.delivered}">
   <summary>
     <div class="weekProductTitle"><b>${r.p.name}</b><span class="weekMini">Open ${r.opening}${r.delivered?` • Delivered ${r.delivered}`:""}</span></div>
     <div class="weekQuick">
       <label>Closing</label>
       <input class="closing" type="number" min="0" inputmode="decimal" placeholder="—" aria-label="Closing stock for ${r.p.name}">
     </div>
     <span class="weekState status warn">Waiting</span><span class="weekChev">⌄</span>
   </summary>
   <div class="weekDetail">
     <div class="weekStat"><span>Opening</span><b>${r.opening}</b></div>
     <div class="weekStat"><span>Deliveries</span><b>${r.delivered}</b></div>
     <label class="weekStat editable"><span>Take out</span><input class="takeout" type="number" min="0" inputmode="decimal" value="0"></label>
     <div class="weekStat"><span>Expected</span><b class="expected">${r.opening+r.delivered}</b></div>
     <div class="weekStat"><span>Sold</span><b class="sold">—</b></div>
     <div class="weekStat"><span>Sales</span><b class="sales">—</b></div>
     <div class="weekStat"><span>Pay Pin</span><b class="pin">—</b></div>
     <div class="check" hidden><span class="status warn">Waiting</span></div>
   </div>
 </details>`).join("");
 tb.querySelectorAll("input").forEach(i=>i.oninput=e=>{calcWeek(); if(i.classList.contains("closing") && i.value!=="") i.closest(".weekProduct").open=false;});
 calcWeek();filterWeekRows();
}
function calcWeek(){
 let sales=0,cost=0,profit=0,pin=0,alix=0,bm=0;
 document.querySelectorAll("#weekRows .weekProduct").forEach(tr=>{
  const p=db.products.find(x=>x.id===tr.dataset.pid), opening=+tr.dataset.opening, delivered=+tr.dataset.delivered, take=+tr.querySelector(".takeout").value||0, cval=tr.querySelector(".closing").value;
  const expected=opening+delivered-take;tr.querySelector(".expected").textContent=expected;
  if(cval===""){
    tr.classList.add("isPending");tr.classList.remove("isDone","hasError");
    tr.querySelector(".sold").textContent="—";tr.querySelector(".sales").textContent="—";tr.querySelector(".pin").textContent="—";
    tr.querySelector(".check").innerHTML=`<span class="status warn">Waiting</span>`;
    tr.querySelector(".weekState").className="weekState status warn";tr.querySelector(".weekState").textContent="Waiting";
    return
  }
  const closing=+cval, sold=expected-closing, s=sold*p.retail, c=sold*p.cost, pr=s-c;
  const isEd=p.type==="edible"; const pinProfit=pr*(isEd?.40:.30), alixProfit=pr*(isEd?.20:.30), bmProfit=pr*.40, pinPay=c+pinProfit;
  tr.querySelector(".sold").innerHTML=sold<0?`<span class="bad">${sold}</span>`:sold;
  tr.querySelector(".sales").textContent=baht(s);tr.querySelector(".pin").textContent=baht(pinPay);tr.querySelector(".check").innerHTML=sold<0?`<span class="status bad">Investigate</span>`:`<span class="status ok">OK</span>`;
  tr.classList.remove("isPending");tr.classList.add("isDone");tr.classList.toggle("hasError",sold<0);
  tr.querySelector(".weekState").className=`weekState status ${sold<0?"bad":"ok"}`;
  tr.querySelector(".weekState").textContent=sold<0?"Check":"OK";
  tr.querySelector(".weekMini").textContent=`Stock ${closing} • Sold ${sold}${delivered?` • Delivered ${delivered}`:""}`;
  sales+=s;cost+=c;profit+=pr;pin+=pinPay;alix+=alixProfit;bm+=bmProfit;
 });
 document.getElementById("weekTotals").innerHTML=`<span>Sales ${baht(sales)}</span><span>Cost ${baht(cost)}</span><span>Profit ${baht(profit)}</span><span>BM ${baht(bm)}</span><span>Alix ${baht(alix)}</span><span>Pay Pin ${baht(pin)}</span>`;
 return {sales,cost,profit,pin,alix,bm};
}

let weekFilter="pending";
function filterWeekRows(){
 const q=norm(document.getElementById("weekSearch")?.value||"");
 document.querySelectorAll("#weekRows .weekProduct").forEach(row=>{
   const name=norm(row.querySelector(".weekProductTitle b")?.textContent||"");
   const pending=row.querySelector(".closing")?.value==="";
   row.hidden=!!q&&!name.includes(q) || (weekFilter==="pending"&&!pending);
 });
 const pending=[...document.querySelectorAll("#weekRows .weekProduct")].filter(r=>r.querySelector(".closing")?.value==="").length;
 const btn=document.getElementById("weekShowPending");if(btn)btn.textContent=`Pending (${pending})`;
}
document.getElementById("weekSearch").oninput=filterWeekRows;
document.getElementById("weekShowPending").onclick=()=>{weekFilter="pending";filterWeekRows()};
document.getElementById("weekShowAll").onclick=()=>{weekFilter="all";filterWeekRows()};

document.getElementById("loadWeek").onclick=loadWeek;
document.getElementById("weekBranch").onchange=loadWeek;
document.getElementById("saveWeek").onclick=()=>{
 const tb=document.getElementById("weekRows");if(!tb.children.length)return alert("Load the weekly stock first.");
 const trs=[...tb.querySelectorAll(".weekProduct")];
 const missing=trs.filter(tr=>tr.querySelector(".closing").value==="");
 if(missing.length && !confirm(`${missing.length} closing-stock fields are blank. Save blanks as zero?`)) return;
 const rows=trs.map(tr=>({productId:tr.dataset.pid,opening:+tr.dataset.opening,delivered:+tr.dataset.delivered,takeout:+tr.querySelector(".takeout").value||0,closing:tr.querySelector(".closing").value===""?0:+tr.querySelector(".closing").value}));
 const totals=calcWeek(), w={id:"W"+Date.now(),branch:tb.dataset.branch,date:tb.dataset.date,rows,totals};db.weeks.push(w);save();alert("Weekly check saved.");
}

function displayBranchName(branch){
 const b=String(branch||"");
 if(/lamai/i.test(b)) return "BM Lamai";
 if(/bangrak|k\.\s*pual|k\.\s*paul|mini mart/i.test(b)) return "The Grocery by BM";
 return b||"—";
}
function recordDateLabel(d){
 if(!d)return "No date";
 try{return new Date(String(d)+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}catch(e){return d}
}
function renderHistory(){
 const box=document.getElementById("historyList"); if(!box)return;
 const q=(document.getElementById("recordsSearch")?.value||"").trim().toLowerCase();
 const type=document.getElementById("recordsType")?.value||"all";
 const groups=[];
 const deliveries=[...(db.deliveries||[])].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(d=>({type:"delivery",date:d.date,title:displayBranchName(d.branch),meta:d.note||"Delivery docket",status:"Docket",obj:d}));
 const sundays=[...(db.sundayImports||[])].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(r=>{const st=r.reconciliation?reconStatusLabel(r.reconciliation):["unknown","Not checked"];return {type:"sunday",date:r.date,title:displayBranchName(r.branch),meta:`${r.rows?.length||0} products`,status:st[1],statusClass:st[0]==="ok"?"ok":"",obj:r}});
 const invoices=[...(db.invoices||[])].filter(i=>i.status!=="void").sort((a,b)=>String(b.reportDate||"").localeCompare(String(a.reportDate||""))||Number(b.version||1)-Number(a.version||1)).map(i=>{const cur=invoiceRecordState(i);return {type:"invoice",date:i.reportDate,title:(i.number||"Invoice")+(Number(i.version||1)>1?` v${Number(i.version||1)}`:""),meta:"The Grocery by BM + BM Lamai",status:cur.label,statusClass:cur.cls,obj:i};});
 const payments=invoices.filter(x=>x.obj.payment).map(x=>({type:"payment",date:x.obj.payment?.date||x.date,title:x.obj.number||"Payment",meta:x.obj.payment?.note||"Payment record",status:String(x.obj.payment?.status||"unpaid").toUpperCase(),statusClass:x.obj.payment?.status==="paid"?"paid":"unpaid",obj:x.obj}));
 const weekly=[...(db.weeks||[])].filter(w=>!/Excel/i.test(String(w.source||""))).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).map(w=>({type:"weekly",date:w.date,title:displayBranchName(w.branch),meta:"Stock / weekly check",status:"Saved",obj:w}));
 const defs=[['delivery','Delivery dockets',deliveries],['sunday','Sunday reports',sundays],['invoice','Invoices',invoices],['payment','Payments',payments],['weekly','Stock / weekly checks',weekly]];
 defs.forEach(([key,label,items])=>{if(type!=="all"&&type!==key)return;const filtered=items.filter(x=>!q||`${x.date} ${x.title} ${x.meta} ${x.status}`.toLowerCase().includes(q));if(filtered.length)groups.push({key,label,items:filtered})});
 if(!groups.length){box.innerHTML='<div class="recordsEmpty">No matching records. Try another type or clear the search.</div>';return;}
 box.innerHTML=groups.map((g,gi)=>`<details class="recordGroup" ${groups.length===1||gi===0?'open':''}><summary><span class="recordGroupTitle">${g.label}</span><span class="recordGroupChevron">›</span></summary><div class="recordGroupBody">${g.items.map(x=>recordItemHtml(x)).join('')}</div></details>`).join('');
 box.querySelectorAll('.recordGroup').forEach(el=>el.addEventListener('toggle',()=>{if(!el.open)return;box.querySelectorAll('.recordGroup[open]').forEach(o=>{if(o!==el)o.open=false})}));
}
function recordItemHtml(x){
 const o=x.obj||{};
 let action="";
 if(x.type==='delivery') action=`openRecordDelivery('${o.id}')`;
 else if(x.type==='sunday') action=`openRecordSunday('${o.id}')`;
 else if(x.type==='invoice'||x.type==='payment') action=`openInvoiceRecord('${o.id}')`;
 else action=`openRecordWeekly('${o.id}')`;
 return `<div class="recordItemDirect"><button type="button" class="recordItemButton" onclick="${action}"><span class="recordDate">${escapeHtml(recordDateLabel(x.date))}</span><span class="recordMain"><div class="recordName">${escapeHtml(x.title)}</div><div class="recordMeta">${escapeHtml(x.meta)}</div></span><span class="recordStatus ${x.statusClass||''}">${escapeHtml(x.status)}</span><span class="recordOpenChevron">›</span></button></div>`;
}
window.openRecordDelivery=id=>openDeliveryArchive(id);
window.openRecordSunday=id=>{switchTab('import');renderArchive(id);setTimeout(()=>{document.getElementById('archiveList')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
window.openRecordInvoice=id=>openInvoiceRecord(id);
window.openRecordWeekly=id=>{
 const w=(db.weeks||[]).find(x=>x.id===id);if(!w)return;
 // Manual weekly records are retained for evidence but are not part of Pin's normal workflow.
 alert(`${recordDateLabel(w.date)} — ${displayBranchName(w.branch)}\n\nSaved manual stock/weekly check. This is a fallback record; normal Sunday work is handled from the Sunday Excel reports.`);
};

window.showDock=id=>openDeliveryArchive(id)
window.deleteRecord=(kind,id)=>{
 if(kind==="Delivery")return deleteDocket(id);
 if(!confirm(`Delete this ${kind.toLowerCase()} record?`))return;
 db.weeks=db.weeks.filter(x=>x.id!==id);
 save(); renderHistory(); renderMetrics(); renderAudit();
}


function renderCatalogue(){
 ensureProductFamilyStructure();
 const rows=document.getElementById("catalogueRows");
 if(!rows)return;

 const archivedCount=(db.products||[]).filter(isProductArchived).length;
 const activeCount=(db.products||[]).length-archivedCount;
 const status=document.getElementById("catalogueArchiveStatus");
 const missingBarcodeCount=activeVariantsMissingBarcode().length;
 if(status)status.innerHTML=`${activeCount} active variant${activeCount===1?"":"s"}${archivedCount?` · ${archivedCount} archived`:""}${missingBarcodeCount?` · ${missingBarcodeCount} missing barcode`:""}${catalogueMissingBarcodesOnly?`<div class="catalogueMissingOnlyNotice">Showing active variants with no barcode only. <button type="button" class="catalogueActionBtn" onclick="clearMissingBarcodeFilter()">Show full catalogue</button></div>`:""}`;
 const toggle=document.getElementById("toggleArchivedProducts");
 if(toggle)toggle.textContent=showArchivedCatalogue?`Hide archived (${archivedCount})`:`Show archived${archivedCount?` (${archivedCount})`:""}`;

 const visible=(db.products||[]).filter(p=>{
   if(catalogueMissingBarcodesOnly)return !isProductArchived(p)&&!normalizeBarcode(p.barcode);
   return showArchivedCatalogue || !isProductArchived(p);
 });
 const groups=new Map();
 visible.forEach(p=>{
   const parent=productParentName(p)||p.name;
   const key=normalizeProductKey(parent);
   if(!groups.has(key))groups.set(key,{parent,key,items:[]});
   groups.get(key).items.push(p);
 });

 const variantOrder={"1g":1,"5g":2,preroll:3,special:9};
 rows.innerHTML=[...groups.values()]
   .sort((a,b)=>a.parent.localeCompare(b.parent,"en",{sensitivity:"base",numeric:true}))
   .map(g=>{
     const items=g.items.slice().sort((a,b)=>
       (isProductArchived(a)?1:0)-(isProductArchived(b)?1:0) ||
       (variantOrder[a.variantKey]||8)-(variantOrder[b.variantKey]||8) ||
       String(a.name).localeCompare(String(b.name),"en",{sensitivity:"base",numeric:true})
     );
     const allFamily=(db.products||[]).filter(p=>normalizeProductKey(productParentName(p))===g.key);
     const activeFamily=allFamily.filter(p=>!isProductArchived(p));
     const archivedFamily=allFamily.filter(isProductArchived);
     const familyAction=activeFamily.length
       ? `<button class="catalogueParentArchive" type="button" onclick='archiveProductFamily("${escapeHtmlAttr(g.key)}")'>Archive all</button>`
       : `<button class="catalogueParentArchive" type="button" onclick='restoreProductFamily("${escapeHtmlAttr(g.key)}")'>Restore all</button>`;
     const head=`<tr class="catalogueParentRow"><td colspan="5"><div class="catalogueParentMeta"><span>${escapeHtml(g.parent)}${!activeFamily.length?'<span class="catalogueArchivedBadge">ARCHIVED</span>':""}</span><span style="display:flex;align-items:center;gap:7px"><small>${allFamily.length} variant${allFamily.length===1?"":"s"}${archivedFamily.length?` · ${archivedFamily.length} archived`:""}</small>${familyAction}</span></div></td></tr>`;

     const variants=items.map(p=>{
       const archived=isProductArchived(p);
       const missingBarcode=!archived&&!normalizeBarcode(p.barcode);
       return `<tr class="catalogueMobileRow ${archived?"catalogueArchivedRow":""} ${missingBarcode?"catalogueMissingBarcodeRow":""}">
         <td colspan="5">
           <div class="catalogueMobileMain">
             <div class="catalogueMobileInfo">
               <div class="catalogueMobileTop">
                 <span class="catalogueVariantTag">${escapeHtml(productVariantLabel(p))}</span>
                 <span class="catalogueMobileName">${escapeHtml(p.name)}${archived?'<span class="catalogueArchivedBadge">ARCHIVED</span>':""}</span>
               </div>
               <div class="catalogueMobileMeta">
                 <span>Type <b>${escapeHtml(p.type||"—")}</b></span>
                 <span>Cost <b>฿${Number(p.cost||0)}</b></span>
                 <span>Retail <b>฿${Number(p.retail||0)}</b></span>
               </div>
               <div class="catalogueBarcodeField">
                 <input type="text" value="${escapeHtmlAttr(p.barcode||"")}" placeholder="Optional shop barcode" class="keyboardSafeInput" ${archived?"disabled":""} onchange='saveProductBarcode("${p.id}",this.value)'>
                 <span class="catalogueBarcodeStatus ${p.barcode?"ok":"missing"}">${p.barcode?"BARCODE":"MISSING"}</span>
               </div>
             </div>
             <div class="catalogueMobileAction">
               ${archived
                 ? `<button class="catalogueActionBtn restore" type="button" onclick='restoreProductVariant("${p.id}")'>Restore</button>`
                 : `<button class="catalogueActionBtn archive" type="button" onclick='archiveProductVariant("${p.id}")'>Archive</button>`}
             </div>
           </div>
         </td>
       </tr>`;
     }).join("");

     return head+variants;
   }).join("");

 if(!rows.innerHTML)rows.innerHTML='<tr><td colspan="5" class="small">No active products. Use Show archived to restore products.</td></tr>';
}
window.editPrice=(id,k,v)=>{const p=db.products.find(x=>x.id===id);if(!p)return;p[k]=+v;save()}
window.editProductName=(id,value)=>{
 const p=db.products.find(x=>x.id===id);if(!p)return;
 const next=cleanProductDisplayName(value);if(!next){renderCatalogue();return alert("Product name cannot be blank.")}
 const conflict=db.products.find(x=>x.id!==id&&normalizeProductKey(x.name)===normalizeProductKey(next));
 if(conflict){renderCatalogue();return alert(`That master product name already exists as “${conflict.name}”. Use Master Product Setup to merge shop names into it.`)}
 const old=p.name;p.name=next;ensureProductAliases();
 Object.keys(db.productAliases).forEach(k=>{if(db.productAliases[k]===id)db.productAliases[k]=id});
 db.productAliases[normalizeProductKey(old)]=id;
 retroactivelyRemapAllImports(false);save();renderMasterProductSetup();
}

function openDashboardInvoices(){
  switchTab("history");
  const type=document.getElementById("recordsType");
  if(type)type.value="invoice";
  renderHistory();
}
window.openDashboardInvoices=openDashboardInvoices;



function latestActiveSuggestedPackingGroup(){
  const active=(db.deliveries||[]).filter(isSuggestedDraftDocket);
  if(!active.length)return null;
  const dates=[...new Set(active.map(d=>d.sourceSundayDate||d.date||"").filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
  const date=dates[0]||"";
  const dockets=active.filter(d=>(d.sourceSundayDate||d.date||"")===date);
  return {date,dockets};
}

function combinedSuggestedPackingRows(date){
  const active=(db.deliveries||[]).filter(d=>
    isSuggestedDraftDocket(d) &&
    String(d.sourceSundayDate||d.date||"")===String(date||"")
  );
  const combined=new Map();
  active.forEach(d=>{
    (d.lines||[]).forEach(l=>{
      const p=resolvedProductById(l.productId)||db.products.find(x=>x.id===l.productId);
      const name=cleanProductDisplayName(l.productName||p?.name||"Unknown product");
      const key=l.productId||normalizeProductKey(name);
      const row=combined.get(key)||{name,qty:0};
      row.qty+=Number(l.qty||0);
      combined.set(key,row);
    });
  });
  return [...combined.values()]
    .filter(x=>x.qty>0)
    .sort((a,b)=>String(a.name).localeCompare(String(b.name),"en",{sensitivity:"base",numeric:true}));
}

window.openCombinedPackingView=(date)=>{
  const group=latestActiveSuggestedPackingGroup();
  const targetDate=date||group?.date;
  const overlay=document.getElementById("combinedPackingOverlay");
  const body=document.getElementById("combinedPackingBody");
  const subtitle=document.getElementById("combinedPackingSubtitle");
  if(!overlay||!body)return;
  const rows=combinedSuggestedPackingRows(targetDate);
  if(!rows.length){
    body.innerHTML='<div class="packingEmpty">There are no active suggested delivery quantities to pack.</div>';
    if(subtitle)subtitle.textContent="Nothing currently waiting to be packed";
  }else{
    const total=rows.reduce((n,r)=>n+Number(r.qty||0),0);
    if(subtitle)subtitle.textContent=`Week ending ${recordDateLabel(targetDate)} · A–Z packing list`;
    body.innerHTML=`<div class="packingSummary"><span>${rows.length} products</span><b>${total} units to pack</b></div>
      <div class="packingList">${rows.map(r=>`<div class="packingRow"><div class="packingName">${escapeHtml(r.name)}</div><div class="packingQty">${Number(r.qty||0)}</div></div>`).join("")}</div>`;
  }
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
};
window.closeCombinedPackingView=()=>{
  const overlay=document.getElementById("combinedPackingOverlay");
  if(overlay){overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");}
  document.body.style.overflow="";
};

window.openAddProductForm=()=>{
  ensureProductFamilyStructure();
  const overlay=document.getElementById("addProductOverlay");
  const name=document.getElementById("newProductName");
  if(!overlay)return;
  if(name)name.value="";
  const v1=document.getElementById("newVar1g"),v5=document.getElementById("newVar5g"),vpr=document.getElementById("newVarPreRoll"),vc=document.getElementById("newVarCustom");
  if(v1)v1.checked=true;if(v5)v5.checked=false;if(vpr)vpr.checked=false;if(vc)vc.checked=false;
  ["newCustomVariantLabel","newProductCost","newProductRetail","newCustomWeight","newBarcode1g","newBarcode5g","newBarcodePreRoll","newBarcodeCustom"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});
  const type=document.getElementById("newCustomType");if(type)type.value="hash";
  toggleNewProductCustomVariant();
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>name?.focus(),120);
};
window.closeAddProductForm=()=>{
  const overlay=document.getElementById("addProductOverlay");
  if(overlay){overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");}
  document.body.style.overflow="";
};
window.toggleNewProductCustomVariant=()=>{
  const box=document.getElementById("newProductCustomFields");
  box?.classList.toggle("open",!!document.getElementById("newVarCustom")?.checked);
};
function nextProductId(){
  let id="P"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase();
  while((db.products||[]).some(p=>p.id===id))
    id="P"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase();
  return id;
}
function buildNewVariantRecord(parentName,spec){
  const legacyName=
    spec.variantKey==="1g" ? parentName :
    spec.variantKey==="5g" ? `${parentName} 5g` :
    spec.variantKey==="preroll" ? `${parentName} Pre-Roll` :
    `${parentName}${spec.customLabel?` ${spec.customLabel}`:""}`;
  return {
    id:nextProductId(),name:cleanProductDisplayName(legacyName),parentName:cleanProductDisplayName(parentName),
    variantKey:spec.variantKey,variantLabel:spec.variantLabel,unitWeightGrams:spec.unitWeightGrams,
    catalogueException:!!spec.catalogueException,type:spec.type,cost:Number(spec.cost||0),retail:Number(spec.retail||0),
    unit:"each",pricingConvention:spec.pricingConvention,barcode:normalizeBarcode(spec.barcode)||undefined,createdAt:new Date().toISOString(),addedManually:true
  };
}
window.saveNewMasterProduct=()=>{
  const parentName=cleanProductDisplayName(document.getElementById("newProductName")?.value||"");
  if(!parentName)return alert("Enter the product name.");
  const specs=[];
  if(document.getElementById("newVar1g")?.checked)specs.push({variantKey:"1g",variantLabel:"1g",unitWeightGrams:1,type:"kanja",cost:60,retail:150,pricingConvention:"flower",barcode:document.getElementById("newBarcode1g")?.value||""});
  if(document.getElementById("newVar5g")?.checked)specs.push({variantKey:"5g",variantLabel:"5g",unitWeightGrams:5,type:"5g",cost:300,retail:600,pricingConvention:"5g",barcode:document.getElementById("newBarcode5g")?.value||""});
  if(document.getElementById("newVarPreRoll")?.checked)specs.push({variantKey:"preroll",variantLabel:"Pre-Roll",unitWeightGrams:1,type:"preroll",cost:75,retail:150,pricingConvention:"preroll",barcode:document.getElementById("newBarcodePreRoll")?.value||""});
  if(document.getElementById("newVarCustom")?.checked){
    const label=cleanProductDisplayName(document.getElementById("newCustomVariantLabel")?.value||"");
    const type=document.getElementById("newCustomType")?.value||"other";
    const cost=Number(document.getElementById("newProductCost")?.value||0);
    const retail=Number(document.getElementById("newProductRetail")?.value||0);
    const raw=document.getElementById("newCustomWeight")?.value;
    const weight=raw===""?null:Number(raw);
    if(!label)return alert("Enter a name for the special/custom variant.");
    if(!(cost>0))return alert("Enter the custom cost price.");
    if(!(retail>0))return alert("Enter the custom retail price.");
    specs.push({variantKey:"special",variantLabel:label,customLabel:label,unitWeightGrams:Number.isFinite(weight)&&weight>0?weight:null,catalogueException:true,type,cost,retail,pricingConvention:"custom",barcode:document.getElementById("newBarcodeCustom")?.value||""});
  }
  if(!specs.length)return alert("Choose at least one packaged variant.");

  const enteredBarcodes=specs.map(s=>normalizeBarcode(s.barcode)).filter(Boolean);
  if(new Set(enteredBarcodes).size!==enteredBarcodes.length)return alert("Two selected variants have the same barcode. Each sellable variant needs its own barcode.");
  for(const code of enteredBarcodes){
    const owner=barcodeOwner(code);
    if(owner)return alert(`Barcode ${code} is already assigned to ${productParentName(owner)} · ${productVariantLabel(owner)}.`);
  }

  ensureProductAliases();ensureProductFamilyStructure();
  const family=(db.products||[]).filter(p=>normalizeProductKey(productParentName(p))===normalizeProductKey(parentName));
  const keys=new Set(family.map(p=>p.variantKey));
  for(const spec of specs){
    if(spec.variantKey!=="special" && keys.has(spec.variantKey)){
      const existing=family.find(p=>p.variantKey===spec.variantKey);
      return alert(existing&&isProductArchived(existing)
        ? `${parentName} already has an archived ${spec.variantLabel} variant. Restore it from Product Catalogue instead of creating a duplicate.`
        : `${parentName} already has a ${spec.variantLabel} variant.`);
    }
    if(spec.variantKey==="special" && family.some(p=>normalizeProductKey(productVariantLabel(p))===normalizeProductKey(spec.variantLabel)))
      return alert(`${parentName} already has a “${spec.variantLabel}” variant.`);
  }
  const created=specs.map(spec=>buildNewVariantRecord(parentName,spec));
  created.forEach(p=>{db.products.push(p);db.productAliases[normalizeProductKey(p.name)]=p.id});
  localStorage.setItem("mdpin-db",JSON.stringify(db));
  closeAddProductForm();renderAll();
  alert(`${parentName}: ${created.length} variant${created.length===1?"":"s"} added to Pin's master catalogue.`);
};



function mdNowStamp(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}
function mdSafeFilenamePart(v){
  return String(v||"").trim().replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,40);
}
function buildFullBackupPayload(kind="SUPPORT",note=""){
  return {
    magicDragonBackup:true,
    app:"Magic Dragon Pin",
    appVersion:"0.10.12-dev",
    backupKind:String(kind||"SUPPORT").toUpperCase(),
    createdAt:new Date().toISOString(),
    note:String(note||""),
    db:JSON.parse(JSON.stringify(db))
  };
}
async function shareBackupPayload(payload,filenameBase){
  const json=JSON.stringify(payload,null,2);
  const file=new File([json],`${filenameBase}.json`,{type:"application/json"});
  try{
    if(navigator.share && navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file]});
      return {shared:true,file};
    }
  }catch(err){
    if(err?.name==="AbortError")return {shared:false,cancelled:true,file};
    console.warn("Share failed",err);
  }
  try{
    const url=URL.createObjectURL(file);
    const a=document.createElement("a");
    a.href=url;a.download=file.name;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return {shared:false,downloaded:true,file};
  }catch(err){
    console.error(err);
    alert("Backup created, but this device could not open Share or Download.");
    return {shared:false,error:true,file};
  }
}
window.createBaselineSnapshot=async()=>{
  const payload=buildFullBackupPayload("BASELINE","Known-good restore point before Sunday operation");
  const stamp=mdNowStamp();
  try{
    localStorage.setItem("mdpin-baseline-snapshot",JSON.stringify(payload));
    localStorage.setItem("mdpin-baseline-createdAt",payload.createdAt);
  }catch(err){
    console.warn("Could not store baseline locally",err);
  }
  const status=document.getElementById("baselineSnapshotStatus");
  if(status)status.textContent=`Baseline saved locally: ${new Date(payload.createdAt).toLocaleString()}`;
  await shareBackupPayload(payload,`Magic-Dragon-Pin_BASELINE_${stamp}`);
};
window.createSupportBackup=()=>{
  const overlay=document.getElementById("supportBackupModal");
  const note=document.getElementById("supportBackupNote");
  if(note)note.value="";
  if(overlay){
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }
};
window.closeSupportBackup=()=>{
  const overlay=document.getElementById("supportBackupModal");
  if(overlay){
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden","true");
  }
  document.body.style.overflow="";
};
window.shareSupportBackupNow=async()=>{
  const note=document.getElementById("supportBackupNote")?.value||"";
  const payload=buildFullBackupPayload("SUPPORT",note);
  const suffix=mdSafeFilenamePart(note);
  const name=`Magic-Dragon-Pin_SUPPORT_${mdNowStamp()}${suffix?`_${suffix}`:""}`;
  closeSupportBackup();
  await shareBackupPayload(payload,name);
};
function refreshBaselineSnapshotStatus(){
  const status=document.getElementById("baselineSnapshotStatus");
  if(!status)return;
  const created=localStorage.getItem("mdpin-baseline-createdAt");
  status.textContent=created
    ? `Baseline on this device: ${new Date(created).toLocaleString()}`
    : "No baseline snapshot stored on this device yet.";
}
window.restoreLocalBaselineSnapshot=()=>{
  const raw=localStorage.getItem("mdpin-baseline-snapshot");
  if(!raw){
    alert("No local safety snapshot is stored on this device yet.");
    return;
  }
  try{
    const payload=JSON.parse(raw);
    if(!payload?.db||typeof payload.db!=="object")throw new Error("The local snapshot is invalid.");
    const created=payload.createdAt?new Date(payload.createdAt).toLocaleString():"unknown time";
    const counts=backupCounts(payload.db);
    const ok=confirm(`Restore the local safety snapshot?\n\nCreated: ${created}\nProducts: ${counts.products}\nDeliveries: ${counts.deliveries}\nSunday reports: ${counts.sundayReports}\nInvoices: ${counts.invoices}\n\nThis restores the app database only. Archived Sunday source workbooks are not changed.`);
    if(!ok)return;
    Object.keys(db).forEach(k=>delete db[k]);
    Object.assign(db,JSON.parse(JSON.stringify(payload.db)));
    localStorage.setItem("mdpin-db",JSON.stringify(db));
    alert("Local safety snapshot restored. Magic Dragon will now reload.");
    location.reload();
  }catch(err){
    console.error(err);
    alert(err?.message||"The local safety snapshot could not be restored.");
  }
};
function offerSundayCompletionBackup(){
  setTimeout(()=>{
    const ok=confirm("Sunday workflow complete.\n\nCreate / share a full support backup now?");
    if(ok)createSupportBackup();
  },150);
}

window.testSundayBackupPrompt=()=>{
  const ok=confirm("TEST ONLY — no Sunday data will be changed.\n\nThis is the same backup prompt Pin will see after Sunday completion.\n\nCreate / share a full support backup now?");
  if(ok)createSupportBackup();
};


function renderPinDashboard(){
  const barcodeHost=document.getElementById("dashboardBarcodeTask");
  if(barcodeHost){
    const missing=activeVariantsMissingBarcode();
    barcodeHost.innerHTML=missing.length?`<button class="dashboardBarcodeTask" type="button" onclick="openMissingBarcodes()"><b>Barcode needed — ${missing.length} variant${missing.length===1?"":"s"}</b><small>Tap to review active products still waiting for shop barcodes.</small></button>`:"";
  }
  const badge=document.getElementById("pinDashboardState");
  const title=document.getElementById("pinSundayPrimaryTitle");
  const copy=document.getElementById("pinSundayPrimaryText");
  const button=document.getElementById("pinSundayPrimary");
  if(!badge||!title||!copy||!button)return;

  ensureCompletedSundayCycles();
  const activeDate=db.activeSundayCycleDate||null;

  if(activeDate && !isSundayCycleComplete(activeDate)){
    badge.textContent="IN PROGRESS";
    badge.classList.add("active");
    title.textContent="Continue Sunday Workflow";
    copy.textContent=`Continue ${recordDateLabel(activeDate)} from where you left off.`;
    button.setAttribute("aria-label",`Continue Sunday workflow for ${recordDateLabel(activeDate)}`);
  }else{
    badge.textContent="READY";
    badge.classList.remove("active");
    title.textContent="Start Sunday Workflow";
    copy.textContent="Import reports, reconcile, invoice and record payment.";
    button.setAttribute("aria-label","Start Sunday workflow");
  }

  const draftsBox=document.getElementById("pinSuggestedDrafts");
  if(draftsBox){
    migrateLegacyDeliverySuggestions();
    const drafts=[...(db.deliveries||[])]
      .filter(isSuggestedDraftDocket)
      .sort((a,b)=>String(a.branch||"").localeCompare(String(b.branch||"")));
    if(!drafts.length){
      draftsBox.style.display="none";
      draftsBox.innerHTML="";
    }else{
      draftsBox.style.display="grid";
      const packingGroup=latestActiveSuggestedPackingGroup();
      const packingRows=packingGroup?combinedSuggestedPackingRows(packingGroup.date):[];
      const packingQty=packingRows.reduce((n,r)=>n+Number(r.qty||0),0);
      draftsBox.innerHTML=`<div class="pinSuggestedTitle">Suggested delivery dockets</div>`+
        drafts.map(d=>{
          const ref=d.suggestedRef||suggestedDraftRef(d.sourceSundayDate||d.date,d.branch);
          const qty=(d.lines||[]).reduce((n,l)=>n+Number(l.qty||0),0);
          return `<button class="pinSuggestedCard" type="button" onclick='openSuggestedDraftFromDashboard("${d.id}")'>
            <span><b>${escapeHtml(displayBranchName(d.branch))}</b><small>${escapeHtml(recordDateLabel(d.date||d.sourceSundayDate))} · ${escapeHtml(ref)}</small></span>
            <span class="pinSuggestedQty">${qty} units ›</span>
          </button>`;
        }).join("")+
        (packingGroup&&packingRows.length?`<button class="pinSuggestedCard pinCombinedPacking" type="button" onclick='openCombinedPackingView("${packingGroup.date}")'>
          <span><b>Combined Suggested Delivery</b><small>A–Z packing quick view · ${escapeHtml(recordDateLabel(packingGroup.date))}</small></span>
          <span class="pinSuggestedQty">${packingQty} units ›</span>
        </button>`:"");
    }
  }
}

function renderMetrics(){
 renderPinDashboard();
 const ds=db.deliveries.reduce((s,d)=>s+d.lines.reduce((a,l)=>{const p=db.products.find(x=>x.id===l.productId);return a+l.qty*(p?.cost||0)},0),0);
 const ws=db.weeks.reduce((s,w)=>s+(w.totals?.sales||0),0);
 const latestByDate={};(db.invoices||[]).filter(i=>i&&i.status!=="void").forEach(i=>{const d=i.reportDate;if(!d)return;if(!latestByDate[d]||Number(i.version||1)>Number(latestByDate[d].version||1))latestByDate[d]=i;});
 const currentInvoices=Object.values(latestByDate).filter(i=>!i.supersededBy);
 const unpaid=currentInvoices.filter(i=>i.payment?.status!=="paid");
 const unpaidTotal=unpaid.reduce((n,i)=>n+Number(i.totals?.payPin||0),0);
 const activeDate=db.activeSundayCycleDate||null;
 const sundayLabel=activeDate?`In progress · ${recordDateLabel(activeDate)}`:"Ready for next Sunday";
 const am=document.getElementById("dashboardActionMetrics");if(am)am.innerHTML=`<div class="dashboardActionCard ${unpaid.length?'warn':'ok'}"><div class="k">Unpaid invoices</div><div class="v">${unpaid.length?`${unpaid.length} · ${baht(unpaidTotal)}`:"None"}</div></div><div class="dashboardActionCard ${activeDate?'warn':'ok'}"><div class="k">Sunday status</div><div class="v smallStatus">${escapeHtml(sundayLabel)}</div></div>`;
 const legacyMetrics=document.getElementById("metrics");
 if(legacyMetrics){legacyMetrics.innerHTML="";legacyMetrics.style.display="none";}
 const trend=document.getElementById("payPinTrend");
 if(trend){
   const paid=currentInvoices.filter(i=>i.payment?.status==='paid').sort((a,b)=>String(b.reportDate||b.payment?.date||'').localeCompare(String(a.reportDate||a.payment?.date||'')));
   const recentPaid=paid.slice(0,3).reverse();
   const cells=[];
   for(let i=0;i<3;i++){
     const inv=recentPaid[i-(3-recentPaid.length)];
     if(inv){cells.push(`<div class="payPinTrendCell"><div class="d">${escapeHtml(recordDateLabel(inv.reportDate||inv.payment?.date))}</div><div class="a">${baht(inv.totals?.payPin||0)}</div></div>`)}
     else cells.push(`<div class="payPinTrendCell"><div class="d">Earlier week</div><div class="a">—</div></div>`);
   }
   cells.push(`<div class="payPinTrendCell current ${unpaidTotal>0?'due':''}"><div class="d">CURRENT DUE</div><div class="a">${baht(unpaidTotal)}</div></div>`);
   let arrow='';
   if(recentPaid.length>=2){const prev=Number(recentPaid[recentPaid.length-2].totals?.payPin||0),last=Number(recentPaid[recentPaid.length-1].totals?.payPin||0);if(prev>0){const pct=Math.round(((last-prev)/prev)*100);arrow=`<span class="payPinTrendArrow ${pct>0?'up':pct<0?'down':'flat'}">${pct>0?'↑':pct<0?'↓':'→'} ${Math.abs(pct)}%</span>`;}}
   trend.innerHTML=`<div class="payPinTrendTitle"><span>Pay Pin · recent weeks</span>${arrow}</div><div class="payPinTrendGrid">${cells.join('')}</div>`;
 }
 const recent=document.getElementById("dashboardRecent");
 if(recent){
   const latestDelivery=[...(db.deliveries||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
   ensureCompletedSundayCycles();
   const latestCycle=[...(db.completedSundayCycles||[])].filter(x=>x?.status==='complete').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
   const paidInvoices=currentInvoices.filter(i=>i.payment?.status==='paid').sort((a,b)=>String(b.payment?.date||b.reportDate||'').localeCompare(String(a.payment?.date||a.reportDate||'')));
   const latestPaid=paidInvoices[0];
   const rows=[];
   if(latestDelivery)rows.push(`<div><span>Last delivery</span><b>${escapeHtml(recordDateLabel(latestDelivery.date))} · ${escapeHtml(displayBranchName(latestDelivery.branch))}</b></div>`);
   if(latestCycle)rows.push(`<div><span>Last Sunday completed</span><b>${escapeHtml(recordDateLabel(latestCycle.date))}</b></div>`);
   if(latestPaid)rows.push(`<div><span>Last payment</span><b>${escapeHtml(recordDateLabel(latestPaid.payment?.date||latestPaid.reportDate))} · ${baht(latestPaid.totals?.payPin||0)}</b></div>`);
   recent.innerHTML=rows.length?`<div class="dashboardRecentTitle">Recent activity</div>${rows.join('')}`:'';
   recent.style.display=rows.length?'block':'none';
 }
}

function auditData(){
 let issues=[], checked=0, pending=0;
 db.weeks.forEach(w=>{
   w.rows.forEach(r=>{
     const p=db.products.find(x=>x.id===r.productId);
     const productName=p?.name||r.sourceProductName||"Unknown product";
     if(r.opening==null || r.closing==null) return;
     const available=(Number(r.opening)||0)+(Number(r.delivered)||0)-(Number(r.takeout)||0), sold=available-(Number(r.closing)||0); checked++;
     if(sold<0) issues.push({date:w.date,branch:w.branch,product:productName,msg:`Closing stock ${r.closing} exceeds available stock ${available} by ${Math.abs(sold)}.`});
     if(r.reportedSold!=null && Math.abs(sold-Number(r.reportedSold))>0.001) issues.push({date:w.date,branch:w.branch,product:productName,msg:`Calculated sold ${sold} does not match shop-reported sold ${r.reportedSold}.`});
   });
 });
 db.deliveries.forEach(d=>{
   const covered=db.weeks.some(w=>w.branch===d.branch && w.date>=d.date);
   if(!covered){pending++; issues.push({date:d.date,branch:d.branch,product:"Delivery",msg:`Delivery ${d.id} has not yet been covered by a saved weekly check.`})}
 });
 return {issues,checked,pending};
}
function renderAudit(){
 const a=auditData(), branch=document.getElementById("auditBranch")?.value||"All branches", q=(document.getElementById("auditSearch")?.value||"").toLowerCase();
 let rows=a.issues.filter(i=>(branch==="All branches"||i.branch===branch)&&(!q||`${i.date} ${i.branch} ${i.product} ${i.msg}`.toLowerCase().includes(q)));
 document.getElementById("auditSummary").innerHTML=[
  ["Checks reviewed",a.checked],["Issues found",a.issues.length],["Pending deliveries",a.pending],["Saved weeks",db.weeks.length]
 ].map(x=>`<div class="card metric"><div class="k">${x[0]}</div><div class="v">${x[1]}</div></div>`).join("");
 document.getElementById("auditList").innerHTML=rows.length?rows.map(i=>`<div class="auditrow"><span class="status bad">Review</span> <b>${i.product}</b> · ${i.branch}<div class="small">${i.date}</div><div>${i.msg}</div></div>`).join(""):`<div class="notice"><b>No matching discrepancies.</b> The saved records currently reconcile under the checks available in this build.</div>`;
 const log=document.getElementById("docketAuditLog");
 if(log){
   const entries=[...(db.docketAudit||[])].sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));
   log.innerHTML=entries.length?entries.map(e=>{
     const snap=e.deletedSnapshot||e.beforeSnapshot||{};
     const count=(snap.lines||e.lines||[]).length;
     const when=e.at?new Date(e.at).toLocaleString():"";
     const edited=e.action==="edited";
     return `<div class="auditrow"><span class="status ${edited?"warn":"bad"}">${edited?"Edited":"Deleted"}</span> <b>${escapeHtml(e.date||snap.date||"No date")} — ${escapeHtml(e.branch||snap.branch||"No branch")}</b><div class="small">${escapeHtml(when)} · ${count} line${count===1?"":"s"} · Original docket ID ${escapeHtml(e.docketId||snap.id||"—")}</div></div>`;
   }).join(""):`<div class="small">No delivery docket changes recorded yet.</div>`;
 }
}


const historicalData={"weekly_reports": [{"branch": "Lamai", "old_stock_from": "2026-07-18", "check_date": "2026-07-25", "totals": {"sales": 1050, "cost": 450, "profit": 600, "bm": 240, "alix": 180, "pin_profit": 180, "pay_pin": 630}}, {"branch": "Lamai", "old_stock_from": "2026-07-25", "check_date": "2026-08-02", "totals": {"sales": 2100, "cost": 930, "profit": 1170, "bm": 468, "alix": 351, "pin_profit": 351, "pay_pin": 1281}}, {"branch": "Lamai", "old_stock_from": "2026-08-02", "check_date": "2026-08-09", "totals": {"sales": 1950, "cost": 870, "profit": 1080, "bm": 432, "alix": 324, "pin_profit": 324, "pay_pin": 1194}}], "dockets": [{"branch": "BM Bangrak", "date": "2026-08-05", "lines": [["Gummy 4 Leaf", 15, 100]], "total": 1500, "calculated_total": 1500, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-08-06", "lines": [["Super Boof Pre-roll", 20, 75], ["Permanent Marker Pre-roll", 20, 75], ["Super Lemon Haze Pre-roll", 15, 75], ["Miami Pre-roll", 15, 75], ["Tropicana Cookies Pre-roll", 15, 75], ["Black Cherry Punch Pre-roll", 10, 75]], "total": 7125, "calculated_total": 7125, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-08-06", "lines": [["Super Lemon Haze 1g", 30, 60], ["Permanent Marker 1g", 30, 60], ["Tropicana Cookies 1g", 30, 60], ["Miami 1g", 15, 60], ["Super Lemon Haze 5g", 5, 300], ["Permanent Marker 5g", 3, 300], ["Tropicana Cookies 5g", 3, 300], ["Miami 5g", 2, 300]], "total": 10200, "calculated_total": 10200, "total_check": true}, {"branch": "Lamai", "date": "2026-08-06", "lines": [["Super Lemon Haze 1g", 6, 60], ["Tropicana Cookies 1g", 6, 60], ["Permanent Marker 1g", 6, 60], ["Super Lemon Haze Pre-roll", 6, 75], ["Tropicana Cookies Pre-roll", 6, 75], ["Permanent Marker Pre-roll", 6, 75], ["Black Cherry Punch Pre-roll", 4, 75]], "total": 2730, "calculated_total": 2730, "total_check": true}, {"branch": "Lamai", "date": null, "lines": [["Super Lemon Haze 1g", 6, 60], ["Tropicana Cookies 1g", 6, 60], ["Super Lemon Haze Pre-roll", 6, 75], ["Tropicana Cookies Pre-roll", 6, 75], ["Black Cherry Punch Pre-roll", 4, 75]], "total": 1920, "calculated_total": 1920, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-08-14", "lines": [["Gummy 4 Leaf", 10, 100]], "total": 1000, "calculated_total": 1000, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-08-24", "lines": [["Cali Mousse 1g", 10, 350], ["Super Boof 1g", 7, 60], ["Tropicana Cookies Pre-roll", 5, 75], ["Miami Pre-roll", 10, 75], ["Super Lemon Haze Pre-roll", 12, 75], ["Permanent Marker Pre-roll", 11, 75], ["Gummy 4 Leaf", 15, 100]], "total": 8270, "calculated_total": 8270, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-09-02", "lines": [["Super Lemon Haze 1g", 15, 60], ["Permanent Marker 5g", 1, 300], ["Super Lemon Haze Pre-roll", 18, 75], ["Permanent Marker Pre-roll", 12, 75], ["Miami Pre-roll", 10, 75], ["Tropicana Cookies Pre-roll", 5, 75]], "total": 4575, "calculated_total": 4575, "total_check": true}, {"branch": "Lamai", "date": "2026-09-02", "lines": [["King's Tars 1g", 2, 60], ["Super Boof 1g", 4, 60], ["Black Cherry Punch 1g", 6, 60], ["Super Boof Pre-roll", 5, 75], ["Tropicana Cookies Pre-roll", 3, 75], ["Super Lemon Haze Pre-roll", 3, 75]], "total": 1545, "calculated_total": 1545, "total_check": true}, {"branch": "BM Bangrak", "date": "2026-09-07", "lines": [["Gummy 4 Leaf", 20, 100]], "total": 2000, "calculated_total": 2000, "total_check": true}]};
function renderHistorical(){
 const ws=historicalData.weekly_reports;
 const ds=historicalData.dockets;
 const docketValue=ds.reduce((a,d)=>a+d.total,0);
 const knownDates=ds.filter(d=>d.date).length;
 document.getElementById("histMetrics").innerHTML=[
  ["Weekly reports",ws.length],["Delivery dockets",ds.length],["Docket value",baht(docketValue)],["Dated dockets",knownDates+"/"+ds.length]
 ].map(x=>`<div class="card metric"><div class="k">${x[0]}</div><div class="v">${x[1]}</div></div>`).join("");
 document.getElementById("histWeeks").innerHTML=ws.map(w=>{
   const t=w.totals, splitOK=Math.abs((t.bm+t.alix+t.pin_profit)-t.profit)<0.01, pinOK=Math.abs((t.cost+t.pin_profit)-t.pay_pin)<0.01;
   return `<tr><td>${w.old_stock_from} → ${w.check_date}</td><td>${baht(t.sales)}</td><td>${baht(t.cost)}</td><td>${baht(t.profit)}</td><td>${baht(t.bm)}</td><td>${baht(t.alix)}</td><td>${baht(t.pin_profit)}</td><td>${baht(t.pay_pin)}</td><td>${splitOK&&pinOK?'<span class="status ok">Matches</span>':'<span class="status bad">Review</span>'}</td></tr>`;
 }).join("");
 const branch=document.getElementById("histBranch")?.value||"All branches";
 const filt=ds.filter(d=>branch==="All branches"||d.branch===branch);
 document.getElementById("histDockets").innerHTML=filt.map((d,i)=>`<div class="auditrow"><div style="display:flex;justify-content:space-between;gap:10px"><div><b>${d.branch}</b><div class="small">${d.date||'<span class="status warn">Date not visible</span>'}</div></div><div><b>${baht(d.total)}</b> ${d.total_check?'<span class="status ok">Arithmetic OK</span>':'<span class="status bad">Total mismatch</span>'}</div></div><div class="small" style="margin-top:6px">${d.lines.map(l=>`${l[1]} × ${l[0]} @ ฿${l[2]}`).join(" · ")}</div></div>`).join("");
}



let selectedXlsxFiles=[];

function loadSheetJS(){
  if(window.XLSX) return Promise.resolve(true);
  return new Promise(resolve=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.onload=()=>resolve(true);
    s.onerror=()=>resolve(false);
    document.head.appendChild(s);
  });
}

function sanitizeArchivePart(s){
  return String(s||"").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
}

function parseDateFromText(s){
  const m=String(s||"").match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if(!m) return null;
  const dd=m[1].padStart(2,"0"), mm=m[2].padStart(2,"0"), yyyy=m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function detectBranchFromWorkbook(rows, filename){
  const hay=[filename, ...(rows.slice(0,4).flat().filter(Boolean))].join(" ").toLowerCase();
  if(hay.includes("lamai")) return "Lamai";
  if(hay.includes("k.pual") || hay.includes("k.paul") || hay.includes("bangrak") || hay.includes("mini mart") || hay.includes("minimart")) return "BM Bangrak";
  return null;
}

function findHeaderRow(rows){
  for(let i=0;i<Math.min(rows.length,12);i++){
    const vals=(rows[i]||[]).map(v=>String(v||"").toLowerCase());
    if(vals.some(v=>v.includes("products")) && vals.some(v=>v.includes("old stock"))) return i;
  }
  return 2; // current BM format fallback
}



function findWeeklyBlockStarts(rows){
  const starts=[];
  for(let i=0;i<rows.length;i++){
    const vals=(rows[i]||[]).map(v=>String(v??"").trim());
    const hay=vals.join(" | ").toLowerCase();

    // Strong marker used by both real BM and Lamai sheets:
    // report title row contains BOTH "Old Stock from" and "Check Date".
    const titleMarker=hay.includes("old stock from") && hay.includes("check date");

    // Secondary structural check: a No./Products row followed shortly by
    // Old stock/New Deliver/Take out headings.
    let tableMarker=false;
    if(!titleMarker){
      const lower=vals.map(v=>v.toLowerCase());
      const rowHasNo=lower.some(v=>v==="no."||v==="no");
      const rowHasProducts=lower.some(v=>v.includes("product"));
      if(rowHasNo&&rowHasProducts){
        for(let j=i+1;j<=Math.min(i+2,rows.length-1);j++){
          const h=(rows[j]||[]).map(v=>String(v??"").toLowerCase()).join(" | ");
          if(h.includes("old stock")&&h.includes("new deliver")&&h.includes("take out")){
            tableMarker=true;
            break;
          }
        }
      }
    }

    // Prefer title rows. Table-marker rows are shifted upward if possible
    // to the nearest title row, otherwise used as a fallback.
    if(titleMarker){
      starts.push(i);
    }else if(tableMarker){
      let title=i;
      for(let k=Math.max(0,i-3);k<i;k++){
        const h=(rows[k]||[]).map(v=>String(v??"").toLowerCase()).join(" | ");
        if(h.includes("old stock from")&&h.includes("check date")) title=k;
      }
      if(!starts.includes(title)) starts.push(title);
    }
  }

  // Last-resort fallback for a single known-format report.
  if(!starts.length && rows.length>4) starts.push(0);

  return [...new Set(starts)].sort((a,b)=>a-b);
}


function parseFlexibleDateText(s){
  const text=String(s||"");
  let m=text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if(m){
    return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  m=text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/);
  if(m){
    return `20${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  return null;
}

function findDateNearBlock(rows,start){
  let checkDate=null,oldDate=null;
  const to=Math.min(rows.length-1,start+8);
  for(let i=start;i<=to;i++){
    const row=rows[i]||[];
    for(const cell of row){
      const t=String(cell||"");
      if(/check date/i.test(t)) checkDate=parseFlexibleDateText(t)||checkDate;
      if(/old stock from/i.test(t)) oldDate=parseFlexibleDateText(t)||oldDate;
    }
  }
  return {checkDate,oldDate};
}

function parseWeeklyBlock(rows,start,end,branch,filename,sheetName,idx){
 const parsed=[];
 for(let r=start+1;r<end;r++){
  const row=rows[r]||[],no=row[0],product=row[1];
  if(typeof no!=="number"||!product||typeof product!=="string")continue;
  parsed.push({no,product:String(product).trim(),oldStock:numOrNull(row[2]),newDeliver:numOrNull(row[3]),takeOut:numOrNull(row[4]),total:numOrNull(row[5]),inStock:numOrNull(row[6]),sold:numOrNull(row[7]),sellPrice:numOrNull(row[8]),cost:numOrNull(row[9]),totalSales:numOrNull(row[11]),totalCost:numOrNull(row[12]),totalProfit:numOrNull(row[13]),bmShare:numOrNull(row[14]),alixShare:numOrNull(row[15]),pinShare:numOrNull(row[16])});
 }
 if(!parsed.length)return null;
 const dates=findDateNearBlock(rows,start),date=dates.checkDate||today(),branchLabel=displayBranchName(branch||"Unknown-Branch");
 return {sheetName,branch,date,oldDate:dates.oldDate,rows:parsed,archiveName:`${date}_${sanitizeArchivePart(branchLabel)}_Sunday-Stock.xlsx`,originalFilename:filename,blockIndex:idx,startRow:start+1,endRow:end};
}
function parseSundayWorkbook(arrayBuffer,filename){
 const wb=XLSX.read(arrayBuffer,{type:"array",cellDates:false,cellFormula:true,cellNF:false}); if(!wb.SheetNames.length)throw new Error("Workbook contains no worksheets.");
 const reports=[];
 for(const sheetName of wb.SheetNames){
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,raw:true,defval:null});
  const branch=detectBranchFromWorkbook(rows,filename),starts=findWeeklyBlockStarts(rows);
  starts.forEach((start,i)=>{const rep=parseWeeklyBlock(rows,start,i+1<starts.length?starts[i+1]:rows.length,branch,filename,sheetName,i);if(rep)reports.push(rep)});
 }
 if(!reports.length)throw new Error("No weekly stock report blocks were found."); return reports;
}



function numOrNull(v){
  if(v===null || v===undefined || v==="") return null;
  if(typeof v==="number") return Number.isFinite(v)?v:null;

  const s=String(v).trim();
  const direct=Number(s);
  if(Number.isFinite(direct)) return direct;

  // Safely evaluate only very simple numeric formula strings such as
  // =2, =4+2, =10-3. Cell-reference formulas normally arrive with
  // cached numeric values from Excel and do not use this fallback.
  if(/^=\s*[\d.\s+\-*/()]+$/.test(s)){
    try{
      const n=Function(`"use strict";return (${s.slice(1)})`)();
      return Number.isFinite(n)?n:null;
    }catch(e){}
  }
  return null;
}



function daysBetween(a,b){
  if(!a||!b) return null;
  const da=new Date(a+"T00:00:00"), dbb=new Date(b+"T00:00:00");
  return Math.round((dbb-da)/86400000);
}

function cleanProductDisplayName(s){
  return String(s||"").trim().replace(/\s+/g," ");
}
function hasWhitespaceNoise(s){
  const raw=String(s||"");
  return raw!==raw.trim() || /\s{2,}/.test(raw);
}

function normalizeProductKey(s){
  return norm(String(s||"")
    .replace(/pre[\s\-]?roll/gi,"preroll")
    .replace(/pre[\s\-]?oll/gi,"preroll")
    .replace(/\b1\s*g(?:ram)?\.?/gi,"1g")
    .replace(/\b5\s*g(?:ram)?\.?/gi,"5g")
    .replace(/[’']/g,""));
}
function productFamilyKey(name){
  return normalizeProductKey(correctedCanonicalProductName(name))
    .replace(/\s+(?:1g|5g|preroll)$/,'')
    .trim();
}

function inferProductVariantFromPrices(p){
  const cost=Number(p?.cost||0), retail=Number(p?.retail||0);
  if(Math.abs(cost-60)<0.001 && Math.abs(retail-150)<0.001)
    return {variantKey:"1g",variantLabel:"1g",unitWeightGrams:1,exception:false};
  if(Math.abs(cost-300)<0.001 && Math.abs(retail-600)<0.001)
    return {variantKey:"5g",variantLabel:"5g",unitWeightGrams:5,exception:false};
  if(Math.abs(cost-75)<0.001 && Math.abs(retail-150)<0.001)
    return {variantKey:"preroll",variantLabel:"Pre-Roll",unitWeightGrams:1,exception:false};

  const n=String(p?.name||"");
  if(/gummy|edible/i.test(n) || p?.type==="edible")
    return {variantKey:"special",variantLabel:"Gummy / Edible",unitWeightGrams:null,exception:true};
  if(/hash|mousse|concentrate/i.test(n) || p?.type==="hash")
    return {variantKey:"special",variantLabel:"Hash / Special",unitWeightGrams:null,exception:true};
  return {variantKey:"special",variantLabel:"Special",unitWeightGrams:null,exception:true};
}

function inferParentProductName(p,variant){
  let n=cleanProductDisplayName(correctedCanonicalProductName(p?.name||""));
  if(variant?.variantKey==="5g") n=n.replace(/\s+5\s*g\.?$/i,"").trim();
  if(variant?.variantKey==="preroll") n=n.replace(/\s+Pre[\s-]?Roll$/i,"").trim();
  if(variant?.variantKey==="1g") n=n.replace(/\s+1\s*g\.?$/i,"").trim();
  return cleanProductDisplayName(n);
}

function ensureProductFamilyStructure(){
  let changed=false;
  (db.products||[]).forEach(p=>{
    if(!p||!p.id)return;
    const inferred=inferProductVariantFromPrices(p);
    const parent=inferParentProductName(p,inferred);
    if(!p.parentName){p.parentName=parent;changed=true}
    if(!p.variantKey){p.variantKey=inferred.variantKey;changed=true}
    if(!p.variantLabel){p.variantLabel=inferred.variantLabel;changed=true}
    if(p.unitWeightGrams===undefined){p.unitWeightGrams=inferred.unitWeightGrams;changed=true}
    if(p.catalogueException===undefined){p.catalogueException=!!inferred.exception;changed=true}
  });
  if(changed)localStorage.setItem("mdpin-db",JSON.stringify(db));
  return changed;
}
function productParentName(p){
  if(!p)return "";
  return cleanProductDisplayName(p.parentName||inferParentProductName(p,inferProductVariantFromPrices(p)));
}
function productVariantLabel(p){
  if(!p)return "";
  return p.variantLabel||inferProductVariantFromPrices(p).variantLabel;
}

function productHintMatches(p,hint={}){
  if(!p)return false;
  const hc=Number(hint.cost), hr=Number(hint.retail);
  const hasC=Number.isFinite(hc)&&hc>0, hasR=Number.isFinite(hr)&&hr>0;
  if(!hasC&&!hasR)return true;
  const pc=Number(p.cost), pr=Number(p.retail);
  if(hasC && (!(pc>0)||Math.abs(pc-hc)>0.001))return false;
  if(hasR && (!(pr>0)||Math.abs(pr-hr)>0.001))return false;
  return true;
}
function contextualFamilyMatch(name,hint={}){
  const family=productFamilyKey(name);
  if(!family)return null;
  const candidates=(db.products||[]).filter(p=>productFamilyKey(p.name)===family && productHintMatches(p,hint));
  if(candidates.length===1)return candidates[0];
  return null;
}

function basePriceReferenceForName(name){
  const corrected=correctedCanonicalProductName(name);
  const key=normalizeProductKey(corrected);
  let ref=BASE_PRODUCTS.find(p=>normalizeProductKey(p.name)===key);
  if(ref)return ref;
  // The original catalogue omitted the visible "1g" suffix on standard 1g flower.
  // Treat an otherwise exact "... 1g" name as the same product, but never fuzzy-match prices.
  const without1g=key.replace(/\s+1g$/,'').trim();
  if(without1g!==key){
    ref=BASE_PRODUCTS.find(p=>p.type==='kanja' && normalizeProductKey(p.name)===without1g);
    if(ref)return ref;
  }
  return null;
}
function repairKnownProductPrices(){
  let repaired=0;
  (db.products||[]).forEach(p=>{
    if(Number(p.cost)>0 && Number(p.retail)>0)return;
    let ref=basePriceReferenceForName(p.name);
    if(!ref){
      // If the master product was renamed, one of its saved aliases may still be a known base name.
      const aliasKey=Object.keys(db.productAliases||{}).find(k=>db.productAliases[k]===p.id && basePriceReferenceForName(k));
      if(aliasKey)ref=basePriceReferenceForName(aliasKey);
    }
    if(!ref)return;
    if(!(Number(p.cost)>0) && Number(ref.cost)>0){p.cost=Number(ref.cost);repaired++}
    if(!(Number(p.retail)>0) && Number(ref.retail)>0){p.retail=Number(ref.retail);repaired++}
    if(!p.type)p.type=ref.type;
  });
  if(repaired)localStorage.setItem("mdpin-db",JSON.stringify(db));
  return repaired;
}
function resolvedProductById(id){
  return (db.products||[]).find(p=>p.id===id)||null;
}
function validatedProductPrices(p){
  if(!p)return null;
  let cost=Number(p.cost)||0, retail=Number(p.retail)||0;
  if(cost>0 && retail>0)return {cost,retail};
  const ref=basePriceReferenceForName(p.name);
  if(ref){
    if(cost<=0)cost=Number(ref.cost)||0;
    if(retail<=0)retail=Number(ref.retail)||0;
  }
  return {cost,retail};
}


function ensureProductAliases(){if(!db.productAliases)db.productAliases={};if(!db.deferredMappings)db.deferredMappings={}}
function canonicalProductMatch(name,hint={}){
 ensureProductAliases();
 const corrected=correctedCanonicalProductName(name),n=normalizeProductKey(corrected);
 const aid=db.productAliases[n];
 if(aid){
   const p=db.products.find(x=>x.id===aid);
   if(p){
     // A saved alias is authoritative unless the shop row carries a strong price signature
     // proving it is a different size/form of the same product family.
     if(productHintMatches(p,hint))return {product:p,score:1,viaAlias:true,suggestion:p};
     const contextual=contextualFamilyMatch(corrected,hint);
     if(contextual)return {product:contextual,score:1,viaAlias:false,contextual:true,suggestion:contextual};
     return {product:p,score:1,viaAlias:true,suggestion:p};
   }
 }
 let exact=db.products.find(p=>normalizeProductKey(correctedCanonicalProductName(p.name))===n);
 if(exact){
   if(productHintMatches(exact,hint))return {product:exact,score:1,viaAlias:false,suggestion:exact};
   const contextual=contextualFamilyMatch(corrected,hint);
   if(contextual)return {product:contextual,score:1,viaAlias:false,contextual:true,suggestion:contextual};
   return {product:exact,score:1,viaAlias:false,suggestion:exact};
 }
 // Exact standard-flower identity when the shop includes a redundant 1g suffix.
 const without1g=n.replace(/\s+1g$/,'').trim();
 if(without1g!==n){
   const oneGram=db.products.filter(p=>p.type==='kanja' && normalizeProductKey(correctedCanonicalProductName(p.name))===without1g);
   if(oneGram.length===1 && productHintMatches(oneGram[0],hint))return {product:oneGram[0],score:1,viaAlias:false,contextual:true,suggestion:oneGram[0]};
 }
 const contextual=contextualFamilyMatch(corrected,hint);
 if(contextual)return {product:contextual,score:1,viaAlias:false,contextual:true,suggestion:contextual};
 let best=null,bestScore=0;db.products.forEach(p=>{const sc=similarity(n,normalizeProductKey(correctedCanonicalProductName(p.name)));if(sc>bestScore){bestScore=sc;best=p}});
 // Fuzzy matches are suggestions only. Unknown shop spellings must be reviewed before they become canonical.
 return {product:null,score:bestScore,viaAlias:false,suggestion:best};
}
function canonicalProductMatchRow(rr){
 return canonicalProductMatch(rr?.product||rr?.sourceProductName||"",{cost:rr?.cost,retail:rr?.sellPrice});
}

function saveProductAlias(sourceName,productId){ensureProductAliases();db.productAliases[normalizeProductKey(sourceName)]=productId;save()}


function isExcelSourceRecord(r){
  return /excel/i.test(String(r?.source||"")) || r?.importAudit?.type==="xlsx";
}

function cleanupDataIntegrity(){
  if(!db.weeks) db.weeks=[];
  ensureSundayArchive();

  let removedWeeks=0, removedArchives=0, supersededLowerQuality=0;

  const grouped=new Map();
  db.weeks.forEach((w,idx)=>{
    const key=`${w.branch||""}|${w.date||""}`;
    if(!grouped.has(key)) grouped.set(key,[]);
    grouped.get(key).push({w,idx});
  });
  const keepWeekIds=new Set();
  for(const entries of grouped.values()){
    entries.sort((a,b)=>{
      const ae=isExcelSourceRecord(a.w)?1:0, be=isExcelSourceRecord(b.w)?1:0;
      if(ae!==be) return be-ae;
      return b.idx-a.idx;
    });
    keepWeekIds.add(entries[0].w.id);
    if(entries.length>1){
      removedWeeks += entries.length-1;
      supersededLowerQuality += entries.slice(1).filter(e=>!isExcelSourceRecord(e.w)&&isExcelSourceRecord(entries[0].w)).length;
    }
  }
  db.weeks=db.weeks.filter(w=>keepWeekIds.has(w.id));

  const ag=new Map();
  db.sundayImports.forEach((r,idx)=>{
    const key=`${r.branch||""}|${r.date||""}`;
    if(!ag.has(key)) ag.set(key,[]);
    ag.get(key).push({r,idx});
  });
  const keepArchiveIds=new Set();
  for(const entries of ag.values()){
    entries.sort((a,b)=>{
      const at=new Date(a.r.importedAt||0).getTime(), bt=new Date(b.r.importedAt||0).getTime();
      return bt-at || b.idx-a.idx;
    });
    keepArchiveIds.add(entries[0].r.id);
    removedArchives += Math.max(0,entries.length-1);
  }
  db.sundayImports=db.sundayImports.filter(r=>keepArchiveIds.has(r.id));

  save();
  const box=document.getElementById("cleanupStatus");
  if(box){
    box.innerHTML=`<b>Data cleaned.</b> ${removedWeeks} duplicate/superseded weekly record${removedWeeks===1?"":"s"} removed, ${removedArchives} duplicate archive record${removedArchives===1?"":"s"} removed${supersededLowerQuality?`, including ${supersededLowerQuality} lower-quality OCR/manual record${supersededLowerQuality===1?"":"s"}`:""}.`;
  }
  const integrity=document.getElementById("integrityDetails");
  if(integrity)integrity.classList.toggle("hasIssue",(removedWeeks+removedArchives+supersededLowerQuality)>0);
  return {removedWeeks,removedArchives,supersededLowerQuality};
}

function ensureSundayArchive(){
  if(!db.sundayImports) db.sundayImports=[];
}

function mapProductByName(name){
  return canonicalProductMatch(name).product;
}

function validateWorkbookMath(rep){
  let mismatches=[];
  rep.rows.forEach(r=>{
    if(r.oldStock!=null || r.newDeliver!=null || r.takeOut!=null || r.inStock!=null){
      const old=r.oldStock||0, del=r.newDeliver||0, take=r.takeOut||0;
      const expectedTotal=old+del-take;
      if(r.total!=null && Math.abs(expectedTotal-r.total)>0.001) mismatches.push(`${r.product}: total`);
      if(r.inStock!=null && r.sold!=null && Math.abs((expectedTotal-r.inStock)-r.sold)>0.001) mismatches.push(`${r.product}: sold`);
      if(r.sold!=null && r.sellPrice!=null && r.totalSales!=null && Math.abs((r.sold*r.sellPrice)-r.totalSales)>0.01) mismatches.push(`${r.product}: sales`);
    }
  });
  return mismatches;
}


function canonicalBranchName(value){
  const raw=cleanProductDisplayName(value);
  const n=raw.toLowerCase();
  if(n.includes("lamai")) return "Lamai";
  if(n.includes("bangrak") || n.includes("k.paul") || n.includes("k.pual") || n.includes("mini mart")) return "BM Bangrak";
  return raw;
}

function rebuildSundayReportChain(){
  ensureSundayArchive();
  const groups=new Map();
  db.sundayImports.forEach(r=>{
    r.branch=canonicalBranchName(r.branch);
    r.chainPreviousId=null;
    r.chainPreviousDate=null;
    r.chainGapDays=null;
    const key=canonicalBranchName(r.branch);
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(r);
  });
  groups.forEach(rows=>{
    rows.sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
    for(let i=1;i<rows.length;i++){
      const prev=rows[i-1], cur=rows[i];
      const gap=daysBetween(prev.date,cur.date);
      cur.chainGapDays=gap;
      if(gap!=null && gap>=5 && gap<=9){
        cur.chainPreviousId=prev.id;
        cur.chainPreviousDate=prev.date;
      }
    }
  });
}

function getPreviousSundayReport(branch,date,currentId=null){
  ensureSundayArchive();
  const branchKey=canonicalBranchName(branch);
  const current=currentId ? db.sundayImports.find(r=>r.id===currentId) : db.sundayImports.find(r=>canonicalBranchName(r.branch)===branchKey && r.date===date);
  if(current?.chainPreviousId){
    const linked=db.sundayImports.find(r=>r.id===current.chainPreviousId);
    if(linked) return linked;
  }
  const prev=[...db.sundayImports]
    .filter(r=>canonicalBranchName(r.branch)===branchKey && r.date<date && (!currentId || r.id!==currentId))
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))
    .at(-1) || null;
  if(!prev) return null;
  const gap=daysBetween(prev.date,date);
  return gap!=null && gap>=5 && gap<=9 ? prev : null;
}

function getNearestEarlierSundayReport(branch,date,currentId=null){
  ensureSundayArchive();
  const branchKey=canonicalBranchName(branch);
  return [...db.sundayImports]
    .filter(r=>canonicalBranchName(r.branch)===branchKey && r.date<date && (!currentId || r.id!==currentId))
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))
    .at(-1) || null;
}

function rowByProductName(report,name){
  if(!report) return null;
  const n=norm(name);
  let exact=(report.rows||[]).find(r=>norm(r.product)===n);
  if(exact) return exact;
  let best=null,bestScore=0;
  (report.rows||[]).forEach(r=>{
    const s=similarity(n,norm(r.product));
    if(s>bestScore){bestScore=s;best=r}
  });
  return bestScore>=0.72?best:null;
}

function appDeliveryQty(branch,startDate,endDate,productId){
  if(!productId) return null;
  return db.deliveries
    .filter(d=>d.branch===branch && !!d.deliveredAt && d.date && d.date>startDate && d.date<=endDate)
    .reduce((sum,d)=>sum+(d.lines||[])
      .filter(l=>l.productId===productId)
      .reduce((a,l)=>a+(Number(l.qty)||0),0),0);
}

function previousRowForProduct(report,currentName,currentProduct){
  if(!report) return null;
  const exact=(report.rows||[]).find(r=>normalizeProductKey(r.product)===normalizeProductKey(currentName));
  if(exact) return exact;
  if(currentProduct){
    const byCanonical=(report.rows||[]).find(r=>{
      const m=canonicalProductMatchRow(r);
      return m.product && m.product.id===currentProduct.id;
    });
    if(byCanonical) return byCanonical;
  }
  return rowByProductName(report,currentName);
}

function reconcileExcelReport(rep){
  const previous=getPreviousSundayReport(rep.branch,rep.date,rep.id||null);
  const nearestEarlier=getNearestEarlierSundayReport(rep.branch,rep.date,rep.id||null);
  const previousGap=nearestEarlier?daysBetween(nearestEarlier.date,rep.date):null;
  const periodStart=previous?.date || rep.oldDate || null;
  let verified=0, stockErrorRows=0, deliveryIssueRows=0, historyPendingRows=0, mappingRows=0;
  const details=[];
  const flowRows=[];

  rep.rows.forEach(rr=>{
    const pm=canonicalProductMatchRow(rr);
    const p=pm.product;
    const prev=previousRowForProduct(previous,rr.product,p);
    const rowIssues=[];
    let rowVerified=true;
    let rowHasStockError=false, rowHasDeliveryIssue=false, rowHasHistoryPending=false, rowHasMapping=false;

    // Workbook self arithmetic.
    const old=rr.oldStock||0, del=rr.newDeliver||0, take=rr.takeOut||0;
    const expectedTotal=old+del-take;
    if(rr.total!=null && Math.abs(expectedTotal-rr.total)>0.001){
      rowIssues.push({type:"bad",msg:`Workbook total mismatch: ${old} + ${del} − ${take} = ${expectedTotal}, sheet says ${rr.total}.`});
      rowVerified=false; rowHasStockError=true;
    }
    if(rr.inStock!=null && rr.sold!=null && Math.abs((expectedTotal-rr.inStock)-rr.sold)>0.001){
      rowIssues.push({type:"bad",msg:`Workbook sold mismatch: calculated ${expectedTotal-rr.inStock}, sheet says ${rr.sold}.`});
      rowVerified=false; rowHasStockError=true;
    }

    // Previous Sunday closing -> this Sunday opening.
    // In the shop Excel sheets, a blank stock quantity in an existing product row means zero.
    // Treat it as zero only when the product row itself exists; an absent product row remains unknown.
    if(previous){
      if(prev){
        const prevCloseForOpening=Number(prev.inStock ?? 0);
        const currentOpeningForCheck=Number(rr.oldStock ?? 0);
        if(Math.abs(prevCloseForOpening-currentOpeningForCheck)>0.001){
          rowIssues.push({type:"bad",msg:`Opening stock differs from previous Sunday: previous closing ${prevCloseForOpening}, this sheet opening ${currentOpeningForCheck}.`});
          rowVerified=false; rowHasStockError=true;
        }
      }else if(Math.abs(Number(rr.oldStock ?? 0))<0.001){
        // A genuinely new product line opening at zero is valid.
      }else{
        rowIssues.push({type:"unknown",msg:"This product is not on the previous Sunday report and its opening stock is not zero. Review its product mapping/history."});
        rowVerified=false; rowHasHistoryPending=true;
      }
    }else{
      rowIssues.push({type:"unknown",msg: nearestEarlier && previousGap>9 ? `Earlier report exists (${nearestEarlier.date}) but there is a ${previousGap}-day gap, so it is not valid for week-to-week reconciliation.` : "Baseline report — no earlier imported Sunday report exists yet."});
      rowVerified=false; rowHasHistoryPending=true;
    }

    // Shop deliveries -> Yaowaret's independently recorded delivery dockets.
    let appQty=null;
    const shopQty=Number(rr.newDeliver)||0;
    if(previous && p){
      appQty=appDeliveryQty(rep.branch,previous.date,rep.date,p.id);
      if(appQty!==shopQty){
        rowIssues.push({
          type:"data",
          msg:`Delivery records differ: shop sheet ${shopQty}, saved delivery dockets ${appQty}. Difference ${shopQty-appQty>0?"+":""}${shopQty-appQty}.`
        });
        rowVerified=false; rowHasDeliveryIssue=true;
      }
    }else if(!p){
      rowIssues.push({type:"warn",msg:`Product name needs catalogue mapping review${pm.score?` (match score ${Math.round(pm.score*100)}%)`:""}.`});
      rowVerified=false; rowHasMapping=true;
    }

    const previousClose=prev?Number(prev.inStock ?? 0):(previous && Math.abs(Number(rr.oldStock ?? 0))<0.001 ? 0 : null);
    const sheetOpening=previous?Number(rr.oldStock ?? 0):(rr.oldStock!=null?Number(rr.oldStock):null);
    const sheetClosing=Number(rr.inStock ?? 0);
    const sheetSold=Number(rr.sold ?? 0);
    const takeOut=Number(rr.takeOut)||0;
    const openingDifference=(previousClose!=null&&sheetOpening!=null)?sheetOpening-previousClose:null;
    const deliveryDifference=(appQty!=null)?shopQty-appQty:null;
    const expectedClosing=(previousClose!=null&&appQty!=null&&sheetSold!=null)?previousClose+appQty-takeOut-sheetSold:null;
    const closingDifference=(expectedClosing!=null&&sheetClosing!=null)?sheetClosing-expectedClosing:null;
    let flowStatus="unknown",flowLabel="History pending";
    if(!p){flowStatus="warn";flowLabel="Mapping review";}
    else if(previousClose!=null&&appQty!=null){
      if(Math.abs(openingDifference||0)<0.001 && Math.abs(deliveryDifference||0)<0.001 && Math.abs(closingDifference||0)<0.001 && !rowHasStockError){flowStatus="ok";flowLabel="Reconciles";}
      else{flowStatus=(rowHasStockError?"bad":"data");flowLabel="Check difference";}
    }
    flowRows.push({
      product:p?.name||rr.product, previousClose,sheetOpening,ledgerDeliveries:appQty,shopDeliveries:shopQty,
      sheetClosing,sheetSold,takeOut,expectedClosing,openingDifference,deliveryDifference,closingDifference,
      status:flowStatus,label:flowLabel
    });

    if(rowVerified) verified++;
    if(rowHasStockError) stockErrorRows++;
    if(rowHasDeliveryIssue) deliveryIssueRows++;
    if(rowHasHistoryPending) historyPendingRows++;
    if(rowHasMapping) mappingRows++;
    if(rowIssues.length) details.push({
      product:rr.product,
      inStock:rr.inStock,
      sold:rr.sold,
      delivered:rr.newDeliver,
      sellPrice:rr.sellPrice,
      issues:rowIssues,
      flags:{rowHasStockError,rowHasDeliveryIssue,rowHasHistoryPending,rowHasMapping},
      flow:flowRows[flowRows.length-1]
    });
  });

  const status = stockErrorRows>0 ? "bad" : deliveryIssueRows>0 ? "data" : (historyPendingRows>0 || mappingRows>0) ? "unknown" : "ok";
  return {
    branch:rep.branch,date:rep.date,previousDate:previous?.date||null,
    verified,stockErrorRows,deliveryIssueRows,historyPendingRows,mappingRows,
    totalRows:rep.rows.length,status,details,flowRows
  };
}

function reconStatusLabel(r){
  if(r.status==="ok") return ["ok","Fully reconciled"];
  if(r.status==="bad") return ["bad","Arithmetic / stock error"];
  if(r.status==="data") return ["data","Delivery data check"];
  if(r.previousDate && r.mappingRows>0) return ["unknown","Mapping review"];
  if(r.previousDate) return ["unknown","Incomplete product history"];
  return ["unknown","Baseline / incomplete history"];
}


function summarizeUniqueMappingNames(reports){
  const map=new Map();
  (reports||[]).forEach(r=>{
    (r.details||[]).forEach(d=>{
      if(!d.flags?.rowHasMapping) return;
      const key=normalizeProductKey(d.product);
      if(!map.has(key)) map.set(key,{name:d.product,reports:[]});
      map.get(key).reports.push(`${r.branch} ${r.date}`);
    });
  });
  return [...map.values()];
}

function fmtSigned(n){
  if(n==null || Number.isNaN(Number(n))) return "—";
  const v=Number(n);
  return `${v>0?"+":""}${v}`;
}
function stockFlowHtml(r){
  const rows=r.flowRows||[];
  if(!rows.length) return "";
  const ordered=[...rows].sort((a,b)=>(a.status==="ok")-(b.status==="ok") || String(a.product||"").localeCompare(String(b.product||""),undefined,{sensitivity:"base"}));
  const need=rows.filter(x=>x.status!=="ok").length;
  const rowHtml=ordered.map(x=>{
    const diffs=[];
    if(x.openingDifference!=null&&Math.abs(x.openingDifference)>0.001) diffs.push(`Opening difference ${fmtSigned(x.openingDifference)}`);
    if(x.deliveryDifference!=null&&Math.abs(x.deliveryDifference)>0.001) diffs.push(`Delivery difference ${fmtSigned(x.deliveryDifference)}`);
    if(x.closingDifference!=null&&Math.abs(x.closingDifference)>0.001) diffs.push(`Closing difference ${fmtSigned(x.closingDifference)}`);
    if(!diffs.length&&x.status==="ok") diffs.push("Previous stock + saved deliveries − shop sold/take-out agrees with this Sunday closing stock.");
    if(x.status==="unknown") diffs.push("A contiguous previous Sunday report is required before this product can be reconciled.");
    if(x.status==="warn") diffs.push("Map this shop product name before delivery reconciliation can be completed.");
    const mini=`Prev ${x.previousClose??"—"} · Del ${x.ledgerDeliveries??"—"} · Close ${x.sheetClosing??"—"}`;
    return `<details class="stockFlowItem">
      <summary>
        <div class="stockFlowName">${escapeHtml(x.product)}</div>
        <div class="stockFlowMini">${escapeHtml(mini)}</div>
        <span class="reconStatus ${x.status}">${escapeHtml(x.label)}</span>
        <span class="stockFlowChevron">⌄</span>
      </summary>
      <div class="stockFlowDetail">
        <div class="stockFlowNumbers">
          <div class="stockFlowCell"><div class="k">Previous close</div><div class="v">${x.previousClose??"—"}</div></div>
          <div class="stockFlowCell"><div class="k">Saved deliveries</div><div class="v">${x.ledgerDeliveries??"—"}</div></div>
          <div class="stockFlowCell"><div class="k">Sunday close</div><div class="v">${x.sheetClosing??"—"}</div></div>
          <div class="stockFlowCell"><div class="k">Difference</div><div class="v">${x.closingDifference==null?"—":fmtSigned(x.closingDifference)}</div></div>
        </div>
        <div class="stockFlowDiff">Shop opening ${x.sheetOpening??"—"} • Shop delivery ${x.shopDeliveries??"—"} • Shop sold ${x.sheetSold??"—"}${x.takeOut?` • Take-out ${x.takeOut}`:""}${diffs.length?`<br>${diffs.map(escapeHtml).join(" • ")}`:""}</div>
      </div>
    </details>`;
  }).join("");
  return `<details class="stockFlowBlock">
    <summary><b>Stock flow check</b><span>${rows.length-need} OK • ${need} review</span><span class="chev">⌄</span></summary>
    <div class="stockFlowList">${rowHtml}</div>
  </details>`;
}

function renderExcelReconciliation(reports){
  const panel=document.getElementById("excelReconPanel");
  const summary=document.getElementById("excelReconSummary");
  const box=document.getElementById("excelReconReports");
  if(!reports?.length){
    panel.style.display="none"; summary.innerHTML=""; box.innerHTML=""; return;
  }
  panel.style.display="block";

  const totals=reports.reduce((a,r)=>{
    a.rows+=r.totalRows||0;
    a.verified+=r.verified||0;
    a.errors+=r.stockErrorRows||0;
    a.delivery+=r.deliveryIssueRows||0;
    a.history+=r.historyPendingRows||0;
    a.mapping+=r.mappingRows||0;
    return a;
  },{rows:0,verified:0,errors:0,delivery:0,history:0,mapping:0});

  summary.innerHTML=[
    ["Rows checked",totals.rows],
    ["Verified",totals.verified],
    ["Stock errors",totals.errors],
    ["Delivery checks",totals.delivery],
    ["History pending",totals.history],
    ["Mapping",totals.mapping]
  ].map(x=>`<div class="card metric reconMetric"><div class="k">${x[0]}</div><div class="v">${x[1]}</div></div>`).join("");

  const uniqueMappings=summarizeUniqueMappingNames(reports);
  const mappingBlock=uniqueMappings.length ? `
    <details class="reconGroup mappingGroup">
      <summary><b>Mapping review</b><span>${uniqueMappings.length} unique product name${uniqueMappings.length===1?"":"s"}</span><span class="chev">⌄</span></summary>
      <div class="reconGroupBody">
        ${uniqueMappings.map(m=>`<div class="mappingItem"><b>${m.name}</b><div class="small">${[...new Set(m.reports)].join(" • ")}</div></div>`).join("")}
      </div>
    </details>` : "";

  box.innerHTML=mappingBlock + reports.map(r=>{
    const [cls,label]=reconStatusLabel(r);
    const serious=(r.details||[]).filter(d=>d.flags?.rowHasStockError||d.flags?.rowHasDeliveryIssue);
    const mapping=(r.details||[]).filter(d=>d.flags?.rowHasMapping);
    const history=(r.details||[]).filter(d=>d.flags?.rowHasHistoryPending);

    const seriousBlock=serious.length?`
      <details class="reconGroup" open>
        <summary><b>Needs attention</b><span>${serious.length}</span><span class="chev">⌄</span></summary>
        <div class="reconGroupBody">${serious.map(d=>{
          const primary=d.flags?.rowHasStockError?["bad","Stock error"]:["data","Delivery check"];
          return `<details class="productRecon">
            <summary>
              <div class="productReconMain">
                <div class="productReconName">${d.product}</div>
                <div class="productReconMini">${[
                  d.inStock!=null?`Stock ${d.inStock}`:null,
                  d.sold!=null?`Sold ${d.sold}`:null,
                  d.delivered!=null?`Delivered ${d.delivered}`:null
                ].filter(Boolean).join(" • ")}</div>
              </div>
              <span class="reconStatus ${primary[0]}">${primary[1]}</span><span class="chev">⌄</span>
            </summary>
            <div class="productReconBody">${d.issues.map(i=>`<div class="reconLine"><div class="small">${i.msg}</div><span class="reconStatus ${i.type}">${i.type==="data"?"Delivery":i.type==="bad"?"Error":i.type==="warn"?"Mapping":"Info"}</span></div>`).join("")}</div>
          </details>`;
        }).join("")}</div>
      </details>`:"";

    const mapBlock=mapping.length?`
      <details class="reconGroup">
        <summary><b>Mapping review</b><span>${mapping.length}</span><span class="chev">⌄</span></summary>
        <div class="reconGroupBody">${mapping.map(d=>`<div class="mappingItem"><b>${d.product}</b><div class="small">${d.issues.filter(i=>i.type==="warn").map(i=>i.msg).join(" ")}</div></div>`).join("")}</div>
      </details>`:"";

    const histBlock=history.length?`
      <details class="reconGroup historyGroup">
        <summary><b>History pending</b><span>${history.length} product${history.length===1?"":"s"}</span><span class="chev">⌄</span></summary>
        <div class="reconGroupBody compactNames">${history.map(d=>`<span>${d.product}</span>`).join("")}</div>
      </details>`:"";

    return `<details class="reconReport compactReconReport">
      <summary class="reconReportHead">
        <div><b>${r.branch} · ${r.date}</b><div class="small">${r.previousDate?`Previous Sunday: ${r.previousDate}`:"Baseline / incomplete history"}</div></div>
        <span class="reconStatus ${cls}">${label}</span><span class="chev">⌄</span>
      </summary>
      <div class="reconIssues">
        ${stockFlowHtml(r)}
        ${seriousBlock}${mapBlock}${histBlock}
        ${!serious.length&&!mapping.length&&!history.length?`<div class="notice" style="margin:10px 0"><b>Fully reconciled.</b> No issues found.</div>`:""}
      </div>
    </details>`;
  }).join("");
}


function escapeHtml(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function escapeHtmlAttr(s){return String(s??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function collectShopProductNames(){
 ensureSundayArchive();ensureProductAliases();
 const seen=new Map();
 db.sundayImports.forEach(r=>(r.rows||[]).forEach(rr=>{
   const name=String(rr.product||"").trim();if(!name)return;
   const key=normalizeProductKey(name);
   if(!seen.has(key))seen.set(key,{key,sourceName:name,examples:[]});
   const it=seen.get(key);it.examples.push(`${r.branch} ${r.date}`);
 }));
 return [...seen.values()].sort((a,b)=>a.sourceName.localeCompare(b.sourceName));
}
function currentMasterNameForSource(sourceName){
 ensureProductAliases();const key=normalizeProductKey(sourceName),aid=db.productAliases[key];
 const aliased=aid?db.products.find(p=>p.id===aid):null;if(aliased)return aliased.name;
 const exact=db.products.find(p=>normalizeProductKey(p.name)===key);return exact?.name||sourceName;
}
let recentlySavedMasterKeys=new Set();
function masterTargetForSource(sourceName){
 ensureProductAliases();const key=normalizeProductKey(sourceName),aid=db.productAliases[key];
 const aliased=aid?db.products.find(p=>p.id===aid):null;if(aliased)return aliased;
 return db.products.find(p=>normalizeProductKey(p.name)===key)||null;
}
function collectMasterDisplayGroups(){
 const items=collectShopProductNames();
 if(!db.masterCatalogueConfirmedAt)return items.map(it=>({groupKey:it.key,productId:masterTargetForSource(it.sourceName)?.id||"",masterName:currentMasterNameForSource(it.sourceName),sources:[it.sourceName],examples:it.examples,sourceKeys:[it.key]}));
 const groups=new Map();
 items.forEach(it=>{
   const target=masterTargetForSource(it.sourceName),masterName=target?.name||currentMasterNameForSource(it.sourceName),gk=target?.id||`name:${normalizeProductKey(masterName)}`;
   if(!groups.has(gk))groups.set(gk,{groupKey:gk,productId:target?.id||"",masterName,sources:[],examples:[],sourceKeys:[]});
   const g=groups.get(gk);g.sources.push(it.sourceName);g.examples.push(...it.examples);g.sourceKeys.push(it.key);
 });
 return [...groups.values()].sort((a,b)=>a.masterName.localeCompare(b.masterName));
}
function renderMasterProductSetup(resetFields=false){
 const box=document.getElementById("masterProductSetup"),status=document.getElementById("masterSetupStatus");if(!box||!status)return;
 const rawItems=collectShopProductNames();
 if(!rawItems.length){status.textContent="Import the shop Excel files first. The complete one-time setup list will appear here.";box.innerHTML="";return}
 const groups=collectMasterDisplayGroups();
 const confirmed=db.masterCatalogueConfirmedAt?` <span class="reconStatus ok">Master list saved</span>`:"";
 status.innerHTML=`<b>${rawItems.length} unique shop product names found.</b>${confirmed} ${db.masterCatalogueConfirmedAt?`Now showing Pin's saved master names. Shop spellings are retained underneath as aliases.`:`Review each once. Unchanged names are still explicitly confirmed as Pin's master names when you save.`}`;
 const prior={};if(!resetFields)document.querySelectorAll(".masterSetupRow").forEach(r=>{prior[r.dataset.groupKey]=r.querySelector(".masterNameInput")?.value||""});
 box.innerHTML=`<div class="masterSetupHead"><b>${db.masterCatalogueConfirmedAt?"Pin's saved master product":"Shop spreadsheet name"}</b><b>Pin's correct product name</b></div>`+groups.map(g=>{
   const value=prior[g.groupKey]||g.masterName;
   const changed=g.sourceKeys.some(k=>recentlySavedMasterKeys.has(k));
   const aliases=[...new Set(g.sources)].filter(x=>normalizeProductKey(x)!==normalizeProductKey(g.masterName));
   const noisySources=[...new Set(g.sources)].filter(hasWhitespaceNoise);
   const sourceText=db.masterCatalogueConfirmedAt?(aliases.length?`Received as: ${aliases.join(" • ")}`:`Shop name matches master name`):[...new Set(g.examples)].join(" • ");
   const whitespaceNote=noisySources.length?`<div class="small" style="color:#92400e;font-weight:700">Whitespace cleaned automatically from shop text.</div>`:"";
   const dates=db.masterCatalogueConfirmedAt?[...new Set(g.examples)].join(" • "):"";
   return `<div class="masterSetupRow ${changed?"savedChange":""}" data-group-key="${escapeHtmlAttr(g.groupKey)}" data-product-id="${escapeHtmlAttr(g.productId)}" data-sources="${escapeHtmlAttr(JSON.stringify(g.sources))}"><div><b>${escapeHtmlAttr(g.masterName)}</b><div class="masterAliasLine">${escapeHtmlAttr(sourceText)}</div>${whitespaceNote}${dates?`<div class="small">${escapeHtmlAttr(dates)}</div>`:""}${changed?`<span class="savedBadge">✓ Saved just now</span>`:""}</div><input class="masterNameInput" value="${escapeHtmlAttr(value)}" autocomplete="off"></div>`;
 }).join("");
 filterMasterProductSetup();
}
function filterMasterProductSetup(){
 const q=norm(document.getElementById("masterProductSearch")?.value||"");
 document.querySelectorAll(".masterSetupRow").forEach(r=>{const txt=norm(`${r.textContent||""} ${r.querySelector(".masterNameInput")?.value||""}`);r.hidden=!!q&&!txt.includes(q)});
}
function reassignProductReferences(fromId,toId){
 if(!fromId||!toId||fromId===toId)return;
 db.deliveries.forEach(d=>(d.lines||[]).forEach(l=>{if(l.productId===fromId)l.productId=toId}));
 db.weeks.forEach(w=>(w.rows||[]).forEach(r=>{if(r.productId===fromId)r.productId=toId}));
 Object.values(db.stock||{}).forEach(st=>{if(st&&Object.prototype.hasOwnProperty.call(st,fromId)){st[toId]=(Number(st[toId])||0)+(Number(st[fromId])||0);delete st[fromId]}});
 Object.keys(db.productAliases||{}).forEach(k=>{if(db.productAliases[k]===fromId)db.productAliases[k]=toId});
 db.sundayImports.forEach(r=>(r.rows||[]).forEach(rr=>{if(rr.productId===fromId)rr.productId=toId}));
}
function createMasterProduct(name,sourceName){
 const srcMatch=db.products.find(p=>normalizeProductKey(p.name)===normalizeProductKey(sourceName));
 const ref=srcMatch||canonicalProductMatch(sourceName).product;
 const id="P"+Date.now()+Math.random().toString(36).slice(2,7);
 const p={id,name,type:ref?.type||"kanja",cost:Number(ref?.cost)||0,retail:Number(ref?.retail)||0,branches:ref?.branches||["BM Bangrak","Lamai"]};
 db.products.push(p);return p;
}
function applyMasterProductSetup(){
 const rows=[...document.querySelectorAll(".masterSetupRow")];if(!rows.length)return alert("Import the shop Excel files first.");
 const entries=[];
 rows.forEach(r=>{
   let sources=[];try{sources=JSON.parse(r.dataset.sources||"[]")}catch{}
   const desired=cleanProductDisplayName(r.querySelector(".masterNameInput")?.value||""),currentProductId=r.dataset.productId||"";
   if(r.querySelector(".masterNameInput"))r.querySelector(".masterNameInput").value=desired;
   sources.forEach(sourceName=>entries.push({sourceName,desired,currentProductId,groupKey:r.dataset.groupKey||""}));
 });
 if(entries.some(x=>!x.desired))return alert("Every Pin product name must contain a name. Please fill the blank field(s).");
 const changedGroupKeys=new Set();
 rows.forEach(r=>{
   const desired=cleanProductDisplayName(r.querySelector(".masterNameInput")?.value||"");
   const currentProductId=r.dataset.productId||"";
   const current=db.products.find(p=>p.id===currentProductId)?.name || r.querySelector("div > b")?.textContent || "";
   if(desired!==cleanProductDisplayName(current))changedGroupKeys.add(r.dataset.groupKey||desired);
 });
 const changedKeys=entries.filter(e=>changedGroupKeys.has(e.groupKey)).map(e=>normalizeProductKey(e.sourceName));
 const desiredGroups=new Map();entries.forEach(e=>{const k=normalizeProductKey(e.desired);if(!desiredGroups.has(k))desiredGroups.set(k,[]);desiredGroups.get(k).push(e)});
 ensureProductAliases();
 desiredGroups.forEach((group,desiredKey)=>{
   const desiredName=cleanProductDisplayName(group[0].desired);
   let target=db.products.find(p=>normalizeProductKey(p.name)===desiredKey);
   if(!target){
     const currentIds=[...new Set(group.map(e=>e.currentProductId).filter(Boolean))];
     if(currentIds.length===1){target=db.products.find(p=>p.id===currentIds[0])||null;if(target){const old=target.name;target.name=desiredName;db.productAliases[normalizeProductKey(old)]=target.id}}
   }
   if(!target){
     const firstExact=db.products.find(p=>normalizeProductKey(p.name)===normalizeProductKey(group[0].sourceName));
     if(firstExact){target=firstExact;const old=target.name;target.name=desiredName;db.productAliases[normalizeProductKey(old)]=target.id}
     else target=createMasterProduct(desiredName,group[0].sourceName);
   }
   // Pin's typed spelling/capitalisation/punctuation is authoritative, even when
   // the normalized lookup key is unchanged (for example "1 g." -> "1g").
   if(target&&cleanProductDisplayName(target.name)!==cleanProductDisplayName(desiredName)){
     const oldMasterName=target.name;
     if(oldMasterName)db.productAliases[normalizeProductKey(oldMasterName)]=target.id;
     target.name=desiredName;
   }
   const currentIds=[...new Set(group.map(e=>e.currentProductId).filter(Boolean))];
   currentIds.forEach(pid=>{if(pid!==target.id){reassignProductReferences(pid,target.id);db.products=db.products.filter(p=>p.id!==pid)}});
   group.forEach(e=>{
     const sourceKey=normalizeProductKey(e.sourceName);
     const sourceProduct=db.products.find(p=>p.id!==target.id&&normalizeProductKey(p.name)===sourceKey);
     if(sourceProduct){reassignProductReferences(sourceProduct.id,target.id);db.products=db.products.filter(p=>p.id!==sourceProduct.id)}
     db.productAliases[sourceKey]=target.id;
     delete db.deferredMappings?.[sourceKey];
   });
 });
 db.masterCatalogueConfirmedAt=new Date().toISOString();
 recentlySavedMasterKeys=new Set(changedKeys);
 retroactivelyRemapAllImports(false);save();renderAll();renderMappingReview();renderMappingManager();
 const count=changedGroupKeys.size;
 alert(count?`${count} corrected product name${count===1?"":"s"} saved. The green rows show the changes just applied.`:"Pin's master product list has been saved. No product names changed this time.");
}

function renderCatalogueIntegrity(){
 const box=document.getElementById("catalogueIntegrity");if(!box)return;
 ensureSundayArchive();
 const branches=["BM Bangrak","Lamai"];
 const html=branches.map(branch=>{
   const reports=(db.sundayImports||[]).filter(r=>r.branch===branch).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
   if(!reports.length)return `<div class="integrityCard"><b>${branch}</b><div class="small" style="margin-top:5px">No Sunday reports imported yet.</div></div>`;
   const latest=reports.at(-1);
   const historicalIds=new Map();
   reports.forEach(r=>(r.rows||[]).forEach(rr=>{const pm=canonicalProductMatchRow(rr);if(pm.product)historicalIds.set(pm.product.id,pm.product.name)}));
   const latestIds=new Set();let unknown=0;
   (latest.rows||[]).forEach(rr=>{const pm=canonicalProductMatchRow(rr);if(pm.product)latestIds.add(pm.product.id);else unknown++});
   const missing=[...historicalIds.entries()].filter(([id])=>!latestIds.has(id)).map(([,name])=>name);
   const cls=(missing.length||unknown)?"integrityCard warn":"integrityCard";
   const status=(missing.length||unknown)?`<span class="status warn">Review ${missing.length+unknown}</span>`:`<span class="status ok">Aligned</span>`;
   const detail=[];
   if(missing.length)detail.push(`<b>Missing from latest sheet:</b> ${missing.slice(0,8).map(escapeHtmlAttr).join(" • ")}${missing.length>8?` • +${missing.length-8} more`:""}`);
   if(unknown)detail.push(`<b>${unknown} unmapped/new name${unknown===1?"":"s"}</b> in latest sheet.`);
   return `<div class="${cls}"><div class="integrityTop"><div><b>${branch}</b><div class="small">Latest Sunday: ${escapeHtmlAttr(latest.date||"—")}</div></div>${status}</div><div class="integrityNums"><span><b>${historicalIds.size}</b><br><span class="small">known at branch</span></span><span><b>${latestIds.size+unknown}</b><br><span class="small">on latest sheet</span></span><span><b>${missing.length}</b><br><span class="small">missing</span></span></div>${detail.length?`<div class="integrityMissing">${detail.join("<br>")}</div>`:""}</div>`;
 }).join("");
 box.innerHTML=html;
}

function collectUnmappedProductNames(){
 const seen=new Map();ensureSundayArchive();
 db.sundayImports.forEach(r=>(r.rows||[]).forEach(rr=>{const pm=canonicalProductMatchRow(rr);if(pm.product)return;const key=normalizeProductKey(rr.product);if(db.deferredMappings?.[key])return;if(!seen.has(key))seen.set(key,{key,name:rr.product,examples:[],best:null,bestScore:0});const it=seen.get(key);it.examples.push(`${r.branch} ${r.date}`);db.products.forEach(p=>{const s=similarity(key,normalizeProductKey(p.name));if(s>it.bestScore){it.bestScore=s;it.best=p}})}));
 return [...seen.values()].sort((a,b)=>b.bestScore-a.bestScore);
}
function renderMappingReview(){
 const panel=document.getElementById("mappingReviewPanel"),box=document.getElementById("mappingReviewList");if(!panel||!box)return;
 const items=collectUnmappedProductNames();if(!items.length){panel.style.display="none";box.innerHTML="";return}panel.style.display="block";
 box.innerHTML=items.map(it=>`<div class="mappingReviewItem" data-mapkey="${it.key}"><b>${it.name}</b><div class="small">${[...new Set(it.examples)].join(" • ")}</div><div class="mappingSuggestion"><select class="mappingTarget">${db.products.map(p=>`<option value="${p.id}" ${it.best?.id===p.id?"selected":""}>${p.name}</option>`).join("")}</select><span class="reconStatus warn">${Math.round(it.bestScore*100)}% suggestion</span></div><div class="mappingActions"><button class="btn" onclick="confirmMapping('${it.key.replace(/'/g,"\\'")}')">Merge as same product</button><button class="btn alt" onclick="keepMappingSeparate('${it.key.replace(/'/g,"\\'")}')">Keep separate</button><button class="btn alt mappingLaterBtn" onclick="deferMapping('${it.key.replace(/'/g,"\\'")}')">Unsure — Check Later</button></div></div>`).join("");
}
window.confirmMapping=key=>{const row=[...document.querySelectorAll(".mappingReviewItem")].find(x=>x.dataset.mapkey===key),pid=row?.querySelector(".mappingTarget")?.value,name=row?.querySelector("b")?.textContent;if(!pid||!name)return;const p=db.products.find(x=>x.id===pid);if(!p)return;if(!confirm(`Merge "${name}" with "${p.name}"?\n\nThis will apply to previous and future imports.`))return;saveProductAlias(name,pid);retroactivelyRemapAllImports();renderMappingReview();renderMappingManager();renderAll()};

window.deferMapping=key=>{
  ensureProductAliases();
  const row=[...document.querySelectorAll(".mappingReviewItem")].find(x=>x.dataset.mapkey===key);
  const name=row?.querySelector("b")?.textContent||key;
  db.deferredMappings[key]={name,deferredAt:new Date().toISOString()};
  save();
  renderMappingReview();
  renderMappingManager();
};
window.keepMappingSeparate=key=>{const row=[...document.querySelectorAll(".mappingReviewItem")].find(x=>x.dataset.mapkey===key),name=row?.querySelector("b")?.textContent;if(!name)return;const id="P"+Date.now()+Math.random().toString(36).slice(2,5);db.products.push({id,name,type:"flower",cost:0,retail:0,branches:["BM Bangrak","Lamai"]});saveProductAlias(name,id);retroactivelyRemapAllImports();renderMappingReview();renderMappingManager();renderCatalogue()};
function retroactivelyRemapAllImports(doSave=true){ensureSundayArchive();db.sundayImports.forEach(r=>(r.rows||[]).forEach(rr=>{const pm=canonicalProductMatchRow(rr);rr.productId=pm.product?.id||null}));db.weeks.forEach(w=>{if(!/Excel/i.test(String(w.source||"")))return;(w.rows||[]).forEach(rr=>{const pm=canonicalProductMatch(rr.sourceProductName||"",{cost:rr.cost,retail:rr.sellPrice});if(pm.product)rr.productId=pm.product.id})});refreshStoredReconciliations(false);if(doSave)save()}

window.reopenDeferredMapping=key=>{
  ensureProductAliases();
  delete db.deferredMappings[key];
  save();
  renderMappingManager();
  renderMappingReview();
};

function renderMappingManager(){
  ensureProductAliases();
  const box=document.getElementById("mappingManager");
  if(!box)return;

  const aliases=Object.entries(db.productAliases||{});
  const deferred=Object.entries(db.deferredMappings||{});

  let out="";
  if(aliases.length){
    out+=`<div class="small" style="margin-bottom:6px"><b>Confirmed aliases</b></div>`;
    out+=aliases.map(([k,pid])=>{
      const p=db.products.find(x=>x.id===pid);
      return `<span class="mappingAliasTag">${k} → <b>${p?.name||"Missing"}</b></span>`;
    }).join("");
  }else{
    out+='<div class="small">No confirmed product aliases yet.</div>';
  }

  if(deferred.length){
    out+=`<div class="small" style="margin:12px 0 6px"><b>Check later (${deferred.length})</b></div>`;
    out+=deferred.map(([k,v])=>`<div class="deferredMapRow"><span>${v.name||k}</span><button class="btn alt" onclick="reopenDeferredMapping('${k.replace(/'/g,"\\'")}')">Review now</button></div>`).join("");
  }
  box.innerHTML=out;
}

async function openFileDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open("MagicDragonPinFiles",1);
    req.onupgradeneeded=()=>{const dbi=req.result;if(!dbi.objectStoreNames.contains("sourceFiles"))dbi.createObjectStore("sourceFiles",{keyPath:"id"})};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function storeOriginalWorkbook(id,file,archiveName){
  try{
    const idb=await openFileDb();
    await new Promise((resolve,reject)=>{
      const tx=idb.transaction("sourceFiles","readwrite");
      tx.objectStore("sourceFiles").put({id,archiveName,blob:file,storedAt:new Date().toISOString()});
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
    idb.close();
    return true;
  }catch(e){ return false; }
}

async function downloadArchivedSource(id,archiveName){
  try{
    const idb=await openFileDb();
    const rec=await new Promise((resolve,reject)=>{
      const tx=idb.transaction("sourceFiles","readonly");
      const rq=tx.objectStore("sourceFiles").get(id);
      rq.onsuccess=()=>resolve(rq.result);
      rq.onerror=()=>reject(rq.error);
    });
    idb.close();
    if(!rec?.blob) return alert("Original source file is not available on this device.");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(rec.blob);
    a.download=archiveName||rec.archiveName||"Sunday-Report.xlsx";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }catch(e){alert("Could not open the archived source file.");}
}


async function deleteArchivedSourceFile(id){
  try{
    const idb=await openFileDb();
    await new Promise((resolve,reject)=>{
      const tx=idb.transaction("sourceFiles","readwrite");
      tx.objectStore("sourceFiles").delete(id);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
    idb.close();
  }catch(e){}
}

function refreshStoredReconciliations(doSave=true){
  ensureSundayArchive();
  rebuildSundayReportChain();
  const ordered=[...db.sundayImports].sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.branch||"").localeCompare(b.branch||""));
  ordered.forEach(r=>{
    r.reconciliation=reconcileExcelReport(r);
    const w=db.weeks.find(w=>w.sourceArchiveId===r.id || (w.branch===r.branch&&w.date===r.date&&/Excel/i.test(w.source||"")));
    if(w){
      w.sourceArchiveId=r.id;
      w.importAudit=w.importAudit||{};
      w.importAudit.reconciliation=r.reconciliation;
    }
  });
  if(doSave)save();
  return ordered.map(r=>r.reconciliation);
}

window.deleteSundayReport=async id=>{
  ensureSundayArchive();
  const r=db.sundayImports.find(x=>x.id===id);
  if(!r) return;
  const ok=confirm(`Delete this Sunday report?\n\n${r.branch} • ${r.date}\n${r.archiveName}\n\nThis removes the active report, its linked weekly record and the locally archived source file from this device.`);
  if(!ok) return;
  db.sundayImports=db.sundayImports.filter(x=>x.id!==id);
  db.weeks=db.weeks.filter(w=>w.sourceArchiveId!==id && !(w.branch===r.branch&&w.date===r.date&&/Excel/i.test(w.source||"")));
  await deleteArchivedSourceFile(id);
  cleanupDataIntegrity();
  const recs=refreshStoredReconciliations();
  if(activeSundayArchiveId===id)activeSundayArchiveId=null;
  renderArchive();
  renderExcelReconciliation(recs.slice(-4));
  renderAll();
  alert("Sunday report deleted.");
};

window.toggleSundayImportPanel=()=>{
  const panel=document.getElementById("importWorkPanel"),btn=document.getElementById("toggleSundayImport");
  if(!panel)return;
  const open=!panel.classList.contains("open");
  panel.classList.toggle("open",open);
  if(btn)btn.textContent=open?"Close Import":"+ Import Reports";
};

let activeSundayArchiveId=null;
function renderArchive(openId){
  ensureSundayArchive();
  const box=document.getElementById("archiveList");
  if(!box) return;
  const list=[...db.sundayImports].sort((a,b)=>(b.date||"").localeCompare(a.date||"") || (a.branch||"").localeCompare(b.branch||""));
  if(!list.length){activeSundayArchiveId=null;box.innerHTML='<div class="small">No Excel Sunday reports imported yet.</div>';return}
  if(openId!==undefined) activeSundayArchiveId=list.some(r=>r.id===openId)?openId:null;
  else if(activeSundayArchiveId&&!list.some(r=>r.id===activeSundayArchiveId)) activeSundayArchiveId=null;
  const active=list.find(r=>r.id===activeSundayArchiveId)||null;
  const selectors=list.map(r=>{
    const rec=r.reconciliation;
    const status=rec?reconStatusLabel(rec):["unknown","Not checked"];
    const flow=rec?.flowRows||[];
    const review=flow.filter(x=>x.status!=="ok").length;
    const okCount=flow.length-review;
    const summaryText=flow.length?`${okCount} OK • ${review} review`:status[1];
    return `<button type="button" class="sundaySelector ${active&&active.id===r.id?'active':''}" onclick='selectSundayArchive("${r.id}")'><span class="sundaySelectorMain"><div class="sundaySelectorTitle">${escapeHtml(r.date||"No date")}</div><div class="sundaySelectorBranch">${escapeHtml(displayBranchName(r.branch))}</div><div class="sundaySelectorMeta">${r.rows?.length||0} products • ${escapeHtml(summaryText)}</div></span><span class="reconStatus ${status[0]}">${escapeHtml(status[1])}</span><span class="sundaySelectorChevron">${active&&active.id===r.id?'⌃':'⌄'}</span></button>`;
  }).join("");
  let viewer='<div class="sundayEmptyState">Tap a Sunday report above to view it.</div>';
  if(active){
    const rec=active.reconciliation;
    const status=rec?reconStatusLabel(rec):["unknown","Not checked"];
    viewer=`<div class="sundayActivePanel" data-report-id="${active.id}"><div class="sundayActiveScroll"><div class="sundayActiveHead"><div><div class="sundayActiveTitle">${escapeHtml(active.date||"No date")} — ${escapeHtml(displayBranchName(active.branch))}</div><div class="sundayActiveMeta">${escapeHtml(active.archiveName||"")}<br>Imported ${escapeHtml(new Date(active.importedAt).toLocaleString())}${rec?.previousDate?` • Previous Sunday: ${escapeHtml(rec.previousDate)}`:""}</div></div><span class="reconStatus ${status[0]}">${escapeHtml(status[1])}</span></div>${rec?stockFlowHtml(rec):'<div class="small">This report has not been reconciled yet.</div>'}</div><div class="sundayActiveActions"><button class="btn alt" onclick="downloadArchivedSource('${active.id}','${String(active.archiveName||'Sunday-report.xlsx').replace(/'/g,"\\'")}')">Source</button><button class="btn dangerBtn" onclick="deleteSundayReport('${active.id}')">Delete</button></div></div>`;
  }
  box.innerHTML=`<div class="sundayArchiveUnified"><div class="sundaySelectorList">${selectors}</div>${viewer}</div>`;
  const listBox=box.querySelector(".sundaySelectorList"),activeButton=box.querySelector(".sundaySelector.active");
  if(listBox&&activeButton){
    const top=activeButton.offsetTop-listBox.offsetTop, bottom=top+activeButton.offsetHeight;
    if(top<listBox.scrollTop)listBox.scrollTop=top;
    else if(bottom>listBox.scrollTop+listBox.clientHeight)listBox.scrollTop=bottom-listBox.clientHeight;
  }
}
window.selectSundayArchive=id=>{
  activeSundayArchiveId=(activeSundayArchiveId===id)?null:id;
  renderArchive(activeSundayArchiveId===null?null:activeSundayArchiveId);
};


let detectedWorkbookBlocks=[];
async function preflightSelectedXlsxFiles(){
 detectedWorkbookBlocks=[];const panel=document.getElementById("detectedBlocksPanel"),list=document.getElementById("detectedBlocksList");
 if(!selectedXlsxFiles.length){panel.style.display="none";list.innerHTML="";return}
 const ok=await loadSheetJS();if(!ok)return;
 let n=0;
 for(const file of selectedXlsxFiles){
  try{const reps=parseSundayWorkbook(await file.arrayBuffer(),file.name);reps.forEach(rep=>detectedWorkbookBlocks.push({id:`B${n++}`,file,rep,selected:true}))}
  catch(err){detectedWorkbookBlocks.push({id:`B${n++}`,file,rep:null,selected:false,error:err.message})}
 }
 panel.style.display="block";
 updateDetectedBlockSelectionUI();
 list.innerHTML=detectedWorkbookBlocks.map(b=>b.rep?`<div class="detectedBlock"><input type="checkbox" data-blockid="${b.id}" checked><div><b>${b.rep.branch||"Unknown"} · ${b.rep.date}</b><div class="detectedBlockMeta">${b.file.name} • ${b.rep.sheetName} • ${b.rep.rows.length} products</div></div><span class="reconStatus ok">${b.rep.rows.length} rows</span></div>`:`<div class="detectedBlock"><input type="checkbox" disabled><div><b>${b.file.name}</b><div class="detectedBlockMeta">${b.error}</div></div><span class="reconStatus bad">Unreadable</span></div>`).join("");
 updateDetectedBlockSelectionUI();
 list.querySelectorAll("[data-blockid]").forEach(cb=>cb.onchange=()=>{const b=detectedWorkbookBlocks.find(x=>x.id===cb.dataset.blockid);if(b)b.selected=cb.checked;updateDetectedBlockSelectionUI()});
}


function updateDetectedBlockSelectionUI(){
  const valid=detectedWorkbookBlocks.filter(b=>b.rep);
  const selected=valid.filter(b=>b.selected);
  const title=document.getElementById("detectedBlocksTitle");
  const btn=document.getElementById("importXlsx");
  if(title) title.textContent=`${valid.length} weekly report${valid.length===1?"":"s"} detected`;
  if(btn) btn.textContent=`Import ${selected.length} Selected Report${selected.length===1?"":"s"}`;
}

document.getElementById("xlsxFiles").onchange=e=>{
  selectedXlsxFiles=[...e.target.files];
  const box=document.getElementById("xlsxSelectionCard");
  if(!selectedXlsxFiles.length){
    box.className="selectionCard empty";
    box.innerHTML="<b>No Excel files selected</b><div class=\"small\">Choose one or both Sunday report files.</div>";
    return;
  }
  box.className="selectionCard ready";
  box.innerHTML=`<b>✓ ${selectedXlsxFiles.length} Excel file${selectedXlsxFiles.length===1?"":"s"} selected</b>`+
    selectedXlsxFiles.map(f=>`<div class="selectionFile">${f.name}</div>`).join("");

  preflightSelectedXlsxFiles().then(()=>{if(document.body.classList.contains("workflowMode"))renderSundayWizard();});
  if(document.body.classList.contains("workflowMode"))renderSundayWizard();
};

document.getElementById("clearXlsxSelection").onclick=()=>{
  selectedXlsxFiles=[];
  document.getElementById("xlsxFiles").value="";
  const box=document.getElementById("xlsxSelectionCard");
  box.className="selectionCard empty";
  box.innerHTML="<b>No Excel files selected</b><div class=\"small\">Choose one or both Sunday report files.</div>";
  document.getElementById("xlsxResults").innerHTML="";
};


document.getElementById("importXlsx").onclick=async()=>{
 if(!selectedXlsxFiles.length)return alert("Choose one or more Excel files first.");
 const ok=await loadSheetJS();if(!ok)return alert("The Excel reader could not load.");
 if(!detectedWorkbookBlocks.length)await preflightSelectedXlsxFiles();
 const chosen=detectedWorkbookBlocks.filter(b=>b.selected&&b.rep);if(!chosen.length)return alert("No weekly report blocks selected.");
 ensureSundayArchive();const results=document.getElementById("xlsxResults");results.innerHTML="";const reconReports=[],importedDates=[];
 for(const block of chosen){
  const file=block.file,rep=block.rep;
  try{
   const mathErrors=validateWorkbookMath(rep),reconciliation=reconcileExcelReport(rep),id="X"+Date.now()+Math.random().toString(36).slice(2,7),stored=await storeOriginalWorkbook(id,file,rep.archiveName);
   const record={...rep,id,importedAt:new Date().toISOString(),sourceStored:stored,mathErrors,reconciliation};
   const same=db.sundayImports.filter(x=>x.branch===rep.branch&&x.date===rep.date);
   if(same.length&&!confirm(`${rep.branch} already has a Sunday report for ${rep.date}.\n\nReplace it?`))continue;
   db.sundayImports=db.sundayImports.filter(x=>!(x.branch===rep.branch&&x.date===rep.date));db.weeks=db.weeks.filter(w=>!(w.branch===rep.branch&&w.date===rep.date));
   db.sundayImports.push(record);reconReports.push(reconciliation);importedDates.push(rep.date);
   const weeklyRows=rep.rows.map(rr=>{const pm=canonicalProductMatchRow(rr),p=pm.product;return {productId:p?.id||null,sourceProductName:rr.product,opening:rr.oldStock,delivered:rr.newDeliver||0,takeout:rr.takeOut||0,closing:rr.inStock,reportedSold:rr.sold,sellPrice:rr.sellPrice,cost:rr.cost,historyKnown:rr.oldStock!=null,source:"Excel"}});
   db.weeks.push({id:"W"+Date.now()+Math.random().toString(36).slice(2,5),branch:rep.branch,date:rep.date,source:"Excel Sunday import",sourceArchiveId:id,rows:weeklyRows,totals:{sales:rep.rows.reduce((s,r)=>s+(r.totalSales||0),0),cost:rep.rows.reduce((s,r)=>s+(r.totalCost||0),0),profit:rep.rows.reduce((s,r)=>s+(r.totalProfit||0),0),bm:rep.rows.reduce((s,r)=>s+(r.bmShare||0),0),alix:rep.rows.reduce((s,r)=>s+(r.alixShare||0),0),pin:rep.rows.reduce((s,r)=>s+(r.pinShare||0),0)},importAudit:{type:"xlsx",archiveName:rep.archiveName,mathErrors,reconciliation}});
   save();
   results.insertAdjacentHTML("beforeend",`<div class="xlsxResult ${mathErrors.length?"warn":"ok"}"><b>${rep.archiveName}</b><br><span class="small">${displayBranchName(rep.branch)} • ${rep.date} • ${rep.rows.length} product rows</span></div>`);
  }catch(err){results.insertAdjacentHTML("beforeend",`<div class="xlsxResult bad"><b>${file.name}</b><br><span class="small">${err.message}</span></div>`)}
 }
 if(importedDates.length){
   const newest=[...new Set(importedDates.filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)))[0];
   if(newest&&!isSundayCycleComplete(newest))db.activeSundayCycleDate=newest;
   localStorage.setItem("mdpin-db",JSON.stringify(db));
 }
 cleanupDataIntegrity();refreshStoredReconciliations();retroactivelyRemapAllImports();renderArchive();renderExcelReconciliation(reconReports);renderMappingReview();renderMappingManager();renderAll();
 if(document.body.classList.contains("workflowMode")){sundayWizardStep=1;renderSundayWizard();}
};

document.getElementById("exportMaster").onclick=async()=>{
  ensureSundayArchive();
  if(!db.sundayImports.length) return alert("There are no imported Excel reports to export yet.");
  const ok=await loadSheetJS();
  if(!ok) return alert("The Excel export library could not load.");

  const out=XLSX.utils.book_new();
  const sorted=[...db.sundayImports].sort((a,b)=>(a.date||"").localeCompare(b.date||"") || (a.branch||"").localeCompare(b.branch||""));
  const indexRows=[["Check Date","Branch","Archived Source Name","Old Stock From","Products","Spreadsheet Check","Independent Reconciliation"]];
  sorted.forEach(r=>indexRows.push([r.date,r.branch,r.archiveName,r.oldDate||"",r.rows.length,(r.mathErrors?.length||0)?"Review":"OK",r.reconciliation?reconStatusLabel(r.reconciliation)[1]:"Not checked"]));
  XLSX.utils.book_append_sheet(out,XLSX.utils.aoa_to_sheet(indexRows),"Index");

  sorted.forEach((r,idx)=>{
    const rows=[["No.","Product","Old Stock","New Deliver","Take Out","Total","In Stock","Sold","Sell Price","Cost","Total Sales","Total Cost","Total Profit","BM Share","Alix Share","Pin Share"]];
    r.rows.forEach(x=>rows.push([x.no,x.product,x.oldStock,x.newDeliver,x.takeOut,x.total,x.inStock,x.sold,x.sellPrice,x.cost,x.totalSales,x.totalCost,x.totalProfit,x.bmShare,x.alixShare,x.pinShare]));
    let name=`${r.date} ${r.branch==="BM Bangrak"?"Bangrak":"Lamai"}`.slice(0,31);
    if(out.SheetNames.includes(name)) name=(name.slice(0,27)+" "+(idx+1)).slice(0,31);
    XLSX.utils.book_append_sheet(out,XLSX.utils.aoa_to_sheet(rows),name);
  });

  const filename=`Magic-Dragon-Sunday-Archive_${sorted[0].date}_to_${sorted.at(-1).date}.xlsx`;
  XLSX.writeFile(out,filename,{compression:true});
};


let importFiles=[], importRows=[];
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function editDistance(a,b){const m=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
function similarity(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;return 1-editDistance(a,b)/Math.max(a.length,b.length)}
function importBaseRows(){
 const b=document.getElementById("impBranch").value,date=document.getElementById("impDate").value||today(),dels=deliveriesSinceLastWeek(b,date);
 const last=db.weeks.filter(w=>w.branch===b&&w.date<date).sort((a,c)=>a.date.localeCompare(c.date)).at(-1);
 return branchProducts(b).map(p=>{
   const prev=last?.rows?.find(r=>r.productId===p.id);
   return {
     productId:p.id,name:p.name,confidence:null,
     historyKnown:!!last && !!prev,
     opening:prev?prev.closing:null,
     delivered:dels[p.id]||0,
     closing:"",reportedSold:"",sourceText:""
   };
 });
}
function renderImport(){
 const tb=document.getElementById("impRows"); if(!importRows.length)importRows=importBaseRows();
 tb.innerHTML=importRows.map((r,i)=>{
   const conf=r.confidence==null?"—":Math.round(r.confidence)+"%";
   const cc=r.confidence==null?"":r.confidence>=90?"confHigh":r.confidence>=75?"confMed":"confLow";
   const opening=r.historyKnown?r.opening:"Unknown";
   return `<tr data-i="${i}">
     <td data-label="Product">${r.name}<div class="small">${r.sourceText?`OCR: ${r.sourceText}`:""}</div><div class="passSummary">${r.passSummary||""}</div></td>
     <td data-label="OCR" class="${cc}">${conf}</td>
     <td data-label="Opening" class="${r.historyKnown?"":"histUnknown"}">${opening}</td>
     <td data-label="Deliveries">${r.delivered}</td>
     <td data-label="Closing"><input class="impClosing" type="number" min="0" value="${r.closing}" style="width:65px"></td>
     <td data-label="Reported sold"><input class="impSold" type="number" min="0" value="${r.reportedSold}" placeholder="—" style="width:65px"></td>
     <td data-label="Difference" class="impDiff">—</td>
     <td data-label="Status" class="impState"><span class="status warn">Review</span></td>
   </tr>`;
 }).join("");
 tb.querySelectorAll("input").forEach(x=>x.oninput=e=>{const tr=e.target.closest("tr"),r=importRows[+tr.dataset.i];r.closing=tr.querySelector(".impClosing").value;r.reportedSold=tr.querySelector(".impSold").value;calcImport()});
 calcImport();
}
function calcImport(){
 let exact=0,amber=0,bad=0,purple=0,entered=0,unknown=0;
 document.querySelectorAll("#impRows tr").forEach(tr=>{
  const r=importRows[+tr.dataset.i], c=r.closing, rs=r.reportedSold;
  tr.classList.remove("recBad","recData");
  if(c===""){tr.querySelector(".impDiff").textContent="—";tr.querySelector(".impState").innerHTML='<span class="status warn">Waiting</span>';return}
  entered++;
  if(!r.historyKnown){
    unknown++;
    tr.querySelector(".impDiff").textContent="—";
    tr.querySelector(".impState").innerHTML='<span class="status unknown">No history yet</span>';
    return;
  }
  const calcSold=r.opening+r.delivered-(+c);
  let diff=rs===""?null:calcSold-(+rs);
  tr.querySelector(".impDiff").textContent=diff==null?"—":(diff===0?"0":(diff>0?"+":"")+diff);
  if(diff!==null&&diff!==0){
    bad++; tr.classList.add("recBad");
    const likelyData=(r.confidence??100)>=90;
    if(likelyData){purple++;tr.classList.add("recData");tr.querySelector(".impState").innerHTML='<span class="status" style="background:#ede9fe;color:#6d28d9">Data error?</span>'}
    else tr.querySelector(".impState").innerHTML='<span class="status bad">Mismatch</span>';
  }else if((r.confidence??100)<75){amber++;tr.querySelector(".impState").innerHTML='<span class="status warn">OCR check</span>'}
  else {exact++;tr.querySelector(".impState").innerHTML='<span class="status ok">Verified</span>'}
 });
 document.getElementById("impSummary").innerHTML=`<span>Entered ${entered}</span><span>Verified ${exact}</span><span>OCR checks ${amber}</span><span>Errors ${bad}</span><span>No history ${unknown}</span>`;
 return {entered,exact,amber,bad,purple,unknown};
}



const DELIVERY_ALPHA="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function clearDeliveryAlphabetVisual(){
  const el=document.getElementById("deliveryAlphabetScrubber");
  const thumb=document.getElementById("deliveryAlphabetThumb");
  if(el)el.classList.remove("active");
  if(thumb)thumb.style.display="none";
}
function setDeliveryAlphabetLetter(letter, clientX=null){
  if(!letter)return;
  activeDeliveryLetter=letter;
  const search=document.getElementById("deliveryProductSearch");
  if(search)search.value="";
  const el=document.getElementById("deliveryAlphabetScrubber");
  const thumb=document.getElementById("deliveryAlphabetThumb");
  if(el){
    const pos=DELIVERY_ALPHA.indexOf(letter);
    el.classList.add("active");
    el.setAttribute("aria-valuenow",String(pos+1));
    el.setAttribute("aria-valuetext",letter);
    if(thumb){
      thumb.textContent=letter;
      thumb.style.display="grid";
      const rect=el.getBoundingClientRect();
      const x=clientX==null?((pos+.5)/26)*rect.width:Math.max(0,Math.min(rect.width,clientX-rect.left));
      thumb.style.left=`${x}px`;
    }
  }
  fillProducts();
}
function deliveryLetterFromPointer(ev){
  const el=document.getElementById("deliveryAlphabetScrubber");
  if(!el)return "";
  const rect=el.getBoundingClientRect();
  const x=Math.max(0,Math.min(rect.width-0.01,ev.clientX-rect.left));
  return DELIVERY_ALPHA[Math.floor((x/rect.width)*26)]||"A";
}
function setupDeliveryAlphabetScrubber(){
  const el=document.getElementById("deliveryAlphabetScrubber");
  if(!el||el.dataset.ready==="1")return;
  el.dataset.ready="1";
  let dragging=false;
  const update=ev=>{
    const letter=deliveryLetterFromPointer(ev);
    if(letter)setDeliveryAlphabetLetter(letter,ev.clientX);
  };
  el.addEventListener("pointerdown",ev=>{
    dragging=true;
    try{el.setPointerCapture(ev.pointerId)}catch(_){}
    update(ev);
    ev.preventDefault();
  });
  el.addEventListener("pointermove",ev=>{
    if(!dragging)return;
    update(ev);
    ev.preventDefault();
  });
  el.addEventListener("pointerup",ev=>{
    if(dragging)update(ev);
    dragging=false;
    try{el.releasePointerCapture(ev.pointerId)}catch(_){}
    ev.preventDefault();
  });
  el.addEventListener("pointercancel",()=>{dragging=false});
}
setupDeliveryAlphabetScrubber();

const deliverySearch=document.getElementById("deliveryProductSearch");
if(deliverySearch)deliverySearch.oninput=()=>{activeDeliveryLetter="";clearDeliveryAlphabetVisual();fillProducts();};

document.getElementById("impFiles").onchange=e=>{
 importFiles=[...e.target.files]; const box=document.getElementById("shotPreview");box.innerHTML="";
 importFiles.forEach(f=>{const img=document.createElement("img");img.src=URL.createObjectURL(f);img.title=f.name;box.appendChild(img)});
 document.getElementById("ocrProgress").textContent=`${importFiles.length} screenshot${importFiles.length===1?"":"s"} selected. Tap Run Multi-Pass OCR.`;
 importRows=importBaseRows();renderImport();
};
document.getElementById("impBranch").onchange=()=>{importRows=importBaseRows();renderImport()}
document.getElementById("impDate").onchange=()=>{importRows=importBaseRows();renderImport()}
document.getElementById("clearImport").onclick=()=>{importFiles=[];importRows=[];document.getElementById("impFiles").value="";document.getElementById("shotPreview").innerHTML="";document.getElementById("ocrProgress").textContent="Import cleared.";renderImport()}
async function ensureTesseract(){
 if(window.Tesseract)return true;
 document.getElementById("ocrProgress").textContent="Loading OCR reader…";
 return new Promise(resolve=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s)});
}

async function makeOCRVariant(file, mode){
  const bmp=await createImageBitmap(file);
  const scale=Math.max(2.5,Math.min(5,3200/Math.max(bmp.width,bmp.height)));
  const c=document.createElement("canvas");
  c.width=Math.round(bmp.width*scale);
  c.height=Math.round(bmp.height*scale);
  const x=c.getContext("2d",{willReadFrequently:true});
  x.imageSmoothingEnabled=true;
  x.imageSmoothingQuality="high";
  x.drawImage(bmp,0,0,c.width,c.height);

  if(mode==="color") return c;

  const img=x.getImageData(0,0,c.width,c.height),d=img.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2];
    const lum=0.299*r+0.587*g+0.114*b;
    let v=lum;
    if(mode==="gray") v=Math.max(0,Math.min(255,(lum-128)*1.35+128));
    if(mode==="light") v=lum>225?255:lum<145?0:Math.round((lum-145)*3.19);
    if(mode==="dark") v=lum>195?255:lum<95?0:Math.round((lum-95)*2.55);
    if(mode==="green"){
      v=g;
      v=Math.max(0,Math.min(255,(v-128)*1.45+128));
    }
    d[i]=d[i+1]=d[i+2]=v;
  }
  x.putImageData(img,0,0);
  return c;
}

function extractNumericCandidates(text){
  return (String(text||"").match(/\b\d+(?:\.\d+)?\b/g)||[]).map(Number);
}

function chooseConsensus(reads){
  if(!reads.length) return null;
  const buckets=new Map();
  reads.forEach(r=>{
    const nums=extractNumericCandidates(r.text);
    if(!nums.length) return;
    const val=nums[nums.length-1];
    const key=String(val);
    if(!buckets.has(key)) buckets.set(key,{value:val,count:0,weight:0,sources:[]});
    const b=buckets.get(key);
    b.count++;
    b.weight += Math.max(1,r.confidence||0);
    b.sources.push(r.mode);
  });
  const ranked=[...buckets.values()].sort((a,b)=>(b.count-a.count)||(b.weight-a.weight));
  return ranked[0]||null;
}


document.getElementById("runOCR").onclick=async()=>{
 if(!importFiles.length)return alert("Choose at least one screenshot first.");
 const ok=await ensureTesseract();
 if(!ok){
   document.getElementById("ocrProgress").innerHTML="<b>OCR reader could not load.</b> Check internet connection, then try again.";
   return;
 }
 document.getElementById("runOCR").disabled=true;
 try{
   const modes=[
     {id:"color",label:"Original colour"},
     {id:"gray",label:"Grayscale contrast"},
     {id:"light",label:"Light threshold"},
     {id:"dark",label:"Dark threshold"},
     {id:"green",label:"Green-channel contrast"}
   ];
   let allPassLines=[];
   const totalPasses=importFiles.length*modes.length;
   let passNo=0;

   for(let fi=0;fi<importFiles.length;fi++){
     for(const mode of modes){
       passNo++;
       document.getElementById("ocrProgress").textContent=`OCR pass ${passNo} of ${totalPasses}: ${mode.label}…`;
       const prepared=await makeOCRVariant(importFiles[fi],mode.id);
       const out=await Tesseract.recognize(prepared,"eng",{
         logger:m=>{
           if(m.status==="recognizing text"){
             document.getElementById("ocrProgress").textContent=
               `OCR pass ${passNo}/${totalPasses}: ${mode.label} — ${Math.round((m.progress||0)*100)}%`;
           }
         }
       });
       const lines=(out.data.lines||[])
         .map(l=>({
           text:l.text.trim(),
           confidence:l.confidence||out.data.confidence||0,
           mode:mode.id,
           modeLabel:mode.label
         }))
         .filter(l=>l.text);
       allPassLines.push(...lines);
     }
   }

   importRows=importBaseRows();
   importRows.forEach(r=>{
     let candidateReads=[];
     allPassLines.forEach(l=>{
       const txt=norm(l.text),pn=norm(r.name);
       const score=txt.includes(pn)?1:Math.max(
         similarity(txt,pn),
         similarity(txt.split(/\s+\d/)[0],pn)
       );
       if(score>.38){
         candidateReads.push({
           ...l,
           matchScore:score,
           effectiveConfidence:Math.max(0,Math.min(100,(l.confidence||0)*score))
         });
       }
     });

     candidateReads.sort((a,b)=>b.effectiveConfidence-a.effectiveConfidence);
     const best=candidateReads[0];

     if(best){
       const consensus=chooseConsensus(candidateReads.slice(0,12));
       const agreement=consensus?Math.min(1,consensus.count/3):0;
       const boost=agreement*18;
       r.confidence=Math.max(0,Math.min(100,best.effectiveConfidence+boost));
       r.sourceText=best.text;
       r.passSummary=candidateReads.slice(0,5)
         .map(x=>`${x.modeLabel}: ${Math.round(x.effectiveConfidence)}%`)
         .join(" • ");
       if(consensus){
         r.closing=String(consensus.value);
         r.consensusCount=consensus.count;
         r.consensusSources=consensus.sources;
       }
     }
   });

   document.getElementById("ocrProgress").innerHTML=
     "<b>Multi-pass OCR complete.</b> Five image treatments were compared. Agreement between independent passes increases confidence; disagreements remain highlighted for checking.";
   renderImport();
 }catch(err){
   document.getElementById("ocrProgress").innerHTML="<b>OCR failed:</b> "+err.message;
 }finally{
   document.getElementById("runOCR").disabled=false;
 }
};

document.getElementById("commitImport").onclick=()=>{
 const s=calcImport(); if(!s.entered)return alert("No closing-stock figures have been entered.");
 if(s.bad&&!confirm(`${s.bad} reconciliation error(s) remain. Save anyway for investigation?`))return;
 if(s.unknown&&!confirm(`${s.unknown} row(s) cannot yet be reconciled because historical opening stock is missing. Save this as a baseline Sunday check?`))return;
 const b=document.getElementById("impBranch").value,date=document.getElementById("impDate").value||today();
 const rows=importRows.filter(r=>r.closing!=="").map(r=>({productId:r.productId,opening:r.historyKnown?r.opening:null,delivered:r.delivered,takeout:0,closing:+r.closing,reportedSold:r.reportedSold===""?null:+r.reportedSold,ocrConfidence:r.confidence,sourceText:r.sourceText,historyKnown:r.historyKnown}));
 let sales=0,cost=0,profit=0,pin=0,alix=0,bm=0;
 rows.filter(r=>r.historyKnown).forEach(r=>{const p=db.products.find(x=>x.id===r.productId),sold=r.opening+r.delivered-r.closing,s=sold*p.retail,c=sold*p.cost,pr=s-c,isEd=p.type==="edible";sales+=s;cost+=c;profit+=pr;pin+=c+pr*(isEd?.40:.30);alix+=pr*(isEd?.20:.30);bm+=pr*.40});
 db.weeks.push({id:"W"+Date.now(),branch:b,date,source:"Sunday screenshot import",rows,totals:{sales,cost,profit,pin,alix,bm},importAudit:{files:importFiles.map(f=>f.name),summary:s}});
 save();alert("Sunday check saved with OCR/reconciliation audit information.");switchTab("audit");
};

function renderAll(){inferLegacyDeliveredDockets();processPendingDocketCorrections();fillProducts();renderDelivery();renderHistory();renderCatalogue();renderMetrics();renderAudit();renderHistorical();renderMasterProductSetup();renderCatalogueIntegrity();renderMappingManager();renderMappingReview();renderDocketArchive();renderDashboardAlerts()}
ensureProductAliases();
migrateKnownCanonicalDuplicates();
ensureKnownCatalogueAdditions();
repairKnownProductPrices();
ensureProductFamilyStructure();
let sundayWizardStep=2;
let sundayWizardTargetDate=null;
const SUNDAY_STEPS=["Import","Reconcile","Financial","Invoice","Payment"];
function ensureCompletedSundayCycles(){if(!Array.isArray(db.completedSundayCycles))db.completedSundayCycles=[];}
function isSundayCycleComplete(date){ensureCompletedSundayCycles();return db.completedSundayCycles.some(x=>x&&x.date===date&&x.status==="complete");}
function completeSundayCycle(state){
  const date=state?.items?.[0]?.report?.date;if(!date||!state.paymentSaved)return false;
  ensureCompletedSundayCycles();
  const inv=state.invoice;
  const rec={date,status:"complete",completedAt:new Date().toISOString(),invoiceId:inv?.id||null,invoiceNumber:inv?.number||null};
  const i=db.completedSundayCycles.findIndex(x=>x&&x.date===date);if(i>=0)db.completedSundayCycles[i]=rec;else db.completedSundayCycles.push(rec);
  // A completed cycle is historical. Never let normal Sunday Wizard discovery resurrect older imports.
  if(db.activeSundayCycleDate===date)db.activeSundayCycleDate=null;
  localStorage.setItem("mdpin-db",JSON.stringify(db));
  return true;
 refreshBaselineSnapshotStatus();
}
function openSundayWizard(targetDate=null){
  sundayWizardTargetDate=targetDate||null;
  const items=latestWizardReports();
  sundayWizardStep=items.length?2:1;
  switchTab("sundayWizard");
  document.body.classList.add("workflowMode");
  renderSundayWizard();
  window.scrollTo({top:0,behavior:"smooth"});
}
function exitSundayWorkflow(){
  sundayWizardTargetDate=null;
  document.body.classList.remove("workflowMode");
  switchTab("home");
  const resetHomeScroll=()=>{
    const home=document.getElementById("home");
    const viewport=document.querySelector(".contentViewport");
    if(home) home.scrollTop=0;
    if(viewport) viewport.scrollTop=0;
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    window.scrollTo(0,0);
  };
  const settle=()=>{resetHomeScroll();if(window.syncShellGeometry)window.syncShellGeometry();};
  settle();
  requestAnimationFrame(()=>{settle();requestAnimationFrame(settle)});
  setTimeout(settle,80);
  setTimeout(settle,220);
}
function wizardAction(type){
  if(type==="import"){ wizardChooseExcel(); return; }
  document.body.classList.remove("workflowMode");
  if(type==="delivery") openDeliveryArchive();
  else if(type==="mapping") switchTab("settings");
  else if(type==="weekly") switchTab("weekly");
}
function wizardChooseExcel(){
  const input=document.getElementById("xlsxFiles");if(input)input.click();
}
function wizardImportSelected(){
  const btn=document.getElementById("importXlsx");if(btn)btn.click();
}
function wizardImportMarkup(){
  if(!selectedXlsxFiles.length)return `<div class="wizardLocked">No Sunday report has been imported yet.</div><div class="wizardActions"><button class="btn gold" onclick="wizardChooseExcel()">Choose Excel files</button></div>`;
  const detected=detectedWorkbookBlocks.filter(b=>b.rep);
  return `<div class="wizardImportBox"><div class="wizardImportFiles"><b>Selected Excel files</b>${selectedXlsxFiles.map(f=>`<div class="wizardImportFile">${escapeHtml(f.name)}</div>`).join('')}</div>${detected.length?`<div class="wizardImportDetected">${detected.map(b=>`<div><span>${escapeHtml(displayBranchName(b.rep.branch))} · ${escapeHtml(b.rep.date)}</span><b>${b.rep.rows.length} rows</b></div>`).join('')}</div>`:`<div class="wizardLocked">Reading the selected workbook…</div>`}<div class="wizardActions"><button class="btn alt" onclick="wizardChooseExcel()">Change files</button><button class="btn gold" ${detected.length?'':'disabled'} onclick="wizardImportSelected()">Import ${detected.length||''} report${detected.length===1?'':'s'}</button></div></div>`;
}
function wizardReportsForDate(date){
  ensureSundayArchive(); rebuildSundayReportChain();
  return [...(db.sundayImports||[])].filter(r=>r.date===date).map(r=>({report:r,rec:reconcileExcelReport(r)}));
}
function latestWizardReports(){
  ensureSundayArchive(); rebuildSundayReportChain();ensureCompletedSundayCycles();
  // Explicit historical/review mode may open any requested date.
  if(sundayWizardTargetDate)return wizardReportsForDate(sundayWizardTargetDate);
  // Normal Sunday Wizard resumes ONLY a cycle that was explicitly started by an import.
  // Historical unresolved reports are never auto-selected as current work.
  const activeDate=db.activeSundayCycleDate||null;
  if(!activeDate)return [];
  if(isSundayCycleComplete(activeDate)){db.activeSundayCycleDate=null;localStorage.setItem("mdpin-db",JSON.stringify(db));return [];}
  const items=wizardReportsForDate(activeDate);
  if(!items.length){db.activeSundayCycleDate=null;localStorage.setItem("mdpin-db",JSON.stringify(db));return [];}
  return items;
}
function financialReconcileReport(rep){
  const stock=reconcileExcelReport(rep);
  const issues=[];
  const totals={sales:0,cost:0,profit:0,bm:0,alix:0,pinProfit:0,payPin:0,sheetSales:0,sheetCost:0,sheetProfit:0,sheetBm:0,sheetAlix:0,sheetPinProfit:0};
  const tol=.011;
  if(stock.status!=="ok") return {status:"locked",issues,totals,stock};
  (rep.rows||[]).forEach(rr=>{
    const pm=canonicalProductMatchRow(rr),p=pm.product;
    if(!p){issues.push({product:rr.product,reason:"Product is not linked to the master catalogue.",action:"mapping"});return;}
    const sold=Number(rr.sold ?? ((Number(rr.oldStock)||0)+(Number(rr.newDeliver)||0)-(Number(rr.takeOut)||0)-(Number(rr.inStock)||0)))||0;
    const expectedSales=sold*Number(p.retail||0), expectedCost=sold*Number(p.cost||0), expectedProfit=expectedSales-expectedCost;
    const edible=p.type==="edible", expectedBm=expectedProfit*.40, expectedAlix=expectedProfit*(edible?.20:.30), expectedPin=expectedProfit*(edible?.40:.30);
    const checks=[];
    const add=(label,sheet,expected)=>{if(sheet==null){if(Math.abs(expected)>tol)checks.push(`${label}: missing on sheet, expected ${baht(expected)}`)}else if(Math.abs(Number(sheet)-expected)>tol)checks.push(`${label}: sheet ${baht(sheet)}, expected ${baht(expected)}`)};
    if(rr.sellPrice==null){if(sold>0)checks.push(`Retail price: missing on sheet, master ${baht(p.retail)}`)}else if(Math.abs(Number(rr.sellPrice)-Number(p.retail||0))>tol)checks.push(`Retail price: sheet ${baht(rr.sellPrice)}, master ${baht(p.retail)}`);
    if(rr.cost==null){if(sold>0)checks.push(`Cost price: missing on sheet, master ${baht(p.cost)}`)}else if(Math.abs(Number(rr.cost)-Number(p.cost||0))>tol)checks.push(`Cost price: sheet ${baht(rr.cost)}, master ${baht(p.cost)}`);
    add("Sales",rr.totalSales,expectedSales); add("Cost",rr.totalCost,expectedCost); add("Profit",rr.totalProfit,expectedProfit); add("BM share",rr.bmShare,expectedBm); add("Alix share",rr.alixShare,expectedAlix); add("Pin profit",rr.pinShare,expectedPin);
    if(checks.length)issues.push({product:p.name,reason:checks.join(" • "),action:(checks.some(x=>x.startsWith("Retail price")||x.startsWith("Cost price"))?"mapping":"import")});
    totals.sales+=expectedSales;totals.cost+=expectedCost;totals.profit+=expectedProfit;totals.bm+=expectedBm;totals.alix+=expectedAlix;totals.pinProfit+=expectedPin;totals.payPin+=expectedCost+expectedPin;
    totals.sheetSales+=Number(rr.totalSales)||0;totals.sheetCost+=Number(rr.totalCost)||0;totals.sheetProfit+=Number(rr.totalProfit)||0;totals.sheetBm+=Number(rr.bmShare)||0;totals.sheetAlix+=Number(rr.alixShare)||0;totals.sheetPinProfit+=Number(rr.pinShare)||0;
  });
  return {status:issues.length?"review":"ok",issues,totals,stock};
}
function invoiceFinancialSummary(financial){
  const branches=financial.filter(x=>x.result.status==="ok").map(x=>({branch:x.report.branch,...x.result.totals}));
  const combined={sales:0,cost:0,profit:0,bm:0,alix:0,pinProfit:0,payPin:0};
  branches.forEach(b=>Object.keys(combined).forEach(k=>combined[k]+=Number(b[k]||0)));
  return {branches,combined};
}
function invoiceSignature(date,summary){
  return JSON.stringify({date,branches:summary.branches.map(b=>[b.branch,+b.sales.toFixed(2),+b.cost.toFixed(2),+b.pinProfit.toFixed(2),+b.payPin.toFixed(2)])});
}
function adjustmentDecisionForDate(adj,date){
  if(adj.status==="applied"&&adj.appliedToDate===date)return "apply";
  return adj.workflowDecisions?.[date]||"";
}
function adjustmentCandidatesForDate(date){
  if(!date)return [];
  return (db.adjustments||[]).filter(a=>(a.status==="pending"&&String(a.sourceDate||"")<String(date))||(a.status==="applied"&&a.appliedToDate===date));
}
function appliedAdjustmentsForDate(date,candidates=adjustmentCandidatesForDate(date)){return candidates.filter(a=>adjustmentDecisionForDate(a,date)==="apply");}
function settlementAdjustmentSignature(adjs){return JSON.stringify((adjs||[]).map(a=>[a.id,+Number(a.amount||0).toFixed(2)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));}
function getValidSundayInvoice(date,financial,appliedAdjustments=[]){
  const summary=invoiceFinancialSummary(financial),sig=invoiceSignature(date,summary),adjSig=settlementAdjustmentSignature(appliedAdjustments);
  const inv=latestInvoiceForDate(date);
  if(!inv||inv.signature!==sig)return null;
  const savedAdjSig=inv.adjustmentSignature||settlementAdjustmentSignature(inv.adjustmentsApplied||[]);
  return savedAdjSig===adjSig?inv:null;
}
function currentWizardState(){
  const items=latestWizardReports();
  const stockGreen=items.length>0&&items.every(x=>x.rec.status==="ok");
  const financial=items.map(x=>({report:x.report,result:financialReconcileReport(x.report)}));
  const financialGreen=stockGreen&&financial.length>0&&financial.every(x=>x.result.status==="ok");
  const latestDate=items[0]?.report?.date||null;
  const adjustmentCandidates=latestDate?adjustmentCandidatesForDate(latestDate):[];
  const pendingForDecision=adjustmentCandidates.filter(a=>a.status==="pending"&&a.resolution!=="next_sunday_auto");
  const autoAdjustments=adjustmentCandidates.filter(a=>a.status==="pending"&&a.resolution==="next_sunday_auto");
  const adjustmentsReady=pendingForDecision.every(a=>["apply","defer"].includes(adjustmentDecisionForDate(a,latestDate)));
  const appliedAdjustments=[...(latestDate?appliedAdjustmentsForDate(latestDate,adjustmentCandidates):[]),...autoAdjustments.filter(a=>!appliedAdjustmentsForDate(latestDate,adjustmentCandidates).some(x=>x.id===a.id))];
  const financialReady=financialGreen&&adjustmentsReady;
  const invoice=financialReady&&latestDate?getValidSundayInvoice(latestDate,financial,appliedAdjustments):null;
  return {items,stockGreen,financial,financialGreen,financialReady,adjustmentCandidates,pendingForDecision,adjustmentsReady,appliedAdjustments,invoice,invoiceSaved:!!invoice,paymentSaved:!!paymentForInvoice(invoice)};
}
function renderWizardChrome(state){
  const prog=document.getElementById("wizardProgress"),dots=document.getElementById("wizardDots"),prev=document.getElementById("wizardPrev"),next=document.getElementById("wizardNext");
  if(prog)prog.innerHTML=SUNDAY_STEPS.map((n,i)=>`<div class="wizardStep ${i+1<sundayWizardStep?'done':i+1===sundayWizardStep?'active':''}">${i+1} ${n}</div>`).join("");
  if(dots)dots.innerHTML=SUNDAY_STEPS.map((n,i)=>`<span class="workflowDot ${i+1<sundayWizardStep?'done':i+1===sundayWizardStep?'active':''}" title="${n}"></span>`).join("");
  if(prev){prev.style.visibility=sundayWizardStep<=1?"hidden":"visible";prev.disabled=sundayWizardStep<=1;prev.onclick=()=>{if(sundayWizardStep>1){sundayWizardStep--;renderSundayWizard();window.scrollTo({top:0,behavior:"smooth"})}}}
  let canNext=false;
  if(sundayWizardStep===1)canNext=state.items.length>0;
  else if(sundayWizardStep===2)canNext=state.stockGreen;
  else if(sundayWizardStep===3)canNext=state.financialReady;
  else if(sundayWizardStep===4)canNext=state.invoiceSaved;
  else if(sundayWizardStep===5)canNext=state.paymentSaved;
  if(next){next.disabled=!canNext;next.textContent=sundayWizardStep>=5?'Complete':'Next ›';next.onclick=()=>{if(sundayWizardStep<5&&canNext){sundayWizardStep++;renderSundayWizard();window.scrollTo({top:0,behavior:"smooth"})}else if(sundayWizardStep===5&&canNext){const fresh=currentWizardState();if(completeSundayCycle(fresh)){exitSundayWorkflow();renderDashboardAlerts();}else alert("This Sunday cycle is not ready to complete yet.");}}}
}
function renderStockWizard(items){
  let allGreen=true;
  const html=items.map(({report:r,rec})=>{
    const issues=(rec.details||[]).filter(d=>d.flags?.rowHasStockError||d.flags?.rowHasDeliveryIssue||d.flags?.rowHasMapping||d.flags?.rowHasHistoryPending);
    if(rec.status!=="ok")allGreen=false;
    if(rec.status==="ok")return `<div class="wizardBranch"><div class="wizardBranchHead"><b>${escapeHtml(r.branch)}</b><span class="reconStatus ok">RECONCILED</span></div><div class="wizardBranchBody"><div class="wizardGood">✓ All ${rec.totalRows} products reconcile with the prior week.</div></div></div>`;
    const visible=issues.slice(0,12).map(d=>{
      const reason=(d.issues||[])[0]?.msg||"Review this product.";
      const action=d.flags?.rowHasDeliveryIssue?['delivery','Open Delivery Dockets']:d.flags?.rowHasMapping?['mapping','Fix Product Mapping']:d.flags?.rowHasStockError?['import','Open Sunday Report']:['import','Open Sunday Report'];
      const f=d.flow||{};
      const evidence=[['Prior close',f.previousClose],['This opening',f.sheetOpening],['Saved delivery',f.ledgerDeliveries],['Shop delivery',f.shopDeliveries],['Shop sold',f.sheetSold],['This close',f.sheetClosing]].map(([k,v])=>`<div class="wizardEvidenceCell"><div class="k">${k}</div><div class="v">${v==null?'—':escapeHtml(String(v))}</div></div>`).join('');
      let hint='Compare the figures below. The highlighted reason tells you which source needs correcting.';
      if(d.flags?.rowHasDeliveryIssue)hint='The shop delivery quantity and Pin’s saved docket quantity differ. Open Delivery Dockets and correct the source docket if needed.';
      else if(d.flags?.rowHasStockError)hint='The opening stock should equal the prior Sunday closing stock. Open the Sunday report and verify the shop figures.';
      else if(d.flags?.rowHasMapping)hint='This shop product name is not linked confidently to Pin’s master product. Fix the mapping once, then return here.';
      else if(d.flags?.rowHasHistoryPending)hint='The app cannot prove the prior-week stock chain for this product. Open the Sunday report to check its prior-week row.';
      return `<details class="wizardIssue"><summary><div><div class="wizardIssueTitle">${escapeHtml(d.product)}</div><div class="wizardIssueReason">${escapeHtml(reason)}</div></div><span class="wizardIssueChevron">⌄</span></summary><div class="wizardEvidence">${evidence}</div><div class="wizardEvidenceNote">${escapeHtml(hint)}</div><div class="wizardActions"><button class="btn" onclick="event.preventDefault();event.stopPropagation();wizardAction('${action[0]}')">${action[1]}</button></div></details>`;
    }).join("");
    return `<div class="wizardBranch"><div class="wizardBranchHead"><b>${escapeHtml(r.branch)}</b><span class="reconStatus bad">ACTION REQUIRED</span></div><div class="wizardBranchBody">${visible}${issues.length>12?`<div class="wizardMinimal">+ ${issues.length-12} more items. Resolve the first issues, then return here.</div>`:""}</div></div>`;
  }).join("");
  return html+(allGreen?'<div class="wizardGood" style="margin-top:12px">✓ Stock reconciliation complete. Tap Next for the financial check.</div>':'<div class="wizardLocked" style="margin-top:12px">Next stays locked until the stock exceptions above are resolved.</div>');
}
function renderFinancialWizard(state){
  const financial=state.financial;
  let combined={sales:0,cost:0,profit:0,bm:0,alix:0,pinProfit:0,payPin:0},allGreen=true;
  const html=financial.map(({report:r,result:x})=>{
    if(x.status!=="ok")allGreen=false;
    Object.keys(combined).forEach(k=>combined[k]+=Number(x.totals[k]||0));
    if(x.status==="locked")return `<div class="wizardBranch"><div class="wizardBranchHead"><b>${escapeHtml(r.branch)}</b><span class="reconStatus bad">LOCKED</span></div><div class="wizardBranchBody"><div class="wizardLocked">Complete stock reconciliation first.</div></div></div>`;
    if(x.status==="review"){
      const issues=x.issues.slice(0,10).map(i=>`<div class="financeIssue"><b>${escapeHtml(i.product)}</b><div class="small">${escapeHtml(i.reason)}</div><div class="wizardActions"><button class="btn" onclick="wizardAction('${i.action}')">${i.action==='mapping'?'Review Product Price':'Review Sunday Report'}</button></div></div>`).join('');
      return `<div class="wizardBranch"><div class="wizardBranchHead"><b>${escapeHtml(r.branch)}</b><span class="reconStatus bad">ACTION REQUIRED</span></div><div class="wizardBranchBody">${issues}${x.issues.length>10?`<div class="wizardMinimal">+ ${x.issues.length-10} more financial issue(s).</div>`:''}</div></div>`;
    }
    const t=x.totals;
    return `<div class="wizardBranch"><div class="wizardBranchHead"><b>${escapeHtml(r.branch)}</b><span class="reconStatus ok">FINANCIAL OK</span></div><div class="wizardBranchBody"><div class="wizardGood">✓ Sales, costs and profit shares agree.</div><div class="financeSummary"><div class="financeCell"><div class="k">Sales</div><div class="v">${baht(t.sales)}</div></div><div class="financeCell"><div class="k">Pay Pin</div><div class="v">${baht(t.payPin)}</div></div></div><details class="financeDetails"><summary>View calculation</summary><div class="financeSummary"><div class="financeCell"><div class="k">Cost recovery</div><div class="v">${baht(t.cost)}</div></div><div class="financeCell"><div class="k">Profit</div><div class="v">${baht(t.profit)}</div></div><div class="financeCell"><div class="k">BM share</div><div class="v">${baht(t.bm)}</div></div><div class="financeCell"><div class="k">Alix share</div><div class="v">${baht(t.alix)}</div></div><div class="financeCell"><div class="k">Pin profit</div><div class="v">${baht(t.pinProfit)}</div></div></div></details></div></div>`;
  }).join('');
  let adjustmentHtml="";
  const autoCorrections=(state.appliedAdjustments||[]).filter(a=>a.resolution==="next_sunday_auto");
  if(allGreen&&autoCorrections.length){adjustmentHtml+=`<div class="adjustmentPanel"><h3>Correction from previous week</h3>${autoCorrections.map(a=>`<div class="adjustmentRow"><div class="adjustmentTop"><div><b>${escapeHtml(a.description||"Delivery docket correction")}</b><div class="wizardMinimal">From week ending ${escapeHtml(invoiceDateLabel(a.sourceDate))}</div></div><div class="adjustmentAmt ${Number(a.amount)>=0?'pos':'neg'}">${Number(a.amount)>=0?'+':''}${baht(a.amount)}</div></div><div class="adjustmentDecision">This correction is added automatically to this Sunday’s invoice.</div></div>`).join('')}</div>`;}
  if(allGreen&&state.pendingForDecision?.length){
    adjustmentHtml+=`<div class="adjustmentPanel"><h3>Prior adjustment${state.pendingForDecision.length>1?'s':''}</h3><div class="adjustmentIntro">A previous invoice changed after it was saved. Choose what to do this Sunday. This does not change this week's trading figures.</div>${state.pendingForDecision.map(a=>{const d=adjustmentDecisionForDate(a,state.items[0]?.report?.date);return `<div class="adjustmentRow"><div class="adjustmentTop"><div><b>${escapeHtml(a.oldNumber||'Prior invoice')} adjustment</b><div class="wizardMinimal">From ${escapeHtml(invoiceDateLabel(a.sourceDate))}</div></div><div class="adjustmentAmt ${Number(a.amount)>=0?'pos':'neg'}">${Number(a.amount)>=0?'+':''}${baht(a.amount)}</div></div><div class="adjustmentActions"><button class="${d==='apply'?'selected':''}" onclick="setSundayAdjustmentDecision('${a.id}','apply')">Apply this Sunday</button><button class="${d==='defer'?'selected':''}" onclick="setSundayAdjustmentDecision('${a.id}','defer')">Leave for later</button></div><div class="adjustmentDecision">${d==='apply'?'Will be shown separately on this invoice.':d==='defer'?'Will remain as an alert for a future Sunday.':'Choose one option before continuing.'}</div></div>`}).join('')}</div>`;
  }
  const adjTotal=(state.appliedAdjustments||[]).reduce((n,a)=>n+Number(a.amount||0),0);
  const total=allGreen?`<div class="financeTotal"><b>✓ Financial reconciliation complete</b><div class="wizardMinimal" style="color:#166534;margin-top:3px">Both shops combined</div><div class="big">Pay Pin ${baht(combined.payPin)}</div>${adjTotal?`<div class="wizardMinimal" style="color:#166534">Prior adjustment selected: ${adjTotal>=0?'+':''}${baht(adjTotal)} · Settlement total ${baht(combined.payPin+adjTotal)}</div>`:`<div class="wizardMinimal" style="color:#166534">Sales ${baht(combined.sales)} · Cost recovery ${baht(combined.cost)} · Pin profit ${baht(combined.pinProfit)}</div>`}</div>`:`<div class="wizardLocked">Next stays locked until every financial exception above is resolved.</div>`;
  const gate=allGreen&&!state.adjustmentsReady?`<div class="wizardLocked" style="margin-top:8px">Choose Apply this Sunday or Leave for later for each prior adjustment before continuing.</div>`:"";
  return html+adjustmentHtml+total+gate;
}
function setSundayAdjustmentDecision(id,decision){
  const state=currentWizardState(),date=state.items[0]?.report?.date,adj=(db.adjustments||[]).find(a=>a.id===id);if(!adj||!date)return;
  if(!adj.workflowDecisions||typeof adj.workflowDecisions!=="object")adj.workflowDecisions={};
  adj.workflowDecisions[date]=decision;localStorage.setItem("mdpin-db",JSON.stringify(db));renderSundayWizard();renderDashboardAlerts();
}
window.setSundayAdjustmentDecision=setSundayAdjustmentDecision;

function sundayInvoiceNumber(date){return "MD-"+String(date||today()).replace(/-/g,"");}
function invoiceDateLabel(date){
  try{return new Date(String(date)+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}catch(e){return date||""}
}
function buildInvoiceCard(state,printMode=false){
  const date=state.items[0]?.report?.date||today(),summary=invoiceFinancialSummary(state.financial),saved=state.invoice;
  const number=saved?.number||sundayInvoiceNumber(date);
  if(printMode){
    const branches=summary.branches.map(b=>`<div class="invoiceBranch"><div class="invoiceBranchName">${escapeHtml(displayBranchName(b.branch))}</div><div class="invoiceNums"><div class="invoiceNum"><div class="k">Sales</div><div class="v">${baht(b.sales)}</div></div><div class="invoiceNum"><div class="k">Cost recovery</div><div class="v">${baht(b.cost)}</div></div><div class="invoiceNum"><div class="k">Pin profit share</div><div class="v">${baht(b.pinProfit)}</div></div><div class="invoiceNum"><div class="k">Amount due</div><div class="v">${baht(b.payPin)}</div></div></div></div>`).join("");
    return `<div class="invoiceCard"><div class="invoiceHead"><div><div class="invoiceTitle">Weekly Settlement Invoice</div><div class="wizardMinimal">Week ending ${escapeHtml(invoiceDateLabel(date))}</div></div><div class="invoiceMeta"><b>${escapeHtml(number)}</b><br>${saved?"Saved "+escapeHtml(invoiceDateLabel(saved.createdDate)):"Draft"}</div></div><div class="invoiceFrom"><b>Issued by Yaowaret</b><br>The Grocery by BM + BM Lamai weekly settlement</div><div class="invoiceBranches">${branches}</div><div class="invoiceTotal"><div class="k">Total payable to Pin</div><div class="v">${baht(summary.combined.payPin)}</div></div><div class="invoiceExplain">Verified product cost recovery plus Pin’s profit share. Normal profit split: BM 40% · Alix 30% · Pin 30%. Edibles: BM 40% · Alix 20% · Pin 40%.</div></div>`;
  }
  const branches=summary.branches.map(b=>`<div class="invoiceScreenBranch"><div class="name">${escapeHtml(displayBranchName(b.branch))}</div><div class="mini">Sales ${baht(b.sales)}</div><div class="amt">Due ${baht(b.payPin)}</div></div>`).join("");
  const breakdown=summary.branches.map(b=>`<div class="invoiceNum"><div class="k">${escapeHtml(b.branch)} cost + Pin profit</div><div class="v">${baht(b.cost)} + ${baht(b.pinProfit)}</div></div>`).join("");
  const savedNote=saved?.shopNote?`<div class="invoiceNoteSaved"><b>Note to shop:</b> ${escapeHtml(saved.shopNote)}</div>`:"";
  return `<div class="invoiceCard compactInvoice"><div class="invoiceHead"><div><div class="invoiceTitle">Weekly Settlement Invoice</div><div class="wizardMinimal">Week ending ${escapeHtml(invoiceDateLabel(date))}</div></div><div class="invoiceMeta"><b>${escapeHtml(number)}</b><br>${saved?"Saved":"Draft"}</div></div><div class="invoiceFrom"><b>Issued by Yaowaret</b></div>${branches}<div class="invoiceTotal"><div class="k">Total payable to Pin</div><div class="v">${baht(saved?.totals?.payPin ?? (summary.combined.payPin + (state.appliedAdjustments||[]).reduce((n,a)=>n+Number(a.amount||0),0)))}</div></div>${((saved?.adjustmentsApplied||state.appliedAdjustments||[]).length)?`<div class="invoiceAdjustment"><b>Correction from previous week</b>${(saved?.adjustmentsApplied||state.appliedAdjustments||[]).map(a=>`<div class="invoiceAdjustmentLine"><span>${escapeHtml(a.description||('Week ending '+invoiceDateLabel(a.sourceDate)))}</span><b>${Number(a.amount)>=0?'+':''}${baht(a.amount)}</b></div>`).join('')}</div>`:''}<details class="invoiceScreenDetails"><summary>View invoice breakdown</summary><div class="invoiceNums" style="margin-top:7px">${breakdown}</div><div class="invoiceExplain">Normal profit split: BM 40% · Alix 30% · Pin 30%. Edibles: BM 40% · Alix 20% · Pin 40%.</div></details>${savedNote}<div class="invoiceState"><span class="${saved?'invoiceSaved':'invoiceDraft'}">${saved?'✓ INVOICE SAVED':'DRAFT — NOT SAVED'}</span><span class="wizardMinimal">Sales ${baht(summary.combined.sales)}</span></div></div>`;
}
function latestInvoiceForDate(date){
  return [...(db.invoices||[])].filter(x=>x&&x.reportDate===date&&x.status!=="void").sort((a,b)=>Number(b.version||1)-Number(a.version||1)||String(b.createdAt||"").localeCompare(String(a.createdAt||"")))[0]||null;
}
function postInvoiceDocketEdits(inv){
  if(!inv)return [];
  const created=Date.parse(inv.createdAt||inv.createdDate||"")||0;
  const items=wizardReportsForDate(inv.reportDate);
  const prevDates=items.map(x=>x?.rec?.previousDate).filter(Boolean).sort();
  const prev=prevDates.length?prevDates[0]:"";
  const branches=new Set((inv.branches||[]).map(b=>canonicalBranchName(b.branch)));
  return (db.docketAudit||[]).filter(e=>{
    if(e.action!=="edited")return false;
    const at=Date.parse(e.at||"")||0;if(at<=created)return false;
    const d=String(e.date||e.beforeSnapshot?.date||"");
    if(!d||d>String(inv.reportDate||"")||(prev&&d<=prev))return false;
    const b=canonicalBranchName(e.branch||e.beforeSnapshot?.branch||"");
    return !branches.size||branches.has(b);
  }).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));
}
function invoiceSourceEditAckKey(inv,events){return `${inv.id}:${events.map(e=>e.id).sort().join(",")}`;}
function acknowledgeInvoiceSourceEdits(id){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return;
  const events=postInvoiceDocketEdits(inv);
  if(!db.alertAcknowledgements||typeof db.alertAcknowledgements!=="object")db.alertAcknowledgements={};
  db.alertAcknowledgements[invoiceSourceEditAckKey(inv,events)]=new Date().toISOString();
  localStorage.setItem("mdpin-db",JSON.stringify(db));renderDashboardAlerts();renderInvoiceRecord(id);
}
window.acknowledgeInvoiceSourceEdits=acknowledgeInvoiceSourceEdits;

function correctionChangeDescription(c){
 const parts=(c.changes||[]).map(ch=>{
  const before=ch.before?productLineLabel(ch.before):"",after=ch.after?productLineLabel(ch.after):"";
  if(before&&after)return `${before} → ${after}`;
  if(before)return `${before} removed`;
  return after?`${after} added`:"Docket corrected";
 });
 return parts.slice(0,3).join("; ")+(parts.length>3?` +${parts.length-3} more`:"");
}
function makeAutomaticInvoiceRevision(inv,live,correction){
 if(!inv||!live?.financialGreen)return null;
 const summary=live.summary,version=Number(inv.version||1)+1,id="INV"+Date.now(),adjustmentsApplied=(inv.adjustmentsApplied||[]).map(a=>({...a})),adjustmentTotal=adjustmentsApplied.reduce((n,a)=>n+Number(a.amount||0),0),basePayPin=Number(summary.combined.payPin||0);
 const record={...JSON.parse(JSON.stringify(inv)),id,version,createdDate:today(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),signature:live.signature,adjustmentSignature:settlementAdjustmentSignature(adjustmentsApplied),adjustmentsApplied,branches:summary.branches.map(b=>({branch:b.branch,sales:b.sales,cost:b.cost,profit:b.profit,bm:b.bm,alix:b.alix,pinProfit:b.pinProfit,payPin:b.payPin})),totals:{...summary.combined,basePayPin,adjustmentTotal,payPin:basePayPin+adjustmentTotal},supersededBy:null,supersededAt:null,revisionReason:"Delivery docket correction",revisionCorrectionId:correction.id};
 if(inv.sent?.status==="sent")record.sent={status:"not_sent",date:null,note:"Corrected invoice revision — resend to customer"};
 if(inv.payment?.status==="paid")record.payment={...inv.payment,reviewRequired:true,note:[inv.payment.note,"Invoice corrected after payment; review revised amount."].filter(Boolean).join(" · ")};
 inv.supersededBy=id;inv.supersededAt=new Date().toISOString();db.invoices.push(record);return record;
}
function processPendingDocketCorrections(){
 if(!Array.isArray(db.pendingCorrections)||!db.pendingCorrections.length)return false;
 let changed=false;
 db.pendingCorrections.forEach(c=>{
  if(!["pending","waiting_reconciliation"].includes(c.status))return;
  const inv=(db.invoices||[]).find(x=>x.id===c.invoiceId);if(!inv){c.status="error";c.message="Affected invoice could not be found.";changed=true;return;}
  const live=currentWizardStateSafeForInvoice(inv.reportDate);
  if(!live?.financialGreen){if(c.status!=="waiting_reconciliation"){c.status="waiting_reconciliation";changed=true;}c.message="Waiting for the edited week to reconcile.";return;}
  const oldBase=Number(inv.totals?.basePayPin ?? (Number(inv.totals?.payPin||0)-Number(inv.totals?.adjustmentTotal||0))),newBase=Number(live.summary?.combined?.payPin||0),delta=+(newBase-oldBase).toFixed(2);c.amount=delta;c.description=correctionChangeDescription(c);
  if(c.choice==="update_current"){
    if(Math.abs(delta)<0.005&&inv.signature===live.signature){c.status="resolved";c.message="No financial change was required.";changed=true;return;}
    const revision=makeAutomaticInvoiceRevision(inv,live,c);if(revision){c.status="resolved";c.revisedInvoiceId=revision.id;c.message=`Updated ${revision.number} v${revision.version}.`;changed=true;}
  }else if(c.choice==="next_sunday"){
    if(Math.abs(delta)<0.005){c.status="resolved";c.message="No financial difference to carry forward.";changed=true;return;}
    if(!Array.isArray(db.adjustments))db.adjustments=[];
    let a=db.adjustments.find(a=>a.correctionId===c.id);
    if(!a){a={id:"ADJ"+Date.now()+Math.floor(Math.random()*1000),status:"pending",amount:delta,sourceDate:inv.reportDate,oldInvoiceId:inv.id,newInvoiceId:null,oldNumber:inv.number,newNumber:"",createdAt:new Date().toISOString(),resolution:"next_sunday_auto",correctionId:c.id,description:c.description||"Delivery docket correction"};db.adjustments.push(a);}
    c.status="queued";c.adjustmentId=a.id;c.message="Will be added automatically to the next Sunday invoice.";changed=true;
  }
 });
 if(changed)localStorage.setItem("mdpin-db",JSON.stringify(db));return changed;
}
function invoiceRecordState(inv){
  if(!inv)return {label:"UNKNOWN",cls:""};
  if(inv.supersededBy)return {label:"SUPERSEDED",cls:"warn"};
  const tracked=(db.pendingCorrections||[]).find(c=>c.invoiceId===inv.id&&["pending","waiting_reconciliation","queued"].includes(c.status));
  if(tracked?.choice==="next_sunday")return {label:"CURRENT",cls:"ok"};
  const state=currentWizardStateSafeForInvoice(inv.reportDate);
  if(state&&state.financialGreen===false)return {label:"UPDATE REQUIRED",cls:"warn"};
  if(state&&state.signature&&inv.signature!==state.signature)return {label:"UPDATE REQUIRED",cls:"warn"};
  if(inv.payment?.status==="paid")return {label:"PAID",cls:"paid"};
  return {label:"CURRENT",cls:"ok"};
}
function currentWizardStateSafeForInvoice(date){
  try{
    const items=wizardReportsForDate(date);
    if(!items.length)return null;
    const stockGreen=items.every(x=>x.rec.status==="ok");
    const financial=items.map(x=>({report:x.report,result:financialReconcileReport(x.report)}));
    const financialGreen=stockGreen&&financial.length>0&&financial.every(x=>x.result.status==="ok");
    const summary=invoiceFinancialSummary(financial);
    if(!financialGreen)return {signature:null,financialGreen:false,stockGreen,financial,items,summary:null};
    return {signature:invoiceSignature(date,summary),summary,financialGreen:true,financial,items};
  }catch(e){return null;}
}
function addRevisionAdjustment(oldInv,newInv){
  const delta=Number(newInv.totals?.payPin||0)-Number(oldInv.totals?.payPin||0);
  if(Math.abs(delta)<0.005)return;
  if(oldInv.sent?.status!=="sent"&&!oldInv.payment)return;
  if(!Array.isArray(db.adjustments))db.adjustments=[];
  if(db.adjustments.some(a=>a.oldInvoiceId===oldInv.id&&a.newInvoiceId===newInv.id))return;
  db.adjustments.push({id:"ADJ"+Date.now(),status:"pending",amount:+delta.toFixed(2),sourceDate:newInv.reportDate,oldInvoiceId:oldInv.id,newInvoiceId:newInv.id,oldNumber:oldInv.number,newNumber:newInv.number,createdAt:new Date().toISOString(),resolution:null});
}
function ensureDeliverySuggestions(){
  // Legacy compatibility only. v0.10.8 DEV stores suggested deliveries as normal unsent dockets.
  if(!Array.isArray(db.deliverySuggestions))db.deliverySuggestions=[];
}
function sundaySuggestedLines(report){
  const combined=new Map();
  (report?.rows||[]).forEach(rr=>{
    const sold=Number(rr.sold ?? ((Number(rr.oldStock)||0)+(Number(rr.newDeliver)||0)-(Number(rr.takeOut)||0)-(Number(rr.inStock)||0)))||0;
    if(sold<=0)return;
    const pm=canonicalProductMatchRow(rr),p=pm.product;
    if(!p)return;
    const prices=validatedProductPrices(p)||{cost:Number(p.cost||0),retail:Number(p.retail||0)};
    const existing=combined.get(p.id)||{productId:p.id,qty:0,productName:p.name,cost:Number(prices.cost||0),retail:Number(prices.retail||0)};
    existing.qty+=sold;
    combined.set(p.id,existing);
  });
  return [...combined.values()].filter(l=>l.qty>0).sort((a,b)=>String(a.productName).localeCompare(String(b.productName),'en',{sensitivity:'base',numeric:true}));
}
function suggestedDraftRef(date,branch){
  const d=String(date||today()).replaceAll("-","").slice(2);
  const b=canonicalBranchName(branch)==="Lamai"?"LAM":"BAN";
  return `SD-${d}-${b}`;
}
function isSuggestedDraftDocket(d){
  return !!d && !!d.generatedFromSundaySuggestion && !d.deliveredAt;
}
function migrateLegacyDeliverySuggestions(){
  ensureDeliverySuggestions();
  if(!db.deliverySuggestions.length)return false;
  let changed=false;
  db.deliverySuggestions.forEach(s=>{
    if(!s?.branch||!s?.sourceSundayDate||!(s.lines||[]).length)return;
    const existing=(db.deliveries||[]).find(d=>
      d.generatedFromSundaySuggestion &&
      d.sourceSundayDate===s.sourceSundayDate &&
      canonicalBranchName(d.branch)===canonicalBranchName(s.branch)
    );
    if(existing)return;
    const d={
      id:"D"+Date.now()+Math.random().toString(36).slice(2,5),
      branch:s.branch,
      date:s.date||today(),
      note:s.note||`Suggested from sales for week ending ${s.sourceSundayDate}`,
      lines:(s.lines||[]).map(l=>({...l})),
      deliveredAt:null,
      lineChanges:[],
      generatedFromSundaySuggestion:true,
      sourceSundayDate:s.sourceSundayDate,
      suggestedRef:suggestedDraftRef(s.sourceSundayDate,s.branch),
      createdAt:s.createdAt||new Date().toISOString()
    };
    db.deliveries.push(d);
    changed=true;
  });
  if(db.deliverySuggestions.length){
    db.deliverySuggestions=[];
    changed=true;
  }
  if(changed)localStorage.setItem("mdpin-db",JSON.stringify(db));
  return changed;
}
function refreshSundayDeliverySuggestions(state,date){
  if(!date||!state?.items?.length)return;
  migrateLegacyDeliverySuggestions();
  state.items.forEach(({report})=>{
    const branch=report.branch;
    const lines=sundaySuggestedLines(report);
    const existing=(db.deliveries||[]).find(d=>
      d.generatedFromSundaySuggestion &&
      d.sourceSundayDate===date &&
      canonicalBranchName(d.branch)===canonicalBranchName(branch)
    );

    // Once the draft has been marked delivered it is historical and never regenerated.
    if(existing?.deliveredAt)return;

    if(!lines.length){
      if(existing){
        db.deliveries=db.deliveries.filter(d=>d.id!==existing.id);
      }
      return;
    }

    if(existing){
      // Refresh only the untouched system suggestion. If Pin has edited it, preserve her work.
      if(!existing.userEditedSuggestedDraft){
        existing.lines=lines.map(l=>({...l}));
        existing.updatedAt=new Date().toISOString();
        existing.note=existing.note||`Suggested from sales for week ending ${date}`;
      }
      existing.suggestedRef=existing.suggestedRef||suggestedDraftRef(date,branch);
      existing.generatedFromSundaySuggestion=true;
      return;
    }

    db.deliveries.push({
      id:"D"+Date.now()+Math.random().toString(36).slice(2,5),
      branch,
      date:today(),
      note:`Suggested from sales for week ending ${date}`,
      lines:lines.map(l=>({...l})),
      deliveredAt:null,
      lineChanges:[],
      generatedFromSundaySuggestion:true,
      sourceSundayDate:date,
      suggestedRef:suggestedDraftRef(date,branch),
      createdAt:new Date().toISOString()
    });
  });
}
function bootstrapLatestSavedInvoiceSuggestions(){
  migrateLegacyDeliverySuggestions();
  if(db.deliverySuggestionBootstrapDoneV2)return;
  const latest=[...(db.invoices||[])].filter(i=>i&&!i.supersededBy&&i.status!=="void"&&i.reportDate).sort((a,b)=>String(b.reportDate).localeCompare(String(a.reportDate))||Number(b.version||1)-Number(a.version||1))[0];
  if(!latest)return;
  const items=wizardReportsForDate(latest.reportDate);
  if(items.length){
    refreshSundayDeliverySuggestions({items},latest.reportDate);
    db.deliverySuggestionBootstrapDoneV2=true;
    localStorage.setItem("mdpin-db",JSON.stringify(db));
  }
}
window.openSuggestedDraftFromDashboard=id=>{
  const d=(db.deliveries||[]).find(x=>x.id===id);
  if(!d)return alert("Suggested delivery docket not found.");

  // Clear any create/edit state first so Dashboard routing is deterministic.
  try{
    if(typeof setDeliveryView==="function")setDeliveryView("archive");
  }catch(err){console.warn("Delivery view reset failed",err)}

  try{
    if(typeof switchTab==="function")switchTab("docket");
  }catch(err){console.warn("Delivery tab switch failed",err)}

  // Let the DOM/view state settle before expanding the requested saved docket.
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      try{
        if(typeof renderDocketArchive==="function")renderDocketArchive(id);
        else openDeliveryArchive(id);
      }catch(err){
        console.error("Suggested docket open failed",err);
        openDeliveryArchive(id);
      }
    },40);
  });
};

function saveSundayInvoice(){
  const state=currentWizardState();
  if(!state.financialGreen||!state.items.length)return alert("Financial reconciliation must be complete before saving the invoice.");
  if(!state.adjustmentsReady)return alert("Choose what to do with each prior adjustment before saving the invoice.");
  const date=state.items[0].report.date,summary=invoiceFinancialSummary(state.financial),sig=invoiceSignature(date,summary),baseNumber=sundayInvoiceNumber(date);
  if(!Array.isArray(db.invoices))db.invoices=[];
  const latest=latestInvoiceForDate(date),adjSig=settlementAdjustmentSignature(state.appliedAdjustments||[]);
  const latestAdjSig=latest?(latest.adjustmentSignature||settlementAdjustmentSignature(latest.adjustmentsApplied||[])):"";
  if(latest&&latest.signature===sig&&latestAdjSig===adjSig){
    refreshSundayDeliverySuggestions(state,date);
    localStorage.setItem("mdpin-db",JSON.stringify(db));
    renderSundayWizard();renderDocketArchive();return;
  }
  const noteEl=document.getElementById("invoiceShopNote"),shopNote=(noteEl?noteEl.value:(latest?.shopNote||"")).trim();
  const version=latest?Number(latest.version||1)+1:1,id="INV"+Date.now();
  const adjustmentTotal=(state.appliedAdjustments||[]).reduce((n,a)=>n+Number(a.amount||0),0);
  const adjustmentSnapshots=(state.appliedAdjustments||[]).map(a=>({id:a.id,amount:Number(a.amount||0),sourceDate:a.sourceDate,oldNumber:a.oldNumber||"",newNumber:a.newNumber||"",description:a.description||"",resolution:a.resolution||""}));
  const totals={...summary.combined,basePayPin:summary.combined.payPin,adjustmentTotal,payPin:summary.combined.payPin+adjustmentTotal};
  const record={id,number:baseNumber,version,reportDate:date,createdDate:today(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:"unpaid",signature:sig,adjustmentSignature:adjSig,adjustmentsApplied:adjustmentSnapshots,shopNote,sent:{status:"not_sent",date:null,note:""},branches:summary.branches.map(b=>({branch:b.branch,sales:b.sales,cost:b.cost,profit:b.profit,bm:b.bm,alix:b.alix,pinProfit:b.pinProfit,payPin:b.payPin})),totals};
  if(latest&&(latest.signature!==sig||latestAdjSig!==adjSig)){latest.supersededBy=id;latest.supersededAt=new Date().toISOString();addRevisionAdjustment(latest,record);}
  db.invoices.push(record);
  refreshSundayDeliverySuggestions(state,date);
  (state.appliedAdjustments||[]).forEach(a=>{if(!Array.isArray(a.appliedHistory))a.appliedHistory=[];if(a.appliedToInvoiceId&&a.appliedToInvoiceId!==id)a.appliedHistory.push({invoiceId:a.appliedToInvoiceId,date:a.appliedToDate,at:a.resolvedAt||new Date().toISOString()});a.status="applied";if(a.resolution!=="next_sunday_auto")a.resolution="carry_forward";a.appliedToInvoiceId=id;a.appliedToDate=date;a.resolvedAt=new Date().toISOString();});
  localStorage.setItem("mdpin-db",JSON.stringify(db));renderSundayWizard();renderHistory();renderDashboardAlerts();
  offerSundayCompletionBackup();
}
function pdfEscapeText(v){return String(v??"").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/[\r\n]+/g," ");}
function pdfAscii(v){
  return String(v??"").normalize?String(v??"").normalize("NFKD").replace(/[^\x20-\x7E]/g," "):String(v??"").replace(/[^\x20-\x7E]/g," ");
}
function pdfMoney(v){
  const n=Number(v||0);return "THB "+n.toLocaleString("en-US",{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2});
}
function pdfWrap(text,maxChars=78){
  const words=pdfAscii(text).trim().split(/\s+/).filter(Boolean),out=[];let line="";
  words.forEach(w=>{const next=line?line+" "+w:w;if(next.length>maxChars&&line){out.push(line);line=w}else line=next;});
  if(line)out.push(line);return out.length?out:[""];
}
function buildSundayInvoicePdfBytes(invoice){
  const c=[];
  const esc=t=>pdfEscapeText(pdfAscii(t));
  const txt=(text,x,y,size=11,bold=false,r=0.09,g=0.13,b=0.20)=>{
    c.push(`${r} ${g} ${b} rg BT /F${bold?2:1} ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`);
  };
  const rect=(x,y,w,h,fillR,fillG,fillB,strokeR=null,strokeG=null,strokeB=null,line=1)=>{
    c.push('q');
    if(fillR!==null)c.push(`${fillR} ${fillG} ${fillB} rg`);
    if(strokeR!==null)c.push(`${strokeR} ${strokeG} ${strokeB} RG ${line} w`);
    c.push(`${x} ${y} ${w} ${h} re ${fillR!==null?(strokeR!==null?'B':'f'):'S'}`);
    c.push('Q');
  };
  const line=(x1,y1,x2,y2,r=.86,g=.88,b=.91,w=.8)=>c.push(`q ${r} ${g} ${b} RG ${w} w ${x1} ${y1} m ${x2} ${y2} l S Q`);
  const money=v=>pdfMoney(v);
  const pageLeft=42,pageRight=553,pageWidth=511;

  // Header
  txt('WEEKLY SETTLEMENT INVOICE',pageLeft,785,22,true);
  txt('Week ending '+invoiceDateLabel(invoice.reportDate),pageLeft,762,11,false,.38,.42,.50);
  txt((invoice.number||'')+(Number(invoice.version||1)>1?' v'+Number(invoice.version||1):''),455,786,10,true,.38,.42,.50);
  txt('Saved '+invoiceDateLabel(invoice.createdDate||invoice.reportDate),455,769,9,false,.38,.42,.50);
  line(pageLeft,747,pageRight,747);
  txt('Issued by Yaowaret',pageLeft,726,11,true);
  txt('The Grocery by BM + BM Lamai weekly settlement',pageLeft,708,10,false,.28,.32,.40);

  // Branch cards styled to match the on-screen v0.9.30 invoice.
  let top=679;
  (invoice.branches||[]).forEach((b,idx)=>{
    const h=116,y=top-h;
    rect(pageLeft,y,pageWidth,h,.995,.997,1,.87,.89,.92,.9);
    txt(displayBranchName(b.branch),pageLeft+16,top-24,14,true);

    const gap=10,innerX=pageLeft+16,innerW=pageWidth-32,cellW=(innerW-gap)/2,cellH=31;
    const row1Y=top-67,row2Y=top-104;
    const drawCell=(x,y,label,value)=>{
      rect(x,y,cellW,cellH,.972,.978,.986,null,null,null);
      txt(label.toUpperCase(),x+10,y+18,7.5,true,.38,.42,.50);
      txt(value,x+10,y+5,11.5,true);
    };
    drawCell(innerX,row1Y,'Sales',money(b.sales));
    drawCell(innerX+cellW+gap,row1Y,'Cost recovery',money(b.cost));
    drawCell(innerX,row2Y,'Pin profit share',money(b.pinProfit));
    drawCell(innerX+cellW+gap,row2Y,'Amount due',money(b.payPin));
    top=y-14;
  });

  // Carry-forward adjustments stay separate from current-week trading.
  const pdfAdjustments=invoice.adjustmentsApplied||[];
  if(pdfAdjustments.length){
    txt('CORRECTION FROM PREVIOUS WEEK',pageLeft,top-18,8.5,true,.55,.25,.08);
    pdfAdjustments.forEach((a,idx)=>txt((a.description||invoiceDateLabel(a.sourceDate))+'  '+(Number(a.amount)>=0?'+':'')+money(a.amount),pageLeft+145,top-18-(idx*12),8.5,true,.20,.24,.31));
    top-=Math.max(26,pdfAdjustments.length*12+12);
  }
  // Prominent total panel.
  const totalY=top-67;
  rect(pageLeft,totalY,pageWidth,58,.09,.13,.20,null,null,null);
  txt('TOTAL PAYABLE TO PIN',pageLeft+16,totalY+38,9.5,true,.78,.81,.86);
  txt(money(invoice.totals?.payPin||0),pageLeft+16,totalY+13,22,true,1,1,1);
  txt('Total sales '+money(invoice.totals?.sales||0),418,totalY+20,8.5,false,.78,.81,.86);

  let bodyY=totalY-24;
  txt("Verified product cost recovery plus Pin's profit share.",pageLeft,bodyY,9.5,false,.38,.42,.50); bodyY-=15;
  txt('Normal profit split: BM 40% / Alix 30% / Pin 30%.  Edibles: BM 40% / Alix 20% / Pin 40%.',pageLeft,bodyY,8.8,false,.38,.42,.50); bodyY-=23;

  if(invoice.shopNote){
    line(pageLeft,bodyY+9,pageRight,bodyY+9); bodyY-=8;
    txt('NOTE TO SHOP',pageLeft,bodyY,9,true,.55,.25,.08); bodyY-=16;
    for(const row of pdfWrap(invoice.shopNote,94).slice(0,7)){
      txt(row,pageLeft,bodyY,9.5,false,.20,.24,.31); bodyY-=14;
    }
  }

  // Footer kept subtle; no extra attachment or helper document is generated.
  line(pageLeft,53,pageRight,53,.90,.91,.93,.7);
  txt('Verified and saved in Magic Dragon Pin',pageLeft,37,7.5,false,.48,.51,.57);
  txt((invoice.number||'')+(Number(invoice.version||1)>1?' v'+Number(invoice.version||1):'')+'  •  Page 1 of 1',445,37,7.5,false,.48,.51,.57);

  const content=c.join('\n');
  const objs=[];
  objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
  objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objs[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objs[6]=`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`;
  let pdf='%PDF-1.4\n%MDPIN\n',offsets=[0];
  for(let i=1;i<=6;i++){offsets[i]=new TextEncoder().encode(pdf).length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
  const xref=new TextEncoder().encode(pdf).length;
  pdf+='xref\n0 7\n0000000000 65535 f \n';
  for(let i=1;i<=6;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
async function shareInvoicePDF(inv){
  if(!inv)return alert("Invoice record not found.");
  try{
    const bytes=buildSundayInvoicePdfBytes(inv);
    const blob=new Blob([bytes],{type:"application/pdf"});
    const v=Number(inv.version||1)>1?` v${Number(inv.version||1)}`:"";
    const filename=`Invoice - The Grocery by BM + BM Lamai - ${invoiceDateLabel(inv.reportDate).replace(/\s+/g," ")}${v}.pdf`;
    const file=new File([blob],filename,{type:"application/pdf"});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return;}
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.rel="noopener";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(err){if(err&&err.name==="AbortError")return;console.error(err);alert("The PDF could not be created. Please try again.");}
}
async function createSundayInvoicePDF(){const state=currentWizardState();if(!state.invoiceSaved||!state.invoice)return alert("Save the verified invoice first.");return shareInvoicePDF(state.invoice);}
function markInvoiceSent(id,status){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return;
  const date=document.getElementById("invoiceSentDate")?.value||today();
  const note=(document.getElementById("invoiceSentNote")?.value||"").trim();
  inv.sent=status==="sent"?{status:"sent",date,note,savedAt:new Date().toISOString()}:{status:"not_sent",date:null,note:"",savedAt:new Date().toISOString()};
  localStorage.setItem("mdpin-db",JSON.stringify(db));renderInvoiceRecord(id);renderHistory();renderDashboardAlerts();
}
function invoiceViewerPaymentStatus(id,status){
  const paid=status==="paid";
  const paidBtn=document.getElementById("viewerPaidBtn"),unpaidBtn=document.getElementById("viewerUnpaidBtn"),fields=document.getElementById("viewerPaidFields");
  if(paidBtn){paidBtn.classList.toggle("activePaid",paid);paidBtn.setAttribute("aria-pressed",paid?"true":"false");}
  if(unpaidBtn){unpaidBtn.classList.toggle("activeUnpaid",!paid);unpaidBtn.setAttribute("aria-pressed",paid?"false":"true");}
  const statusEl=document.getElementById("viewerPaymentStatus");if(statusEl)statusEl.value=paid?"paid":"unpaid";
  if(fields)fields.style.display=paid?"grid":"none";
}
function invoiceViewerPaymentMethodChanged(){
  const method=document.getElementById("viewerPaymentMethod")?.value||"";
  const wrap=document.getElementById("viewerPaymentOtherWrap");if(wrap)wrap.style.display=method==="other"?"block":"none";
}
function saveInvoiceViewerPayment(id){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return alert("Invoice record not found.");
  const status=document.getElementById("viewerPaymentStatus")?.value||"unpaid";
  const paid=status==="paid";
  const date=document.getElementById("viewerPaymentDate")?.value||"";
  const method=document.getElementById("viewerPaymentMethod")?.value||"";
  const other=(document.getElementById("viewerPaymentOther")?.value||"").trim();
  const note=(document.getElementById("viewerPaymentNote")?.value||"").trim();
  if(paid&&!date)return alert("Choose the payment date before marking this invoice paid.");
  if(paid&&!method)return alert("Choose the payment method before marking this invoice paid.");
  if(paid&&method==="other"&&!other)return alert("Enter the payment method.");
  inv.status=paid?"paid":"unpaid";
  inv.payment={status:paid?"paid":"unpaid",date:paid?date:null,method:paid?method:null,methodOther:paid&&method==="other"?other:"",note,savedAt:new Date().toISOString()};
  localStorage.setItem("mdpin-db",JSON.stringify(db));
  renderInvoiceRecord(id);renderHistory();renderDashboardAlerts();
}
window.invoiceViewerPaymentStatus=invoiceViewerPaymentStatus;
window.invoiceViewerPaymentMethodChanged=invoiceViewerPaymentMethodChanged;
window.saveInvoiceViewerPayment=saveInvoiceViewerPayment;

function correctionWorkflowMarkup(inv,live,oldBase,livePay,liveDelta){
  const pending=(db.pendingCorrections||[]).filter(c=>c.invoiceId===inv.id&&["pending","waiting_reconciliation"].includes(c.status));
  if(live?.financialGreen){
    const delta=Number(live.summary?.combined?.payPin||0)-oldBase;
    return `<div class="invoiceWarning"><b>Source correction detected</b><br>Verified difference: ${delta>=0?'+':''}${baht(delta)}. If this came from a docket edit, the handling choice is made directly on the Edit Docket screen.</div>`;
  }
  return `<div class="invoiceWarning"><b>Correction waiting for reconciliation</b><br>No money difference is being calculated while this week is out of balance. Fix the highlighted stock discrepancy first; the saved correction choice will then be applied automatically.${pending.length?`<div class="wizardMinimal" style="margin-top:5px">${escapeHtml(pending[0].message||"")}</div>`:""}</div>`;
}
function continueInvoiceCorrection(id){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return;
  openSundayWizard(inv.reportDate);sundayWizardStep=2;renderSundayWizard();
}
function createRevisionFromInvoice(id){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return;
  const live=currentWizardStateSafeForInvoice(inv.reportDate);
  if(!live?.financialGreen)return alert('Complete the correction reconciliation first.');
  openSundayWizard(inv.reportDate);sundayWizardStep=4;renderSundayWizard();
}
function queueCorrectionForNextSunday(id){
  const inv=(db.invoices||[]).find(x=>x.id===id);if(!inv)return;
  const live=currentWizardStateSafeForInvoice(inv.reportDate);if(!live?.financialGreen)return alert('Complete the correction reconciliation first so the adjustment amount is verified.');
  const oldBase=Number(inv.totals?.basePayPin ?? (Number(inv.totals?.payPin||0)-Number(inv.totals?.adjustmentTotal||0)));
  const next=Number(live.summary?.combined?.payPin||0),delta=+(next-oldBase).toFixed(2);
  if(Math.abs(delta)<0.005)return alert('There is no financial difference to carry forward.');
  if(!Array.isArray(db.adjustments))db.adjustments=[];
  let a=db.adjustments.find(a=>a.oldInvoiceId===inv.id&&a.status==='pending'&&a.resolution==='carry_forward_pending');
  if(!a){a={id:'ADJ'+Date.now(),status:'pending',amount:delta,sourceDate:inv.reportDate,oldInvoiceId:inv.id,newInvoiceId:null,oldNumber:inv.number,newNumber:'',createdAt:new Date().toISOString(),resolution:'carry_forward_pending'};db.adjustments.push(a);}
  localStorage.setItem('mdpin-db',JSON.stringify(db));renderDashboardAlerts();renderInvoiceRecord(id);alert(`Adjustment ${delta>=0?'+':''}${baht(delta)} is queued for the next eligible Sunday.`);
}
function deferInvoiceCorrection(id){
  switchTab('home');renderDashboardAlerts();window.scrollTo({top:0,behavior:'smooth'});
}
window.continueInvoiceCorrection=continueInvoiceCorrection;window.createRevisionFromInvoice=createRevisionFromInvoice;window.queueCorrectionForNextSunday=queueCorrectionForNextSunday;window.deferInvoiceCorrection=deferInvoiceCorrection;
function renderInvoiceRecord(id){
  const box=document.getElementById("invoiceViewerBody"),inv=(db.invoices||[]).find(x=>x.id===id);if(!box||!inv)return;
  const st=invoiceRecordState(inv),sent=inv.sent?.status==="sent",latest=latestInvoiceForDate(inv.reportDate),isLatest=latest?.id===inv.id;
  const live=currentWizardStateSafeForInvoice(inv.reportDate);
  const livePay=live?.summary?.combined?.payPin;
  const oldBase=Number(inv.totals?.basePayPin ?? (Number(inv.totals?.payPin||0)-Number(inv.totals?.adjustmentTotal||0)));
  const liveDelta=livePay==null?null:Number(livePay)-oldBase;
  const sourceEdits=postInvoiceDocketEdits(inv);
  const sourceAck=sourceEdits.length&&db.alertAcknowledgements?.[invoiceSourceEditAckKey(inv,sourceEdits)];
  const warning=inv.supersededBy?`<div class="invoiceWarning"><b>This is the original / earlier invoice version.</b><br>A newer version is available. Nothing has been overwritten.<div class="recordActions"><button class="btn" onclick="openInvoiceRecord('${inv.supersededBy}')">Open newer version</button></div></div>`:st.label==="UPDATE REQUIRED"?correctionWorkflowMarkup(inv,live,oldBase,livePay,liveDelta):sourceEdits.length&&!sourceAck?`<div class="invoiceWarning" style="background:#fffaf0;border-color:#f1d48b;color:#78350f"><b>Source docket edited after this invoice</b><br>${sourceEdits.length} delivery docket edit${sourceEdits.length===1?' was':'s were'} made after this invoice was saved. The invoice amount is currently unchanged.<div class="recordActions"><button class="btn" onclick="acknowledgeInvoiceSourceEdits('${inv.id}')">Acknowledge</button></div></div>`:"";
  const branchRows=(inv.branches||[]).map(b=>`<tr><td class="branchNameCell">${escapeHtml(displayBranchName(b.branch))}</td><td>${baht(b.sales)}</td><td>${baht(b.cost)}</td><td>${baht(b.pinProfit)}</td><td class="amountDueCell">${baht(b.payPin)}</td></tr>`).join("");
  const pending=(db.adjustments||[]).filter(a=>a.status==="pending"&&(a.oldInvoiceId===inv.id||a.newInvoiceId===inv.id));
  const adjustmentTotal=Number(inv.totals?.adjustmentTotal||0);
  const basePay=Number(inv.totals?.basePayPin ?? (Number(inv.totals?.payPin||0)-adjustmentTotal));
  const adjustmentRows=(inv.adjustmentsApplied||[]).map(a=>`<div class="invoiceAdjustmentLine"><span>${escapeHtml(a.description||invoiceDateLabel(a.sourceDate))}</span><b>${Number(a.amount)>=0?'+':''}${baht(a.amount)}</b></div>`).join('');
  box.innerHTML=`${warning}
  <div class="invoiceDocument">
    <div class="invoiceDocHeader">
      <div>
        <div class="invoiceDocTitle">WEEKLY SETTLEMENT INVOICE</div>
        <div class="invoiceDocPeriod">Week ending ${escapeHtml(invoiceDateLabel(inv.reportDate))}</div>
      </div>
      <div class="invoiceDocRef">
        <div><span>Invoice</span><b>${escapeHtml(inv.number||"")} v${Number(inv.version||1)}</b></div>
        <div><span>Issued</span><b>${escapeHtml(invoiceDateLabel(inv.createdDate||inv.reportDate))}</b></div>
      </div>
    </div>
    <div class="invoiceDocParties">
      <div><span class="invoiceDocLabel">Issued by</span><b>Yaowaret</b></div>
      <div><span class="invoiceDocLabel">Settlement for</span><b>The Grocery by BM + BM Lamai</b></div>
    </div>
    <div class="invoiceTableWrap">
      <table class="invoiceTable">
        <thead><tr><th>Branch</th><th>Sales</th><th>Cost</th><th>Pin share</th><th>Due</th></tr></thead>
        <tbody>${branchRows}</tbody>
      </table>
    </div>
    ${(inv.adjustmentsApplied||[]).length?`<div class="invoiceAdjustments"><div class="invoiceAdjustmentsTitle">Previous-week correction${inv.adjustmentsApplied.length>1?'s':''}</div>${adjustmentRows}<div class="invoiceAdjustmentLine subtotal"><span>Current week before adjustment</span><b>${baht(basePay)}</b></div></div>`:''}
    <div class="invoiceDocTotalRow"><div><span>Total payable to Pin</span><small>Verified cost recovery + Pin profit share${adjustmentTotal?` including ${adjustmentTotal>=0?'+':''}${baht(adjustmentTotal)} adjustment`:''}</small></div><strong>${baht(inv.totals?.payPin||0)}</strong></div>
    ${inv.shopNote?`<div class="invoiceDocNote"><span class="invoiceDocLabel">Note to shop</span>${escapeHtml(inv.shopNote)}</div>`:""}
    <div class="invoiceDocFooter"><span class="invoiceViewerStatus ${st.cls==='warn'?'warn':''}">${escapeHtml(st.label)}</span><span>Saved invoice record · v${Number(inv.version||1)}</span></div>
    ${pending.length?`<div class="invoiceWarning"><b>${pending.length} unresolved adjustment${pending.length>1?'s':''}</b><br>${pending.map(a=>`${escapeHtml(invoiceDateLabel(a.sourceDate))}: ${Number(a.amount)>=0?'+':''}${baht(a.amount)}`).join('<br>')}<br><span class="wizardMinimal">It will be offered in the next eligible Sunday workflow, or you can mark it handled separately.</span>${pending.map(a=>`<div class="adjustmentResolve"><button class="btn" onclick="resolveAdjustmentSeparately('${a.id}')">Mark ${Number(a.amount)>=0?'+':''}${baht(a.amount)} handled separately</button></div>`).join('')}</div>`:""}
  </div>
  <div class="invoiceManagementTitle">
    <div><b>Invoice management</b><span>Send, payment and PDF controls</span></div>
  </div>
  <div class="invoiceQuickActions">
    <button class="btn gold invoicePdfPrimary" onclick="shareInvoicePDFById('${inv.id}')">
      <span class="invoiceActionIcon">↗</span><span><b>Create / Share PDF</b><small>Customer invoice copy</small></span>
    </button>
  </div>

  <details class="invoiceManageCard invoiceSentBox" ${sent?'':'open'}>
    <summary>
      <div class="manageSummaryMain">
        <span class="manageIcon">✉</span>
        <div><b>Customer copy</b><small>${sent?`Sent ${escapeHtml(invoiceDateLabel(inv.sent.date))}${inv.sent.note?` · ${escapeHtml(inv.sent.note)}`:''}`:'Not marked as sent'}</small></div>
      </div>
      <span class="recordStatus ${sent?'ok':'unpaid'}">${sent?'SENT':'NOT SENT'}</span>
      <span class="manageChevron">⌄</span>
    </summary>
    <div class="manageEditor">
      <div class="manageFieldGrid">
        <label><span>Sent date</span><input id="invoiceSentDate" type="date" value="${escapeHtml(inv.sent?.date||today())}"></label>
        <label><span>How sent <em>optional</em></span><input id="invoiceSentNote" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" placeholder="LINE, email…" value="${escapeHtml(inv.sent?.note||'')}"></label>
      </div>
      <div class="manageButtonRow">
        <button class="btn gold" onclick="markInvoiceSent('${inv.id}','sent')">Save as Sent</button>
        <button class="btn subtleDanger" onclick="markInvoiceSent('${inv.id}','not_sent')">Mark Not Sent</button>
      </div>
    </div>
  </details>

  <details class="invoiceManageCard invoicePaymentBox" ${inv.payment?.status==='paid'?'':'open'}>
    <summary>
      <div class="manageSummaryMain">
        <span class="manageIcon">฿</span>
        <div><b>Payment</b><small>${inv.payment?.status==='paid'?`Paid ${escapeHtml(invoiceDateLabel(inv.payment.date))}${inv.payment.method?` · ${escapeHtml(inv.payment.method==='bank_transfer'?'Bank transfer':inv.payment.method==='promptpay'?'PromptPay':inv.payment.method==='cash'?'Cash':inv.payment.methodOther||'Other')}`:''}`:'Awaiting payment'}</small></div>
      </div>
      <span class="recordStatus ${inv.payment?.status==='paid'?'ok':'unpaid'}">${inv.payment?.status==='paid'?'PAID':'UNPAID'}</span>
      <span class="manageChevron">⌄</span>
    </summary>
    <div class="manageEditor">
      <input id="viewerPaymentStatus" type="hidden" value="${inv.payment?.status==='paid'?'paid':'unpaid'}">
      <div class="invoicePaymentToggle compactToggle">
        <button id="viewerUnpaidBtn" type="button" class="${inv.payment?.status==='paid'?'':'activeUnpaid'}" aria-pressed="${inv.payment?.status==='paid'?'false':'true'}" onclick="invoiceViewerPaymentStatus('${inv.id}','unpaid')">UNPAID</button>
        <button id="viewerPaidBtn" type="button" class="${inv.payment?.status==='paid'?'activePaid':''}" aria-pressed="${inv.payment?.status==='paid'?'true':'false'}" onclick="invoiceViewerPaymentStatus('${inv.id}','paid')">PAID</button>
      </div>
      <div id="viewerPaidFields" class="invoicePaymentFields" style="display:${inv.payment?.status==='paid'?'grid':'none'}">
        <div><label>Payment date</label><input id="viewerPaymentDate" type="date" value="${escapeHtml(inv.payment?.date||today())}"></div>
        <div><label>Method</label><select id="viewerPaymentMethod" onchange="invoiceViewerPaymentMethodChanged()"><option value="">Choose…</option><option value="cash" ${inv.payment?.method==='cash'?'selected':''}>Cash</option><option value="bank_transfer" ${inv.payment?.method==='bank_transfer'?'selected':''}>Bank transfer</option><option value="promptpay" ${inv.payment?.method==='promptpay'?'selected':''}>PromptPay</option><option value="other" ${inv.payment?.method==='other'?'selected':''}>Other</option></select></div>
        <div id="viewerPaymentOtherWrap" class="full" style="display:${inv.payment?.method==='other'?'block':'none'}"><label>Other payment method</label><input id="viewerPaymentOther" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" placeholder="Enter payment method" value="${escapeHtml(inv.payment?.methodOther||'')}"></div>
      </div>
      <div class="invoicePaymentFields compactNote"><div class="full"><label>Payment note <em>optional</em></label><input id="viewerPaymentNote" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" placeholder="Reference or note" value="${escapeHtml(inv.payment?.note||'')}"></div></div>
      <button class="btn gold invoicePaymentSave" type="button" onclick="saveInvoiceViewerPayment('${inv.id}')">Save Payment</button>
      ${inv.payment?`<div class="invoicePaymentSummary ${inv.payment.status==='paid'?'paid':''}">${inv.payment.status==='paid'?`✓ Paid ${escapeHtml(invoiceDateLabel(inv.payment.date))}${inv.payment.method?` · ${escapeHtml(inv.payment.method==='bank_transfer'?'Bank transfer':inv.payment.method==='promptpay'?'PromptPay':inv.payment.method==='cash'?'Cash':inv.payment.methodOther||'Other')}`:''}`:'Saved as UNPAID'}${inv.payment.note?` · ${escapeHtml(inv.payment.note)}`:''}</div>`:''}
    </div>
  </details>`;
}
function resolveAdjustmentSeparately(id){
  const a=(db.adjustments||[]).find(x=>x.id===id);if(!a)return;
  if(!confirm(`Mark this ${Number(a.amount)>=0?'+':''}${baht(a.amount)} adjustment as handled separately? It will not be carried into a future Sunday invoice.`))return;
  a.status="resolved";a.resolution="handled_separately";a.resolvedAt=new Date().toISOString();localStorage.setItem("mdpin-db",JSON.stringify(db));renderHistory();renderDashboardAlerts();
  const inv=(db.invoices||[]).find(x=>x.id===a.oldInvoiceId||x.id===a.newInvoiceId);if(inv)renderInvoiceRecord(inv.id);
}
window.resolveAdjustmentSeparately=resolveAdjustmentSeparately;
window.shareInvoicePDFById=id=>shareInvoicePDF((db.invoices||[]).find(x=>x.id===id));
window.openInvoiceRecord=id=>{switchTab('invoiceViewer');renderInvoiceRecord(id);window.scrollTo({top:0,behavior:"smooth"});};

function renderInvoiceWizard(state){
  if(!state.financialGreen)return '<div class="wizardLocked">Financial reconciliation must be complete before an invoice can be produced.</div>';
  const card=buildInvoiceCard(state,false);
  const note=state.invoice?.shopNote||"";
  const noteField=state.invoiceSaved?"":`<div class="invoiceNote"><label for="invoiceShopNote">Note to shop (optional)</label><textarea id="invoiceShopNote" placeholder="Add an explanation or message that should appear on the invoice…">${escapeHtml(note)}</textarea></div>`;
  const actions=state.invoiceSaved?`<div class="invoiceConfirmActions"><button class="btn gold primary" type="button" onclick="createSundayInvoicePDF()">Create / Share PDF</button><button class="btn" type="button" onclick="saveSundayInvoice()">Refresh Invoice</button></div><div class="pdfHint">Creates the PDF first. On iPhone you can then Share it, Save to Files, send it, or open it later to print.</div><div class="wizardGood" style="margin-top:7px;padding:8px">✓ Invoice saved. Next is ready.</div>`:`${noteField}<div class="invoiceConfirmActions"><button class="btn gold primary" type="button" onclick="saveSundayInvoice()">Save Verified Invoice</button></div>`;
  return card+actions;
}

function paymentForInvoice(invoice){
  return invoice&&invoice.payment&&typeof invoice.payment==="object"?invoice.payment:null;
}
function saveSundayPayment(){
  const state=currentWizardState();
  if(!state.invoiceSaved||!state.invoice)return alert("Save the verified invoice first.");
  const paid=document.querySelector('input[name="payStatus"]:checked')?.value==="paid";
  const date=document.getElementById("paymentDate")?.value||"";
  const method=document.getElementById("paymentMethod")?.value||"";
  const other=(document.getElementById("paymentMethodOther")?.value||"").trim();
  const note=(document.getElementById("paymentNote")?.value||"").trim();
  if(paid&&!date)return alert("Choose the payment date before marking the invoice paid.");
  if(paid&&!method)return alert("Choose the payment method before marking the invoice paid.");
  if(paid&&method==="other"&&!other)return alert("Enter the payment method.");
  const inv=(db.invoices||[]).find(x=>x.id===state.invoice.id);if(!inv)return alert("Invoice record not found.");
  inv.status=paid?"paid":"unpaid";
  inv.payment={status:paid?"paid":"unpaid",date:paid?date:null,method:paid?method:null,methodOther:paid&&method==="other"?other:"",note,savedAt:new Date().toISOString()};
  localStorage.setItem("mdpin-db",JSON.stringify(db));
  renderSundayWizard();
}
function setPaymentStatus(v){
  const paid=v==="paid";
  const p=document.getElementById("payPaid"),u=document.getElementById("payUnpaid"),wrap=document.getElementById("paymentPaidFields");
  if(p)p.checked=paid;if(u)u.checked=!paid;if(wrap)wrap.style.display=paid?"grid":"none";
  document.querySelectorAll(".paymentStatusBtn").forEach(b=>b.classList.remove("activePaid","activeUnpaid"));
  const btn=document.getElementById(paid?"paidStatusBtn":"unpaidStatusBtn");if(btn)btn.classList.add(paid?"activePaid":"activeUnpaid");
}
function paymentMethodLabel(p){
  if(!p||!p.method)return "";
  if(p.method==="cash")return "Cash";
  if(p.method==="bank_transfer")return "Bank transfer";
  if(p.method==="promptpay")return "PromptPay";
  return p.methodOther||"Other";
}
function paymentMethodChanged(){
  const method=document.getElementById("paymentMethod")?.value||"";
  const wrap=document.getElementById("paymentMethodOtherWrap");if(wrap)wrap.style.display=method==="other"?"block":"none";
}
function renderPaymentWizard(state){
  if(!state.invoiceSaved||!state.invoice)return '<div class="wizardLocked">Save the verified invoice before recording payment.</div>';
  const p=paymentForInvoice(state.invoice),paid=p?.status==="paid",date=p?.date||today(),note=p?.note||"",method=p?.method||"",other=p?.methodOther||"";
  return `<div class="paymentCard"><div class="paymentTop"><div><div class="wizardMinimal">${escapeHtml(state.invoice.number)}</div><b>Payment status</b></div><div style="text-align:right"><div class="wizardMinimal">Amount due</div><div class="paymentAmount">${baht(state.invoice.totals?.payPin||0)}</div></div></div><div class="paymentStatusBtns"><label id="unpaidStatusBtn" class="paymentStatusBtn ${paid?'':'activeUnpaid'}" onclick="setPaymentStatus('unpaid')"><input id="payUnpaid" type="radio" name="payStatus" value="unpaid" ${paid?'':'checked'} style="display:none">UNPAID</label><label id="paidStatusBtn" class="paymentStatusBtn ${paid?'activePaid':''}" onclick="setPaymentStatus('paid')"><input id="payPaid" type="radio" name="payStatus" value="paid" ${paid?'checked':''} style="display:none">PAID</label></div><div class="paymentFields"><div id="paymentPaidFields" style="display:${paid?'grid':'none'};grid-template-columns:1fr 1fr;gap:9px"><div><label>Payment date</label><input id="paymentDate" type="date" value="${escapeHtml(date)}"></div><div><label>Method</label><select id="paymentMethod" onchange="paymentMethodChanged()"><option value="">Choose…</option><option value="cash" ${method==='cash'?'selected':''}>Cash</option><option value="bank_transfer" ${method==='bank_transfer'?'selected':''}>Bank transfer</option><option value="promptpay" ${method==='promptpay'?'selected':''}>PromptPay</option><option value="other" ${method==='other'?'selected':''}>Other</option></select></div><div id="paymentMethodOtherWrap" style="display:${method==='other'?'block':'none'};grid-column:1/-1"><label>Other payment method</label><input id="paymentMethodOther" placeholder="Enter payment method" value="${escapeHtml(other)}"></div></div><div><label>Note (optional)</label><textarea id="paymentNote" placeholder="Reference or other payment note…">${escapeHtml(note)}</textarea></div></div><button class="btn gold paymentSave" type="button" onclick="saveSundayPayment()">Save Payment Status</button>${p?`<div class="paymentSaved">✓ ${paid?'Paid '+escapeHtml(invoiceDateLabel(p.date))+(paymentMethodLabel(p)?' · '+escapeHtml(paymentMethodLabel(p)):''):'Saved as unpaid'}${p.note?` · ${escapeHtml(p.note)}`:''}</div>`:'<div class="paymentHint">Choose Paid or Unpaid. Paid invoices require a date and payment method.</div>'}</div>`;
}

function renderDashboardAlerts(){
  const box=document.getElementById("dashboardAlerts");if(!box)return;
  const alerts=[];
  try{
    const latestByDate={};
    (db.invoices||[]).filter(i=>i&&i.status!=="void").forEach(i=>{const d=i.reportDate;if(!latestByDate[d]||Number(i.version||1)>Number(latestByDate[d].version||1))latestByDate[d]=i;});
    Object.values(latestByDate).forEach(inv=>{
      if(inv.supersededBy)return;
      const trackedCorrection=(db.pendingCorrections||[]).find(c=>c.invoiceId===inv.id&&["pending","waiting_reconciliation","queued","resolved"].includes(c.status));
      if(trackedCorrection)return;
      const live=currentWizardStateSafeForInvoice(inv.reportDate);
      const sourceEdits=postInvoiceDocketEdits(inv);
      if(live&&live.financialGreen===false){
        alerts.push(`<div class="dashboardAlert"><div class="dashboardAlertHead"><div class="dashboardAlertTitle">⚠ Invoice needs review</div></div><div class="dashboardAlertText">${escapeHtml(inv.number||'Invoice')} v${Number(inv.version||1)} has source records edited after it was saved, and the week no longer fully reconciles.</div><button class="btn" onclick="openInvoiceRecord('${inv.id}')">Review invoice</button></div>`);
        return;
      }
      if(live?.signature&&live.signature!==inv.signature){
        const oldBase=Number(inv.totals?.basePayPin ?? (Number(inv.totals?.payPin||0)-Number(inv.totals?.adjustmentTotal||0))),next=Number(live.summary?.combined?.payPin||0),delta=next-oldBase;
        alerts.push(`<div class="dashboardAlert"><div class="dashboardAlertHead"><div class="dashboardAlertTitle">⚠ Invoice update required</div></div><div class="dashboardAlertText">${escapeHtml(inv.number||'Invoice')} v${Number(inv.version||1)} changed after source records were edited. Difference: ${delta>=0?'+':''}${baht(delta)}.</div><button class="btn" onclick="openInvoiceRecord('${inv.id}')">Review invoice</button></div>`);
        return;
      }
      if(sourceEdits.length){
        if(!db.alertAcknowledgements||typeof db.alertAcknowledgements!=="object")db.alertAcknowledgements={};
        const key=invoiceSourceEditAckKey(inv,sourceEdits);
        if(!db.alertAcknowledgements[key])alerts.push(`<div class="dashboardAlert info"><div class="dashboardAlertTitle">Delivery docket edited</div><div class="dashboardAlertText">A docket linked to ${escapeHtml(inv.number||'this invoice')} was edited after the invoice was saved. Reconciliation and invoice amount are still unchanged.</div><button class="btn" onclick="openInvoiceRecord('${inv.id}')">Review</button><button class="btn" onclick="acknowledgeInvoiceSourceEdits('${inv.id}')">Acknowledge</button></div>`);
      }
    });
  }catch(e){console.warn("Could not build invoice alerts",e)}
  processPendingDocketCorrections();
  const corrections=(db.pendingCorrections||[]).filter(c=>["pending","waiting_reconciliation"].includes(c.status));
  corrections.forEach(c=>{
    const d=(db.deliveries||[]).find(x=>x.id===c.docketId),label=d?`${invoiceDateLabel(d.date)} — ${displayBranchName(d.branch)}`:"Edited delivery docket";
    if(c.choice==="next_sunday")alerts.push(`<div class="dashboardAlert info"><div class="dashboardAlertTitle">Correction queued for next Sunday</div><div class="dashboardAlertText">${escapeHtml(label)} has a saved correction. It will be carried into the next Sunday billing cycle automatically once the edited week reconciles. The existing invoice stays unchanged.</div></div>`);
    else alerts.push(`<div class="dashboardAlert"><div class="dashboardAlertTitle">⚠ Docket correction waiting</div><div class="dashboardAlertText">${escapeHtml(label)} has a correction waiting for the edited week to reconcile. Your saved choice will apply automatically afterwards.</div></div>`);
  });
  const pending=(db.adjustments||[]).filter(a=>a.status==="pending"&&a.resolution!=="next_sunday_auto");
  if(pending.length){const total=pending.reduce((n,a)=>n+Number(a.amount||0),0);alerts.push(`<div class="dashboardAlert info"><div class="dashboardAlertTitle">Adjustment waiting</div><div class="dashboardAlertText">${pending.length} unresolved adjustment${pending.length>1?'s':''} (${total>=0?'+':''}${baht(total)}) is waiting for Pin's decision. It will be offered automatically in the next eligible Sunday workflow.</div><button class="btn" onclick="switchTab('history');document.getElementById('recordsType').value='invoice';renderHistory()">Open Records</button></div>`);}
  box.innerHTML=alerts.join("");box.style.display=alerts.length?"block":"none";
}

function renderSundayWizard(){
  document.body.classList.add("workflowMode");
  const box=document.getElementById("wizardContent"),period=document.getElementById("wizardPeriod");if(!box)return;
  const state=currentWizardState(),items=state.items;
  if(!items.length){sundayWizardStep=1;period.textContent="Start by importing this Sunday's Excel reports.";box.innerHTML=wizardImportMarkup();renderWizardChrome(state);return;}
  const latest=items[0].report.date,prevDates=[...new Set(items.map(x=>x.rec.previousDate).filter(Boolean))];
  period.textContent=`${latest}${prevDates.length?` compared with ${prevDates.join(" / ")}`:" — prior Sunday required"}`;
  if(sundayWizardStep===1){box.innerHTML=`<div class="wizardGood">✓ ${items.length} Sunday report${items.length===1?'':'s'} imported for ${escapeHtml(latest)}.</div><div class="wizardActions"><button class="btn alt" onclick="wizardAction('import')">Review imported reports</button></div>`;}
  else if(sundayWizardStep===2){box.innerHTML=renderStockWizard(items);}
  else if(sundayWizardStep===3){box.innerHTML=renderFinancialWizard(state);}
  else if(sundayWizardStep===4){box.innerHTML=renderInvoiceWizard(state);}
  else{box.innerHTML=renderPaymentWizard(state);}
  renderWizardChrome(state);
}

document.getElementById("recordsSearch")?.addEventListener("input",renderHistory);
document.getElementById("recordsType")?.addEventListener("change",renderHistory);
function setDeliveryView(mode){
  const archive=document.getElementById("deliveryArchivePane");
  const create=document.getElementById("deliveryCreatePane");
  const isCreate=mode==="create";
  const isEdit=isCreate&&!!(editingDocketId||editingSuggestionId);

  if(archive)archive.style.display=isCreate?"none":"block";
  if(create)create.style.display=isCreate?"block":"none";

  // Create and Archive are deliberately mutually exclusive.
  document.body.classList.toggle("deliveryMode",isCreate);
  document.body.classList.toggle("docketMode",!isCreate);
  document.body.classList.toggle("deliveryEditMode",isEdit);

  const t=document.getElementById("deliveryEditorTitle");
  if(t&&isCreate)t.childNodes[0].nodeValue=isEdit?"Edit delivery docket ":"Create delivery ";
}
function openDeliveryCreate(preserveEdit=false){
  if(!preserveEdit&&(editingDocketId||editingSuggestionId))resetDeliveryEditor();
  setDeliveryView("create");
  switchTab("docket");
  if(!preserveEdit && !editingDocketId){
    const d=document.getElementById("delDate");
    if(d&&!d.value)d.value=today();
  }
  fillProducts();
  if(editingDocketId||editingSuggestionId)setDeliveryEditAddTools(false);
  else setDeliveryEditAddTools(true);
  renderDelivery();
  window.scrollTo({top:0,left:0,behavior:"auto"});
}
function openDeliveryArchive(openId){
  document.body.classList.remove("deliveryEditMode","deliveryKeyboardOpen");
  document.documentElement.style.removeProperty("--md-keyboard-height");
  deliveryKeyboardActiveInput=null;
  setDeliveryView("archive");
  switchTab("docket");
  if(openId!==undefined)renderDocketArchive(openId);
  else renderDocketArchive();
}
window.openDeliveryCreate=openDeliveryCreate;window.openDeliveryArchive=openDeliveryArchive;
function returnToDashboardFromHeader(){
  closeMainMenu();
  document.body.classList.remove("workflowMode","deliveryMode","docketMode");
  switchTab("home");
  window.scrollTo({top:0,left:0,behavior:"auto"});
  const home=document.getElementById("home");
  if(home){home.scrollTop=0}
}

function switchTab(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===id));

  // Delivery view mode is owned only by setDeliveryView().
  // Leaving Delivery Dockets clears both special modes.
  if(id!=="docket"){
    document.body.classList.remove("deliveryMode","docketMode");
  }else if(!document.body.classList.contains("deliveryMode")&&!document.body.classList.contains("docketMode")){
    setDeliveryView("archive");
  }

  if(id!=="sundayWizard")document.body.classList.remove("workflowMode");
  closeMainMenu();
  const active=document.getElementById(id);
  if(active){
    active.scrollTop=0;
    requestAnimationFrame(()=>{active.scrollTop=0});
  }
  if(id==="weekly"&&!document.querySelector("#weekRows tr"))loadWeek();
  if(id==="sundayWizard")renderSundayWizard();
  if(id==="home"){renderPinDashboard();renderMetrics();renderDashboardAlerts()}
}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{if(t.dataset.tab==="docket")openDeliveryArchive();else switchTab(t.dataset.tab)});

const BACKUP_FORMAT="magic-dragon-pin-full-backup";
const BACKUP_SCHEMA=1;
function backupStatus(msg,bad=false){const el=document.getElementById("backupStatus");if(el){el.textContent=msg;el.style.color=bad?"#991b1b":""}}
function backupCounts(data=db){
 return {
  products:Array.isArray(data?.products)?data.products.length:0,
  deliveries:Array.isArray(data?.deliveries)?data.deliveries.length:0,
  sundayReports:Array.isArray(data?.sundayImports)?data.sundayImports.length:0,
  invoices:Array.isArray(data?.invoices)?data.invoices.length:0,
  payments:Array.isArray(data?.invoices)?data.invoices.filter(i=>i?.payment?.status==="paid"||i?.status==="paid").length:(Array.isArray(data?.payments)?data.payments.length:0)
 };
}
function bytesToBase64(bytes){let out="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(out)}
function base64ToBytes(text){const raw=atob(text),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out}
async function exportArchivedSourceFiles(){
 try{
  const idb=await openFileDb();
  const rows=await new Promise((resolve,reject)=>{const tx=idb.transaction("sourceFiles","readonly"),rq=tx.objectStore("sourceFiles").getAll();rq.onsuccess=()=>resolve(rq.result||[]);rq.onerror=()=>reject(rq.error)});
  idb.close();
  const out=[];
  for(const rec of rows){
   if(!rec?.blob)continue;
   const bytes=new Uint8Array(await rec.blob.arrayBuffer());
   out.push({id:rec.id,archiveName:rec.archiveName||"Sunday-Report.xlsx",storedAt:rec.storedAt||null,type:rec.blob.type||"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",data:bytesToBase64(bytes)});
  }
  return out;
 }catch(e){console.warn("Backup could not read archived source files",e);return []}
}
async function replaceArchivedSourceFiles(files){
 const idb=await openFileDb();
 await new Promise((resolve,reject)=>{const tx=idb.transaction("sourceFiles","readwrite"),store=tx.objectStore("sourceFiles");store.clear();for(const f of files||[]){if(!f?.id||!f?.data)continue;const bytes=base64ToBytes(f.data);store.put({id:f.id,archiveName:f.archiveName||"Sunday-Report.xlsx",storedAt:f.storedAt||new Date().toISOString(),blob:new Blob([bytes],{type:f.type||"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})})}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});
 idb.close();
}
function validateBackupPackage(pkg){
 if(!pkg||typeof pkg!=="object")throw new Error("This is not a Magic Dragon backup file.");
 if(pkg.format!==BACKUP_FORMAT||Number(pkg.schema)!==BACKUP_SCHEMA)throw new Error("This backup format is not supported by this version of Magic Dragon.");
 if(!pkg.data||typeof pkg.data!=="object")throw new Error("The backup does not contain app data.");
 ["products","deliveries"].forEach(k=>{if(!Array.isArray(pkg.data[k]))throw new Error(`Backup is missing ${k}.`)});
 if(pkg.sourceFiles!=null&&!Array.isArray(pkg.sourceFiles))throw new Error("Archived source files are invalid.");
 return true;
}
async function downloadBackupPackage(pkg){
 const blob=new Blob([JSON.stringify(pkg)],{type:"application/json"});
 const fileName=`Magic-Dragon-Pin-Backup-${today()}.json`;
 const file=new File([blob],fileName,{type:"application/json"});
 if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
  try{await navigator.share({files:[file]});return}catch(e){if(e?.name==="AbortError")return}
 }
 const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
document.getElementById("exportData").onclick=async()=>{
 const btn=document.getElementById("exportData");if(btn.disabled)return;btn.disabled=true;backupStatus("Preparing complete backup…");
 try{
  const sourceFiles=await exportArchivedSourceFiles(),counts=backupCounts();
  const pkg={format:BACKUP_FORMAT,schema:BACKUP_SCHEMA,appVersion:"0.10.12-dev",createdAt:new Date().toISOString(),counts,sourceFilesCount:sourceFiles.length,data:JSON.parse(JSON.stringify(db)),sourceFiles};
  await downloadBackupPackage(pkg);
  backupStatus(`Backup ready: ${counts.deliveries} deliveries, ${counts.sundayReports} Sunday reports, ${counts.invoices} invoices, ${sourceFiles.length} archived source file${sourceFiles.length===1?"":"s"}.`);
 }catch(e){console.error(e);backupStatus("Backup could not be created. No app data was changed.",true);alert("The full backup could not be created. Your current app data has not been changed.")}
 finally{btn.disabled=false}
}
document.getElementById("importData").onchange=e=>{
 const input=e.target,f=input.files?.[0];if(!f)return;backupStatus("Checking backup file…");
 const r=new FileReader();
 r.onload=async()=>{
  try{
   const pkg=JSON.parse(r.result);validateBackupPackage(pkg);const c=backupCounts(pkg.data),when=pkg.createdAt?new Date(pkg.createdAt).toLocaleString():"unknown date";
   const ok=confirm(`Restore this Magic Dragon backup?\n\nCreated: ${when}\nDeliveries: ${c.deliveries}\nSunday reports: ${c.sundayReports}\nInvoices: ${c.invoices}\nPayments: ${c.payments}\nArchived source files: ${(pkg.sourceFiles||[]).length}\n\nThis will replace the data currently stored on this device.`);
   if(!ok){backupStatus("Restore cancelled. Current data was not changed.");return}
   backupStatus("Restoring backup…");
   await replaceArchivedSourceFiles(pkg.sourceFiles||[]);
   Object.keys(db).forEach(k=>delete db[k]);Object.assign(db,pkg.data);
   localStorage.setItem("mdpin-db",JSON.stringify(db));
   backupStatus("Restore complete. Reloading…");
   alert("Backup restored successfully. Magic Dragon will now reload using the restored data.");
   location.reload();
  }catch(err){console.error(err);backupStatus(err?.message||"Invalid backup file.",true);alert(err?.message||"This backup file could not be restored.")}
  finally{input.value=""}
 };
 r.onerror=()=>{backupStatus("The selected backup file could not be read.",true);input.value=""};
 r.readAsText(f)
}
document.getElementById("masterProductSearch").oninput=filterMasterProductSetup;
document.getElementById("fillMasterCurrent").onclick=()=>renderMasterProductSetup(true);
document.getElementById("saveMasterProducts").onclick=applyMasterProductSetup;
document.getElementById("resetData").onclick=()=>{if(confirm("Delete all local Magic Dragon Pin data on this browser?")){localStorage.removeItem("mdpin-db");location.reload()}}

// v0.10.12 DEV — Supabase Stage 2A reference snapshot. Operational records remain local; reference sync is manual and DEV-only.
const MDPIN_SUPABASE_URL="https://bzgkeshxbnhnlrpdgbtb.supabase.co";
const MDPIN_SUPABASE_PUBLISHABLE_KEY="sb_publishable_8EReyQFUFSe6SPHCBLhU7g_zp8j18_D";
const MDPIN_SUPABASE_SESSION_KEY="mdpin-supabase-dev-session";
let mdCloudSession=null;

function mdCloudSetStatus(message,state="idle"){
  const dot=document.getElementById("cloudDevDot"), text=document.getElementById("cloudDevStatusText");
  if(text)text.textContent=message;
  if(dot){dot.className="cloudDot"+(state==="ok"?" ok":state==="bad"?" bad":state==="wait"?" wait":"");}
}
function mdCloudRender(){
  const loggedIn=!!mdCloudSession?.access_token;
  const a=document.getElementById("cloudLoggedOut"), b=document.getElementById("cloudLoggedIn"), u=document.getElementById("cloudDevUser");
  if(a)a.style.display=loggedIn?"none":"block";
  if(b)b.style.display=loggedIn?"block":"none";
  if(u)u.textContent=mdCloudSession?.user?.email||"authenticated DEV user";
}
function mdCloudSaveSession(session){
  mdCloudSession=session||null;
  try{
    if(mdCloudSession)localStorage.setItem(MDPIN_SUPABASE_SESSION_KEY,JSON.stringify(mdCloudSession));
    else localStorage.removeItem(MDPIN_SUPABASE_SESSION_KEY);
  }catch(e){console.warn("Could not save DEV cloud session",e);}
  mdCloudRender();
}
function mdCloudLoadSession(){
  try{mdCloudSession=JSON.parse(localStorage.getItem(MDPIN_SUPABASE_SESSION_KEY)||"null");}catch(e){mdCloudSession=null;}
  mdCloudRender();
}
async function mdCloudJson(url,options={}){
  const response=await fetch(url,options);
  let body=null;
  try{body=await response.json();}catch(e){}
  if(!response.ok){
    const msg=body?.msg||body?.message||body?.error_description||body?.error||`HTTP ${response.status}`;
    const err=new Error(msg);err.status=response.status;err.body=body;throw err;
  }
  return body;
}
async function mdCloudRefreshSession(){
  if(!mdCloudSession?.refresh_token)throw new Error("No DEV cloud session is available.");
  const body=await mdCloudJson(`${MDPIN_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
    method:"POST",headers:{apikey:MDPIN_SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({refresh_token:mdCloudSession.refresh_token})
  });
  mdCloudSaveSession(body);return body;
}
async function mdCloudAuthFetch(path,options={}){
  if(!mdCloudSession?.access_token)throw new Error("Sign in to DEV Cloud first.");
  const perform=()=>fetch(`${MDPIN_SUPABASE_URL}${path}`,{...options,headers:{apikey:MDPIN_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${mdCloudSession.access_token}`,...(options.headers||{})}});
  let response=await perform();
  if(response.status===401&&mdCloudSession?.refresh_token){await mdCloudRefreshSession();response=await perform();}
  if(!response.ok){let body=null;try{body=await response.json();}catch(e){};throw new Error(body?.message||body?.hint||body?.error||`HTTP ${response.status}`);}
  return response;
}
async function mdCloudTestProject(){
  mdCloudSetStatus("Testing DEV project…","wait");
  try{
    const response=await fetch(`${MDPIN_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:MDPIN_SUPABASE_PUBLISHABLE_KEY}});
    if(!response.ok)throw new Error(`Project returned HTTP ${response.status}`);
    mdCloudSetStatus("DEV project reachable. Sign in to verify protected database access.","ok");
    return true;
  }catch(err){mdCloudSetStatus(`DEV project connection failed: ${err.message}`,"bad");return false;}
}
async function mdCloudSignIn(){
  const email=document.getElementById("cloudDevEmail")?.value?.trim();
  const password=document.getElementById("cloudDevPassword")?.value||"";
  if(!email||!password){alert("Enter the DEV user email and password first.");return;}
  const btn=document.getElementById("cloudDevSignIn");if(btn)btn.disabled=true;
  mdCloudSetStatus("Signing in to DEV Cloud…","wait");
  try{
    const session=await mdCloudJson(`${MDPIN_SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:MDPIN_SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    mdCloudSaveSession(session);
    const pw=document.getElementById("cloudDevPassword");if(pw)pw.value="";
    await mdCloudVerifyDatabase();
  }catch(err){mdCloudSaveSession(null);mdCloudSetStatus(`Sign-in failed: ${err.message}`,"bad");}
  finally{if(btn)btn.disabled=false;}
}
async function mdCloudVerifyDatabase(){
  mdCloudSetStatus("Verifying authenticated database access…","wait");
  try{
    const response=await mdCloudAuthFetch('/rest/v1/shops?select=id,name,active&order=name.asc',{headers:{Accept:"application/json"}});
    const shops=await response.json();
    const names=(shops||[]).map(x=>x.name).filter(Boolean);
    mdCloudSetStatus(`Connected securely · ${names.length} shop${names.length===1?"":"s"} visible${names.length?`: ${names.join(" · ")}`:""}`,"ok");
    mdCloudRender();return true;
  }catch(err){
    mdCloudSetStatus(`Signed in, but database verification failed: ${err.message}`,"bad");
    mdCloudRender();return false;
  }
}
function mdCloudSignOut(){
  const token=mdCloudSession?.access_token;
  mdCloudSaveSession(null);
  mdCloudSetStatus("Signed out. Local app data is unchanged.","idle");
  mdCloudRefSetStatus("Signed out. Stage 2A reference data was not changed.");
  if(token)fetch(`${MDPIN_SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:MDPIN_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}}).catch(()=>{});
}

function mdCloudRefSetStatus(message,state=""){
  const el=document.getElementById("cloudRefStatus");if(!el)return;
  el.textContent=message;el.className="cloudRefStatus"+(state?" "+state:"");
}
function mdCloudRefUpdateLocalMetric(){
  const el=document.getElementById("cloudRefLocalProducts");if(el)el.textContent=String((db.products||[]).length);
}
function mdCloudRefCanonicalProduct(p){
  return {id:String(p?.id||""),name:String(p?.name||""),type:String(p?.type||""),cost:Number(p?.cost||0),retail:Number(p?.retail||0),barcode:String(p?.barcode||""),archived:!!(p?.archived||p?.archivedAt),payload:p||{}};
}
function mdCloudRefStableProduct(p){
  const x=mdCloudRefCanonicalProduct(p);return JSON.stringify({id:x.id,name:x.name,type:x.type,cost:x.cost,retail:x.retail,barcode:x.barcode,archived:x.archived});
}
async function mdCloudRefFetchAll(){
  const [pr,ar,sr]=await Promise.all([
    mdCloudAuthFetch('/rest/v1/md_reference_products?select=id,name,payload&order=id.asc',{headers:{Accept:"application/json"}}),
    mdCloudAuthFetch('/rest/v1/md_reference_aliases?select=alias_key,product_id&order=alias_key.asc',{headers:{Accept:"application/json"}}),
    mdCloudAuthFetch('/rest/v1/md_reference_settings?select=key,value&order=key.asc',{headers:{Accept:"application/json"}})
  ]);
  return {products:await pr.json(),aliases:await ar.json(),settings:await sr.json()};
}
async function mdCloudRefCheck(){
  mdCloudRefUpdateLocalMetric();
  if(!mdCloudSession?.access_token){mdCloudRefSetStatus("Sign in to DEV Cloud first.","warn");return false;}
  mdCloudRefSetStatus("Reading Stage 2A reference tables…");
  try{
    const cloud=await mdCloudRefFetchAll();
    const local=(db.products||[]).map(mdCloudRefCanonicalProduct);
    const localMap=new Map(local.map(p=>[p.id,mdCloudRefStableProduct(p)]));
    let changed=0,missing=0;
    (cloud.products||[]).forEach(r=>{const lp=localMap.get(String(r.id));if(!lp)changed++;else if(lp!==mdCloudRefStableProduct(r.payload||r))changed++;localMap.delete(String(r.id));});
    missing=localMap.size;
    document.getElementById("cloudRefCloudProducts").textContent=String((cloud.products||[]).length);
    document.getElementById("cloudRefAliases").textContent=String((cloud.aliases||[]).length);
    if(!(cloud.products||[]).length){mdCloudRefSetStatus("Reference tables are ready but contain no product snapshot yet. Upload the local reference snapshot when you are ready.","warn");}
    else if(!changed&&!missing&&(cloud.products||[]).length===local.length){mdCloudRefSetStatus(`Reference snapshot matches this device: ${local.length} products · ${(cloud.aliases||[]).length} aliases. Local operational data remains unchanged.`,"ok");}
    else{mdCloudRefSetStatus(`Comparison complete: local ${local.length}, cloud ${(cloud.products||[]).length}. ${changed} cloud row(s) differ/extra and ${missing} local row(s) are not yet represented in cloud.`,"warn");}
    return true;
  }catch(err){
    document.getElementById("cloudRefCloudProducts").textContent="—";document.getElementById("cloudRefAliases").textContent="—";
    const msg=String(err?.message||err);
    if(/does not exist|relation|schema cache|Could not find/i.test(msg))mdCloudRefSetStatus("Stage 2A tables are not installed yet. Run the included SUPABASE-STAGE2A-SETUP.sql once in Supabase SQL Editor, then tap Check / Compare again.","warn");
    else mdCloudRefSetStatus(`Reference check failed: ${msg}`,"bad");
    return false;
  }
}
async function mdCloudRefUpsert(path,rows,onConflict){
  if(!rows.length)return;
  const response=await mdCloudAuthFetch(`${path}?on_conflict=${encodeURIComponent(onConflict)}`,{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
  return response;
}
async function mdCloudRefUpload(){
  if(!mdCloudSession?.access_token){mdCloudRefSetStatus("Sign in to DEV Cloud first.","warn");return;}
  const products=(db.products||[]).map(p=>{const x=mdCloudRefCanonicalProduct(p);return {id:x.id,name:x.name,payload:x.payload,updated_at:new Date().toISOString()};});
  const aliases=Object.entries(db.productAliases||{}).map(([alias_key,product_id])=>({alias_key:String(alias_key),product_id:String(product_id),updated_at:new Date().toISOString()}));
  const rules={standard_profit_split:{shop:0.40,pin:0.30,alix:0.30},edible_profit_split:{shop:0.40,pin:0.40,alix:0.20},shops:["BM Bangrak","Lamai Minimart"],stage:"2A-reference-only",source_of_truth:"local-device"};
  const ok=confirm(`Upload a DEV reference snapshot from this device?\n\nProducts: ${products.length}\nAliases: ${aliases.length}\n\nThis only creates/updates DEV reference rows. It does NOT replace local data and does NOT upload Sunday reports, deliveries, invoices or payments.`);
  if(!ok){mdCloudRefSetStatus("Upload cancelled. Nothing changed.");return;}
  const btn=document.getElementById("cloudRefUpload");if(btn)btn.disabled=true;mdCloudRefSetStatus("Uploading DEV reference snapshot…");
  try{
    await mdCloudRefUpsert('/rest/v1/md_reference_products',products,'id');
    if(aliases.length)await mdCloudRefUpsert('/rest/v1/md_reference_aliases',aliases,'alias_key');
    await mdCloudRefUpsert('/rest/v1/md_reference_settings',[{key:'business_rules',value:rules,updated_at:new Date().toISOString()},{key:'snapshot_meta',value:{app_version:'0.10.12-dev',product_count:products.length,alias_count:aliases.length,uploaded_at:new Date().toISOString()},updated_at:new Date().toISOString()}],'key');
    mdCloudRefSetStatus(`Upload complete: ${products.length} products and ${aliases.length} aliases copied to DEV Cloud. Verifying read-back…`,"ok");
    await mdCloudRefCheck();
  }catch(err){mdCloudRefSetStatus(`Upload failed: ${err?.message||err}`,"bad");}
  finally{if(btn)btn.disabled=false;}
}

function mdCloudInit(){
  mdCloudLoadSession();
  document.getElementById("cloudDevTestPublic")?.addEventListener("click",mdCloudTestProject);
  document.getElementById("cloudDevSignIn")?.addEventListener("click",mdCloudSignIn);
  document.getElementById("cloudDevVerify")?.addEventListener("click",mdCloudVerifyDatabase);
  document.getElementById("cloudDevSignOut")?.addEventListener("click",mdCloudSignOut);
  document.getElementById("cloudRefCheck")?.addEventListener("click",mdCloudRefCheck);
  document.getElementById("cloudRefUpload")?.addEventListener("click",mdCloudRefUpload);
  mdCloudRefUpdateLocalMetric();
  document.getElementById("cloudDevPassword")?.addEventListener("keydown",e=>{if(e.key==="Enter")mdCloudSignIn();});
  if(mdCloudSession?.access_token)mdCloudVerifyDatabase();else mdCloudTestProject();
}

cleanupDataIntegrity();refreshStoredReconciliations();renderImport();renderArchive();migrateLegacyDeliverySuggestions();bootstrapLatestSavedInvoiceSuggestions();renderAll();renderDashboardAlerts();refreshBaselineSnapshotStatus();mdCloudInit();
// v0.9.25 contextual Sunday help and compact selection controls
const sundayHelpButton=document.getElementById("sundayHelpButton");
const sundayHelp=document.getElementById("sundayHelp");
if(sundayHelpButton&&sundayHelp){sundayHelpButton.addEventListener("click",()=>{const show=sundayHelp.style.display==="none";sundayHelp.style.display=show?"block":"none";sundayHelp.open=show;sundayHelpButton.setAttribute("aria-expanded",show?"true":"false");});}
const importWork=document.querySelector(".importWork");
const xlsxFilesInput=document.getElementById("xlsxFiles");
function syncImportCompactState(){if(!importWork||!xlsxFilesInput)return;importWork.classList.toggle("hasSelection",!!(xlsxFilesInput.files&&xlsxFilesInput.files.length));}
if(xlsxFilesInput)xlsxFilesInput.addEventListener("change",()=>setTimeout(syncImportCompactState,0));
const clearXlsxBtn=document.getElementById("clearXlsxSelection");if(clearXlsxBtn)clearXlsxBtn.addEventListener("click",()=>setTimeout(syncImportCompactState,0));
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  // Fixed branded shell. Keep Menu attached directly beneath the visible header.
  (()=>{
    const tabs=document.querySelector(".tabs"),btn=document.getElementById("heroMenuButton"),hero=document.querySelector(".hero"),app=document.querySelector(".app"),spacer=document.getElementById("navSpacer");
    if(!tabs||!btn||!hero||!app)return;
    const syncGeometry=()=>{
      const a=app.getBoundingClientRect(),cs=getComputedStyle(app),pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0;
      const left=Math.max(8,Math.round(a.left+pl)),width=Math.max(0,Math.round(a.width-pl-pr));
      document.documentElement.style.setProperty("--shell-left",left+"px");
      document.documentElement.style.setProperty("--shell-width",width+"px");
      requestAnimationFrame(()=>{
        const h=hero.getBoundingClientRect(),space=Math.ceil(hero.offsetHeight+16),menuTop=Math.ceil(h.bottom+6);
        document.documentElement.style.setProperty("--hero-space",space+"px");
        document.documentElement.style.setProperty("--menu-top",menuTop+"px");
        document.documentElement.style.setProperty("--content-top",Math.ceil(h.bottom+6)+"px");
        if(spacer&&!document.body.classList.contains("workflowMode"))spacer.style.height=space+"px";
      });
    };
    window.syncShellGeometry=syncGeometry;
    let menuTimer=null;
    const armMenuTimer=()=>{clearTimeout(menuTimer);if(tabs.classList.contains("menuOpen"))menuTimer=setTimeout(()=>window.closeMainMenu(),5000);};
    window.closeMainMenu=()=>{clearTimeout(menuTimer);menuTimer=null;tabs.classList.remove("menuOpen");btn.setAttribute("aria-expanded","false");};
    btn.addEventListener("click",()=>{syncGeometry();const open=!tabs.classList.contains("menuOpen");if(open){tabs.classList.add("menuOpen");btn.setAttribute("aria-expanded","true");armMenuTimer();}else closeMainMenu();});
    ["pointerdown","touchstart","keydown","focusin"].forEach(evt=>tabs.addEventListener(evt,armMenuTimer,{passive:true}));
    tabs.addEventListener("click",()=>{if(tabs.classList.contains("menuOpen"))armMenuTimer();});
    document.addEventListener("click",e=>{if(tabs.classList.contains("menuOpen")&&!tabs.contains(e.target)&&!btn.contains(e.target))closeMainMenu();});
    const resync=()=>{syncGeometry();};
    window.addEventListener("resize",resync);
    window.addEventListener("orientationchange",()=>setTimeout(resync,150));
    if(window.visualViewport){visualViewport.addEventListener("resize",resync);visualViewport.addEventListener("scroll",resync);}
    requestAnimationFrame(syncGeometry);
    window.addEventListener("load",syncGeometry,{once:true});
  })();

  window.addEventListener("load",async()=>{
    // v0.10.11 DEV cloud diagnostic: remove any previously installed worker.
    // Safari can keep an older worker controlling this GitHub Pages scope even after a deploy.
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
      if("caches" in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>k.startsWith("magic-dragon-pin-")).map(k=>caches.delete(k)));
      }
      if(navigator.serviceWorker.controller && !sessionStorage.getItem("mdpin-sw-cleared-0112")){
        sessionStorage.setItem("mdpin-sw-cleared-0112","1");
        const u=new URL(location.href);u.searchParams.set("swreset","0112");location.replace(u.toString());
      }
    }catch(e){console.warn("DEV service-worker cleanup",e);}
  });
}
document.getElementById("auditBranch").onchange=renderAudit;
document.getElementById("auditSearch").oninput=renderAudit;
document.getElementById("histBranch").onchange=renderHistorical;
document.getElementById("exportHistorical").onclick=()=>{
 const blob=new Blob([JSON.stringify(historicalData,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="magic-dragon-historical-source-data.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
