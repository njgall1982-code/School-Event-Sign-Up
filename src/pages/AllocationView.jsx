import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const AllocationView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const eventRef = doc(db, 'events', id);
    const unsubscribeEvent = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.createdBy !== user.uid) {
          navigate(`/event/${id}`); // Redirect if not creator
        }
        setEvent({ id: docSnap.id, ...data });
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    const requestsRef = collection(db, 'events', id, 'requests');
    const unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
      const reqData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(reqData);
    });

    const signupsRef = collection(db, 'events', id, 'signups');
    const unsubscribeSignups = onSnapshot(signupsRef, (snapshot) => {
      const signupData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSignups(signupData);
    });

    return () => {
      unsubscribeEvent();
      unsubscribeRequests();
      unsubscribeSignups();
    };
  }, [id, user, navigate]);

  const getClaimedQty = (needId) => {
    return signups
      .filter(s => s.needId === needId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  const getRequestCount = (needId) => {
    return requests.filter(r => r.wishlist?.includes(needId)).length;
  };

  const runAllocation = async () => {
    if (!event || requests.length === 0) return;
    
    if (!window.confirm("This will automatically assign slots based on volunteer preferences. Proceed?")) {
        return;
    }

    setAllocating(true);
    try {
      const availableSpots = {};
      event.needs.forEach(n => {
        availableSpots[n.id] = n.quantity - getClaimedQty(n.id);
      });

      const userCaps = {};
      const userAssignedCount = {};
      
      // Calculate how many items each user has already been assigned
      const existingAssignments = {};
      signups.forEach(s => {
          existingAssignments[s.userId] = (existingAssignments[s.userId] || 0) + s.quantity;
      });

      requests.forEach(r => {
        // Respect both the user's personal cap and the event's global cap
        const globalCap = event.maxItemsPerUser || 1;
        const personalCap = r.maxWanted || 1;
        userCaps[r.userId] = Math.min(globalCap, personalCap);
        userAssignedCount[r.userId] = existingAssignments[r.userId] || 0;
      });

      const newSignups = [];
      let maxWishlistLength = 0;
      requests.forEach(r => {
        if (r.wishlist && r.wishlist.length > maxWishlistLength) {
          maxWishlistLength = r.wishlist.length;
        }
      });

      // Shuffle requests to prevent alphabetical or submission-time bias
      const shuffledRequests = [...requests].sort(() => Math.random() - 0.5);

      // Pass 1: Top choices, Pass 2: Second choices, etc.
      for (let priority = 0; priority < maxWishlistLength; priority++) {
        for (let r of shuffledRequests) {
          if (userAssignedCount[r.userId] < userCaps[r.userId]) {
            const needId = r.wishlist[priority];
            // If they requested this item, and there are spots, AND they aren't already assigned to it
            const alreadyAssignedToThis = signups.some(s => s.userId === r.userId && s.needId === needId) || 
                                          newSignups.some(s => s.userId === r.userId && s.needId === needId);
            
            if (needId && availableSpots[needId] > 0 && !alreadyAssignedToThis) {
              newSignups.push({
                needId,
                userId: r.userId,
                userName: r.userName,
                userEmail: r.userEmail,
                quantity: 1, // Assume 1 quantity per fair-allocation match
                isGuest: r.isGuest || false,
                isAutoAssigned: true
              });
              availableSpots[needId] -= 1;
              userAssignedCount[r.userId] += 1;
            }
          }
        }
      }

      if (newSignups.length === 0) {
          alert("No new assignments could be made based on the current requests and availability.");
          setAllocating(false);
          return;
      }

      // Batch write to Firestore
      const batch = writeBatch(db);
      const signupsCollectionRef = collection(db, 'events', id, 'signups');
      
      newSignups.forEach(s => {
        const newDocRef = doc(signupsCollectionRef);
        batch.set(newDocRef, { ...s, timestamp: serverTimestamp() });
      });

      // Optionally, we could delete the requests here so they aren't processed again, 
      // or mark them as processed. For safety, we keep them, as the logic checks existing signups.
      
      await batch.commit();
      alert(`Successfully allocated ${newSignups.length} slots!`);
      
    } catch (err) {
      console.error("Error during allocation:", err);
      alert("Failed to run allocation.");
    } finally {
      setAllocating(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><p className="muted">Loading manager...</p></div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>Event not found</h2><Link to="/dashboard" className="btn-primary">Back to Dashboard</Link></div>;

  return (
    <div>
      <header style={{ marginBottom: '3rem' }}>
        <Link to={`/event/${id}`} className="muted" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Back to Event
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h1>Allocation Manager</h1>
                <p className="muted">Review requests and distribute slots fairly for {event.name}.</p>
            </div>
            <button 
                className="btn-primary" 
                onClick={runAllocation}
                disabled={allocating || requests.length === 0}
                style={{ background: '#10b981' }} // Green color for the magic button
            >
                {allocating ? 'Processing...' : '✨ Run Fair Allocation'}
            </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div className="glass-card">
              <h2 style={{ marginBottom: '1rem' }}>Request Heatmap</h2>
              <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>See which items have the most demand.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {event.needs.map(need => {
                      const reqCount = getRequestCount(need.id);
                      const claimed = getClaimedQty(need.id);
                      const available = need.quantity - claimed;
                      const isHot = reqCount > available && available > 0;

                      return (
                          <div key={need.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: isHot ? '4px solid #f59e0b' : '4px solid transparent' }}>
                              <div>
                                  <h4 style={{ marginBottom: '0.25rem' }}>{need.title}</h4>
                                  <p className="muted" style={{ fontSize: '0.8rem' }}>{available} slots available</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isHot ? '#f59e0b' : 'var(--text)' }}>{reqCount}</span>
                                  <span className="muted" style={{ fontSize: '0.8rem', marginLeft: '0.25rem' }}>requests</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="glass-card">
              <h2 style={{ marginBottom: '1rem' }}>Volunteer Intent</h2>
              <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Total unique volunteers who have submitted requests: <strong>{requests.length}</strong></p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {requests.map(req => (
                      <div key={req.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 600 }}>{req.userName}</span>
                              <span className="muted" style={{ fontSize: '0.8rem' }}>Max {req.maxWanted} items</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {req.wishlist?.map((needId, idx) => {
                                  const needTitle = event.needs.find(n => n.id === needId)?.title || 'Unknown';
                                  return (
                                      <span key={needId} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                                          #{idx + 1} {needTitle}
                                      </span>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
                  {requests.length === 0 && (
                      <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>No requests submitted yet.</p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AllocationView;
