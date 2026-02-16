import React, { useState, useCallback } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export const NotificationContext = React.createContext({ notify: () => {} });

export const useNotification = () => React.useContext(NotificationContext);

const NotificationProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);

  const remove = useCallback((id) => {
    setNotes((s) => s.filter(n => n.id !== id));
  }, []);

  const notify = useCallback(({ text, variant = 'info', timeout = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const note = { id, text, variant, timeout };
    console.debug('[Notification] add', note);
    setNotes((s) => [note, ...s]);
    if (timeout > 0) setTimeout(() => remove(id), timeout);
    return id;
  }, [remove]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1060 }}>
        <ToastContainer position="top-end">
          {notes.map(n => (
            <Toast 
              key={n.id} 
              onClose={() => remove(n.id)} 
              bg={n.variant} 
              autohide 
              delay={n.timeout || 4000}
            >
              <Toast.Body style={{ color: n.variant === 'light' ? '#000' : '#fff' }}>{n.text}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
