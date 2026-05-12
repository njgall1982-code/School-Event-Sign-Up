// src/pages/EventDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingUpFor, setSigningUpFor] = useState(null); // id of the need
  const [signupQty, setSignupQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [wishlist, setWishlist] = useState([]); // Array of need IDs in order
  const [myRequest, setMyRequest] = useState(null);
  const [maxWanted, setMaxWanted] = useState(1);
  const [showWishlistOverlay, setShowWishlistOverlay] = useState(false);

  useEffect(() => {
    const eventRef = doc(db, 'events', id);
    const unsubscribeEvent = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    const signupsRef = collection(db, 'events', id, 'signups');
    const unsubscribeSignups = onSnapshot(signupsRef, (snapshot) => {
      const signupData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSignups(signupData);
    });

    let unsubscribeRequest = () => {};
    if (user) {
      const requestRef = doc(db, 'events', id, 'requests', user.uid);
      unsubscribeRequest = onSnapshot(requestRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMyRequest(data);
          setWishlist(data.wishlist || []);
          setMaxWanted(data.maxWanted || 1);
        }
      });
    }

    return () => {
      unsubscribeEvent();
      unsubscribeSignups();
      unsubscribeRequest();
    };
  }, [id]);

  const getClaimedQty = (needId) => {
    return signups
      .filter(s => s.needId === needId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  const handleSignup = async (needId, maxAvailable) => {
    if (!user) return alert('Please sign in to sign up!');
    
    const finalName = user.displayName || guestName;
    const finalEmail = user.email || guestEmail;

    if (!finalName || !finalEmail) {
      return alert('Please provide your name and email to sign up.');
    }

    if (signupQty > maxAvailable) return alert('Not enough items remaining!');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'events', id, 'signups'), {
        needId,
        userId: user.uid,
        userName: finalName,
        userEmail: finalEmail,
        isGuest: user.isAnonymous,
        quantity: signupQty,
        timestamp: serverTimestamp()
      });
      setSigningUpFor(null);
      setSignupQty(1);
    } catch (error) {
      console.error("Error signing up:", error);
      alert('Error saving your signup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWishlist = (needId) => {
    if (wishlist.includes(needId)) {
      setWishlist(wishlist.filter(item => item !== needId));
    } else {
      setWishlist([...wishlist, needId]);
    }
  };

  const moveWishlistItem = (index, direction) => {
    const newWishlist = [...wishlist];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newWishlist.length) {
      const temp = newWishlist[index];
      newWishlist[index] = newWishlist[newIndex];
      newWishlist[newIndex] = temp;
      setWishlist(newWishlist);
    }
  };

  const submitRequest = async () => {
    if (!user) return alert('Please sign in to submit requests!');
    
    const finalName = user.displayName || guestName;
    const finalEmail = user.email || guestEmail;

    if (!finalName || !finalEmail) {
      return alert('Please provide your name and email.');
    }

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'events', id, 'requests', user.uid), {
        userId: user.uid,
        userName: finalName,
        userEmail: finalEmail,
        wishlist,
        maxWanted,
        timestamp: serverTimestamp()
      });
      setShowWishlistOverlay(false);
      alert('Your preferences have been saved!');
    } catch (error) {
      console.error("Error saving request:", error);
      alert('Failed to save preferences.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCreator = user && event?.createdBy === user.uid;

  const downloadCSV = () => {
    if (!event || !signups) return;

    // Create CSV header
    let csvContent = "data:text/csv;charset=utf-8,Item,Volunteer Name,Email,Quantity,Unit\n";

    // Add rows
    event.needs.forEach(need => {
      const needSignups = signups.filter(s => s.needId === need.id);
      needSignups.forEach(s => {
        csvContent += `"${need.title}","${s.userName}","${s.userEmail}",${s.quantity},"${need.unit}"\n`;
      });
    });

    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.name.replace(/\s+/g, '_')}_volunteers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><p className="muted">Loading event...</p></div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>Event not found</h2><Link to="/dashboard" className="btn-primary">Back to Dashboard</Link></div>;

  return (
    <div>
      <header style={{ marginBottom: '3rem' }}>
        <Link to="/dashboard" className="muted" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
                <h1 style={{ marginBottom: '0.5rem' }}>{event.name}</h1>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', background: 'var(--primary)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {event.grade || 'All School'}
                </span>
                {event.teacher && (
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
                    Teacher: {event.teacher}
                    </span>
                )}
                </div>
                <p className="muted">Organized by {event.creatorName}</p>
            </div>
            {isCreator && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {event.signupMode === 'fair' && (
                  <Link to={`/event/${id}/allocate`} className="btn-primary" style={{ background: '#10b981', textDecoration: 'none' }}>
                    ✨ Allocation Manager
                  </Link>
                )}
                <button className="btn-secondary" onClick={downloadCSV}>
                  📥 Export CSV
                </button>
              </div>
            )}
        </div>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Needs & Volunteers</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {event.needs.map((need) => {
            const claimed = getClaimedQty(need.id);
            const remaining = need.quantity - claimed;
            const progress = (claimed / need.quantity) * 100;
            const isSigningUp = signingUpFor === need.id;

            return (
              <div key={need.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ marginBottom: '0.25rem' }}>{need.title}</h3>
                        {event.signupMode === 'fair' && wishlist.includes(need.id) && (
                            <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 700 }}>
                                #{wishlist.indexOf(need.id) + 1} CHOICE
                            </span>
                        )}
                    </div>
                    <p className="muted" style={{ fontSize: '0.9rem' }}>
                      {claimed} of {need.quantity} {need.unit} {event.signupMode === 'fair' ? 'available' : 'claimed'}
                    </p>
                  </div>
                  {event.signupMode === 'instant' ? (
                    remaining > 0 && !isSigningUp && (
                        <button 
                          className="btn-primary" 
                          onClick={() => setSigningUpFor(need.id)}
                        >
                          Sign Up
                        </button>
                      )
                  ) : (
                    <button 
                      className={wishlist.includes(need.id) ? "btn-secondary" : "btn-primary"} 
                      onClick={() => toggleWishlist(need.id)}
                    >
                      {wishlist.includes(need.id) ? 'Remove Request' : 'Request Spot'}
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ 
                  height: '8px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '4px', 
                  overflow: 'hidden',
                  marginBottom: isSigningUp ? '1.5rem' : '0'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${progress}%`, 
                    background: progress >= 100 ? '#10b981' : 'var(--primary)',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {/* Inline Sign Up Form */}
                {isSigningUp && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', marginTop: '1rem' }}>
                    {/* Guest Info Fields */}
                    {(!user.displayName || !user.email) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Your Name</label>
                          <input 
                            type="text" 
                            placeholder="Full Name"
                            value={guestName} 
                            onChange={(e) => setGuestName(e.target.value)} 
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>Your Email</label>
                          <input 
                            type="email" 
                            placeholder="email@example.com"
                            value={guestEmail} 
                            onChange={(e) => setGuestEmail(e.target.value)} 
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>How many {need.unit}?</label>
                        <div className="qty-control" style={{ background: 'var(--bg-surface)' }}>
                          <button onClick={() => setSignupQty(Math.max(1, signupQty - 1))}>−</button>
                          <input 
                            type="number" 
                            value={signupQty} 
                            onChange={(e) => setSignupQty(Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1)))} 
                          />
                          <button onClick={() => setSignupQty(Math.min(remaining, signupQty + 1))}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleSignup(need.id, remaining)}
                          disabled={submitting}
                        >
                          {submitting ? 'Claiming...' : 'Confirm'}
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => setSigningUpFor(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* My Signups or List of Signups */}
                {signups.filter(s => s.needId === need.id).length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>VOLUNTEERS:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {signups.filter(s => s.needId === need.id).map(s => (
                        <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span>{s.userName} ({s.quantity})</span>
                          {isCreator && s.userEmail && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--glass-border)', paddingLeft: '0.5rem' }}>
                              {s.userEmail}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fair Mode Wishlist Floating Bar */}
      {event.signupMode === 'fair' && wishlist.length > 0 && !showWishlistOverlay && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 2rem)', maxWidth: '600px', background: 'var(--primary)', padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wishlist.length} item{wishlist.length > 1 ? 's' : ''} in wishlist</span>
            <p style={{ fontSize: '0.75rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rank before submitting.</p>
          </div>
          <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', whiteSpace: 'nowrap' }} onClick={() => setShowWishlistOverlay(true)}>
            Manage
          </button>
        </div>
      )}

      {/* Wishlist Management Overlay */}
      {showWishlistOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Review Your Requests</h2>
                    <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => setShowWishlistOverlay(false)}>×</button>
                </div>

                <p className="muted" style={{ marginBottom: '1.5rem' }}>Drag or use arrows to rank your preferences. The top items are your priority.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {wishlist.map((needId, index) => {
                        const need = event.needs.find(n => n.id === needId);
                        return (
                            <div key={needId} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)', width: '20px' }}>{index + 1}</span>
                                    <span>{need?.title}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        disabled={index === 0} 
                                        onClick={() => moveWishlistItem(index, -1)}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                                    >↑</button>
                                    <button 
                                        disabled={index === wishlist.length - 1} 
                                        onClick={() => moveWishlistItem(index, 1)}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                                    >↓</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label>In total, I only want to be assigned to:</label>
                    <div className="qty-control" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setMaxWanted(Math.max(1, maxWanted - 1))}>−</button>
                        <input type="number" value={maxWanted} onChange={(e) => setMaxWanted(Math.max(1, parseInt(e.target.value) || 1))} />
                        <button onClick={() => setMaxWanted(Math.min(wishlist.length, maxWanted + 1))}>+</button>
                    </div>
                    <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>We will try to give you your top {maxWanted} choice{maxWanted > 1 ? 's' : ''}.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={submitRequest} disabled={submitting}>
                        {submitting ? 'Saving...' : 'Submit All Requests'}
                    </button>
                    <button className="btn-secondary" onClick={() => setShowWishlistOverlay(false)}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
