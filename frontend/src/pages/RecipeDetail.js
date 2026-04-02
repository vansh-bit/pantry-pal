import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarRating, useToast, ToastContainer } from '../components';

export default function RecipeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchRecipe(); }, [id]);

  const fetchRecipe = async () => {
    try {
      const res = await api.get(`/recipes/${id}/`);
      setRecipe(res.data);
    } catch { navigate('/'); }
    finally { setLoading(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return addToast('Please select a rating', 'error');
    setSubmitting(true);
    try {
      await api.post(`/recipes/${id}/reviews/`, reviewForm);
      addToast('Review submitted!', 'success');
      setReviewForm({ rating: 0, comment: '' });
      fetchRecipe();
    } catch (err) {
      addToast(err.response?.data?.non_field_errors?.[0] || 'Could not submit review', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipe?')) return;
    setDeleting(true);
    try {
      await api.delete(`/recipes/${id}/`);
      addToast('Recipe deleted', 'success');
      setTimeout(() => navigate('/my-recipes'), 1000);
    } catch { addToast('Could not delete', 'error'); setDeleting(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}/`);
      addToast('Review deleted', 'success');
      fetchRecipe();
    } catch { addToast('Could not delete review', 'error'); }
  };

  if (loading) return (
    <div className="container page">
      <div className="skeleton" style={{height:320,borderRadius:'var(--radius)',marginBottom:24}}/>
      <div className="skeleton" style={{height:32,width:'60%',marginBottom:12}}/>
      <div className="skeleton" style={{height:20,width:'40%'}}/>
    </div>
  );
  if (!recipe) return null;

  const isOwner = user && user.id === recipe.author_id;
  const userReview = recipe.reviews?.find(r => r.author_email === user?.email);

  return (
    <div className="container page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="recipe-detail-hero">
        {recipe.image_url
          ? <img src={recipe.image_url} alt={recipe.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          : '🍽️'
        }
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:16}}>
        <div>
          <h1 style={{fontSize:'2rem',marginBottom:8}}>{recipe.title}</h1>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span className={`badge badge-${recipe.approval_status}`}>{recipe.approval_status}</span>
            <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>by {recipe.author_name}</span>
            {recipe.tags?.map(t => <span key={t.id} className="tag-pill">{t.tag_name}</span>)}
          </div>
        </div>
        {(isOwner || user?.is_staff) && (
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/recipes/${id}/edit`)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? '...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="recipe-meta-bar">
        <div className="recipe-meta-stat"><span className="val">🍽️ {recipe.cuisine}</span><span className="lbl">Cuisine</span></div>
        <div className="recipe-meta-stat"><span className="val">⏱ {recipe.prep_time_mins}</span><span className="lbl">Minutes</span></div>
        {recipe.calories && <div className="recipe-meta-stat"><span className="val">🔥 {recipe.calories}</span><span className="lbl">Calories</span></div>}
        <div className="recipe-meta-stat">
          <span className="val">⭐ {recipe.avg_rating || '—'}</span>
          <span className="lbl">{recipe.review_count} Reviews</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:32,alignItems:'start'}} className="recipe-layout">
        <div>
          {recipe.recipe_ingredients?.length > 0 && (
            <div className="recipe-section">
              <h3>Ingredients</h3>
              <div className="card" style={{overflow:'hidden'}}>
                <table className="ing-table">
                  <tbody>
                    {recipe.recipe_ingredients.map(ri => (
                      <tr key={ri.id}>
                        <td>{ri.ingredient?.name}</td>
                        <td style={{color:'var(--text-muted)'}}>{ri.quantity_required} {ri.ri_unit}</td>
                        {ri.ri_notes && <td style={{color:'var(--text-muted)',fontStyle:'italic'}}>{ri.ri_notes}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="recipe-section">
            <h3>Instructions</h3>
            <div className="instructions-text">{recipe.instructions}</div>
          </div>
        </div>

        <div>
          <div className="recipe-section">
            <h3>Reviews ({recipe.review_count})</h3>
            {user && !userReview && (
              <div className="card" style={{padding:20,marginBottom:16}}>
                <div style={{fontWeight:600,marginBottom:12}}>Leave a Review</div>
                <form onSubmit={handleReview}>
                  <div className="form-group">
                    <StarRating value={reviewForm.rating} onChange={r => setReviewForm(p => ({...p, rating:r}))} />
                  </div>
                  <div className="form-group">
                    <textarea
                      className="form-input"
                      placeholder="Share your thoughts..."
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(p => ({...p, comment:e.target.value}))}
                      rows={3}
                      required
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
            {recipe.reviews?.length === 0 ? (
              <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>No reviews yet. Be the first!</p>
            ) : (
              recipe.reviews?.map(rev => (
                <div key={rev.id} className="card" style={{padding:16,marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <div>
                      <span style={{fontWeight:600}}>{rev.author_name}</span>
                      <div className="stars" style={{marginTop:2}}>
                        {[1,2,3,4,5].map(n => <span key={n} className={`star ${n <= rev.rating ? 'filled' : ''}`}>★</span>)}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>
                        {new Date(rev.review_date).toLocaleDateString()}
                      </span>
                      {rev.author_email === user?.email && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(rev.id)}>×</button>
                      )}
                    </div>
                  </div>
                  <p style={{fontSize:'0.9rem',color:'var(--text)'}}>{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`.recipe-layout { @media(max-width:768px){ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
