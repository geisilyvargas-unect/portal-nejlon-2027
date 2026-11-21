'use client';
import {useState} from 'react';

type ScenarioDraft={title:string;description:string;material_url:string};
export function ScenarioBuilder(){
  const [items,setItems]=useState<ScenarioDraft[]>([{title:'Proposta principal',description:'',material_url:''}]);
  const update=(index:number,key:keyof ScenarioDraft,value:string)=>setItems(old=>old.map((item,i)=>i===index?{...item,[key]:value}:item));
  return <section className="scenario-builder">
    <div className="toolbar" style={{marginTop:0}}>
      <div><h3 style={{margin:0}}>Cenários / assuntos para votação</h3><p className="muted small">Cada assunto terá seu próprio voto e aparecerá separadamente no relatório.</p></div>
      <button type="button" onClick={()=>setItems(old=>[...old,{title:'',description:'',material_url:''}])} disabled={items.length>=12}>+ Adicionar cenário</button>
    </div>
    {items.map((item,i)=><div key={i} className="scenario-editor">
      <div className="toolbar" style={{margin:'0 0 12px'}}>
        <strong>Cenário {i+1}</strong>{items.length>1&&<button type="button" className="outline" onClick={()=>setItems(old=>old.filter((_,j)=>j!==i))}>Remover</button>}
      </div>
      <label>Assunto para votação<input required maxLength={180} value={item.title} onChange={e=>update(i,'title',e.target.value)} placeholder="Ex.: Planejamento financeiro do 3º ciclo"/></label>
      <label>Contexto do cenário<textarea maxLength={4000} value={item.description} onChange={e=>update(i,'description',e.target.value)} placeholder="Explique o que será votado e o que o conselheiro deve analisar."/></label>
      <label>Link do material de apoio (opcional)<input type="url" value={item.material_url} onChange={e=>update(i,'material_url',e.target.value)} placeholder="https://drive.google.com/..." /></label>
    </div>)}
    <input type="hidden" name="scenarios_json" value={JSON.stringify(items)}/>
    <p className="muted small">É possível publicar um único cenário ou vários no mesmo formulário. O nome da EJ é identificado pelo login.</p>
  </section>;
}
