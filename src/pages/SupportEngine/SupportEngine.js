import React, { useState, useEffect, useRef } from 'react';
import './SupportEngine.css';
import Avatar from './Avatar';

//npm install react-chat-engine

const SupportEngine = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom when messages are updated
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      const initialMessages = [
        { sender: 'bot', text: 'Hello! How can I assist you today?' },
        { sender: 'bot', text: 'Feel free to ask me anything about our services.' },
        { sender: 'bot', text: 'You can also choose from the options below.' },
      ];

      if (messages.length === 0) {
        initialMessages.forEach((msg, index) => {
          setTimeout(() => {
            setMessages((prevMessages) => [...prevMessages, msg]);
            if (index === initialMessages.length - 1) {
              setShowOptions(['Book an Appointment', 'Find a Clinic', 'Learn About Services']);
            }
          }, index * 1000);
        });
      } else {
        setShowOptions(['Book an Appointment', 'Find a Clinic', 'Learn About Services']);
      }
    }
  }, [isOpen, messages]);

  const handleOptionClick = (option) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: option },
      { sender: 'bot', text: `You selected: ${option}. How can I help further?` },
    ]);
    setShowOptions([]);
  };

  return (
    <div>
      {!isOpen && <Avatar onClick={() => setIsOpen(true)} />}
      {isOpen && (
        <div className="support-engine">
          <div className="chat-header">
            <h3></h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              X
            </button>
          </div>

          <div className="chat-body">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
              >
                <div className="message-icon">
                  {message.sender === 'bot' ? (
                    <img
                      src="https://i.pinimg.com/736x/2f/ef/0f/2fef0f62560b377da3b4434bc6062a16.jpg"
                      alt="bot avatar"
                    />
                  ) : (
                    <span>
                       <img
                        src="https://i.pinimg.com/736x/b1/4b/8a/b14b8aa011975d186b5ca4dcd9b6fbfc.jpg"
                        />
                    </span>
                  )}
                </div>
                <p>{message.text}</p>
              </div>
            ))}
            {showOptions.length > 0 && (
              <div className="chat-options-container">
                {showOptions.map((option, index) => (
                  <button key={index} onClick={() => handleOptionClick(option)}>
                    {option}
                  </button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} /> {/* Auto-scroll reference */}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={() => handleOptionClick(userMessage)}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportEngine;