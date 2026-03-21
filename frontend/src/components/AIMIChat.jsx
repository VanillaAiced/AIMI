import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Card, ListGroup, Spinner, Alert } from 'react-bootstrap';

const AIMIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'aimi', content: 'Hello! I\'m AIMI, your Schedule Assistant. I can help you optimize and discuss your academic schedule. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/aimi/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: input,
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
        <strong style={{ fontSize: '1.1em' }}>
          <span style={{ color: '#00ffff' }}>AIMI</span> Schedule Assistant
        </strong>
        <small className="d-block mt-1">Ask me anything about your schedule</small>
      </Card.Header>
      
      <ListGroup variant="flush" style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {messages.map((msg, idx) => (
          <ListGroup.Item key={idx} className={msg.role === 'user' ? 'bg-light' : ''}>
            <div className="mb-1">
              <strong className={msg.role === 'user' ? 'text-primary' : 'text-info'}>
                {msg.role === 'user' ? 'You' : '🤖 AIMI'}
              </strong>
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
        <div ref={messagesEndRef} />
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
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage(e);
                }
              }}
            />
            <small className="text-muted">Ctrl+Enter to send</small>
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
              'Send Message'
            )}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default AIMIChat;
