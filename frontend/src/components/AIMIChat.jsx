import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { apiFetch } from '../apiClient';

const AIMIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'aimi', content: 'Hello! I\'m AIMI, your Schedule Assistant. I can help you optimize and discuss your academic schedule. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: input };
    const messageContent = input; // Save before clearing
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await apiFetch('/api/aimi/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageContent,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'aimi',
          content: data.response,
          isScheduleRelated: data.is_schedule_related
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'aimi',
          content: `Error: ${data.error}`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'aimi',
        content: `Sorry, I encountered an error: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-100" style={{ display: 'flex', flexDirection: 'column' }}>
      <Card.Header className="bg-primary text-white">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '24px', width: '24px' }} />
          <strong style={{ fontSize: '1.1em' }}>AIMI Schedule Assistant</strong>
        </div>
        <small className="d-block mt-1">Ask me anything about your schedule</small>
      </Card.Header>
      
      <ListGroup variant="flush" ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {messages.map((msg, idx) => (
          <ListGroup.Item key={idx} className={msg.role === 'user' ? 'bg-light' : ''}>
            <div className="mb-1">
              {msg.role === 'user' ? (
                <strong className="text-primary">You</strong>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '16px', width: '16px' }} />
                  <strong className="text-info">AIMI</strong>
                </div>
              )}
              {msg.isScheduleRelated === false && (
                <small className="ms-2 text-muted">(off-topic)</small>
              )}
            </div>
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </p>
          </ListGroup.Item>
        ))}
        {loading && (
          <ListGroup.Item className="text-center pt-3">
            <Spinner animation="border" size="sm" className="me-2" />
            <small>AIMI is thinking...</small>
          </ListGroup.Item>
        )}
      </ListGroup>

      <Card.Footer>
        <Form onSubmit={handleSendMessage}>
          <Form.Group className="mb-2">
            <Form.Control
              as="textarea"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AIMI about your schedule..."
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <small className="text-muted">Press Enter to send, Shift+Enter for new line</small>
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !input.trim()}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default AIMIChat;
