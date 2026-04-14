import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RecipeCard, SkeletonGrid, EmptyState, useToast, ToastContainer } from '../components';

export function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/recipes/my-recipes/').then(r => setRecipes(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? recipes : recipes.filter(r => r.approval_status === filter);

  return (
    <div className="container page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 className="section-title">My Recipes</h1>
          <p className="section-sub">{recipes.length} total recipes</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/recipes/new')}>+ New Recipe</button>
      </div>
      <div className="filter-row" style={{marginTop:0}}>
        {['all','approved','pending','rejected'].map(s => (
          <button key={s} className={`filter-pill ${filter===s?'active':''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase()+s.slice(1)}{s!=='all'&&` (${recipes.filter(r=>r.approval_status===s).length})`}
          </button>
        ))}
      </div>
      {loading ? <SkeletonGrid count={3}/> : filtered.length===0 ? (
        <EmptyState icon="📝" title="No recipes here" subtitle="Start sharing your culinary creations!"
          action={<button className="btn btn-primary" onClick={()=>navigate('/recipes/new')}>+ Add Recipe</button>}/>
      ) : (
        <div className="recipe-grid">{filtered.map(r=><RecipeCard key={r.id} recipe={r}/>)}</div>
      )}
    </div>
  );
}

export function Pantry() {
  const [pantry, setPantry] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiMatches, setAiMatches] = useState([]);
  const [usedAi, setUsedAi] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/pantry/'), api.get('/ingredients/')])
      .then(([p,i]) => { setPantry(p.data.results||p.data); setIngredients(i.data.results||i.data); })
      .finally(() => setLoading(false));
  }, []);

  const addItem = async (ingredient) => {
    setAdding(ingredient.id);
    try {
      await api.post('/pantry/', { ingredient_id: ingredient.id, quantity: '1', unit: 'pieces' });
      const res = await api.get('/pantry/');
      setPantry(res.data.results||res.data);
      addToast(`${ingredient.name} added!`, 'success');
    } catch(e) { addToast(e.response?.data?.non_field_errors?.[0]||'Already in pantry','error'); }
    finally { setAdding(null); }
  };

  const removeItem = async (id) => {
    await api.delete(`/pantry/${id}/`);
    setPantry(p=>p.filter(i=>i.id!==id));
    addToast('Removed from pantry','success');
  };

  const updateQty = async (item, qty, unit) => {
    await api.patch(`/pantry/${item.id}/`, { quantity: qty, unit });
    setPantry(p=>p.map(i=>i.id===item.id?{...i,quantity:qty,unit}:i));
  };

  const findRecipes = () => {
    const names = pantry.map(p=>p.ingredient.name).join(' ');
    navigate(`/search?q=${encodeURIComponent(names)}`);
  };

  const getAiSuggestions = async () => {
    if (!pantry.length) return;
    setAiLoading(true);
    try {
      const res = await api.post('/pantry/ai-suggestions/');
      setAiSummary(res.data.ai_summary || '');
      const local = (res.data.top_matches || []).map(m => ({ ...m, source_type: 'local' }));
      const web = (res.data.web_matches || []).map(m => ({ ...m, source_type: 'web' }));
      setAiMatches([...local, ...web]);
      setUsedAi(Boolean(res.data.generated_with_ai));
      addToast('AI suggestions ready!', 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Could not generate suggestions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) && !pantry.find(p=>p.ingredient.id===i.id)
  ).slice(0,12);

  return (
    <div className="container page">
      <ToastContainer toasts={toasts} removeToast={removeToast}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 className="section-title">🥕 My Pantry</h1>
          <p className="section-sub">{pantry.length} ingredients stocked</p>
        </div>
        {pantry.length>0 && (
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-secondary" onClick={getAiSuggestions} disabled={aiLoading}>
              {aiLoading ? '✨ Thinking...' : '✨ AI Meal Planner'}
            </button>
            <button className="btn btn-green" onClick={findRecipes}>🔍 Find Recipes from My Pantry</button>
          </div>
        )}
      </div>
      {(aiSummary || aiMatches.length > 0) && (
        <div className="card" style={{padding:20,marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h3 style={{margin:0,fontFamily:"'Playfair Display',serif"}}>AI Pantry Suggestions</h3>
            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
              {usedAi ? 'AI powered' : 'Smart fallback mode'}
            </span>
          </div>
          {aiSummary && <p style={{marginTop:0,color:'var(--text)'}}>{aiSummary}</p>}
          {aiMatches.length > 0 && (
            <div style={{display:'grid',gap:10}}>
              {aiMatches.map(m => (
                <div key={m.recipe_id} style={{border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 12px',background:'var(--cream)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <div>
                      <div style={{fontWeight:700}}>{m.title}</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>
                        {m.cuisine} · {m.match_count} pantry matches · {m.source_type === 'web' ? 'Web recipe' : 'PantryPal recipe'}
                      </div>
                    </div>
                    {m.source_type === 'web' && m.source_url ? (
                      <a
                        className="btn btn-primary btn-sm"
                        href={m.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Source
                      </a>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/recipes/${m.recipe_id}`)}>
                        Open
                      </button>
                    )}
                  </div>
                  {m.missing_ingredients?.length > 0 && (
                    <div style={{fontSize:'0.8rem',marginTop:8,color:'var(--text-muted)'}}>
                      Missing: {m.missing_ingredients.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,alignItems:'start'}}>
        <div>
          <h3 style={{marginBottom:16,fontFamily:"'Playfair Display',serif"}}>My Pantry Items</h3>
          {loading ? <div className="skeleton" style={{height:200}}/> : pantry.length===0 ? (
            <EmptyState icon="🛒" title="Pantry is empty" subtitle="Add ingredients from the list on the right."/>
          ) : pantry.map(item => (
            <div key={item.id} className="pantry-item">
              <div>
                <div className="pantry-item-name">{item.ingredient.name}</div>
                {item.ingredient.category && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{item.ingredient.category}</div>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input className="form-input" style={{width:70,padding:'4px 8px',fontSize:'0.85rem'}} defaultValue={item.quantity}
                  onBlur={e=>updateQty(item,e.target.value,item.unit)}/>
                <input className="form-input" style={{width:80,padding:'4px 8px',fontSize:'0.85rem'}} defaultValue={item.unit}
                  onBlur={e=>updateQty(item,item.quantity,e.target.value)}/>
                <button className="btn btn-danger btn-sm" onClick={()=>removeItem(item.id)} style={{padding:'4px 10px'}}>×</button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{marginBottom:16,fontFamily:"'Playfair Display',serif"}}>Add Ingredients</h3>
          <input className="form-input" placeholder="Search ingredients..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
          {filtered.map(i => (
            <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--white)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',marginBottom:8}}>
              <div>
                <div style={{fontWeight:600,fontSize:'0.9rem'}}>{i.name}</div>
                {i.category && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{i.category}</div>}
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>addItem(i)} disabled={adding===i.id}>
                {adding===i.id?'...':'+ Add'}
              </button>
            </div>
          ))}
          {search && filtered.length===0 && <p style={{color:'var(--text-muted)',fontSize:'0.9rem',textAlign:'center',padding:16}}>No matching ingredients found.</p>}
        </div>
      </div>
    </div>
  );
}

export function Search() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { setQuery(q); doSearch(q); }
    if (user) api.get('/search-history/').then(r=>setHistory(r.data.results||r.data)).catch(()=>{});
  }, []);

  const doSearch = async (q) => {
    setLoading(true); setSearched(true);
    try {
      const res = await api.post('/search/', { query: q });
      setResults(res.data.results||[]);
      if (user) api.get('/search-history/').then(r=>setHistory(r.data.results||r.data)).catch(()=>{});
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query)}`); doSearch(query); }
  };

  const deleteHistory = async (id) => {
    await api.delete(`/search-history/${id}/`);
    setHistory(h=>h.filter(e=>e.id!==id));
  };

  return (
    <div className="container page">
      <h1 className="section-title" style={{marginBottom:20}}>Search Recipes</h1>
      <form style={{display:'flex',gap:0,maxWidth:600,marginBottom:32,background:'var(--white)',borderRadius:'var(--radius-pill)',border:'2px solid var(--orange)',overflow:'hidden',boxShadow:'var(--shadow)'}} onSubmit={handleSearch}>
        <input style={{flex:1,padding:'12px 20px',border:'none',outline:'none',fontFamily:"'Nunito',sans-serif",fontSize:'0.95rem'}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search recipes, ingredients, cuisines..."/>
        <button type="submit" style={{padding:'12px 24px',background:'var(--orange)',color:'var(--white)',border:'none',cursor:'pointer',fontWeight:600,fontFamily:"'Nunito',sans-serif"}}>Search</button>
      </form>
      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:32,alignItems:'start'}}>
        <div>
          {loading ? <SkeletonGrid count={3}/> : searched ? (
            results.length===0 ? (
              <EmptyState icon="🔍" title="No results found" subtitle={`No recipes matched "${query}"`}/>
            ) : (
              <>
                <p className="section-sub">{results.length} results for "{query}"</p>
                <div className="recipe-grid">{results.map(r=><RecipeCard key={r.id} recipe={r}/>)}</div>
              </>
            )
          ) : <EmptyState icon="🔍" title="Start searching" subtitle="Type something above to find recipes"/>}
        </div>
        {user && (
          <div>
            <div style={{fontWeight:700,marginBottom:14,fontFamily:"'Playfair Display',serif"}}>Recent Searches</div>
            {history.length===0 ? (
              <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No search history yet.</p>
            ) : history.slice(0,10).map(h=>(
              <div key={h.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'var(--white)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',marginBottom:8}}>
                <span style={{fontSize:'0.85rem',cursor:'pointer',color:'var(--orange)',fontWeight:500}}
                  onClick={()=>{setQuery(h.search_query);doSearch(h.search_query);}}>
                  🔍 {h.search_query}
                </span>
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'1rem'}} onClick={()=>deleteHistory(h.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CUISINE_EMOJIS_ADMIN = {
  italian:'🍝',indian:'🍛',mexican:'🌮',chinese:'🥡',japanese:'🍱',
  american:'🍔',french:'🥐',thai:'🍜',mediterranean:'🫒',default:'🍽️'
};
function cuisineEmoji(c) {
  if (!c) return '🍽️';
  const k = c.toLowerCase();
  for (const [key,v] of Object.entries(CUISINE_EMOJIS_ADMIN)) { if (k.includes(key)) return v; }
  return CUISINE_EMOJIS_ADMIN.default;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{background:'var(--white)',borderRadius:'var(--radius)',padding:'20px 24px',boxShadow:'var(--shadow)',display:'flex',alignItems:'center',gap:16,flex:1,minWidth:140}}>
      <div style={{width:48,height:48,borderRadius:'50%',background:color||'var(--orange-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>{icon}</div>
      <div>
        <div style={{fontSize:'1.6rem',fontWeight:700,fontFamily:"'Playfair Display',serif",color:'var(--text)',lineHeight:1}}>{value}</div>
        <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:3}}>{label}</div>
      </div>
    </div>
  );
}

function PendingCard({ recipe, onApprove, onReject, actionLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{background:'var(--white)',borderRadius:'var(--radius)',boxShadow:'var(--shadow)',overflow:'hidden',transition:'box-shadow .2s',border:'1px solid var(--border)'}}>
      <div style={{display:'flex',gap:0}}>
        {/* Left color accent */}
        <div style={{width:5,background:'var(--orange)',flexShrink:0,borderRadius:'var(--radius) 0 0 var(--radius)'}}/>
        <div style={{flex:1,padding:'20px 20px 20px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              {/* Cuisine emoji + title */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                <span style={{fontSize:'1.8rem'}}>{cuisineEmoji(recipe.cuisine)}</span>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.15rem',lineHeight:1.2}}>{recipe.title}</div>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:2}}>
                    by <strong style={{color:'var(--text)'}}>{recipe.author_name}</strong>
                  </div>
                </div>
              </div>
              {/* Meta row */}
              <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:10}}>
                {recipe.cuisine && <span style={{fontSize:'0.82rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>🍽️ {recipe.cuisine}</span>}
                {recipe.prep_time_mins && <span style={{fontSize:'0.82rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>⏱ {recipe.prep_time_mins} min</span>}
                {recipe.calories && <span style={{fontSize:'0.82rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>🔥 {recipe.calories} cal</span>}
                {recipe.servings && <span style={{fontSize:'0.82rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>👥 {recipe.servings} servings</span>}
              </div>
              {/* Tags */}
              {recipe.tags?.length > 0 && (
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                  {recipe.tags.map(t=><span key={t.id} className="tag-pill">{t.tag_name}</span>)}
                </div>
              )}
              {/* Expandable description */}
              {recipe.description && (
                <div style={{marginTop:4}}>
                  <button onClick={()=>setExpanded(e=>!e)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--orange)',fontSize:'0.82rem',fontWeight:600,padding:0,fontFamily:"'Nunito',sans-serif"}}>
                    {expanded ? '▲ Hide description' : '▼ Show description'}
                  </button>
                  {expanded && (
                    <div style={{marginTop:8,padding:'12px 14px',background:'var(--cream)',borderRadius:'var(--radius-sm)',fontSize:'0.88rem',lineHeight:1.7,color:'var(--text)'}}>
                      {recipe.description}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Actions */}
            <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>navigate(`/recipes/${recipe.id}`)} style={{whiteSpace:'nowrap'}}>
                🔗 Preview
              </button>
              <button className="btn btn-green btn-sm" onClick={()=>onApprove(recipe.id)} disabled={actionLoading===recipe.id} style={{whiteSpace:'nowrap',minWidth:110}}>
                {actionLoading===recipe.id ? '...' : '✓ Approve'}
              </button>
              {confirmReject ? (
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-danger btn-sm" onClick={()=>{onReject(recipe.id);setConfirmReject(false);}} disabled={actionLoading===recipe.id} style={{whiteSpace:'nowrap'}}>
                    Confirm Reject
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setConfirmReject(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-sm" onClick={()=>setConfirmReject(true)} style={{whiteSpace:'nowrap',minWidth:110,background:'#FEE2E2',color:'#991B1B',border:'none'}}>
                  ✗ Reject
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [ingSearch, setIngSearch] = useState('');
  const [ingCategoryFilter, setIngCategoryFilter] = useState('all');
  const [allFilter, setAllFilter] = useState('all');
  const [newIng, setNewIng] = useState({ name:'', category:'' });
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  // Load pending count on mount for stat card
  useEffect(() => {
    api.get('/recipes/pending/').then(r=>setPending(r.data.results||r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab==='pending') {
      api.get('/recipes/pending/').then(r=>setPending(r.data.results||r.data)).finally(()=>setLoading(false));
    } else if (tab==='ingredients') {
      api.get('/ingredients/').then(r=>setIngredients(r.data.results||r.data)).finally(()=>setLoading(false));
    } else if (tab==='all') {
      api.get('/recipes/').then(r=>setAllRecipes(r.data.results||r.data)).finally(()=>setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tab]);

  const approve = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/recipes/${id}/approve/`);
      setPending(p=>p.filter(r=>r.id!==id));
      setAllRecipes(p=>p.map(r=>r.id===id?{...r,approval_status:'approved'}:r));
      addToast('Recipe approved!','success');
    } finally { setActionLoading(null); }
  };

  const reject = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/recipes/${id}/reject/`);
      setPending(p=>p.filter(r=>r.id!==id));
      setAllRecipes(p=>p.map(r=>r.id===id?{...r,approval_status:'rejected'}:r));
      addToast('Recipe rejected','error');
    } finally { setActionLoading(null); }
  };

  const addIngredient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ingredients/', newIng);
      setIngredients(p=>[...p,res.data]);
      setNewIng({name:'',category:''});
      addToast('Ingredient added!','success');
    } catch(err) { addToast(err.response?.data?.name?.[0]||'Failed to add','error'); }
  };

  const deleteIngredient = async (id) => {
    try {
      await api.delete(`/ingredients/${id}/`);
      setIngredients(p=>p.filter(i=>i.id!==id));
      addToast('Ingredient deleted','success');
    } catch { addToast('Could not delete ingredient','error'); }
  };

  const ingCategories = ['all', ...Array.from(new Set(ingredients.map(i=>i.category).filter(Boolean)))];
  const filteredIngs = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(ingSearch.toLowerCase());
    const matchCat = ingCategoryFilter==='all' || i.category===ingCategoryFilter;
    return matchSearch && matchCat;
  });
  const filteredAll = allFilter==='all' ? allRecipes : allRecipes.filter(r=>r.approval_status===allFilter);

  return (
    <div style={{background:'var(--cream)',minHeight:'calc(100vh - 140px)'}}>
      <ToastContainer toasts={toasts} removeToast={removeToast}/>

      {/* Header banner */}
      <div style={{background:'linear-gradient(135deg,var(--orange) 0%,#A84008 100%)',padding:'32px 0 28px',marginBottom:0}}>
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:700,color:'#fff',margin:0}}>🛠 Admin Panel</h1>
              <p style={{color:'rgba(255,255,255,0.8)',marginTop:6,fontSize:'0.95rem'}}>Review recipes, manage ingredients, oversee content</p>
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <StatCard icon="⏳" label="Pending Review" value={pending.length} color="rgba(255,255,255,0.2)" />
              <StatCard icon="🧄" label="Ingredients" value={ingredients.length||'—'} color="rgba(255,255,255,0.2)" />
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop:28,paddingBottom:40}}>
        {/* Tabs */}
        <div style={{display:'flex',gap:0,background:'var(--white)',borderRadius:'var(--radius)',padding:6,boxShadow:'var(--shadow)',marginBottom:28,width:'fit-content'}}>
          {[
            {id:'pending',label:`⏳ Pending${pending.length>0?` (${pending.length})`:''}` },
            {id:'all',label:'📋 All Recipes'},
            {id:'ingredients',label:'🧄 Ingredients'},
            {id:'users',label:'👥 Users'},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'8px 20px',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',
              fontWeight:600,fontSize:'0.88rem',fontFamily:"'Nunito',sans-serif",transition:'all .2s',
              background: tab===t.id ? 'var(--orange)' : 'transparent',
              color: tab===t.id ? '#fff' : 'var(--text-muted)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* PENDING TAB */}
        {tab==='pending' && (
          loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:130,borderRadius:'var(--radius)'}}/>)}
            </div>
          ) : pending.length===0 ? (
            <div style={{background:'var(--white)',borderRadius:'var(--radius)',padding:'60px 24px',textAlign:'center',boxShadow:'var(--shadow)'}}>
              <div style={{fontSize:'3rem',marginBottom:12}}>✅</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",marginBottom:8}}>All caught up!</h3>
              <p style={{color:'var(--text-muted)'}}>No recipes waiting for review. Come back later.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {pending.map(r=>(
                <PendingCard key={r.id} recipe={r} onApprove={approve} onReject={reject} actionLoading={actionLoading}/>
              ))}
            </div>
          )
        )}

        {/* ALL RECIPES TAB */}
        {tab==='all' && (
          <div>
            <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:8}}>
                {['all','approved','pending','rejected'].map(s=>(
                  <button key={s} className={`filter-pill ${allFilter===s?'active':''}`} onClick={()=>setAllFilter(s)} style={{fontSize:'0.82rem'}}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                    {s!=='all' && ` (${allRecipes.filter(r=>r.approval_status===s).length})`}
                  </button>
                ))}
              </div>
              <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{filteredAll.length} recipes</span>
            </div>
            {loading ? (
              <div className="skeleton" style={{height:400,borderRadius:'var(--radius)'}}/>
            ) : filteredAll.length===0 ? (
              <EmptyState icon="📋" title="No recipes here" subtitle="Try a different filter."/>
            ) : (
              <div style={{background:'var(--white)',borderRadius:'var(--radius)',boxShadow:'var(--shadow)',overflow:'hidden'}}>
                <table className="data-table" style={{tableLayout:'fixed'}}>
                  <thead>
                    <tr>
                      <th style={{width:'35%'}}>Recipe</th>
                      <th style={{width:'15%'}}>Author</th>
                      <th style={{width:'12%'}}>Cuisine</th>
                      <th style={{width:'10%'}}>Time</th>
                      <th style={{width:'13%'}}>Status</th>
                      <th style={{width:'15%'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAll.map(r=>(
                      <tr key={r.id}>
                        <td>
                          <div style={{fontWeight:600,fontSize:'0.9rem',cursor:'pointer',color:'var(--orange)'}} onClick={()=>navigate(`/recipes/${r.id}`)}>
                            {cuisineEmoji(r.cuisine)} {r.title}
                          </div>
                          {r.tags?.slice(0,2).map(t=><span key={t.id} className="tag-pill" style={{fontSize:'0.7rem',padding:'2px 7px',marginRight:4}}>{t.tag_name}</span>)}
                        </td>
                        <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{r.author_name}</td>
                        <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{r.cuisine||'—'}</td>
                        <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{r.prep_time_mins ? `${r.prep_time_mins}m` : '—'}</td>
                        <td>
                          <span className={`badge badge-${r.approval_status||'pending'}`} style={{fontSize:'0.75rem'}}>
                            {r.approval_status||'pending'}
                          </span>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:6}}>
                            {r.approval_status!=='approved' && (
                              <button className="btn btn-green btn-sm" onClick={()=>approve(r.id)} disabled={actionLoading===r.id} style={{padding:'4px 10px',fontSize:'0.78rem'}}>✓</button>
                            )}
                            {r.approval_status!=='rejected' && (
                              <button className="btn btn-danger btn-sm" onClick={()=>reject(r.id)} disabled={actionLoading===r.id} style={{padding:'4px 10px',fontSize:'0.78rem'}}>✗</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* INGREDIENTS TAB */}
        {tab==='ingredients' && (
          <div>
            {/* Add ingredient form */}
            <div style={{background:'var(--white)',borderRadius:'var(--radius)',padding:'24px',marginBottom:24,boxShadow:'var(--shadow)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
                <span style={{fontSize:'1.3rem'}}>➕</span>
                <h3 style={{margin:0,fontFamily:"'Playfair Display',serif",fontSize:'1.1rem'}}>Add New Ingredient</h3>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:12,alignItems:'end'}}>
                <div>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={newIng.name} onChange={e=>setNewIng(p=>({...p,name:e.target.value}))} placeholder="e.g. Mozzarella"
                    onKeyDown={e=>{if(e.key==='Enter'&&newIng.name.trim()){addIngredient(e);}}}/>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input className="form-input" value={newIng.category} onChange={e=>setNewIng(p=>({...p,category:e.target.value}))} placeholder="e.g. Dairy"/>
                </div>
                <button className="btn btn-primary" onClick={addIngredient} disabled={!newIng.name.trim()}>Add Ingredient</button>
              </div>
            </div>

            {/* Search + filter row */}
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              <input className="form-input" style={{maxWidth:280,marginBottom:0}} placeholder="🔍 Search ingredients..." value={ingSearch} onChange={e=>setIngSearch(e.target.value)}/>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {ingCategories.map(c=>(
                  <button key={c} className={`filter-pill ${ingCategoryFilter===c?'active':''}`} onClick={()=>setIngCategoryFilter(c)} style={{fontSize:'0.8rem',padding:'5px 12px'}}>
                    {c==='all'?'All':c}
                  </button>
                ))}
              </div>
              <span style={{fontSize:'0.85rem',color:'var(--text-muted)',marginLeft:'auto'}}>{filteredIngs.length} ingredients</span>
            </div>

            {loading ? (
              <div className="skeleton" style={{height:300,borderRadius:'var(--radius)'}}/>
            ) : (
              <div style={{background:'var(--white)',borderRadius:'var(--radius)',boxShadow:'var(--shadow)',overflow:'hidden'}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th style={{width:80,textAlign:'right'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngs.length===0 ? (
                      <tr><td colSpan={4} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)'}}>No ingredients match your search.</td></tr>
                    ) : filteredIngs.map((ing,i)=>(
                      <tr key={ing.id}>
                        <td style={{color:'var(--text-muted)',fontSize:'0.8rem',width:40}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{ing.name}</td>
                        <td>
                          {ing.category
                            ? <span style={{background:'var(--orange-light)',color:'var(--orange)',padding:'2px 10px',borderRadius:'var(--radius-pill)',fontSize:'0.78rem',fontWeight:600}}>{ing.category}</span>
                            : <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>—</span>
                          }
                        </td>
                        <td style={{textAlign:'right'}}>
                          <button onClick={()=>deleteIngredient(ing.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#DC2626',fontSize:'1rem',padding:'2px 6px',borderRadius:4,transition:'background .15s'}}
                            title="Delete ingredient" onMouseEnter={e=>e.target.style.background='#FEE2E2'} onMouseLeave={e=>e.target.style.background='none'}>
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab==='users' && <UsersTab addToast={addToast}/>}

      </div>
    </div>
  );
}

function UsersTab({ addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleAdmin = async (u) => {
    setToggling(u.id);
    try {
      const res = await api.post(`/users/${u.id}/toggle-admin/`);
      setUsers(p => p.map(x => x.id === u.id ? res.data : x));
      addToast(`${u.email} is now ${res.data.is_staff ? 'an admin' : 'a regular user'}`, 'success');
    } catch(e) {
      addToast(e.response?.data?.detail || 'Failed to update', 'error');
    } finally { setToggling(null); }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center',justifyContent:'space-between'}}>
        <input className="form-input" style={{maxWidth:300}} placeholder="🔍 Search by name or email..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{filtered.length} users</span>
      </div>
      {loading ? (
        <div className="skeleton" style={{height:300,borderRadius:'var(--radius)'}}/>
      ) : (
        <div style={{background:'var(--white)',borderRadius:'var(--radius)',boxShadow:'var(--shadow)',overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Role</th>
                <th style={{textAlign:'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>
                    {u.first_name||u.last_name ? `${u.first_name} ${u.last_name}`.trim() : '—'}
                  </td>
                  <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{u.email}</td>
                  <td style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>
                    {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {u.is_staff
                      ? <span style={{background:'var(--orange-light)',color:'var(--orange)',padding:'3px 10px',borderRadius:'var(--radius-pill)',fontSize:'0.78rem',fontWeight:700}}>Admin</span>
                      : <span style={{background:'var(--green-light)',color:'var(--green)',padding:'3px 10px',borderRadius:'var(--radius-pill)',fontSize:'0.78rem',fontWeight:600}}>User</span>
                    }
                  </td>
                  <td style={{textAlign:'right'}}>
                    {u.id===currentUser?.id ? (
                      <span style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>You</span>
                    ) : (
                      <button onClick={()=>toggleAdmin(u)} disabled={toggling===u.id}
                        className={`btn btn-sm ${u.is_staff?'btn-danger':'btn-green'}`}
                        style={{fontSize:'0.78rem',padding:'4px 12px'}}>
                        {toggling===u.id ? '...' : u.is_staff ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
