import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommitHorizontal, AlertTriangle, CheckCircle, Clock, ChevronRight, X, FileDiff, Box } from 'lucide-react';
import api from '../../api/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function Commits() {
  const { owner, name } = useParams();
  const { theme } = useTheme();
  
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDetails, setCommitDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    async function fetchCommits() {
      try {
        const { data } = await api.get(`/api/repos/${owner}/${name}/commits`);
        setCommits(data.commits || []);
      } catch (err) {
        console.error('Failed to fetch commits:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, [owner, name]);

  const loadCommitDetails = async (sha) => {
    setSelectedCommit(sha);
    setDetailsLoading(true);
    setCommitDetails(null);
    try {
      const { data } = await api.get(`/api/repos/${owner}/${name}/commits/${sha}`);
      setCommitDetails(data);
    } catch (err) {
      console.error('Failed to fetch commit details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusIcon = (statusState) => {
    if (statusState === 'failure' || statusState === 'error') {
      return <AlertTriangle size={16} color="#EE5D50" />;
    } else if (statusState === 'success') {
      return <CheckCircle size={16} color="#05CD99" />;
    } else if (statusState === 'pending') {
      return <Clock size={16} color="#F59E0B" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Commits List Panel */}
      <div style={{ flex: selectedCommit ? '0 0 380px' : '1', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'flex 0.3s' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommitHorizontal size={18} color="var(--accent-blue)" />
            Recent Commits
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Showing last 50 commits</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {commits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>No commits found.</div>
          ) : (
            commits.map((c) => (
              <div 
                key={c.sha} 
                onClick={() => loadCommitDetails(c.sha)}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  background: selectedCommit === c.sha ? 'var(--bg-elevated)' : 'transparent',
                  borderColor: selectedCommit === c.sha ? 'var(--border-active)' : 'transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  gap: '12px'
                }}
                onMouseEnter={(e) => { if (selectedCommit !== c.sha) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={(e) => { if (selectedCommit !== c.sha) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.message.split('\n')[0]}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.author}</span>
                    <span>•</span>
                    <span>{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px' }}>
                    {c.sha.substring(0, 7)}
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Commit Details Panel */}
      <AnimatePresence>
        {selectedCommit && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {detailsLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                 <div style={{ width: 24, height: 24, border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
               </div>
            ) : commitDetails ? (
              <>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Commit Details</h2>
                      {commitDetails.status?.state && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-default)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {getStatusIcon(commitDetails.status.state)}
                          {commitDetails.status.state}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedCommit(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                      <X size={20} />
                    </button>
                  </div>
                  
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {commitDetails.commit?.commit?.message}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Box size={14} color="var(--text-muted)" />
                      {commitDetails.commit?.sha?.substring(0, 7)}
                    </span>
                    <span>By <strong style={{ color: 'var(--text-primary)' }}>{commitDetails.commit?.commit?.author?.name}</strong></span>
                    <span>on {new Date(commitDetails.commit?.commit?.author?.date).toLocaleString()}</span>
                  </div>
                  
                  {/* Stats */}
                  {commitDetails.commit?.stats && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{commitDetails.commit.files?.length || 0} Files Changed</div>
                      <div style={{ color: '#05CD99', fontSize: '13px', fontWeight: 600 }}>+{commitDetails.commit.stats.additions} Additions</div>
                      <div style={{ color: '#EE5D50', fontSize: '13px', fontWeight: 600 }}>-{commitDetails.commit.stats.deletions} Deletions</div>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {commitDetails.commit?.files?.map((file) => (
                    <div key={file.filename} style={{ marginBottom: '24px', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                          <FileDiff size={14} color="var(--text-muted)" />
                          {file.filename}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                          <span style={{ color: '#05CD99' }}>+{file.additions}</span>
                          <span style={{ color: '#EE5D50' }}>-{file.deletions}</span>
                        </div>
                      </div>
                      
                      {file.patch ? (
                        <div style={{ padding: '16px', background: theme === 'dark' ? '#0A0C10' : '#F8FAFC', margin: 0, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', overflowX: 'auto', whiteSpace: 'pre' }}>
                          {file.patch.split('\n').map((line, idx) => {
                            let color = 'var(--text-secondary)';
                            let bg = 'transparent';
                            if (line.startsWith('+')) {
                              color = '#05CD99';
                              bg = 'rgba(5, 205, 153, 0.1)';
                            } else if (line.startsWith('-')) {
                              color = '#EE5D50';
                              bg = 'rgba(238, 93, 80, 0.1)';
                            } else if (line.startsWith('@@')) {
                              color = 'var(--accent-blue)';
                            }
                            return (
                              <div key={idx} style={{ color, background: bg, padding: '0 4px', minWidth: '100%' }}>
                                {line || ' '}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          Binary file or patch too large.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                Could not load commit details.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
